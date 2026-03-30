export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
}

export interface ApiMeta {
  readonly requestId: string;
}

export interface ApiFailureResponse {
  readonly success: false;
  readonly error: ApiErrorBody;
  readonly meta: ApiMeta;
}

/**
 * Success responses remain plain domain DTOs from controllers.
 * Wrap only when a module explicitly uses a response envelope (future ADR).
 */
export interface ApiSuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: ApiMeta;
}
