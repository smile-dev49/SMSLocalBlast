import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms_localblast_mobile_gateway/core/models/callback_report.dart';
import 'package:sms_localblast_mobile_gateway/core/models/dispatch_job.dart';
import 'package:sms_localblast_mobile_gateway/core/storage/local_store.dart';

void main() {
  test('local store persists jobs and callback outbox', () async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final store = LocalStore(prefs);

    await store.savePendingJobs(const [
      DispatchJob(
        messageId: 'm1',
        normalizedPhoneNumber: '15550001',
        renderedBody: 'Hello',
        channelType: 'SMS',
        idempotencyKey: 'idk',
        attemptNumber: 1,
      ),
    ]);
    expect(store.readPendingJobs().length, 1);

    await store.saveCallbackOutbox(const [
      CallbackReport(messageId: 'm1', type: 'report-sent', idempotencyKey: 'k1'),
    ]);
    expect(store.readCallbackOutbox().length, 1);
  });
}
