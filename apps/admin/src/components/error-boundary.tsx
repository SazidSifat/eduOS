import { LanguageToggle, useLanguage } from '@eduos/ui';
import { Component, type ErrorInfo, type ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Connect a redacted error reporter before production rollout. */
  }
  override render() {
    return this.state.failed ? <ErrorFallback /> : this.props.children;
  }
}

function ErrorFallback() {
  const { t } = useLanguage();
  return (
    <main role="alert" className="mx-auto max-w-xl space-y-4 p-8">
      <LanguageToggle />
      <h1 className="text-2xl font-semibold">{t('EduOS could not load')}</h1>
      <p>{t('Reload to try again.')}</p>
      <a href="/" className="underline">
        {t('Reload EduOS')}
      </a>
    </main>
  );
}
