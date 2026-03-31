class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.environment,
    required this.dispatchPollIntervalSeconds,
    required this.debugLogging,
  });

  final String apiBaseUrl;
  final String environment;
  final int dispatchPollIntervalSeconds;
  final bool debugLogging;

  factory AppConfig.fromEnv() {
    return AppConfig(
      apiBaseUrl: const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://10.0.2.2:3000/api/v1',
      ),
      environment: const String.fromEnvironment('APP_ENV', defaultValue: 'dev'),
      dispatchPollIntervalSeconds: int.tryParse(
            const String.fromEnvironment('DISPATCH_POLL_SECONDS', defaultValue: '10'),
          ) ??
          10,
      debugLogging: const bool.fromEnvironment('DEBUG_LOGGING', defaultValue: true),
    );
  }
}
