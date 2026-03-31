import '../../core/models/dispatch_job.dart';

class TransportResult {
  const TransportResult({
    required this.type,
    this.failureCode,
    this.failureReason,
  });

  final String type; // report-sent | report-delivered | report-failed
  final String? failureCode;
  final String? failureReason;
}

abstract class GatewayTransport {
  Future<TransportResult> sendMessage(DispatchJob job);
  Future<bool> requestPermissions();
  Future<Map<String, dynamic>> checkCapabilities();
}
