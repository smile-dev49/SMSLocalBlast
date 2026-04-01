'use client';

import type { ReactElement } from 'react';

import { useLaunchReadinessHints } from '@/features/docs/hooks/use-launch-readiness-hints';

import { LaunchChecklistContent } from './launch-checklist-content';

export function LaunchChecklistView(): ReactElement {
  const hints = useLaunchReadinessHints();
  return <LaunchChecklistContent hints={hints} />;
}
