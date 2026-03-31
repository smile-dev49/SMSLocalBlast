import 'package:shared_preferences/shared_preferences.dart';

class BootstrapState {
  BootstrapState._();
  static final BootstrapState instance = BootstrapState._();

  late final SharedPreferences sharedPreferences;
}
