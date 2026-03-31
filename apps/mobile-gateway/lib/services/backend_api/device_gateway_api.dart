import '../../core/models/callback_report.dart';
import '../../core/models/dispatch_job.dart';
import '../../core/network/api_client.dart';

abstract class GatewayApiClient {
  Future<String> login({
    required String deviceIdentifier,
    required String secret,
  });

  Future<List<DispatchJob>> pull();
  Future<void> sendReport(CallbackReport report);
}

class DeviceGatewayApi implements GatewayApiClient {
  DeviceGatewayApi(this._client);
  final ApiClient _client;

  @override
  Future<String> login({
    required String deviceIdentifier,
    required String secret,
  }) async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/device-gateway/auth/login',
      data: {'deviceIdentifier': deviceIdentifier, 'secret': secret},
    );
    return res.data?['accessToken'] as String;
  }

  @override
  Future<List<DispatchJob>> pull() async {
    final res = await _client.dio.post<Map<String, dynamic>>(
      '/device-gateway/dispatch/pull',
      data: const <String, dynamic>{},
    );
    final items = (res.data?['items'] as List<dynamic>? ?? const [])
        .cast<Map<String, dynamic>>();
    return items.map(DispatchJob.fromJson).toList();
  }

  @override
  Future<void> sendReport(CallbackReport report) async {
    final path = switch (report.type) {
      'ack-dispatch' => '/device-gateway/messages/${report.messageId}/ack-dispatch',
      'report-sent' => '/device-gateway/messages/${report.messageId}/report-sent',
      'report-delivered' => '/device-gateway/messages/${report.messageId}/report-delivered',
      _ => '/device-gateway/messages/${report.messageId}/report-failed',
    };
    await _client.dio.post<void>(path, data: {
      'idempotencyKey': report.idempotencyKey,
      ...report.payload,
    });
  }
}
