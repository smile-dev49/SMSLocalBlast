'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent, ReactElement, SyntheticEvent } from 'react';
import { useEffect, useState } from 'react';

import { useAuth } from '@/core/auth/auth-context';
import { formatApiError } from '@/core/utils/format';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

export function LoginForm(): ReactElement {
  const { login, me, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isReady || !me) return;
    router.replace(next.startsWith('/') ? next : '/dashboard');
  }, [isReady, me, next, router]);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      router.replace(next.startsWith('/') ? next : '/dashboard');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
              {error}
            </div>
          ) : null}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Email</span>
            <Input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                setEmail(ev.target.value);
              }}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Password</span>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                setPassword(ev.target.value);
              }}
              required
            />
          </label>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
