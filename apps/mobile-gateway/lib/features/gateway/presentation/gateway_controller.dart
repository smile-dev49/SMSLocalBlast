import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/background/gateway_orchestrator.dart';
import '../domain/gateway_state.dart';

class GatewayController extends StateNotifier<GatewayState> {
  GatewayController(this._orchestrator) : super(const GatewayState()) {
    _syncTimer = Timer.periodic(const Duration(seconds: 2), (_) => _refresh());
  }

  final GatewayOrchestrator _orchestrator;
  late final Timer _syncTimer;

  void _refresh() {
    state = state.copyWith(
      running: _orchestrator.isRunning,
      lastPollAt: _orchestrator.lastPollAt,
      pendingCallbacks: _orchestrator.pendingCallbacks,
      processedJobs: _orchestrator.processed,
      sentReports: _orchestrator.sentReports,
      failedReports: _orchestrator.failedReports,
    );
  }

  Future<void> setRunning(bool enabled) async {
    if (enabled) {
      _orchestrator.start();
    } else {
      await _orchestrator.stop();
    }
    _refresh();
  }

  Future<void> testPull() async {
    _orchestrator.start();
    _refresh();
  }

  Future<void> flushCallbacks() async {
    await _orchestrator.flushOutbox();
    _refresh();
  }

  @override
  void dispose() {
    _syncTimer.cancel();
    super.dispose();
  }
}
