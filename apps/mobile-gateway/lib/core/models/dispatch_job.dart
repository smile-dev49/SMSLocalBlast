class DispatchJob {
  const DispatchJob({
    required this.messageId,
    required this.normalizedPhoneNumber,
    required this.renderedBody,
    required this.channelType,
    required this.idempotencyKey,
    required this.attemptNumber,
    this.campaignId,
    this.contactId,
  });

  final String messageId;
  final String normalizedPhoneNumber;
  final String renderedBody;
  final String channelType;
  final String idempotencyKey;
  final int attemptNumber;
  final String? campaignId;
  final String? contactId;

  factory DispatchJob.fromJson(Map<String, dynamic> json) {
    return DispatchJob(
      messageId: json['messageId'] as String,
      normalizedPhoneNumber: json['normalizedPhoneNumber'] as String,
      renderedBody: json['renderedBody'] as String,
      channelType: json['channelType'] as String,
      idempotencyKey: json['idempotencyKey'] as String,
      attemptNumber: (json['attemptNumber'] as num).toInt(),
      campaignId: json['campaignId'] as String?,
      contactId: json['contactId'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'messageId': messageId,
        'normalizedPhoneNumber': normalizedPhoneNumber,
        'renderedBody': renderedBody,
        'channelType': channelType,
        'idempotencyKey': idempotencyKey,
        'attemptNumber': attemptNumber,
        'campaignId': campaignId,
        'contactId': contactId,
      };
}
