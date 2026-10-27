import { useState } from 'react';
import { z } from 'zod';
import { Button, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm } from '../../_component/demo-form';
import { DataTable, Notice, PageHeading, Panel, Status } from '../../_component/demo-ui';

export function ExpenseSettings() {
  const { state, dispatch, notify } = useDemo();
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  return (
    <>
      <PageHeading
        title="Expense settings"
        description="Define categories, evidence requirements and school review policy."
      />
      <Notice title="Proposed school policy" tone="warning">
        Approval thresholds, reviewer roles and evidence rules are synthetic examples for school
        confirmation.
      </Notice>
      <DemoForm
        sections={[
          {
            title: 'Approval and payment controls',
            fields: [
              {
                name: 'expenseThreshold',
                label: 'Approval threshold (BDT)',
                kind: 'money',
                required: true,
                value: state.settings.expenseThreshold ?? '5000',
              },
              {
                name: 'expenseReviewer',
                label: 'Authorized reviewer',
                options: ['Admin / Principal', 'Principal'],
                value: state.settings.expenseReviewer ?? 'Admin / Principal',
              },
              {
                name: 'evidence',
                label: 'Supporting evidence',
                options: ['Required', 'Optional'],
                value: state.settings.evidence ?? 'Required',
              },
            ],
          },
        ]}
        submitLabel="Save expense policy"
        onSubmit={(values) => {
          dispatch({ type: 'settings-save', values });
          notify('Expense policy saved in demo data.');
        }}
      />
      <Panel title="Expense categories">
        <DataTable caption="Expense categories" headers={['Category', 'Evidence rule', 'State']}>
          {state.categories.map((c) => (
            <tr key={c}>
              <td>{c}</td>
              <td>{state.settings.evidence ?? 'Required'}</td>
              <td>
                <Status tone="success">Active</Status>
              </td>
            </tr>
          ))}
        </DataTable>
        <form
          className="demo-filters mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = z.string().trim().min(2).max(60).safeParse(category);
            if (!parsed.success || state.categories.includes(category.trim())) {
              setError('Enter a unique category name of 2–60 characters.');
              return;
            }
            dispatch({ type: 'category-add', category: parsed.data });
            setCategory('');
            setError('');
            notify('Expense category added.');
          }}
        >
          <div>
            <Label htmlFor="new-expense-category">New category</Label>
            <Input
              id="new-expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-describedby={error ? 'category-error' : undefined}
            />
          </div>
          <Button type="submit">Add category</Button>
        </form>
        {error && (
          <p className="demo-error mt-3" id="category-error" role="alert">
            {error}
          </p>
        )}
      </Panel>
    </>
  );
}
