import { useState } from 'react';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf, type FormSection } from '../../_component/demo-form';
import { DemoLink, Notice, PageHeading } from '../../_component/demo-ui';

export function SchoolSettings({ kind }: { kind: 'school' | 'admissions' | 'attendance' }) {
  const { state, dispatch, notify } = useDemo();
  const [error, setError] = useState('');
  const values = state.settings;
  const v = (name: string) => values[name] ?? '';
  const sections: FormSection[] =
    kind === 'school'
      ? [
          {
            title: 'Institution details',
            description: 'Shown across school workspaces, receipts and printed routines.',
            fields: [
              { name: 'name', label: 'School name', value: v('name'), required: true },
              { name: 'code', label: 'Institution code', value: v('code'), readOnly: true },
              {
                name: 'medium',
                label: 'Medium / language',
                value: v('medium'),
                options: ['Bangla medium', 'English version', 'English medium'],
              },
            ],
          },
          {
            title: 'Address and contact',
            fields: [
              {
                name: 'address',
                label: 'School address',
                value: v('address'),
                required: true,
                wide: true,
              },
              { name: 'phone', label: 'School contact', value: v('phone'), required: true },
            ],
          },
          {
            title: 'Regional preferences',
            fields: [
              { name: 'timezone', label: 'Timezone', value: v('timezone'), readOnly: true },
              { name: 'currency', label: 'Currency', value: 'BDT', options: ['BDT'] },
              { name: 'weeklyClosure', label: 'Weekly closure', value: v('weeklyClosure') },
            ],
          },
        ]
      : kind === 'admissions'
        ? [
            {
              title: 'Follow-up reminders',
              description:
                'Willing, admitted and closed records do not receive prospect reminders.',
              fields: [
                {
                  name: 'reminderDays',
                  label: 'Days before follow-up',
                  value: v('reminderDays'),
                  options: ['1', '2', '3'],
                },
                {
                  name: 'reminderTime',
                  label: 'Reminder time',
                  kind: 'time',
                  value: v('reminderTime'),
                  required: true,
                },
                { name: 'timezone', label: 'Timezone', value: v('timezone'), readOnly: true },
              ],
            },
            {
              title: 'Optional willing fee',
              description: 'Collection remains optional when creating a willing student.',
              fields: [
                {
                  name: 'willingFee',
                  label: 'Willing fee (BDT)',
                  kind: 'money',
                  value: v('willingFee'),
                  required: true,
                },
                {
                  name: 'creditWilling',
                  label: 'Credit willing fee toward admission',
                  kind: 'switch',
                  value: v('creditWilling'),
                },
              ],
            },
          ]
        : [
            {
              title: 'Daily register policy',
              description:
                'Status choices, cutoff and correction authority are proposed school policies.',
              fields: [
                {
                  name: 'cutoff',
                  label: 'Submission cutoff',
                  kind: 'time',
                  value: v('cutoff'),
                  required: true,
                },
                {
                  name: 'defaultStatus',
                  label: 'Default attendance status',
                  value: 'Unmarked',
                  readOnly: true,
                },
                { name: 'weeklyClosure', label: 'Weekly closure', value: v('weeklyClosure') },
              ],
            },
            {
              title: 'Corrections and review',
              fields: [
                {
                  name: 'correctionRole',
                  label: 'Authorized correction reviewer',
                  value: v('correctionRole'),
                  options: ['Admin / Principal', 'Principal'],
                },
                {
                  name: 'reasonRequired',
                  label: 'Require a correction reason',
                  kind: 'switch',
                  value: 'yes',
                },
                {
                  name: 'lateIncluded',
                  label: 'Include late students in attendance rate',
                  kind: 'switch',
                  value: v('lateIncluded') || 'yes',
                },
              ],
            },
            {
              title: 'Academic calendar',
              fields: [
                {
                  name: 'holidayName',
                  label: 'Holiday name',
                  value: v('holidayName'),
                },
                {
                  name: 'holidayDate',
                  label: 'Holiday date',
                  kind: 'date',
                  value: v('holidayDate'),
                },
              ],
            },
          ];
  return (
    <>
      <PageHeading
        title={
          kind === 'school'
            ? 'School profile'
            : kind === 'admissions'
              ? 'Admissions settings'
              : 'Attendance settings'
        }
        description="Configure school-level defaults. Saved values apply to this school."
      />
      {error && (
        <Notice title="Review these settings" tone="danger">
          {error}
        </Notice>
      )}
      <DemoForm
        sections={sections}
        submitLabel="Save settings"
        footer={<DemoLink to="/settings">Cancel</DemoLink>}
        onSubmit={async (data) => {
          if (kind === 'admissions' && Number(valueOf(data, 'willingFee')) > 1000000) {
            setError('Use a willing fee of BDT 1,000,000 or less.');
            return;
          }
          if (!(await dispatch({ type: 'settings-save', values: data }))) return;
          setError('');
          notify('School settings saved.');
        }}
      />
      {kind === 'admissions' && (
        <div className="demo-actions">
          <DemoLink to="/settings/academics">Manage class offerings</DemoLink>
          <DemoLink to="/settings/fees">Configure admission fee items</DemoLink>
        </div>
      )}
    </>
  );
}
