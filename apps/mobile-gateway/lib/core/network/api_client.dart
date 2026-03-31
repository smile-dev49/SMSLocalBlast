import 'package:dio/dio.dart';

import '../config/app_config.dart';

typedef TokenReader = Future<String?> Function();

class ApiClient {
  ApiClient({
    required AppConfig config,
    required TokenReader tokenReader,
  }) : dio = Dio(
          BaseOptions(
            baseUrl: config.apiBaseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 15),
            sendTimeout: const Duration(seconds: 10),
            headers: {'Content-Type': 'application/json'},
          ),
        ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenReader();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio dio;
}
