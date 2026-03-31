import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../shared/providers/app_providers.dart';

class JobActivityScreen extends ConsumerWidget {
  const JobActivityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobs = ref.watch(pendingJobsProvider);
    final callbacks = ref.watch(callbackOutboxProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Job Activity')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Pending Jobs: ${jobs.length}', style: Theme.of(context).textTheme.titleMedium),
          ...jobs.map((j) => ListTile(
                title: Text(j.messageId),
                subtitle: Text('${j.normalizedPhoneNumber} • attempt ${j.attemptNumber}'),
              )),
          const Divider(),
          Text('Pending Callback Reports: ${callbacks.length}',
              style: Theme.of(context).textTheme.titleMedium),
          ...callbacks.map((c) => ListTile(
                title: Text('${c.type} • ${c.messageId}'),
                subtitle: Text(c.idempotencyKey),
              )),
        ],
      ),
    );
  }
}
