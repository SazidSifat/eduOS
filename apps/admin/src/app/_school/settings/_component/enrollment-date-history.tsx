import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DataTable, Notice } from '../../_component/demo-ui';
import { enrollmentHistoryQuery } from '../_api/enrollment-history';

export function EnrollmentDateHistory({ enrollmentId }: { enrollmentId: string }) {
  const { snapshot } = useDemo();
  const [offset, setOffset] = useState(0);
  const history = useQuery(
    enrollmentHistoryQuery(snapshot.identity.id, snapshot.institutionId, enrollmentId, offset),
  );
  return (
    <section className="demo-stack" aria-label="Enrollment date history">
      <h3 className="font-semibold">Date change history</h3>
      {history.isError ? (
        <Notice title="History could not be loaded" tone="danger">
          Check your current access and connection, then{' '}
          <Button variant="outline" onClick={() => void history.refetch()}>
            Retry history
          </Button>
          .
        </Notice>
      ) : history.isPending ? (
        <output>Loading date history…</output>
      ) : (
        <>
          <DataTable
            caption="Enrollment date changes"
            headers={['Changed', 'Changed by', 'Previous start / end', 'New start / end', 'Reason']}
          >
            {history.data.items.map((item) => (
              <tr key={item.id}>
                <td>
                  {new Intl.DateTimeFormat('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: snapshot.state.settings.timezone ?? 'Asia/Dhaka',
                  }).format(new Date(item.createdAt))}
                </td>
                <td>{item.actorName}</td>
                <td>
                  {item.previousStart ?? 'Unknown'} / {item.previousEnd ?? 'Unknown'}
                </td>
                <td>
                  {item.startsOn ?? 'Unknown'} / {item.endsOn ?? 'Unknown'}
                </td>
                <td>
                  <p className="max-w-prose whitespace-normal break-words">{item.reason}</p>
                </td>
              </tr>
            ))}
          </DataTable>
          {!history.data.items.length && (
            <p className="demo-help">No date changes recorded for this enrollment.</p>
          )}
          <div className="demo-actions">
            <Button
              variant="outline"
              disabled={offset === 0 || history.isFetching}
              onClick={() => setOffset((value) => Math.max(0, value - 20))}
            >
              Previous changes
            </Button>
            <span className="demo-help">Page {offset / 20 + 1}</span>
            <Button
              variant="outline"
              disabled={!history.data.hasMore || offset >= 100000 || history.isFetching}
              onClick={() => setOffset((value) => value + 20)}
            >
              Next changes
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
