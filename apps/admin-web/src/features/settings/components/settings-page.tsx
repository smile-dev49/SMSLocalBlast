'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { hasPermission, PERMISSION } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { isDevDiagnosticsEnabled, publicEnv } from '@/core/config/env';
import { formatApiError, formatDateTime } from '@/core/utils/format';
import { authApi } from '@/features/auth/api/auth-api';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function SettingsPage(): ReactElement {
  const { me, logout, refreshMe } = useAuth();
  const qc = useQueryClient();
  const canSessions = hasPermission(me?.permissions, PERMISSION.authSessionsRead);
  const canRevoke = hasPermission(me?.permissions, PERMISSION.authSessionsRevoke);
  const canLogoutAll = hasPermission(me?.permissions, PERMISSION.authLogoutAll);

  const sessionsQ = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: () => authApi.listSessions(),
    enabled: canSessions,
  });

  const logoutAllM = useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: async () => {
      await refreshMe();
      void qc.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });

  const revokeM = useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['auth', 'sessions'] });
    },
  });

  if (!me) {
    return <div />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Account, permissions, and active sessions.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signed-in user</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-slate-500">Email: </span>
            {me.user.email}
          </p>
          <p>
            <span className="text-slate-500">Name: </span>
            {me.user.firstName} {me.user.lastName}
          </p>
          <p>
            <span className="text-slate-500">Membership: </span>
            {me.membership.status}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{me.organization.name}</p>
          <p className="text-slate-500">Slug: {me.organization.slug}</p>
          <p className="text-slate-500">Status: {me.organization.status}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role & permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-slate-500">Role: </span>
            {me.role.name} ({me.role.code})
          </p>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Permissions</p>
            <ul className="max-h-48 overflow-auto rounded-md border border-slate-200 p-2 font-mono text-xs dark:border-slate-700">
              {me.permissions.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      {canSessions ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessionsQ.isPending ? (
              <p className="text-sm text-slate-500">Loading sessions…</p>
            ) : null}
            {sessionsQ.error ? (
              <p className="text-sm text-red-600">{formatApiError(sessionsQ.error)}</p>
            ) : null}
            {sessionsQ.data ? (
              <ul className="space-y-3 text-sm">
                {sessionsQ.data.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-md border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <p className="font-mono text-xs text-slate-500">{s.id}</p>
                    <p>UA: {s.userAgent ?? '—'}</p>
                    <p>IP: {s.ipAddress ?? '—'}</p>
                    <p>Expires: {formatDateTime(s.expiresAt)}</p>
                    <p>Last used: {formatDateTime(s.lastUsedAt)}</p>
                    {canRevoke ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2"
                        disabled={revokeM.isPending}
                        onClick={() => void revokeM.mutateAsync(s.id)}
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {canLogoutAll ? (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={logoutAllM.isPending}
                  onClick={() => void logoutAllM.mutateAsync()}
                >
                  Log out other sessions
                </Button>
                {logoutAllM.error ? (
                  <p className="mt-2 text-sm text-red-600">{formatApiError(logoutAllM.error)}</p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-slate-500">Session list requires auth.sessions.read.</p>
      )}
      {isDevDiagnosticsEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Developer diagnostics</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-xs text-slate-600 dark:text-slate-400">
            <p>NEXT_PUBLIC_API_BASE_URL → {publicEnv.apiBaseUrl}</p>
          </CardContent>
        </Card>
      ) : null}
      <Button type="button" variant="outline" onClick={() => void logout()}>
        Log out this session
      </Button>
    </div>
  );
}
