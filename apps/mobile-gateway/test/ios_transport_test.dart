import 'package:flutter_test/flutter_test.dart';
import 'package:sms_localblast_mobile_gateway/core/models/dispatch_job.dart';
import 'package:sms_localblast_mobile_gateway/services/platform_channels/ios_gateway_transport.dart';

void main() {
  test('ios transport reports unsupported send automation', () async {
    final transport = IosGatewayTransport();
    final capabilities = await transport.checkCapabilities();
    expect(capabilities.smsSupported, isFalse);

    const job = DispatchJob(
      messageId: 'm1',
      normalizedPhoneNumber: '15550001',
      renderedBody: 'Body',
      channelType: 'SMS',
      idempotencyKey: 'idk',
      attemptNumber: 1,
    );
    final result = await transport.sendMessage(job);
    expect(result.type, 'report-failed');
    expect(result.failureCode, 'TRANSPORT_UNSUPPORTED');
  });
}
