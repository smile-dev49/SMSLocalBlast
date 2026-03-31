class GatewayState {
  const GatewayState({
    this.running = false,
    this.lastPollAt,
    this.pendingCallbacks = 0,
    this.processedJobs = 0,
    this.sentReports = 0,
    this.failedReports = 0,
  });

  final bool running;
  final DateTime? lastPollAt;
  final int pendingCallbacks;
  final int processedJobs;
  final int sentReports;
  final int failedReports;

  GatewayState copyWith({
    bool? running,
    DateTime? lastPollAt,
    int? pendingCallbacks,
    int? processedJobs,
    int? sentReports,
    int? failedReports,
  }) {
    return GatewayState(
      running: running ?? this.running,
      lastPollAt: lastPollAt ?? this.lastPollAt,
      pendingCallbacks: pendingCallbacks ?? this.pendingCallbacks,
      processedJobs: processedJobs ?? this.processedJobs,
      sentReports: sentReports ?? this.sentReports,
      failedReports: failedReports ?? this.failedReports,
    );
  }
}
