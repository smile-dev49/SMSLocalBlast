import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sms_localblast_mobile_gateway/core/models/callback_report.dart';
import 'package:sms_localblast_mobile_gateway/core/models/dispatch_job.dart';
import 'package:sms_localblast_mobile_gateway/core/storage/secure_storage_service.dart';
import 'package:sms_localblast_mobile_gateway/core/storage/local_store.dart';
import 'package:sms_localblast_mobile_gateway/features/auth/data/auth_repository.dart';
import 'package:sms_localblast_mobile_gateway/features/auth/presentation/auth_controller.dart';
import 'package:sms_localblast_mobile_gateway/features/gateway/domain/gateway_state.dart';
import 'package:sms_localblast_mobile_gateway/features/gateway/presentation/gateway_controller.dart';
import 'package:sms_localblast_mobile_gateway/features/gateway/presentation/gateway_home_screen.dart';
import 'package:sms_localblast_mobile_gateway/services/backend_api/device_gateway_api.dart';
import 'package:sms_localblast_mobile_gateway/services/background/gateway_orchestrator.dart';
import 'package:sms_localblast_mobile_gateway/shared/providers/app_providers.dart';

class _FakeApi implements GatewayApiClient {
  @override
  Future<String> login({required String deviceIdentifier, required String secret}) async =>
      'token';

  @override
  Future<List<DispatchJob>> pull() async => const [];

  @override
  Future<void> sendReport(CallbackReport report) async {}
}

class _FakeStore implements GatewaySecureStore {
  @override
  Future<void> clearSession() async {}
  @override
  Future<String?> readDeviceIdentifier() async => null;
  @override
  Future<String?> readToken() async => null;
  @override
  Future<void> saveSession({required String token, required String deviceIdentifier}) async {}
}

void main() {
  testWidgets('renders gateway counters', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final controller = GatewayController(
      GatewayOrchestrator(
        api: _FakeApi(),
        localStore: LocalStore(prefs),
        pollSeconds: 60,
      ),
    );
    controller.state = const GatewayState(running: true, processedJobs: 3, pendingCallbacks: 1);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          gatewayControllerProvider.overrideWith((ref) => controller),
          authControllerProvider.overrideWith(
            (ref) => AuthController(
              AuthRepository(api: _FakeApi(), secureStorage: _FakeStore()),
            ),
          ),
        ],
        child: const MaterialApp(home: GatewayHomeScreen()),
      ),
    );
    expect(find.text('Gateway Home'), findsOneWidget);
    expect(find.text('Processed Jobs'), findsOneWidget);
  });
}
