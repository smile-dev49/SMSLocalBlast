import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sms_localblast_mobile_gateway/core/models/callback_report.dart';
import 'package:sms_localblast_mobile_gateway/core/models/dispatch_job.dart';
import 'package:sms_localblast_mobile_gateway/core/storage/secure_storage_service.dart';
import 'package:sms_localblast_mobile_gateway/features/auth/data/auth_repository.dart';
import 'package:sms_localblast_mobile_gateway/features/auth/presentation/auth_controller.dart';
import 'package:sms_localblast_mobile_gateway/features/auth/presentation/device_login_screen.dart';
import 'package:sms_localblast_mobile_gateway/services/backend_api/device_gateway_api.dart';
import 'package:sms_localblast_mobile_gateway/shared/providers/app_providers.dart';

class _FakeApi implements GatewayApiClient {
  @override
  Future<String> login({required String deviceIdentifier, required String secret}) async {
    return 'token';
  }

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
  testWidgets('renders login fields and button', (tester) async {
    final controller = AuthController(
      AuthRepository(api: _FakeApi(), secureStorage: _FakeStore()),
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith((ref) => controller),
        ],
        child: const MaterialApp(home: DeviceLoginScreen()),
      ),
    );
    expect(find.text('Device Gateway Login'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });
}
