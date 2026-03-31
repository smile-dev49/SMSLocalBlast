import 'package:flutter_test/flutter_test.dart';
import 'package:sms_localblast_mobile_gateway/core/models/callback_report.dart';
import 'package:sms_localblast_mobile_gateway/core/models/dispatch_job.dart';
import 'package:sms_localblast_mobile_gateway/core/storage/secure_storage_service.dart';
import 'package:sms_localblast_mobile_gateway/features/auth/data/auth_repository.dart';
import 'package:sms_localblast_mobile_gateway/services/backend_api/device_gateway_api.dart';

class _FakeApi implements GatewayApiClient {
  @override
  Future<String> login({required String deviceIdentifier, required String secret}) async {
    return 'token-123';
  }

  @override
  Future<List<DispatchJob>> pull() async => const [];

  @override
  Future<void> sendReport(CallbackReport report) async {}
}

class _FakeStore implements GatewaySecureStore {
  String? token;
  String? deviceId;

  @override
  Future<void> clearSession() async {
    token = null;
    deviceId = null;
  }

  @override
  Future<String?> readDeviceIdentifier() async => deviceId;

  @override
  Future<String?> readToken() async => token;

  @override
  Future<void> saveSession({required String token, required String deviceIdentifier}) async {
    this.token = token;
    deviceId = deviceIdentifier;
  }
}

void main() {
  test('login stores secure session', () async {
    final store = _FakeStore();
    final repo = AuthRepository(api: _FakeApi(), secureStorage: store);
    final session = await repo.login(deviceIdentifier: 'dev-1', secret: 'secret');
    expect(session.deviceIdentifier, 'dev-1');
    expect(store.token, 'token-123');
  });
}
