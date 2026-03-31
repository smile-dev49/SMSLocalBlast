import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract class GatewaySecureStore {
  Future<void> saveSession({
    required String token,
    required String deviceIdentifier,
  });
  Future<String?> readToken();
  Future<String?> readDeviceIdentifier();
  Future<void> clearSession();
}

class SecureStorageService implements GatewaySecureStore {
  SecureStorageService(this._storage);

  final FlutterSecureStorage _storage;
  static const _tokenKey = 'device_gateway_access_token';
  static const _deviceIdentifierKey = 'device_identifier';

  Future<void> saveSession({
    required String token,
    required String deviceIdentifier,
  }) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _deviceIdentifierKey, value: deviceIdentifier);
  }

  Future<String?> readToken() => _storage.read(key: _tokenKey);
  Future<String?> readDeviceIdentifier() => _storage.read(key: _deviceIdentifierKey);

  Future<void> clearSession() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _deviceIdentifierKey);
  }
}
