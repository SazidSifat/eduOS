import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Bell, ArrowUpRight } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@eduos/ui';
import { apiPut } from '../../../../../lib/api-client';
import { admissionKey, admissionPath, notificationsQuery } from '../_api/queries';
import { useAdmissions } from './admissions-shell';
export function ReminderInbox() {
  const { userId, institutionId } = useAdmissions();
  const notifications = useQuery(notificationsQuery(userId, institutionId));
  const cache = useQueryClient();
  const read = useMutation({
    mutationFn: (id: string) =>
      apiPut(
        `${admissionPath(institutionId)}/notifications/${id}/read`,
        z.object({ ok: z.literal(true) }),
        {},
      ),
    onSuccess: async () => {
      await cache.invalidateQueries({
        queryKey: [...admissionKey(userId, institutionId), 'notifications'],
      });
    },
  });
  if (notifications.isError)
    return (
      <div
        aria-live="polite"
        className="mb-5 flex flex-wrap items-center gap-3 rounded-md border border-border p-4"
      >
        <p>Reminders could not be loaded.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void notifications.refetch();
          }}
        >
          Retry reminders
        </Button>
      </div>
    );
  const unread = notifications.data?.filter((n) => !n.read) ?? [];
  if (!unread.length) return null;
  return (
    <details className="mb-6 rounded-md border border-border bg-muted/20">
      <summary className="flex cursor-pointer items-center gap-2 p-4 font-medium">
        <Bell size={16} aria-hidden="true" />
        {unread.length} follow-up reminders
      </summary>
      <ul className="divide-y divide-border border-t border-border">
        {unread.map((n) => (
          <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link
              to="/institutions/$institutionId/admissions/$candidateId"
              params={{ institutionId, candidateId: n.candidateId }}
              className="flex items-center gap-3 rounded-sm hover:text-primary"
            >
              <span>
                {n.kind === 'before' ? 'Upcoming call' : 'Call due'} · {n.dueDate}
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              disabled={read.isPending}
              onClick={() => read.mutate(n.id)}
            >
              Mark read
            </Button>
          </li>
        ))}
      </ul>
      {read.isError && (
        <p role="alert" className="p-4 text-destructive">
          Could not mark the reminder read. Try again.
        </p>
      )}
    </details>
  );
}
