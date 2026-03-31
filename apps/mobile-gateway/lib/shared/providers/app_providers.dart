import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/config/app_config.dart';
import '../../core/config/bootstrap_state.dart';
import '../../core/models/callback_report.dart';
import '../../core/models/dispatch_job.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/local_store.dart';
import '../../core/storage/secure_storage_service.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/presentation/auth_controller.dart';
import '../../features/gateway/domain/gateway_state.dart';
import '../../features/gateway/presentation/gateway_controller.dart';
import '../../services/backend_api/device_gateway_api.dart';
import '../../services/background/gateway_orchestrator.dart';

final appConfigProvider = Provider<AppConfig>((_) => AppConfig.fromEnv());

final flutterSecureStorageProvider =
    Provider<FlutterSecureStorage>((_) => const FlutterSecureStorage());

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService(ref.watch(flutterSecureStorageProvider));
});

final localStoreProvider = Provider<LocalStore>((ref) {
  return LocalStore(BootstrapState.instance.sharedPreferences);
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    config: ref.watch(appConfigProvider),
    tokenReader: () => ref.read(secureStorageProvider).readToken(),
  );
});

final gatewayApiProvider = Provider<DeviceGatewayApi>((ref) {
  return DeviceGatewayApi(ref.watch(apiClientProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    api: ref.watch(gatewayApiProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  final c = AuthController(ref.watch(authRepositoryProvider));
  c.restore();
  return c;
});

final orchestratorProvider = Provider<GatewayOrchestrator>((ref) {
  return GatewayOrchestrator(
    api: ref.watch(gatewayApiProvider),
    localStore: ref.watch(localStoreProvider),
    pollSeconds: ref.watch(appConfigProvider).dispatchPollIntervalSeconds,
  );
});

final gatewayControllerProvider = StateNotifierProvider<GatewayController, GatewayState>((ref) {
  return GatewayController(ref.watch(orchestratorProvider));
});

final pendingJobsProvider = Provider<List<DispatchJob>>((ref) {
  return ref.watch(localStoreProvider).readPendingJobs();
});

final callbackOutboxProvider = Provider<List<CallbackReport>>((ref) {
  return ref.watch(localStoreProvider).readCallbackOutbox();
});
