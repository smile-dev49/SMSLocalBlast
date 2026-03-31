import 'dart:async';
import 'dart:ui';

import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/bootstrap_state.dart';
import '../core/logging/app_logger.dart';

Future<void> bootstrap() async {
  BootstrapState.instance.sharedPreferences = await SharedPreferences.getInstance();
  FlutterError.onError = (FlutterErrorDetails details) {
    AppLogger.instance.error('flutter_error', details.exceptionAsString());
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    AppLogger.instance.error('platform_error', error.toString());
    return true;
  };
}
