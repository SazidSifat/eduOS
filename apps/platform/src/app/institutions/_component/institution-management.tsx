import {
  institutionModuleLabels as moduleLabels,
  institutionStatusLabels as statusLabels,
} from '../../../lib/institution-display';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  institutionStatusSchema,
  platformInstitutionModulesSchema,
  type platformInstitutionSchema,
  platformInstitutionStatusSchema,
} from '@eduos/contracts';
import { institutionModuleKeys } from '@eduos/permissions';
import {
  Button,
  Card,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@eduos/ui';
import { usePlatformAccess } from '../../../components/providers/platform-access-provider';
import {
  institutionsQuery,
  institutionQuery,
  updateInstitutionModules,
  updateInstitutionStatus,
} from '../../_api/platform';

type Institution = z.infer<typeof platformInstitutionSchema>;
type StatusValues = z.input<typeof platformInstitutionStatusSchema>;
type ModuleValues = z.input<typeof platformInstitutionModulesSchema>;

export function InstitutionManagement({ institution }: { institution: Institution }) {
  const { canManageInstitutions } = usePlatformAccess();
  const queryClient = useQueryClient();
  const statusMutation = useMutation({
    mutationFn: (values: StatusValues) => updateInstitutionStatus(institution.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: institutionQuery(institution.id).queryKey });
      await queryClient.invalidateQueries({ queryKey: institutionsQuery.queryKey });
    },
  });
  const moduleMutation = useMutation({
    mutationFn: (values: ModuleValues) => updateInstitutionModules(institution.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: institutionQuery(institution.id).queryKey });
      await queryClient.invalidateQueries({ queryKey: institutionsQuery.queryKey });
    },
  });
  const statusForm = useForm<StatusValues>({
    resolver: zodResolver(platformInstitutionStatusSchema),
    defaultValues: { status: institution.status, reason: institution.statusReason ?? '' },
  });
  const moduleForm = useForm<ModuleValues>({
    resolver: zodResolver(platformInstitutionModulesSchema),
    defaultValues: { enabledModules: institution.enabledModules },
  });
  const selectedStatus = useWatch({ control: statusForm.control, name: 'status' });
  const selectedModules = useWatch({ control: moduleForm.control, name: 'enabledModules' }) ?? [];
  const resetStatus = statusForm.reset;
  const resetModules = moduleForm.reset;

  useEffect(() => {
    resetStatus({ status: institution.status, reason: institution.statusReason ?? '' });
    resetModules({ enabledModules: institution.enabledModules });
  }, [institution, resetStatus, resetModules]);

  const saveStatus = statusForm.handleSubmit((values) => statusMutation.mutate(values));
  const saveModules = moduleForm.handleSubmit((values) => moduleMutation.mutate(values));

  return (
    <div className="space-y-5">
      <Card as="section" className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Institution access</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Frozen or deactivated institutions cannot access their school workspace. Existing
            records are retained.
          </p>
        </div>
        <form onSubmit={saveStatus} noValidate className="space-y-4 p-5">
          <fieldset
            disabled={!canManageInstitutions || statusMutation.isPending}
            className="space-y-4"
          >
            <legend className="sr-only">Institution access state</legend>
            <Controller
              control={statusForm.control}
              name="status"
              render={({ field }) => (
                <Label className="field">
                  Access state
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      const parsed = institutionStatusSchema.safeParse(value);
                      if (parsed.success) {
                        field.onChange(parsed.data);
                        if (parsed.data === 'active')
                          statusForm.setValue('reason', '', { shouldDirty: true });
                      }
                    }}
                  >
                    <SelectTrigger onBlur={field.onBlur} aria-label="Institution access state">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionStatusSchema.options.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Label>
              )}
            />
            {selectedStatus !== 'active' && (
              <Label className="field">
                Reason
                <Textarea
                  maxLength={500}
                  rows={3}
                  aria-invalid={Boolean(statusForm.formState.errors.reason)}
                  {...statusForm.register('reason')}
                />
                {statusForm.formState.errors.reason && (
                  <span className="field-error">{statusForm.formState.errors.reason.message}</span>
                )}
              </Label>
            )}
          </fieldset>
          {statusMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              Access state could not be saved.
            </p>
          )}
          {statusMutation.isSuccess && (
            <output className="block text-xs text-muted-foreground">Access state saved.</output>
          )}
          {canManageInstitutions && (
            <Button
              type="submit"
              disabled={statusMutation.isPending || !statusForm.formState.isDirty}
            >
              {statusMutation.isPending ? 'Saving…' : 'Save access state'}
            </Button>
          )}
          {!canManageInstitutions && (
            <p className="text-xs text-muted-foreground">
              Only Super Admin can change institution access.
            </p>
          )}
        </form>
      </Card>

      <Card as="section" className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">School modules</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Enable services for this institution. School roles still govern who can use them.
          </p>
        </div>
        <form onSubmit={saveModules} className="space-y-4 p-5">
          <fieldset
            disabled={!canManageInstitutions || moduleMutation.isPending}
            className="grid gap-2 sm:grid-cols-2"
          >
            <legend className="sr-only">Enabled school modules</legend>
            {institutionModuleKeys.map((module) => {
              const selected = selectedModules.includes(module);
              return (
                <Button
                  key={module}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  aria-pressed={selected}
                  className="justify-start"
                  onClick={() => {
                    const next = selected
                      ? selectedModules.filter((enabled) => enabled !== module)
                      : [...selectedModules, module];
                    moduleForm.setValue('enabledModules', next, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                >
                  {moduleLabels[module]}
                  <span className="ml-auto text-xs">{selected ? 'On' : 'Off'}</span>
                </Button>
              );
            })}
          </fieldset>
          {moduleMutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              Module settings could not be saved.
            </p>
          )}
          {moduleMutation.isSuccess && (
            <output className="block text-xs text-muted-foreground">Module settings saved.</output>
          )}
          {canManageInstitutions && (
            <Button
              type="submit"
              disabled={moduleMutation.isPending || !moduleForm.formState.isDirty}
            >
              {moduleMutation.isPending ? 'Saving…' : 'Save module access'}
            </Button>
          )}
          {!canManageInstitutions && (
            <p className="text-xs text-muted-foreground">
              Only Super Admin can change module access.
            </p>
          )}
          {moduleForm.formState.errors.enabledModules && (
            <p className="field-error">{moduleForm.formState.errors.enabledModules.message}</p>
          )}
        </form>
      </Card>
    </div>
  );
}
