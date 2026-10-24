import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Label, Card, Button, Textarea } from '@eduos/ui';
import { SchoolStateBadge } from '../../../components/school-badges';
import { usePreview } from '../../../components/providers/preview-provider';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import {
  schoolStatusChangeSchema,
  type SchoolPreview,
  type SchoolStatus,
} from '../../../lib/school-preview-model';

const actionNames = {
  active: 'Reactivate school',
  frozen: 'Freeze school',
  inactive: 'Deactivate school',
};
export function SchoolControls({ school }: { school: SchoolPreview }) {
  const { role } = usePreview();
  const [action, setAction] = useState<SchoolStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const region = useRef<HTMLElement>(null);
  function finish() {
    setAction(null);
    setSaved(true);
    region.current?.focus();
  }
  return (
    <Card
      as="section"
      ref={region}
      tabIndex={-1}
      className="space-y-4 p-5"
      aria-label="School controls"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">School state</h2>
        <SchoolStateBadge status={school.status} />
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Freeze pauses the school in this preview. Deactivate marks it inactive. Records and
        subscription settings are preserved.
      </p>
      {school.statusReason && (
        <p className="border-t border-border pt-3 text-sm">{school.statusReason}</p>
      )}
      {role === 'platform_owner' && (
        <div className="flex flex-wrap gap-2">
          {(['active', 'frozen', 'inactive'] satisfies SchoolStatus[])
            .filter((value) => value !== school.status)
            .map((value) => (
              <Button
                key={value}
                variant="outline"
                className={value === 'inactive' ? 'text-destructive' : ''}
                onClick={() => {
                  setAction(value);
                  setSaved(false);
                }}
              >
                {actionNames[value]}
              </Button>
            ))}
        </div>
      )}
      {action && role === 'platform_owner' && (
        <SchoolStatusForm
          key={action}
          schoolId={school.id}
          status={action}
          onDone={finish}
          onCancel={() => {
            setAction(null);
            region.current?.focus();
          }}
        />
      )}
      {saved && (
        <output className="block text-xs text-primary">School state updated in preview.</output>
      )}
    </Card>
  );
}
function SchoolStatusForm({
  schoolId,
  status,
  onDone,
  onCancel,
}: {
  schoolId: string;
  status: SchoolStatus;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { changeSchoolStatus } = useSchoolPreview();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schoolStatusChangeSchema>>({
    resolver: zodResolver(schoolStatusChangeSchema),
    defaultValues: { status, reason: '' },
  });
  const submit = handleSubmit((values) => {
    try {
      changeSchoolStatus(schoolId, values);
      onDone();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Could not update the school.',
      });
    }
  });
  return (
    <form onSubmit={submit} noValidate className="space-y-3 border-t border-border pt-4">
      <p className="text-sm font-medium">{actionNames[status]}</p>
      <Label className="field">
        Reason for change
        <Textarea
          className="min-h-24"
          aria-invalid={Boolean(errors.reason)}
          {...register('reason')}
        />
        {errors.reason && <span className="field-error">{errors.reason.message}</span>}
      </Label>
      {errors.root && (
        <p role="alert" className="field-error">
          {errors.root.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          {status === 'frozen'
            ? 'Confirm freeze'
            : status === 'inactive'
              ? 'Confirm deactivation'
              : 'Confirm reactivation'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
