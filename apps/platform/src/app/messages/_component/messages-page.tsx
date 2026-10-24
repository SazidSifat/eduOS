import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Card,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@eduos/ui';
import { z } from 'zod';
import { PageHeader } from '../../../components/page-header';
import { EmptyState } from '../../../components/empty-state';
import { OwnerAccessRequired } from '../../../components/owner-access-required';
import { usePreview } from '../../../components/providers/preview-provider';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import { dateLabel } from '../../../lib/school-preview-model';
import { MessageForm } from './message-form';

const filterSchema = z.enum(['all', 'notice', 'warning']);
export function MessagesPage() {
  const { role } = usePreview();
  const { schools, messages } = useSchoolPreview();
  const [composing, setComposing] = useState(false);
  const [filter, setFilter] = useState<z.infer<typeof filterSchema>>('all');
  const [saved, setSaved] = useState(false);
  if (role !== 'platform_owner') return <OwnerAccessRequired />;
  const visible = messages.filter((message) => filter === 'all' || message.kind === filter);
  return (
    <div className="space-y-7">
      <PageHeader
        title="School messages"
        description="Prepare notices and warnings for school contacts. This preview does not send email or in-app messages."
        action={
          <Button
            onClick={() => {
              setComposing(true);
              setSaved(false);
            }}
          >
            New message
          </Button>
        }
      />
      {composing && (
        <MessageForm
          onDone={() => {
            setComposing(false);
            setSaved(true);
          }}
          onCancel={() => setComposing(false)}
        />
      )}
      {saved && (
        <output className="block text-sm text-primary">
          Preview message saved. Nothing was delivered.
        </output>
      )}
      <Card as="section" className="overflow-hidden" aria-label="School message history">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Message history</h2>
          <Select
            value={filter}
            onValueChange={(value) => {
              const parsed = filterSchema.safeParse(value);
              if (parsed.success) setFilter(parsed.data);
            }}
          >
            <SelectTrigger aria-label="Filter message type" className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All messages</SelectItem>
              <SelectItem value="notice">Notices</SelectItem>
              <SelectItem value="warning">Warnings</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {visible.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[650px]">
              <TableCaption className="sr-only">Prepared preview school messages</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">School / subject</TableHead>
                  <TableHead scope="col">Type</TableHead>
                  <TableHead scope="col">Channel</TableHead>
                  <TableHead scope="col">Prepared</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((message) => {
                  const school = schools.find((entry) => entry.id === message.schoolId);
                  return (
                    <TableRow key={message.id}>
                      <TableCell>
                        <Link
                          to="/institutions/$institutionId"
                          params={{ institutionId: message.schoolId }}
                          className="text-sm font-medium hover:text-primary"
                        >
                          {school?.name ?? 'Sample school'}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{message.subject}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={message.kind === 'warning' ? 'warning' : 'secondary'}>
                          {message.kind === 'warning' ? 'Warning' : 'Notice'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {message.channel === 'both'
                          ? 'Email + in-app'
                          : message.channel === 'email'
                            ? 'Email'
                            : 'In-app'}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{dateLabel(message.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">Preview only</p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState title="No messages prepared">
            Use New message, or prepare a notice or warning from a school profile.
          </EmptyState>
        )}
      </Card>
    </div>
  );
}
