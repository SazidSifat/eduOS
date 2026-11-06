import { useLanguage } from '@eduos/ui';
import { useState } from 'react';
import { z } from 'zod';
import { Button, Input, Label } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf } from '../../_component/demo-form';
import {
  Choice,
  DataTable,
  EmptyState,
  Metrics,
  Notice,
  PageHeading,
  Panel,
  Status,
} from '../../_component/demo-ui';
import { useSchoolUiStore } from '../../../../stores/school-ui-store';

const roles = z.enum(['Admin', 'Principal', 'Admission Officer', 'Accountant', 'Teacher']);

const roleScopes: Record<z.infer<typeof roles>, string> = {
  Admin: 'Institution management',
  Principal: 'School operations',
  'Admission Officer': 'Assigned candidates',
  Accountant: 'Authorized collections',
  Teacher: 'Assigned class / subject',
};

export function PeopleSettings() {
  const { t } = useLanguage();

  const { state, dispatch, notify, snapshot } = useDemo();
  const [editing, setEditing] = useState<string | null>(null);

  // Zustand filter state
  const { peopleFilter, setPeopleFilter } = useSchoolUiStore();

  const member = state.members.find((m) => m.id === editing);

  const activeCount = state.members.filter((m) => m.active).length;
  const teacherCount = state.members.filter((m) => m.role === 'Teacher' && m.active).length;
  const admissionCount = state.members.filter(
    (m) => m.role === 'Admission Officer' && m.active,
  ).length;

  const filteredMembers = state.members.filter((m) => {
    const matchesSearch =
      !peopleFilter.search ||
      `${m.name} ${m.role}`.toLowerCase().includes(peopleFilter.search.toLowerCase());
    const matchesRole = peopleFilter.role === 'All school roles' || m.role === peopleFilter.role;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <PageHeading
        title={t('People and access')}
        description={t('Manage institution memberships and review explicit school access.')}
        action={<Button onClick={() => setEditing('')}>{t('Add existing account')}</Button>}
      />

      <Metrics
        items={[
          { label: 'Active members', value: activeCount, detail: 'This institution only' },
          { label: 'Teachers', value: teacherCount, detail: 'Assigned academic duties' },
          { label: 'Admission Officers', value: admissionCount, detail: 'Assigned intake records' },
          {
            label: 'Current session',
            value: state.settings.session || '2026',
            detail: 'Asia/Dhaka',
          },
        ]}
      />

      <div className="demo-filters">
        <div>
          <Label htmlFor="people-search">{t('Find a member')}</Label>
          <Input
            id="people-search"
            value={peopleFilter.search}
            onChange={(e) => setPeopleFilter({ search: e.target.value })}
            placeholder={t('Search name or school role')}
          />
        </div>
        <Choice
          id="people-role-filter"
          label={t('Role')}
          value={peopleFilter.role}
          options={['All school roles', ...roles.options]}
          onChange={(role) => setPeopleFilter({ role })}
        />
      </div>

      {!filteredMembers.length ? (
        <EmptyState title={t('No members found')}>
          {t('Try adjusting the search query or role filter.')}{' '}
        </EmptyState>
      ) : (
        <DataTable
          caption={t('Institution memberships')}
          headers={['Member', 'Role', 'Scope', 'Membership', 'Action']}
        >
          {filteredMembers.map((m) => (
            <tr key={m.id}>
              <td>
                <p className="font-semibold">{m.name}</p>
                <small className="text-muted-foreground">
                  {m.id === snapshot.identity.id ? t('Current account') : state.settings.name}
                </small>
              </td>
              <td>{t(m.role)}</td>
              <td className="text-muted-foreground">{roleScopes[m.role] ?? t('Staff member')}</td>
              <td>
                <Status tone={m.active ? 'success' : 'neutral'}>
                  {m.active ? t('Active') : t('Inactive')}
                </Status>
              </td>
              <td>
                <Button variant="outline" size="sm" onClick={() => setEditing(m.id)}>
                  {t('Review')}{' '}
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Notice title={t('Access follows the active membership')} tone="info">
        {t(
          'Changing or revoking access takes effect on protected school operations. Platform operator access is separate.',
        )}{' '}
      </Notice>

      <Panel title={t('Recent access changes')} description={t('School membership audit history')}>
        <p className="text-xs text-muted-foreground">
          {t(
            'Role assignments and status modifications are audited with the actor timestamp. Last active Admin cannot be revoked.',
          )}{' '}
        </p>
      </Panel>

      {editing !== null && (
        <DemoForm
          key={editing || 'new'}
          sections={[
            {
              title: member
                ? t('Membership · {value0}', { value0: member.name })
                : 'Add an existing account',
              description: member
                ? 'Update role or active status for this school member.'
                : 'Associate an existing authenticated user by their email address.',
              fields: [
                {
                  name: 'name',
                  label: 'Staff display name',
                  required: true,
                  value: member?.name ?? 'Existing account',
                  readOnly: true,
                },
                {
                  name: 'email',
                  label: 'Existing account email',
                  required: !member,
                  value: '',
                  readOnly: !!member,
                },
                {
                  name: 'role',
                  label: 'School role',
                  required: true,
                  options: roles.options,
                  value: member?.role ?? 'Teacher',
                },
                {
                  name: 'active',
                  label: 'Active membership',
                  kind: 'switch',
                  value: member?.active === false ? 'no' : 'yes',
                },
              ],
            },
          ]}
          footer={
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t('Cancel')}{' '}
            </Button>
          }
          submitLabel={t('Save membership')}
          onSubmit={async (values) => {
            const role = roles.safeParse(valueOf(values, 'role'));
            if (!role.success) return;
            if (
              !(await dispatch({
                type: 'member-save',
                member: {
                  id: member?.id ?? crypto.randomUUID(),
                  name: valueOf(values, 'name'),
                  ...(!member ? { email: valueOf(values, 'email') } : {}),
                  role: role.data,
                  active: valueOf(values, 'active') === 'yes',
                },
              }))
            )
              return;
            setEditing(null);
            notify('Membership saved.');
          }}
        />
      )}
    </>
  );
}
