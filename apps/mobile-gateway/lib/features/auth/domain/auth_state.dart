import '../../../core/models/gateway_session.dart';

class AuthState {
  const AuthState({
    this.session,
    this.loading = false,
    this.error,
  });

  final GatewaySession? session;
  final bool loading;
  final String? error;

  bool get isAuthenticated => session != null;

  AuthState copyWith({
    GatewaySession? session,
    bool? loading,
    String? error,
  }) {
    return AuthState(
      session: session ?? this.session,
      loading: loading ?? this.loading,
      error: error,
    );
  }
}
