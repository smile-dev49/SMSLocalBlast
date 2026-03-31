import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms_localblast_mobile_gateway/core/models/callback_report.dart';
import 'package:sms_localblast_mobile_gateway/core/models/dispatch_job.dart';
import 'package:sms_localblast_mobile_gateway/core/storage/local_store.dart';
import 'package:sms_localblast_mobile_gateway/services/backend_api/device_gateway_api.dart';
import 'package:sms_localblast_mobile_gateway/services/background/gateway_orchestrator.dart';
import 'package:sms_localblast_mobile_gateway/services/platform_channels/gateway_transport.dart';

class _FakeApi implements GatewayApiClient {
  final List<CallbackReport> reports = <CallbackReport>[];
  bool pulled = false;

  @override
  Future<String> login({required String deviceIdentifier, required String secret}) async => 'token';

  @override
  Future<List<DispatchJob>> pull() async {
    if (pulled) return const [];
    pulled = true;
    return const [
      DispatchJob(
        messageId: 'm1',
        normalizedPhoneNumber: '15550001',
        renderedBody: 'Hello',
        channelType: 'SMS',
        idempotencyKey: 'idk-1',
        attemptNumber: 1,
      ),
    ];
  }

  @override
  Future<void> sendReport(CallbackReport report) async {
    reports.add(report);
  }
}

class _FakeTransport implements GatewayTransport {
  final StreamController<TransportEvent> _events = StreamController<TransportEvent>.broadcast();

  @override
  Stream<TransportEvent> get events => _events.stream;

  @override
  TransportEvent? get lastEvent => null;

  @override
  Future<TransportCapabilities> checkCapabilities() async {
    return const TransportCapabilities(
      platform: 'android',
      smsSupported: true,
      deliveryReportsSupported: true,
      permissionGranted: true,
      note: 'ok',
    );
  }

  @override
  Future<bool> requestPermissions() async => true;

  @override
  Future<TransportResult> sendMessage(DispatchJob job) async {
    Future<void>.delayed(
      const Duration(milliseconds: 10),
      () => _events.add(
        const TransportEvent(type: 'delivered', messageId: 'm1', correlationId: 'c1'),
      ),
    );
    return const TransportResult(type: 'report-sent');
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('orchestrator enqueues sent and delivered callbacks', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final api = _FakeApi();
    final orchestrator = GatewayOrchestrator(
      api: api,
      localStore: LocalStore(prefs),
      pollSeconds: 999,
      transport: _FakeTransport(),
    );

    orchestrator.start();
    await Future<void>.delayed(const Duration(milliseconds: 150));
    await orchestrator.stop();

    final reportTypes = api.reports.map((e) => e.type).toList();
    expect(reportTypes, contains('ack-dispatch'));
    expect(reportTypes, contains('report-sent'));
    expect(reportTypes, contains('report-delivered'));
  });
}
