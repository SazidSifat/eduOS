import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@eduos/ui';
import { Plus } from 'lucide-react';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY } from '../../_component/school-format';
import type { CandidateState } from '../../_component/demo-model';
import {
  DataTable,
  EmptyState,
  Metrics,
  Notice,
  PageHeading,
  Status,
} from '../../_component/demo-ui';

const headings = {
  follow_up: 'Follow-ups',
  willing: 'Willing students',
  admitted: 'Admitted students',
  closed: 'Closed records',
};
export function CandidateDirectory({ state: view = 'follow_up' }: { state?: CandidateState }) {
  const { state, snapshot } = useDemo();
  const [search, setSearch] = useState('');
  const [schedule, setSchedule] = useState('All dates');
  const [className, setClassName] = useState('All classes');
  const [officer, setOfficer] = useState('All officers');
  const [page, setPage] = useState(0);
  const all = state.candidates.filter((c) => c.state === view);
  const items = all.filter(
    (c) =>
      `${c.name} ${c.guardian} ${c.phone} ${c.id}`.toLowerCase().includes(search.toLowerCase()) &&
      (className === 'All classes' || c.className === className) &&
      (officer === 'All officers' || c.officer === officer) &&
      (view !== 'follow_up' ||
        schedule === 'All dates' ||
        (schedule === 'Today'
          ? c.nextCall === DEMO_TODAY
          : schedule === 'Overdue'
            ? c.nextCall < DEMO_TODAY
            : c.nextCall > DEMO_TODAY)),
  );
  const visible = items.slice(page * 6, page * 6 + 6);
  const mode = view === 'closed' ? 'follow_up' : view;
  return (
    <>
      <PageHeading
        title={headings[view]}
        description={
          view === 'follow_up'
            ? 'Plan the next conversation and keep every call in context.'
            : view === 'willing'
              ? 'Families ready for the next step. No prospect reminders are scheduled.'
              : view === 'admitted'
                ? 'Confirmed students, academic enrollments and admission history.'
                : 'Review closed conversations and reopen with a new follow-up date.'
        }
        action={
          <Button asChild>
            <Link to="/admissions/new" search={{ mode, candidate: '' }}>
              <Plus size={16} aria-hidden="true" />
              New record
            </Link>
          </Button>
        }
      />
      <Metrics
        items={[
          {
            label: 'Follow-up records',
            value: state.candidates.filter((c) => c.state === 'follow_up').length,
            detail: 'All assigned records',
          },
          {
            label: 'Calls due today',
            value: state.candidates.filter(
              (c) => c.state === 'follow_up' && c.nextCall === DEMO_TODAY,
            ).length,
            detail: new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: state.settings.timezone,
            }).format(new Date(`${snapshot.today}T12:00:00+06:00`)),
          },
          {
            label: 'Willing students',
            value: state.candidates.filter((c) => c.state === 'willing').length,
            detail: 'Ready for admission',
          },
          {
            label: 'Admitted students',
            value: state.candidates.filter((c) => c.state === 'admitted').length,
            detail: 'Confirmed enrollments',
          },
        ]}
      />
      {view === 'follow_up' && all.some((c) => c.nextCall < DEMO_TODAY) && (
        <Notice title="Overdue conversations need attention" tone="warning">
          Use the call schedule filter to start with overdue families, then work through today’s
          calls.
        </Notice>
      )}
      <div className="demo-filters">
        <div>
          <Label htmlFor="candidate-search">Find a student</Label>
          <Input
            id="candidate-search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Student, guardian, phone or record ID"
          />
        </div>
        {[
          {
            id: 'class',
            label: 'Class / session',
            value: className,
            options: ['All classes', ...new Set(state.candidates.map((c) => c.className))],
            update: setClassName,
          },
          {
            id: 'officer',
            label: 'Admission Officer',
            value: officer,
            options: ['All officers', ...new Set(state.candidates.map((c) => c.officer))],
            update: setOfficer,
          },
          ...(view === 'follow_up'
            ? [
                {
                  id: 'schedule',
                  label: 'Call schedule',
                  value: schedule,
                  options: ['All dates', 'Today', 'Overdue', 'Upcoming'],
                  update: setSchedule,
                },
              ]
            : []),
        ].map((filter) => (
          <div key={filter.id}>
            <Label htmlFor={`candidate-${filter.id}`}>{filter.label}</Label>
            <Select
              value={filter.value}
              onValueChange={(value) => {
                filter.update(value);
                setPage(0);
              }}
            >
              <SelectTrigger id={`candidate-${filter.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {filter.id === 'officer'
                      ? (state.members.find((m) => m.id === option)?.name ?? option)
                      : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      {!items.length ? (
        <EmptyState
          title="No matching records"
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setClassName('All classes');
                setOfficer('All officers');
                setSchedule('All dates');
              }}
            >
              Clear filters
            </Button>
          }
        >
          Try another student name, class or call schedule.
        </EmptyState>
      ) : (
        <>
          <DataTable
            caption={`${headings[view]} directory`}
            headers={[
              'Student / guardian',
              'Class / session',
              'Admission Officer',
              view === 'admitted' ? 'Admitted on' : view === 'closed' ? 'State' : 'Next call',
              'Action',
            ]}
          >
            {visible.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link
                    to="/admissions/$candidateId"
                    params={{ candidateId: c.id }}
                    className="font-semibold hover:underline"
                  >
                    {c.name}
                  </Link>
                  <small>
                    {c.guardian} · {c.phone}
                  </small>
                </td>
                <td>
                  {c.className}
                  <small>{c.session}</small>
                </td>
                <td>{state.members.find((m) => m.id === c.officer)?.name ?? 'Unassigned'}</td>
                <td>
                  {view === 'admitted' ? (
                    c.admittedOn
                  ) : view === 'closed' ? (
                    <Status>Closed</Status>
                  ) : view === 'willing' ? (
                    <Status tone="success">No reminders</Status>
                  ) : (
                    <Status
                      tone={
                        c.nextCall < DEMO_TODAY
                          ? 'danger'
                          : c.nextCall === DEMO_TODAY
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {c.nextCall}
                    </Status>
                  )}
                </td>
                <td>
                  <Link
                    className="demo-inline-link"
                    to="/admissions/$candidateId"
                    params={{ candidateId: c.id }}
                  >
                    Open record
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
          <footer className="flex flex-wrap items-center justify-between gap-3">
            <p className="demo-help">
              Showing {page * 6 + 1}–{Math.min(page * 6 + 6, items.length)} of {items.length}{' '}
              records
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={(page + 1) * 6 >= items.length}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </footer>
        </>
      )}
    </>
  );
}
