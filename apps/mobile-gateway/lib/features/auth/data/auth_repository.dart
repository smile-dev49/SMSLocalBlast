import '../../../core/models/gateway_session.dart';
import '../../../core/storage/secure_storage_service.dart';
import '../../../services/backend_api/device_gateway_api.dart';

class AuthRepository {
  AuthRepository({
    required GatewayApiClient api,
    required GatewaySecureStore secureStorage,
  })  : _api = api,
        _secureStorage = secureStorage;

  final GatewayApiClient _api;
  final GatewaySecureStore _secureStorage;

  Future<GatewaySession?> restoreSession() async {
    final token = await _secureStorage.readToken();
    final id = await _secureStorage.readDeviceIdentifier();
    if (token == null || id == null) return null;
    return GatewaySession(deviceIdentifier: id, accessToken: token);
  }

  Future<GatewaySession> login({
    required String deviceIdentifier,
    required String secret,
  }) async {
    final token = await _api.login(
      deviceIdentifier: deviceIdentifier,
      secret: secret,
    );
    await _secureStorage.saveSession(token: token, deviceIdentifier: deviceIdentifier);
    return GatewaySession(deviceIdentifier: deviceIdentifier, accessToken: token);
  }

  Future<void> logout() => _secureStorage.clearSession();
}
