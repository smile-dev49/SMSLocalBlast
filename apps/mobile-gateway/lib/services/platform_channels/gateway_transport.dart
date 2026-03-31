import '../../core/models/dispatch_job.dart';

class TransportCapabilities {
  const TransportCapabilities({
    required this.platform,
    required this.smsSupported,
    required this.deliveryReportsSupported,
    required this.permissionGranted,
    required this.note,
  });

  final String platform;
  final bool smsSupported;
  final bool deliveryReportsSupported;
  final bool permissionGranted;
  final String note;

  factory TransportCapabilities.fromJson(Map<String, dynamic> json) {
    return TransportCapabilities(
      platform: (json['platform'] as String?) ?? 'unknown',
      smsSupported: (json['smsSupported'] as bool?) ?? false,
      deliveryReportsSupported: (json['deliveryReportsSupported'] as bool?) ?? false,
      permissionGranted: (json['permissionGranted'] as bool?) ?? false,
      note: (json['note'] as String?) ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'platform': platform,
        'smsSupported': smsSupported,
        'deliveryReportsSupported': deliveryReportsSupported,
        'permissionGranted': permissionGranted,
        'note': note,
      };
}

class TransportEvent {
  const TransportEvent({
    required this.type,
    required this.messageId,
    required this.correlationId,
    this.failureCode,
    this.failureReason,
  });

  final String type; // sent | delivered | failed | accepted
  final String messageId;
  final String correlationId;
  final String? failureCode;
  final String? failureReason;

  factory TransportEvent.fromJson(Map<String, dynamic> json) {
    return TransportEvent(
      type: json['type'] as String,
      messageId: json['messageId'] as String,
      correlationId: (json['correlationId'] as String?) ?? '',
      failureCode: json['failureCode'] as String?,
      failureReason: json['failureReason'] as String?,
    );
  }
}

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
  Future<TransportCapabilities> checkCapabilities();
  Stream<TransportEvent> get events;
  TransportEvent? get lastEvent;
}
