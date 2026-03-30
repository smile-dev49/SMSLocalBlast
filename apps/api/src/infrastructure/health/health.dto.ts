export interface HealthLiveResponse {
  readonly status: 'alive';
  readonly uptimeSeconds: number;
}

export interface DependencyCheck {
  readonly name: string;
  readonly status: 'up' | 'down';
  readonly detail?: string;
}

export interface HealthReadyResponse {
  readonly status: 'ready' | 'degraded';
  readonly checks: DependencyCheck[];
}
