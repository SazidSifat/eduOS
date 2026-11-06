import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowUpRight, Plus, Search } from 'lucide-react';
import {
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@eduos/ui';
import type { CandidateListQuery } from '@eduos/contracts';
import { useAdmissions } from './admissions-shell';
import { candidateListQuery } from '../_api/queries';
import { ErrorState, LoadingState } from '../../../../../components/feedback';
import { Choice } from './form-controls';
import { ReminderInbox } from './reminder-inbox';
const titles = {
  follow_up: 'Follow-ups',
  willing: 'Willing students',
  admitted: 'Admitted students',
  closed: 'Closed records',
};
const descriptions = {
  follow_up: 'Plan the next conversation and keep every call in context.',
  willing: 'Students ready for the next step. No follow-up reminders are scheduled.',
  admitted: 'Confirmed students with their academic session and admission history.',
  closed: 'Previous conversations retained for review and reopening.',
};
export function CandidateList({ filters }: { filters: Omit<CandidateListQuery, 'limit'> }) {
  const { t, locale } = useLanguage();

  const { userId, institutionId, access, setup } = useAdmissions();
  const list = useQuery(candidateListQuery(userId, institutionId, { ...filters, limit: 25 }));
  const [search, setSearch] = useState(filters.search);
  const navigate = useNavigate();
  function update(values: Partial<typeof filters>) {
    void navigate({
      to: '/institutions/$institutionId/admissions',
      params: { institutionId },
      search: { ...filters, ...values },
    });
  }
  return (
    <>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{t(titles[filters.state])}</h1>
            {list.data && <Badge variant="outline">{list.data.total}</Badge>}
          </div>
          <p className="mt-2 max-w-xl text-muted-foreground">{t(descriptions[filters.state])}</p>
        </div>
        {access.permissions.includes('admissions.write') && (
          <Button asChild>
            <Link to="/institutions/$institutionId/admissions/new" params={{ institutionId }}>
              <Plus size={16} aria-hidden="true" />
              {t('New record')}{' '}
            </Link>
          </Button>
        )}
      </header>
      <ReminderInbox />
      <section
        aria-label={t('Candidate directory')}
        className="overflow-hidden rounded-md border border-border"
      >
        <div className="flex flex-wrap items-end gap-4 border-b border-border p-4">
          <form
            className="flex min-w-0 flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              update({ search, offset: 0 });
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-2.5 left-3 text-muted-foreground"
                size={16}
                aria-hidden="true"
              />
              <Input
                className="pl-9"
                aria-label={t('Search students or phone')}
                placeholder={t('Search student name or phone')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={100}
              />
            </div>
            <Button variant="outline" type="submit">
              {t('Search')}{' '}
            </Button>
          </form>
          {filters.state === 'follow_up' && (
            <div className="w-full sm:w-44">
              <Choice
                id="call-filter"
                label={t('Call schedule')}
                value={filters.due}
                onChange={(value) => {
                  if (
                    value === 'all' ||
                    value === 'today' ||
                    value === 'upcoming' ||
                    value === 'overdue'
                  )
                    update({ due: value, offset: 0 });
                }}
                options={[
                  { value: 'all', label: 'All dates' },
                  { value: 'today', label: 'Today' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'overdue', label: 'Overdue' },
                ]}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 border-b border-border px-4 py-3">
          <div className="w-full sm:w-52">
            <Choice
              id="class-filter"
              label={t('Class / session')}
              value={filters.offeringId ?? 'all'}
              onChange={(value) =>
                update({ offeringId: value === 'all' ? undefined : value, offset: 0 })
              }
              options={[
                { value: 'all', label: 'All classes and sessions' },
                ...setup.offerings.map((o) => ({
                  value: o.id,
                  label: `${o.className} · ${o.session}`,
                })),
              ]}
            />
          </div>
          {access.permissions.includes('admissions.manage') && (
            <div className="w-full sm:w-52">
              <Choice
                id="officer-filter"
                label={t('Admission Officer')}
                value={filters.assigneeId ?? 'all'}
                onChange={(value) =>
                  update({ assigneeId: value === 'all' ? undefined : value, offset: 0 })
                }
                options={[
                  { value: 'all', label: 'All Admission Officers' },
                  ...setup.assignees.map((a) => ({ value: a.userId, label: a.name })),
                ]}
              />
            </div>
          )}
        </div>
        {list.isPending ? (
          <div className="p-6">
            <LoadingState label={t('Loading admission records…')} />
          </div>
        ) : list.isError ? (
          <div className="p-6">
            <ErrorState
              retry={() => {
                void list.refetch();
              }}
            />
          </div>
        ) : !list.data.items.length ? (
          <div className="px-6 py-16 text-center">
            <h2 className="font-semibold">
              {filters.search || filters.due !== 'all'
                ? t('No matching records')
                : t('No {value0} yet', { value0: titles[filters.state].toLowerCase() })}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {filters.search || filters.due !== 'all'
                ? t('Try a different name, phone number or call schedule.')
                : t('New school records will appear here as your admission work progresses.')}
            </p>
          </div>
        ) : (
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>{t('Student / guardian')}</TableHead>
                <TableHead>{t('Class / session')}</TableHead>
                <TableHead>{t('Admission Officer')}</TableHead>
                <TableHead>
                  {filters.state === 'admitted' ? t('Admission date') : t('Next call')}
                </TableHead>
                <TableHead className="text-right">{t('Details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      className="font-medium hover:underline"
                      to="/institutions/$institutionId/admissions/$candidateId"
                      params={{ institutionId, candidateId: item.id }}
                    >
                      {item.studentName}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.guardianName} · {item.phone}
                    </p>
                  </TableCell>
                  <TableCell>
                    {item.className}
                    <p className="mt-1 text-xs text-muted-foreground">{item.session}</p>
                  </TableCell>
                  <TableCell>{item.assigneeName}</TableCell>
                  <TableCell className="tabular-nums">
                    {filters.state === 'admitted'
                      ? item.admittedAt &&
                        new Date(item.admittedAt).toLocaleDateString(locale, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: setup.settings.timezone,
                        })
                      : (item.followUpDate ?? 'No call scheduled')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" asChild>
                      <Link
                        to="/institutions/$institutionId/admissions/$candidateId"
                        params={{ institutionId, candidateId: item.id }}
                        aria-label={t('View {value0}', { value0: item.studentName })}
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {list.data && (
          <footer className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {list.data.total
                ? t('{value0}–{value1} of {value2}', {
                    value0: filters.offset + 1,
                    value1: Math.min(filters.offset + 25, list.data.total),
                    value2: list.data.total,
                  })
                : '0 records'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!filters.offset || list.isFetching}
                onClick={() => update({ offset: Math.max(0, filters.offset - 25) })}
              >
                {t('Previous')}{' '}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.offset + 25 >= list.data.total || list.isFetching}
                onClick={() => update({ offset: filters.offset + 25 })}
              >
                {t('Next')}{' '}
              </Button>
            </div>
          </footer>
        )}
      </section>
    </>
  );
}
