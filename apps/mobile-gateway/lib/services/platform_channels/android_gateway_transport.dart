import '../../core/models/dispatch_job.dart';
import 'gateway_transport.dart';

class AndroidGatewayTransport implements GatewayTransport {
  @override
  Future<Map<String, dynamic>> checkCapabilities() async {
    return const {
      'smsSend': false,
      'deliveryReports': false,
      'note': 'Android transport bridge stub; native SMS integration next step.',
    };
  }

  @override
  Future<bool> requestPermissions() async => true;

  @override
  Future<TransportResult> sendMessage(DispatchJob job) async {
    return const TransportResult(type: 'report-sent');
  }
}
