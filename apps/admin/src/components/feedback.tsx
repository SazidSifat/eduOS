import { useLanguage } from '@eduos/ui';
import { Button } from '@eduos/ui';
export function LoadingState({ label = 'Loading workspace…' }: { label?: string }) {
  const { t } = useLanguage();

  return <output className="py-8 text-muted-foreground">{t(label)}</output>;
}
export function ErrorState({ retry }: { retry: () => void }) {
  const { t } = useLanguage();

  return (
    <div role="alert" className="space-y-4 py-8">
      <p>{t('Something went wrong. Please try again.')}</p>
      <Button onClick={retry}>{t('Try again')}</Button>
    </div>
  );
}
