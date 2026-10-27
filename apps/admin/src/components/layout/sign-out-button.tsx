import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@eduos/ui';
import { authClient } from '../../app/login/_api/auth';
import { queryClient } from '../../lib/query-client';
export function SignOutButton() {
  const [failure, setFailure] = useState(false);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  async function logout() {
    setPending(true);
    setFailure(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setFailure(true);
        return;
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
    } catch {
      setFailure(true);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          void logout();
        }}
      >
        {pending ? 'Signing out…' : 'Sign out'}
      </Button>
      {failure && (
        <p role="alert" className="text-xs text-destructive">
          Could not sign out. Try again.
        </p>
      )}
    </div>
  );
}
