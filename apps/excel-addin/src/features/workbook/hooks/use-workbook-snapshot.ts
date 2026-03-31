import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { readActiveWorksheetSnapshot } from '@/core/office/workbook-service';
import type { WorkbookSnapshot } from '@/features/workbook/types/workbook.types';

export function useWorkbookSnapshot(): {
  snapshot: WorkbookSnapshot | null;
  refresh: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
} {
  const [snapshot, setSnapshot] = useState<WorkbookSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => readActiveWorksheetSnapshot(),
    onSuccess: (data) => {
      setSnapshot(data);
      setError(null);
    },
    onError: (err) => { setError((err).message); },
  });

  return {
    snapshot,
    refresh: async () => mutation.mutateAsync(),
    isLoading: mutation.isPending,
    error,
  };
}
