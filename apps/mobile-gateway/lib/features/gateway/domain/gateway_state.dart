import '../../../services/platform_channels/gateway_transport.dart';

class GatewayState {
  const GatewayState({
    this.running = false,
    this.lastPollAt,
    this.pendingCallbacks = 0,
    this.processedJobs = 0,
    this.sentReports = 0,
    this.failedReports = 0,
    this.capabilities,
    this.lastTransportEvent,
    this.permissionGranted = false,
  });

  final bool running;
  final DateTime? lastPollAt;
  final int pendingCallbacks;
  final int processedJobs;
  final int sentReports;
  final int failedReports;
  final TransportCapabilities? capabilities;
  final TransportEvent? lastTransportEvent;
  final bool permissionGranted;

  GatewayState copyWith({
    bool? running,
    DateTime? lastPollAt,
    int? pendingCallbacks,
    int? processedJobs,
    int? sentReports,
    int? failedReports,
    TransportCapabilities? capabilities,
    TransportEvent? lastTransportEvent,
    bool? permissionGranted,
  }) {
    return GatewayState(
      running: running ?? this.running,
      lastPollAt: lastPollAt ?? this.lastPollAt,
      pendingCallbacks: pendingCallbacks ?? this.pendingCallbacks,
      processedJobs: processedJobs ?? this.processedJobs,
      sentReports: sentReports ?? this.sentReports,
      failedReports: failedReports ?? this.failedReports,
      capabilities: capabilities ?? this.capabilities,
      lastTransportEvent: lastTransportEvent ?? this.lastTransportEvent,
      permissionGranted: permissionGranted ?? this.permissionGranted,
    );
  }
}
