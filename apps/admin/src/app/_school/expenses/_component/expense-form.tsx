import { useLanguage } from '@eduos/ui';
import { uploadEvidence } from '../../_api/queries';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Button, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY } from '../../_component/school-format';
import { amountOf, DemoForm, valueOf } from '../../_component/demo-form';
import { DemoLink, EmptyState, Notice, PageHeading, Panel } from '../../_component/demo-ui';
import type { Expense } from '../../_component/demo-model';

export function ExpenseForm({ expenseId }: { expenseId: string }) {
  const { t, money } = useLanguage();

  const { state, snapshot, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const [newId] = useState(() => crypto.randomUUID());
  const expense = state.expenses.find((e) => e.id === expenseId);
  const [attachment, setAttachment] = useState(expense?.attachment ?? '');
  const [uploading, setUploading] = useState(false);
  const [evidenceName, setEvidenceName] = useState(
    expense?.attachment ? 'Uploaded supporting document' : '',
  );
  const [error, setError] = useState('');
  if (expense?.paid || expense?.status === 'approved')
    return (
      <EmptyState
        title={t('This expense is locked')}
        action={<DemoLink to="/expenses">{t('Open register')}</DemoLink>}
      >
        {t(
          'Approved or paid expenses cannot be overwritten. View their original request and payment voucher.',
        )}{' '}
      </EmptyState>
    );
  async function submit(values: Record<string, string>, draft = false) {
    if (uploading) {
      setError('Wait for the document upload to finish.');
      return;
    }
    const amount = amountOf(valueOf(values, 'amount'));
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError('Enter a positive expense amount.');
      return;
    }
    if (!draft && state.settings.evidence === 'Required' && !attachment) {
      setError('Upload supporting evidence before submitting.');
      return;
    }
    const item: Expense = {
      id: expense?.id ?? newId,
      description: valueOf(values, 'description'),
      category: valueOf(values, 'category'),
      payee: valueOf(values, 'payee'),
      reference: valueOf(values, 'reference'),
      amount,
      date: valueOf(values, 'date'),
      status: draft ? 'draft' : 'pending',
      paid: false,
      attachment,
      notes: valueOf(values, 'notes'),
      reviewNote: '',
      history: [
        ...(expense?.history ?? []),
        draft
          ? `${snapshot.identity.name} saved a draft request.`
          : `${snapshot.identity.name} submitted the expense for review.`,
      ],
      voucher: '',
    };
    if (!(await dispatch({ type: 'expense-save', expense: item }))) return;
    notify(
      draft ? 'Expense draft saved.' : 'Expense sent for approval. No payment has been recorded.',
    );
    void navigate({ to: '/expenses/$expenseId', params: { expenseId: item.id } });
  }
  return (
    <>
      <PageHeading
        title={expense ? t('Edit expense request') : t('Record an expense')}
        description={t('Capture the request and evidence before approval or payment.')}
      />
      {error && (
        <Notice title={t('Review this expense')} tone="danger">
          {error}
        </Notice>
      )}
      <DemoForm
        sections={[
          {
            title: 'Expense details',
            fields: [
              {
                name: 'description',
                label: 'Description',
                required: true,
                value: expense?.description ?? '',
                wide: true,
              },
              {
                name: 'date',
                label: 'Expense date',
                kind: 'date',
                required: true,
                value: expense?.date ?? DEMO_TODAY,
              },
              {
                name: 'category',
                label: 'Category',
                options: state.categories,
                required: true,
                value: expense?.category ?? 'Utilities',
              },
              {
                name: 'amount',
                label: 'Amount (BDT)',
                kind: 'money',
                required: true,
                value: expense ? String(expense.amount / 100) : '',
              },
            ],
          },
          {
            title: 'Payee and reference',
            fields: [
              { name: 'payee', label: 'Payee', required: true, value: expense?.payee ?? '' },
              { name: 'reference', label: 'Invoice / reference', value: expense?.reference ?? '' },
              {
                name: 'notes',
                label: 'Internal note',
                kind: 'textarea',
                wide: true,
                value: expense?.notes ?? '',
              },
            ],
          },
        ]}
        onSubmit={(values) => submit(values)}
        submitLabel={t('Submit for approval')}
        busy={uploading}
        footer={
          <>
            <DemoLink to="/expenses">{t('Cancel')}</DemoLink>
            <SaveDraft onSave={(values) => submit(values, true)} />
          </>
        }
      >
        <Panel
          title={t('Supporting evidence')}
          description={t(
            'Upload supporting documents to the school record. Only authorized school staff can download them.',
          )}
        >
          <div className="demo-file demo-field">
            <Label htmlFor="expense-evidence">
              {t('Bill or receipt · PDF, PNG or JPEG · Up to 5 MB')}{' '}
            </Label>
            <Input
              id="expense-evidence"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={async (e) => {
                const file = e.target.files?.item(0);
                if (!file) return;
                const parsed = z
                  .object({
                    name: z.string().regex(/\.(pdf|png|jpe?g)$/i),
                    size: z.number().max(5 * 1024 * 1024),
                    type: z.enum(['application/pdf', 'image/png', 'image/jpeg']),
                  })
                  .safeParse({ name: file.name, size: file.size, type: file.type });
                if (!parsed.success) {
                  setError('Choose a PDF, PNG or JPEG no larger than 5 MB.');
                  return;
                }
                setUploading(true);
                try {
                  const uploaded = await uploadEvidence(snapshot.institutionId, file);
                  setAttachment(uploaded.id);
                  setEvidenceName(uploaded.name);
                  setError('');
                } catch {
                  setError('The document could not be uploaded. Retry before submitting.');
                } finally {
                  setUploading(false);
                }
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p>
                {uploading
                  ? t('Uploading document…')
                  : evidenceName || t('No supporting document uploaded.')}
              </p>
            </div>
          </div>
        </Panel>
        <Notice
          title={t('Approval threshold · {value0}', {
            value0: money(Math.round(Number(state.settings.expenseThreshold ?? '0') * 100)),
          })}
          tone="warning"
        >
          {t('Requests are reviewed by')} {state.settings.expenseReviewer ?? t('Admin / Principal')}
          . Submission does not record a payment.
        </Notice>
      </DemoForm>
    </>
  );
}
function SaveDraft({ onSave }: { onSave: (values: Record<string, string>) => void }) {
  const { t } = useLanguage();

  const form = useFormContext<Record<string, string>>();
  return (
    <Button variant="outline" onClick={form.handleSubmit(onSave)}>
      {t('Save draft')}{' '}
    </Button>
  );
}
