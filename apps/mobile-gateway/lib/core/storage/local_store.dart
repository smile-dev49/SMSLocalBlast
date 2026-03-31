import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/callback_report.dart';
import '../models/dispatch_job.dart';

class LocalStore {
  LocalStore(this._prefs);
  final SharedPreferences _prefs;

  static const _pendingJobsKey = 'pending_jobs';
  static const _callbackOutboxKey = 'callback_outbox';
  static const _gatewayEnabledKey = 'gateway_enabled';

  Future<void> savePendingJobs(List<DispatchJob> jobs) async {
    final encoded = jobs.map((e) => jsonEncode(e.toJson())).toList();
    await _prefs.setStringList(_pendingJobsKey, encoded);
  }

  List<DispatchJob> readPendingJobs() {
    final raw = _prefs.getStringList(_pendingJobsKey) ?? const [];
    return raw
        .map((e) => DispatchJob.fromJson(jsonDecode(e) as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveCallbackOutbox(List<CallbackReport> reports) async {
    final encoded = reports.map((e) => jsonEncode(e.toJson())).toList();
    await _prefs.setStringList(_callbackOutboxKey, encoded);
  }

  List<CallbackReport> readCallbackOutbox() {
    final raw = _prefs.getStringList(_callbackOutboxKey) ?? const [];
    return raw
        .map((e) => CallbackReport.fromJson(jsonDecode(e) as Map<String, dynamic>))
        .toList();
  }

  bool readGatewayEnabled() => _prefs.getBool(_gatewayEnabledKey) ?? true;
  Future<void> setGatewayEnabled(bool value) => _prefs.setBool(_gatewayEnabledKey, value);
}
