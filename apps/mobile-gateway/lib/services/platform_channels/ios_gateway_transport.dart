import '../../core/models/dispatch_job.dart';
import 'gateway_transport.dart';

class IosGatewayTransport implements GatewayTransport {
  @override
  Future<Map<String, dynamic>> checkCapabilities() async {
    return const {
      'smsSend': false,
      'deliveryReports': false,
      'note': 'iOS automation is intentionally limited; no silent SMS transport implemented.',
    };
  }

  @override
  Future<bool> requestPermissions() async => true;

  @override
  Future<TransportResult> sendMessage(DispatchJob job) async {
    return const TransportResult(
      type: 'report-failed',
      failureCode: 'TRANSPORT_UNSUPPORTED',
      failureReason: 'iOS transport automation not implemented in this step',
    );
  }
}
