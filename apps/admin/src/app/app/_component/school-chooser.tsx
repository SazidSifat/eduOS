import { useLanguage } from '@eduos/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { membershipsQuery } from '../../institutions/$institutionId/_api/queries';
import { AppShell } from '../../../components/layout/app-shell';
import { SignOutButton } from '../../../components/layout/sign-out-button';
import { ErrorState, LoadingState } from '../../../components/feedback';

export function SchoolChooser({ userId }: { userId: string }) {
  const { t } = useLanguage();

  const memberships = useQuery(membershipsQuery(userId));
  const schools = memberships.data?.filter((membership) => membership.role !== null) ?? [];
  return (
    <AppShell>
      <section className="max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">
            {schools.length ? t('Choose your school') : t('No school access')}
          </h1>
          <SignOutButton />
        </div>
        {memberships.isPending ? (
          <LoadingState />
        ) : memberships.isError ? (
          <ErrorState
            retry={() => {
              void memberships.refetch();
            }}
          />
        ) : !schools.length ? (
          <p className="text-muted-foreground">
            {t(
              'Your account has no active school role. Contact your institution administrator to assign access.',
            )}{' '}
          </p>
        ) : (
          <>
            <p className="text-muted-foreground">{t('Choose a school to open its application.')}</p>
            <ul className="divide-y divide-border rounded-md border border-border">
              {schools.map((school) => (
                <li key={school.institutionId}>
                  <Link
                    to={
                      school.role === 'teacher'
                        ? '/attendance'
                        : school.role === 'accountant'
                          ? '/fees'
                          : '/admissions'
                    }
                    search={{ institutionId: school.institutionId }}
                    className="flex items-center justify-between gap-4 p-5 transition-colors duration-150 ease-out hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span>
                      <span className="font-medium">{school.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {t('Institution')} {school.code}
                      </span>
                    </span>
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </AppShell>
  );
}
