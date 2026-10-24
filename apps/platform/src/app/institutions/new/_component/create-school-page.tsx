import { useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { Label, Card, Button, Input } from '@eduos/ui';
import { PageHeader } from '../../../../components/page-header';
import { OwnerAccessRequired } from '../../../../components/owner-access-required';
import { usePreview } from '../../../../components/providers/preview-provider';
import { useSchoolPreview } from '../../../../components/providers/school-preview-provider';
import {
  createSchoolSchema,
  slugify,
  type CreateSchoolInput,
} from '../../../../lib/school-preview-model';

export function CreateSchoolPage() {
  const { role } = usePreview();
  const { createSchool } = useSchoolPreview();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<CreateSchoolInput>({
    resolver: zodResolver(createSchoolSchema),
    defaultValues: { name: '', slug: '', contactName: '', contactEmail: '' },
  });
  const name = useWatch({ control, name: 'name' });
  useEffect(() => {
    if (!dirtyFields.slug) setValue('slug', slugify(name));
  }, [name, dirtyFields.slug, setValue]);
  if (role !== 'platform_owner') return <OwnerAccessRequired />;
  const submit = handleSubmit(async (values) => {
    try {
      const id = createSchool(values);
      await navigate({ to: '/institutions/$institutionId', params: { institutionId: id } });
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Could not create the preview school.',
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
        title="Create school"
        description="Add a school profile and its primary contact. Subscription settings are configured separately."
      />
      <Card as="form" onSubmit={submit} noValidate className="max-w-3xl overflow-hidden">
        <h2 className="border-b border-border px-5 py-4 text-sm font-semibold">School details</h2>
        <fieldset disabled={isSubmitting} className="grid gap-5 p-5 sm:grid-cols-2">
          <legend className="sr-only">School and contact details</legend>
          <Label className="field sm:col-span-2">
            School name
            <Input
              autoComplete="organization"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </Label>
          <Label className="field">
            School slug
            <Input spellCheck={false} aria-invalid={Boolean(errors.slug)} {...register('slug')} />
            {errors.slug && <span className="field-error">{errors.slug.message}</span>}
          </Label>
          <Label className="field">
            Time zone
            <Input value="Asia/Dhaka" readOnly />
          </Label>
          <Label className="field">
            Contact name
            <Input
              autoComplete="name"
              aria-invalid={Boolean(errors.contactName)}
              {...register('contactName')}
            />
            {errors.contactName && (
              <span className="field-error">{errors.contactName.message}</span>
            )}
          </Label>
          <Label className="field">
            Contact email
            <Input
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.contactEmail)}
              {...register('contactEmail')}
            />
            {errors.contactEmail && (
              <span className="field-error">{errors.contactEmail.message}</span>
            )}
          </Label>
        </fieldset>
        {errors.root && (
          <p role="alert" className="px-5 pb-4 text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Creates a sample profile. No school account is provisioned.
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/institutions">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Create school
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
