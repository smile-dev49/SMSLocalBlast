class CallbackReport {
  const CallbackReport({
    required this.messageId,
    required this.type,
    required this.idempotencyKey,
    this.payload = const {},
  });

  final String messageId;
  final String type;
  final String idempotencyKey;
  final Map<String, dynamic> payload;

  factory CallbackReport.fromJson(Map<String, dynamic> json) {
    return CallbackReport(
      messageId: json['messageId'] as String,
      type: json['type'] as String,
      idempotencyKey: json['idempotencyKey'] as String,
      payload: (json['payload'] as Map<String, dynamic>?) ?? const {},
    );
  }

  Map<String, dynamic> toJson() => {
        'messageId': messageId,
        'type': type,
        'idempotencyKey': idempotencyKey,
        'payload': payload,
      };
}
