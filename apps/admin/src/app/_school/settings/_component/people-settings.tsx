import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@eduos/ui';
import { useDemo } from '../../_component/demo-provider';
import { DemoForm, valueOf } from '../../_component/demo-form';
import { DataTable, Notice, PageHeading, Status } from '../../_component/demo-ui';

const roles = z.enum(['Admin', 'Principal', 'Admission Officer', 'Accountant', 'Teacher']);
export function PeopleSettings() {
  const { state, dispatch, notify } = useDemo();
  const [editing, setEditing] = useState<string | null>(null);
  const member = state.members.find((m) => m.id === editing);
  return (
    <>
      <PageHeading
        title="People and access"
        description="Review synthetic institution memberships and explicit school roles."
        action={<Button onClick={() => setEditing('')}>Add sample member</Button>}
      />
      <Notice title="Presentation only">
        These controls change sample member records. They do not create accounts, grant live school
        permissions or change platform access.
      </Notice>
      <DataTable
        caption="Institution memberships"
        headers={['Member', 'School role', 'Membership', 'Action']}
      >
        {state.members.map((m) => (
          <tr key={m.id}>
            <td>
              <strong>{m.name}</strong>
              <small>Shapla Model School</small>
            </td>
            <td>{m.role}</td>
            <td>
              <Status tone={m.active ? 'success' : 'neutral'}>
                {m.active ? 'Active' : 'Inactive'}
              </Status>
            </td>
            <td>
              <Button variant="outline" size="sm" onClick={() => setEditing(m.id)}>
                Review membership
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
      {editing !== null && (
        <DemoForm
          key={editing || 'new'}
          sections={[
            {
              title: member ? `Membership · ${member.name}` : 'New sample membership',
              fields: [
                {
                  name: 'name',
                  label: 'Staff display name',
                  required: true,
                  value: member?.name ?? '',
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
              Cancel
            </Button>
          }
          submitLabel="Save sample membership"
          onSubmit={(values) => {
            const role = roles.safeParse(valueOf(values, 'role'));
            if (!role.success) return;
            dispatch({
              type: 'member-save',
              member: {
                id: member?.id ?? `member-${state.members.length + 1}`,
                name: valueOf(values, 'name'),
                role: role.data,
                active: valueOf(values, 'active') === 'yes',
              },
            });
            setEditing(null);
            notify('Sample membership updated. No real access changed.');
          }}
        />
      )}
    </>
  );
}
