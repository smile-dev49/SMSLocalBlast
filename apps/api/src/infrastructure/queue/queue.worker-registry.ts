/**
 * Register BullMQ processors here (import side effects) when workers are implemented.
 * API pods may run workers in-process; scale-out workers can import the same registry module.
 */
export const queueWorkerBootstrap = (): void => {
  // Empty — add `Worker` registrations per queue in future milestones.
};
