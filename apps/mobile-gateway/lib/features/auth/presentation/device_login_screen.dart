import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/providers/app_providers.dart';

class DeviceLoginScreen extends ConsumerStatefulWidget {
  const DeviceLoginScreen({super.key});

  @override
  ConsumerState<DeviceLoginScreen> createState() => _DeviceLoginScreenState();
}

class _DeviceLoginScreenState extends ConsumerState<DeviceLoginScreen> {
  final _deviceId = TextEditingController();
  final _secret = TextEditingController();

  @override
  void dispose() {
    _deviceId.dispose();
    _secret.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Device Gateway Login')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _deviceId,
              decoration: const InputDecoration(labelText: 'Device Identifier'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _secret,
              decoration: const InputDecoration(labelText: 'Device Secret'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: auth.loading
                  ? null
                  : () => ref.read(authControllerProvider.notifier).login(
                        deviceIdentifier: _deviceId.text.trim(),
                        secret: _secret.text.trim(),
                      ),
              child: auth.loading
                  ? const SizedBox.square(
                      dimension: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Login'),
            ),
            if (auth.error != null) ...[
              const SizedBox(height: 12),
              Text(auth.error!, style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}
