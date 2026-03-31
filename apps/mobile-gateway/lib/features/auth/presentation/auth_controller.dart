import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_repository.dart';
import '../domain/auth_state.dart';

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repo) : super(const AuthState());
  final AuthRepository _repo;

  Future<void> restore() async {
    final session = await _repo.restoreSession();
    state = state.copyWith(session: session, error: null);
  }

  Future<void> login({
    required String deviceIdentifier,
    required String secret,
  }) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final session = await _repo.login(
        deviceIdentifier: deviceIdentifier,
        secret: secret,
      );
      state = AuthState(session: session, loading: false);
    } catch (e) {
      state = AuthState(session: null, loading: false, error: e.toString());
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState();
  }
}
