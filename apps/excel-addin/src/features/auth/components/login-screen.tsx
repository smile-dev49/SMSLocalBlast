import { Button, Card, Field, Input, Text } from '@fluentui/react-components';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuthStore } from '@/core/auth/auth-store';
import { authApi } from '@/features/auth/api/auth-api';

export function LoginScreen(): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setTokens = useAuthStore((s) => s.setTokens);

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => { setTokens(data.accessToken, data.refreshToken); },
  });

  return (
    <Card>
      <Text size={500} weight="semibold">
        Sign in to SMS LocalBlast
      </Text>
      <Field label="Email">
        <Input value={email} onChange={(_, d) => { setEmail(d.value); }} />
      </Field>
      <Field label="Password">
        <Input type="password" value={password} onChange={(_, d) => { setPassword(d.value); }} />
      </Field>
      <Button
        appearance="primary"
        onClick={() => { mutation.mutate({ email, password }); }}
        disabled={mutation.isPending}
      >
        Login
      </Button>
      {mutation.error ? <Text>{(mutation.error).message}</Text> : null}
    </Card>
  );
}
