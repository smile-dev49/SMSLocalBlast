import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

import '../../core/logging/app_logger.dart';
import '../../core/models/callback_report.dart';
import '../../core/models/dispatch_job.dart';
import '../../core/storage/local_store.dart';
import '../backend_api/device_gateway_api.dart';
import '../platform_channels/gateway_transport.dart';

class GatewayOrchestrator {
  GatewayOrchestrator({
    required GatewayApiClient api,
    required LocalStore localStore,
    required int pollSeconds,
    required GatewayTransport transport,
  })  : _api = api,
        _localStore = localStore,
        _pollSeconds = pollSeconds,
        _transport = transport;

  final GatewayApiClient _api;
  final LocalStore _localStore;
  final int _pollSeconds;
  final GatewayTransport _transport;
  bool _running = false;
  bool _pullInFlight = false;
  DateTime? _lastPollAt;
  int _processed = 0;
  int _sentReports = 0;
  int _failedReports = 0;
  Timer? _timer;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  StreamSubscription<TransportEvent>? _transportEventsSub;
  final Map<String, DispatchJob> _inFlightDispatches = <String, DispatchJob>{};
  TransportCapabilities? _capabilities;
  TransportEvent? _lastTransportEvent;

  bool get isRunning => _running;
  DateTime? get lastPollAt => _lastPollAt;
  int get processed => _processed;
  int get sentReports => _sentReports;
  int get failedReports => _failedReports;
  int get pendingCallbacks => _localStore.readCallbackOutbox().length;
  TransportCapabilities? get capabilities => _capabilities;
  TransportEvent? get lastTransportEvent => _lastTransportEvent;

  void start() {
    if (_running) return;
    _running = true;
    _transportEventsSub ??= _transport.events.listen(_onTransportEvent);
    _timer = Timer.periodic(Duration(seconds: _pollSeconds), (_) => _tick());
    _connectivitySub = Connectivity().onConnectivityChanged.listen((_) => _tick());
    _tick();
  }

  Future<void> stop() async {
    _running = false;
    _timer?.cancel();
    _timer = null;
    await _connectivitySub?.cancel();
    _connectivitySub = null;
    await _transportEventsSub?.cancel();
    _transportEventsSub = null;
  }

  Future<void> _tick() async {
    if (!_running || _pullInFlight) return;
    _pullInFlight = true;
    try {
      await flushOutbox();
      final jobs = await _api.pull();
      _lastPollAt = DateTime.now();
      if (jobs.isEmpty) return;

      final pending = _localStore.readPendingJobs()..addAll(jobs);
      await _localStore.savePendingJobs(pending);

      for (final job in jobs) {
        _inFlightDispatches[job.messageId] = job;
        await _api.sendReport(
          CallbackReport(
            messageId: job.messageId,
            type: 'ack-dispatch',
            idempotencyKey: 'ack-${job.idempotencyKey}',
          ),
        );
        final result = await _transport.sendMessage(job);
        final report = CallbackReport(
          messageId: job.messageId,
          type: result.type,
          idempotencyKey: '${result.type}-${job.idempotencyKey}',
          payload: {
            if (result.failureCode != null) 'failureCode': result.failureCode,
            if (result.failureReason != null) 'failureReason': result.failureReason,
          },
        );
        await _enqueueAndFlushReport(report);
        _processed += 1;
        if (result.type == 'report-failed') {
          _inFlightDispatches.remove(job.messageId);
        }
      }
      await _localStore.savePendingJobs(const []);
    } catch (e) {
      AppLogger.instance.error('gateway_tick_error', e.toString());
    } finally {
      _pullInFlight = false;
    }
  }

  Future<void> _enqueueAndFlushReport(CallbackReport report) async {
    final outbox = _localStore.readCallbackOutbox()..add(report);
    await _localStore.saveCallbackOutbox(outbox);
    await flushOutbox();
  }

  Future<void> flushOutbox() async {
    final outbox = _localStore.readCallbackOutbox();
    if (outbox.isEmpty) return;
    final failed = <CallbackReport>[];
    for (final report in outbox) {
      try {
        await _api.sendReport(report);
        if (report.type == 'report-failed') {
          _failedReports += 1;
        } else {
          _sentReports += 1;
        }
      } catch (_) {
        failed.add(report);
      }
    }
    await _localStore.saveCallbackOutbox(failed);
  }

  Future<bool> requestTransportPermissions() => _transport.requestPermissions();

  Future<TransportCapabilities> refreshCapabilities() async {
    final current = await _transport.checkCapabilities();
    _capabilities = current;
    return current;
  }

  void _onTransportEvent(TransportEvent event) {
    _lastTransportEvent = event;
    if (event.type != 'delivered') {
      return;
    }
    final job = _inFlightDispatches[event.messageId];
    if (job == null) {
      return;
    }
    _enqueueAndFlushReport(
      CallbackReport(
        messageId: job.messageId,
        type: 'report-delivered',
        idempotencyKey: 'report-delivered-${job.idempotencyKey}',
      ),
    );
    _inFlightDispatches.remove(job.messageId);
  }
}
