import '../../core/models/dispatch_job.dart';
import 'gateway_transport.dart';

class IosGatewayTransport implements GatewayTransport {
  static const TransportCapabilities _capabilities = TransportCapabilities(
    platform: 'ios',
    smsSupported: false,
    deliveryReportsSupported: false,
    permissionGranted: false,
    note: 'iOS automated SMS gateway transport is intentionally unsupported.',
  );

  @override
  Stream<TransportEvent> get events => const Stream<TransportEvent>.empty();

  @override
  TransportEvent? get lastEvent => null;

  @override
  Future<TransportCapabilities> checkCapabilities() async => _capabilities;

  @override
  Future<bool> requestPermissions() async => false;

  @override
  Future<TransportResult> sendMessage(DispatchJob job) async {
    return const TransportResult(
      type: 'report-failed',
      failureCode: 'TRANSPORT_UNSUPPORTED',
      failureReason: 'iOS transport automation not implemented in this step',
    );
  }
}
