import { Card } from '@eduos/ui';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import { dateLabel } from '../../../lib/school-preview-model';
import { Badge } from '@eduos/ui';

export function SchoolActivity({ schoolId }: { schoolId: string }) {
  const { messages, events } = useSchoolPreview();
  const schoolMessages = messages.filter((message) => message.schoolId === schoolId);
  const schoolEvents = events.filter((event) => event.schoolId === schoolId);
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card as="section" className="overflow-hidden" aria-label="School notice and warning history">
        <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">
          Notices and warnings
        </h2>
        {schoolMessages.length ? (
          <div className="divide-y divide-border">
            {schoolMessages.map((message) => (
              <details key={message.id} className="px-5 py-4">
                <summary className="cursor-pointer rounded text-sm font-medium">
                  <Badge
                    variant={message.kind === 'warning' ? 'warning' : 'secondary'}
                    className="mr-2"
                  >
                    {message.kind === 'warning' ? 'Warning' : 'Notice'}
                  </Badge>
                  {message.subject}
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                <p className="mt-3 break-all text-xs text-muted-foreground">
                  Prepared for {message.recipient} · {dateLabel(message.createdAt)} · Preview only
                </p>
              </details>
            ))}
          </div>
        ) : (
          <p className="px-5 py-6 text-sm leading-6 text-muted-foreground">
            No messages prepared for this school. Use Notify school or Send warning to compose one.
          </p>
        )}
      </Card>
      <Card as="section" className="overflow-hidden" aria-label="School preview activity">
        <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">Preview activity</h2>
        {schoolEvents.length ? (
          <ol className="divide-y divide-border">
            {schoolEvents.slice(0, 8).map((event) => (
              <li key={event.id} className="space-y-2 px-5 py-4">
                <p className="text-sm font-medium">{event.summary}</p>
                <p className="text-xs leading-5 text-muted-foreground">{event.detail}</p>
                <p className="text-xs text-muted-foreground">{dateLabel(event.createdAt)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-5 py-6 text-sm leading-6 text-muted-foreground">
            School changes, subscription updates and prepared messages will appear here.
          </p>
        )}
      </Card>
    </div>
  );
}
