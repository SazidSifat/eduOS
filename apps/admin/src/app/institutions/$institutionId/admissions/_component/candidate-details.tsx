import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@eduos/ui';
import { candidateDetailQuery } from '../_api/queries';
import { useAdmissions } from './admissions-shell';
import { ErrorState, LoadingState } from '../../../../../components/feedback';
import { CandidateForm } from './candidate-form';
import { CallForm } from './call-form';
import { money } from './form-controls';
export function CandidateDetails({ candidateId }: { candidateId: string }) {
  const { userId, institutionId, access, setup } = useAdmissions();
  const detail = useQuery(candidateDetailQuery(userId, institutionId, candidateId));
  const [mode, setMode] = useState<
    'call' | 'reopen' | 'close' | 'willing' | 'admitted' | 'edit' | null
  >(null);
  const [showIdentity, setShowIdentity] = useState(false);
  if (detail.isPending) return <LoadingState />;
  if (detail.isError)
    return (
      <ErrorState
        retry={() => {
          void detail.refetch();
        }}
      />
    );
  const { candidate, profile, receipts, history } = detail.data;
  if (mode === 'willing' || mode === 'admitted' || mode === 'edit')
    return <CandidateForm existing={detail.data} mode={mode} onSaved={() => setMode(null)} />;
  const writable =
    access.permissions.includes('admissions.write') && candidate.state !== 'admitted';
  const mask = (value: string) =>
    !value ? 'Not supplied' : showIdentity ? value : `•••• ${value.slice(-4)}`;
  return (
    <div className="w-full min-w-0">
      <Link
        to="/institutions/$institutionId/admissions"
        params={{ institutionId }}
        search={{ state: candidate.state, due: 'all', search: '', offset: 0 }}
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Back to{' '}
        {candidate.state === 'follow_up'
          ? 'follow-ups'
          : candidate.state === 'closed'
            ? 'closed records'
            : `${candidate.state} students`}
      </Link>
      <header className="mb-7 flex flex-wrap justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="min-w-0 break-words text-2xl font-semibold">{candidate.studentName}</h1>
            <Badge variant="outline">{candidate.state.replace('_', ' ')}</Badge>
          </div>
          <p className="mt-2 text-muted-foreground">
            {candidate.className} · {candidate.session} · {candidate.assigneeName}
          </p>
          {candidate.admissionNumber && (
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {candidate.admissionNumber}
            </p>
          )}
        </div>
        {writable && (
          <div className="flex flex-wrap gap-2">
            {candidate.state === 'follow_up' && (
              <>
                <Button variant="outline" onClick={() => setMode('call')}>
                  Record call
                </Button>
                <Button variant="outline" onClick={() => setMode('willing')}>
                  Mark willing
                </Button>
              </>
            )}
            {candidate.state === 'willing' || candidate.state === 'closed' ? (
              <Button variant="outline" onClick={() => setMode('reopen')}>
                Return to follow-up
              </Button>
            ) : null}
            {candidate.state !== 'closed' && (
              <Button onClick={() => setMode('admitted')}>Complete admission</Button>
            )}
          </div>
        )}
      </header>
      {(mode === 'call' || mode === 'reopen' || mode === 'close') && (
        <div className="mb-6">
          <CallForm
            detail={detail.data}
            reopen={mode === 'reopen'}
            close={mode === 'close'}
            onDone={() => setMode(null)}
          />
        </div>
      )}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-8">
          <section className="rounded-md border border-border">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Student and guardian</h2>
              {writable && (
                <Button variant="ghost" size="sm" onClick={() => setMode('edit')}>
                  Edit details
                </Button>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
              {[
                ['Guardian', `${profile.guardianName} (${profile.relationship})`],
                ['Contact phone', profile.phone],
                ['Address', profile.address],
                ['Date of birth', profile.dateOfBirth],
                ['Student nationality', profile.nationality],
                ['Father', profile.fatherName],
                ['Mother', profile.motherName],
                ['Guardian nationality', profile.guardianNationality],
                ['Previous school', profile.previousSchool],
                ['Lead source', profile.source],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words">{value || 'Not supplied'}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-border p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-medium">Identity information</h3>
                <Button variant="outline" size="sm" onClick={() => setShowIdentity(!showIdentity)}>
                  {showIdentity ? 'Hide identity details' : 'Show identity details'}
                </Button>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Birth certificate</dt>
                  <dd className="mt-1 font-mono">{mask(profile.birthCertificate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Parent / guardian NID</dt>
                  <dd className="mt-1 font-mono">{mask(profile.guardianNid)}</dd>
                </div>
              </dl>
              {profile.identityException && (
                <p className="mt-4 text-muted-foreground">Exception: {profile.identityException}</p>
              )}
            </div>
            {profile.notes && (
              <p className="border-t border-border p-5 text-muted-foreground">{profile.notes}</p>
            )}
          </section>
          <section className="overflow-hidden rounded-md border border-border">
            <h2 className="border-b border-border px-5 py-4 font-semibold">Cash receipts</h2>
            {!receipts.length ? (
              <p className="p-5 text-muted-foreground">
                No fees have been collected for this record.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt / date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        <span className="break-all font-mono text-xs">{receipt.number}</span>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(receipt.createdAt).toLocaleDateString('en-BD', {
                            timeZone: setup.settings.timezone,
                          })}
                        </p>
                      </TableCell>
                      <TableCell>
                        {receipt.kind === 'willing' ? 'Willing fee' : 'Admission'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money(receipt.amountMinor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
        <aside className="min-w-0 space-y-7">
          <section className="border-t border-border pt-4">
            <h2 className="font-semibold">Next conversation</h2>
            <p className="mt-3 tabular-nums">{candidate.followUpDate ?? 'No call scheduled'}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {candidate.state === 'follow_up'
                ? 'Reminders follow the institution’s configured schedule.'
                : 'Follow-up reminders are off for this record.'}
            </p>
          </section>
          <section className="border-t border-border pt-4">
            <h2 className="font-semibold">Record history</h2>
            <ol className="mt-4 space-y-5">
              {history.map((event) => (
                <li key={event.id}>
                  <p className="font-medium">{event.action.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.actorName} ·{' '}
                    {new Date(event.createdAt).toLocaleString('en-BD', {
                      timeZone: setup.settings.timezone,
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {event.note && (
                    <p className="mt-2 break-words text-muted-foreground">{event.note}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
          {writable && candidate.state !== 'closed' && (
            <Button variant="outline" onClick={() => setMode('close')}>
              Close record
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}
