export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function formatApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
