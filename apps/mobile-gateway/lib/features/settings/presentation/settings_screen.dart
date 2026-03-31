import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../shared/providers/app_providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Settings & Diagnostics')),
      body: FutureBuilder<_Diag>(
        future: _Diag.load(),
        builder: (context, snapshot) {
          final diag = snapshot.data;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ListTile(title: const Text('API Base URL'), subtitle: Text(config.apiBaseUrl)),
              ListTile(title: const Text('Environment'), subtitle: Text(config.environment)),
              ListTile(title: const Text('Platform'), subtitle: Text(diag?.platform ?? '-')),
              ListTile(title: const Text('App Version'), subtitle: Text(diag?.version ?? '-')),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => ref.read(gatewayControllerProvider.notifier).testPull(),
                child: const Text('Test Pull'),
              ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () => ref.read(gatewayControllerProvider.notifier).flushCallbacks(),
                child: const Text('Retry Callback Outbox'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () => ref.read(authControllerProvider.notifier).logout(),
                child: const Text('Clear Session / Logout'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Diag {
  const _Diag({required this.platform, required this.version});
  final String platform;
  final String version;

  static Future<_Diag> load() async {
    final info = await PackageInfo.fromPlatform();
    final device = DeviceInfoPlugin();
    String platform;
    if (Platform.isAndroid) {
      final d = await device.androidInfo;
      platform = 'Android ${d.version.release} (${d.model})';
    } else if (Platform.isIOS) {
      final d = await device.iosInfo;
      platform = 'iOS ${d.systemVersion} (${d.utsname.machine})';
    } else {
      platform = 'Unsupported';
    }
    return _Diag(platform: platform, version: '${info.version}+${info.buildNumber}');
  }
}
