import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/presentation/device_login_screen.dart';
import '../features/dispatch/presentation/job_activity_screen.dart';
import '../features/gateway/presentation/gateway_home_screen.dart';
import '../features/settings/presentation/settings_screen.dart';
import '../shared/providers/app_providers.dart';

class MobileGatewayAppBootstrap extends ConsumerWidget {
  const MobileGatewayAppBootstrap({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    return MaterialApp(
      title: 'SMS LocalBlast Gateway',
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: auth.isAuthenticated ? const GatewayShell() : const DeviceLoginScreen(),
    );
  }
}

class GatewayShell extends StatefulWidget {
  const GatewayShell({super.key});

  @override
  State<GatewayShell> createState() => _GatewayShellState();
}

class _GatewayShellState extends State<GatewayShell> {
  int _index = 0;
  static const _tabs = [
    GatewayHomeScreen(),
    JobActivityScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _tabs[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (idx) => setState(() => _index = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.sync), label: 'Gateway'),
          NavigationDestination(icon: Icon(Icons.list), label: 'Jobs'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}
