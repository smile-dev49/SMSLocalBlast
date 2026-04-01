import type { ReactElement } from 'react';
import { Suspense } from 'react';

import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
