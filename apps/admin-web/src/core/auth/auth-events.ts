type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

/** Emitted when the API returns 401 so the shell can clear in-app session state. */
export const authEvents = {
  subscribeUnauthorized(listener: UnauthorizedListener): () => void {
    unauthorizedListeners.add(listener);
    return () => {
      unauthorizedListeners.delete(listener);
    };
  },
  emitUnauthorized(): void {
    for (const listener of unauthorizedListeners) {
      listener();
    }
  },
};
