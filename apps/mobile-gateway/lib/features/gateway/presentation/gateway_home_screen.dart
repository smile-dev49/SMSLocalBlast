import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/providers/app_providers.dart';

class GatewayHomeScreen extends ConsumerWidget {
  const GatewayHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final gateway = ref.watch(gatewayControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Gateway Home')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            title: const Text('Device Identifier'),
            subtitle: Text(auth.session?.deviceIdentifier ?? '-'),
          ),
          SwitchListTile(
            value: gateway.running,
            onChanged: (v) => ref.read(gatewayControllerProvider.notifier).setRunning(v),
            title: const Text('Gateway Running'),
          ),
          ListTile(
            title: const Text('Last Poll'),
            subtitle: Text(gateway.lastPollAt?.toIso8601String() ?? 'Never'),
          ),
          ListTile(
            title: const Text('Processed Jobs'),
            trailing: Text('${gateway.processedJobs}'),
          ),
          ListTile(
            title: const Text('Pending Callbacks'),
            trailing: Text('${gateway.pendingCallbacks}'),
          ),
          ListTile(
            title: const Text('Sent Reports'),
            trailing: Text('${gateway.sentReports}'),
          ),
          ListTile(
            title: const Text('Failed Reports'),
            trailing: Text('${gateway.failedReports}'),
          ),
        ],
      ),
    );
  }
}
