import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Label,
  Card,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@eduos/ui';
import { useSchoolPreview } from '../../../components/providers/school-preview-provider';
import { schoolMessageSchema, type SchoolMessageInput } from '../../../lib/school-preview-model';

export function MessageForm({
  schoolId = '',
  kind = 'notice',
  onDone,
  onCancel,
}: {
  schoolId?: string;
  kind?: 'notice' | 'warning';
  onDone: () => void;
  onCancel: () => void;
}) {
  const { schools, prepareMessage } = useSchoolPreview();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SchoolMessageInput>({
    resolver: zodResolver(schoolMessageSchema),
    defaultValues: { schoolId, kind, channel: 'email', subject: '', body: '' },
  });
  const selectedId = useWatch({ control, name: 'schoolId' });
  const selectedKind = useWatch({ control, name: 'kind' });
  const selected = schools.find((school) => school.id === selectedId);
  const submit = handleSubmit((values) => {
    try {
      prepareMessage(values);
      onDone();
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Could not prepare this message.',
      });
    }
  });
  return (
    <Card
      as="form"
      onSubmit={submit}
      noValidate
      className="overflow-hidden"
      aria-label="School message composer"
    >
      <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">
        {selectedKind === 'warning' ? 'Prepare school warning' : 'Prepare school notice'}
      </h2>
      <fieldset disabled={isSubmitting} className="grid gap-4 p-5 sm:grid-cols-2">
        <legend className="sr-only">School message details</legend>
        {schoolId ? (
          <div className="field">
            <span>School</span>
            <p className="text-sm font-normal">{selected?.name}</p>
            <input type="hidden" {...register('schoolId')} />
          </div>
        ) : (
          <Label className="field">
            School
            <Controller
              control={control}
              name="schoolId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.schoolId)}
                  >
                    <SelectValue placeholder="Choose a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.schoolId && <span className="field-error">{errors.schoolId.message}</span>}
          </Label>
        )}
        <Label className="field">
          Message type
          <Controller
            control={control}
            name="kind"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notice">Notice</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Label>
        <Label className="field">
          Channel
          <Controller
            control={control}
            name="channel"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="in_app">In-app notification</SelectItem>
                  <SelectItem value="both">Email and in-app</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Label>
        <div className="field">
          <span>School contact</span>
          <p className="break-all text-sm font-normal text-muted-foreground">
            {selected?.contactEmail ?? 'Choose a school to see its contact.'}
          </p>
        </div>
        <Label className="field sm:col-span-2">
          Subject
          <Input aria-invalid={Boolean(errors.subject)} {...register('subject')} />
          {errors.subject && <span className="field-error">{errors.subject.message}</span>}
        </Label>
        <Label className="field sm:col-span-2">
          Message
          <Textarea
            className="min-h-32"
            aria-invalid={Boolean(errors.body)}
            {...register('body')}
          />
          {errors.body && <span className="field-error">{errors.body.message}</span>}
        </Label>
      </fieldset>
      {errors.root && (
        <p role="alert" className="px-5 pb-4 text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Preview only. Nothing is delivered to the school.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            Save preview message
          </Button>
        </div>
      </div>
    </Card>
  );
}
