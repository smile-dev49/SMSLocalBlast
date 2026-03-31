import 'dart:developer' as dev;

class AppLogger {
  AppLogger._();
  static final AppLogger instance = AppLogger._();

  void info(String event, [String? message]) {
    dev.log(message ?? '', name: event);
  }

  void error(String event, String message) {
    dev.log(message, name: event, level: 1000);
  }
}
