import { useLanguage } from '@eduos/ui';
import { useRouter } from '@tanstack/react-router';
import { ErrorState } from '../../../components/feedback';
import { LoginHeading, LoginShell } from './login-shell';

export function LoginPending() {
  const { t } = useLanguage();

  return (
    <LoginShell>
      <LoginHeading />
      <div aria-busy="true" className="space-y-6">
        <output className="block text-xs text-muted-foreground">
          {t('Checking your session…')}
        </output>
        <div aria-hidden="true" className="space-y-6">
          <div className="h-12 rounded-md bg-muted" />
          <div className="h-12 rounded-md bg-muted" />
          <div className="h-12 rounded-md bg-muted" />
        </div>
      </div>
    </LoginShell>
  );
}

export function LoginError() {
  const router = useRouter();
  return (
    <LoginShell>
      <LoginHeading />
      <ErrorState
        retry={() => {
          void router.invalidate();
        }}
      />
    </LoginShell>
  );
}
