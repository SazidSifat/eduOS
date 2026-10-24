import { institutionTypeLabels as typeLabels } from '../../../../lib/institution-display';
import { useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import type { z } from 'zod';
import { institutionTypeSchema, platformInstitutionCreateSchema } from '@eduos/contracts';
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
} from '@eduos/ui';
import { PageHeader } from '../../../../components/page-header';
import { OwnerAccessRequired } from '../../../../components/owner-access-required';
import { usePlatformAccess } from '../../../../components/providers/platform-access-provider';
import { createInstitution, institutionsQuery } from '../../../_api/platform';
import { ApiError } from '../../../../lib/api-client';

type InstitutionFormValues = z.input<typeof platformInstitutionCreateSchema>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
    .replace(/-$/, '');
}

export function CreateInstitutionPage() {
  const { canCreateInstitutions } = usePlatformAccess();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createInstitution,
    gcTime: 0,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: institutionsQuery.queryKey });
    },
  });
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(platformInstitutionCreateSchema),
    defaultValues: {
      name: '',
      slug: '',
      timezone: 'Asia/Dhaka',
      type: 'high_school',
      firstAdmin: { name: '', email: '', password: '' },
    },
  });
  const name = useWatch({ control, name: 'name' });
  useEffect(() => {
    if (!dirtyFields.slug) setValue('slug', slugify(name ?? ''));
  }, [name, dirtyFields.slug, setValue]);

  if (!canCreateInstitutions) return <OwnerAccessRequired />;

  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      const institution = await mutation.mutateAsync(values);
      setValue('firstAdmin.password', '');
      await navigate({
        to: '/institutions/$institutionId',
        params: { institutionId: institution.id },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (error.code === 'ADMIN_EMAIL_TAKEN')
          setError('firstAdmin.email', {
            message: 'This email already has an account. Use a new Admin email.',
          });
        else setError('slug', { message: 'This slug is already in use. Choose another one.' });
        return;
      }
      setError('root', {
        message: 'Institution could not be created. Check the details and try again.',
      });
    }
  });

  return (
    <div className="space-y-7">
      <Link to="/institutions" className="text-link inline-flex items-center gap-2 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        All institutions
      </Link>
      <PageHeader
        title="Create institution"
        description="Create an institution and its first school Admin. Configure modules from the institution details page afterward."
      />
      <Card as="form" onSubmit={submit} noValidate className="max-w-3xl overflow-hidden">
        <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">
          Institution details
        </h2>
        <fieldset disabled={isSubmitting} className="grid gap-5 p-5 sm:grid-cols-2">
          <legend className="sr-only">Institution details</legend>
          <Label className="field sm:col-span-2">
            Institution name
            <Input
              autoComplete="organization"
              maxLength={120}
              required
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </Label>
          <Label className="field">
            Institution slug
            <Input
              spellCheck={false}
              maxLength={70}
              required
              aria-invalid={Boolean(errors.slug)}
              {...register('slug')}
            />
            {errors.slug && <span className="field-error">{errors.slug.message}</span>}
          </Label>
          <Label className="field">
            Time zone
            <Input
              maxLength={100}
              required
              aria-invalid={Boolean(errors.timezone)}
              {...register('timezone')}
            />
            {errors.timezone && <span className="field-error">{errors.timezone.message}</span>}
          </Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Label className="field">
                Institution type
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    const parsed = institutionTypeSchema.safeParse(value);
                    if (parsed.success) field.onChange(parsed.data);
                  }}
                >
                  <SelectTrigger aria-label="Institution type" onBlur={field.onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {institutionTypeSchema.options.map((type) => (
                      <SelectItem key={type} value={type}>
                        {typeLabels[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <span className="field-error">{errors.type.message}</span>}
              </Label>
            )}
          />
          <fieldset className="grid gap-5 border-t border-border pt-5 sm:col-span-2 sm:grid-cols-2">
            <legend className="sr-only">First school Admin</legend>
            <div className="sm:col-span-2">
              <h2 className="text-sm font-semibold">First school Admin</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                This account will manage users within the new institution.
              </p>
            </div>
            <Label className="field">
              Admin name
              <Input
                autoComplete="name"
                maxLength={100}
                required
                aria-invalid={Boolean(errors.firstAdmin?.name)}
                {...register('firstAdmin.name')}
              />
              {errors.firstAdmin?.name && (
                <span className="field-error">{errors.firstAdmin.name.message}</span>
              )}
            </Label>
            <Label className="field">
              Admin email
              <Input
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                aria-invalid={Boolean(errors.firstAdmin?.email)}
                {...register('firstAdmin.email')}
              />
              {errors.firstAdmin?.email && (
                <span className="field-error">{errors.firstAdmin.email.message}</span>
              )}
            </Label>
            <Label className="field sm:col-span-2">
              Initial password
              <Input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                aria-invalid={Boolean(errors.firstAdmin?.password)}
                {...register('firstAdmin.password')}
              />
              <span className="text-xs text-muted-foreground">
                Use 12–128 characters and share it privately with the school Admin.
              </span>
              {errors.firstAdmin?.password && (
                <span className="field-error">{errors.firstAdmin.password.message}</span>
              )}
            </Label>
          </fieldset>
        </fieldset>
        {errors.root && (
          <p role="alert" className="px-5 pb-4 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
          <p className="max-w-xl text-xs text-muted-foreground">
            Institution settings, the new Admin account and school membership are saved together.
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/institutions">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create institution'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
