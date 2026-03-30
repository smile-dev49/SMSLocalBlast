import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContextStore } from '../../common/types/request-context.types';

export const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore | undefined {
  return requestContextStorage.getStore();
}
