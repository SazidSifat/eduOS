import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { Button, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DEMO_TODAY, money } from '../../_component/demo-data';
import { amountOf, DemoForm, valueOf } from '../../_component/demo-form';
import { DemoLink, EmptyState, Notice, PageHeading, Panel } from '../../_component/demo-ui';
import type { Expense } from '../../_component/demo-model';

export function ExpenseForm({ expenseId }: { expenseId: string }) {
  const { state, dispatch, notify } = useDemo();
  const navigate = useNavigate();
  const expense = state.expenses.find((e) => e.id === expenseId);
  const [attachment, setAttachment] = useState(expense?.attachment ?? '');
  const [error, setError] = useState('');
  if (expense?.paid || expense?.status === 'approved')
    return (
      <EmptyState
        title="This expense is locked"
        action={<DemoLink to="/expenses">Open register</DemoLink>}
      >
        Approved or paid expenses cannot be overwritten. View their original request and payment
        voucher.
      </EmptyState>
    );
  function submit(values: Record<string, string>, draft = false) {
    const amount = amountOf(valueOf(values, 'amount'));
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError('Enter a positive expense amount.');
      return;
    }
    if (!draft && state.settings.evidence === 'Required' && !attachment) {
      setError('Attach supporting evidence or use the synthetic sample bill.');
      return;
    }
    const item: Expense = {
      id: expense?.id ?? `EXP-2026-${String(43 + state.expenses.length).padStart(4, '0')}`,
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
          ? 'Rashed Islam saved a draft request.'
          : 'Rashed Islam submitted the expense for review.',
      ],
      voucher: '',
    };
    dispatch({ type: 'expense-save', expense: item });
    notify(
      draft ? 'Expense draft saved.' : 'Expense sent for approval. No payment has been recorded.',
    );
    void navigate({ to: '/expenses/$expenseId', params: { expenseId: item.id } });
  }
  return (
    <>
      <PageHeading
        title={expense ? 'Edit expense request' : 'Record an expense'}
        description="Capture the request and evidence before approval or payment."
      />
      {error && (
        <Notice title="Review this expense" tone="danger">
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
        submitLabel="Submit for approval"
        footer={
          <>
            <DemoLink to="/expenses">Cancel</DemoLink>
            <SaveDraft onSave={(values) => submit(values, true)} />
          </>
        }
      >
        <Panel
          title="Supporting evidence"
          description="Use a synthetic bill. Only the file name is held in memory; nothing is uploaded."
        >
          <div className="demo-file demo-field">
            <Label htmlFor="expense-evidence">
              Bill or receipt · PDF, PNG or JPEG · Up to 5 MB
            </Label>
            <Input
              id="expense-evidence"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
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
                setAttachment(file.name);
                setError('');
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p>{attachment || 'No supporting document selected.'}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setAttachment('synthetic-school-bill.pdf');
                  setError('');
                }}
              >
                Use sample bill
              </Button>
            </div>
          </div>
        </Panel>
        <Notice
          title={`Approval threshold · ${money(Math.round(Number(state.settings.expenseThreshold ?? '5000') * 100))}`}
          tone="warning"
        >
          Requests are reviewed by {state.settings.expenseReviewer ?? 'Admin / Principal'}.
          Submission does not record a payment.
        </Notice>
      </DemoForm>
    </>
  );
}
function SaveDraft({ onSave }: { onSave: (values: Record<string, string>) => void }) {
  const form = useFormContext<Record<string, string>>();
  return (
    <Button variant="outline" onClick={form.handleSubmit(onSave)}>
      Save draft
    </Button>
  );
}
