import { expect, it } from 'vitest';
import { initialSchoolPreview } from './school-preview-data.js';
import {
  createSchoolPreview,
  changeSchoolStatusPreview,
  updateSubscriptionPreview,
  prepareSchoolMessagePreview,
} from './school-preview-actions.js';

it('creates a unique sample school without assigning a subscription or changing existing records', () => {
  const state = initialSchoolPreview();
  const result = createSchoolPreview(state, 'platform_owner', {
    name: 'Jamuna Preview School',
    slug: 'jamuna-preview-school',
    contactName: 'Rehana Sultana',
    contactEmail: 'office@jamuna.example.test',
  });
  expect(result.state.schools).toHaveLength(state.schools.length + 1);
  expect(result.state.schools.find((school) => school.id === result.id)?.subscription.status).toBe(
    'not_configured',
  );
  expect(state.schools).toHaveLength(8);
  expect(() =>
    createSchoolPreview(result.state, 'platform_owner', {
      name: 'Duplicate School',
      slug: 'jamuna-preview-school',
      contactName: 'Sample Contact',
      contactEmail: 'office@duplicate.example.test',
    }),
  ).toThrow(/slug already exists/);
});

it('requires a reason and preserves subscription data when freezing a school', () => {
  const state = initialSchoolPreview();
  const school = state.schools[0];
  if (!school) throw new Error('Expected a sample school');
  expect(() =>
    changeSchoolStatusPreview(state, 'platform_owner', school.id, { status: 'frozen', reason: '' }),
  ).toThrow(/reason/);
  const changed = changeSchoolStatusPreview(state, 'platform_owner', school.id, {
    status: 'frozen',
    reason: 'School office requested an access review.',
  });
  expect(changed.schools[0]?.status).toBe('frozen');
  expect(changed.schools[0]?.subscription).toEqual(school.subscription);
  expect(state.schools[0]?.status).toBe('active');
});

it('does not reactivate a frozen school when changing its subscription', () => {
  const state = initialSchoolPreview();
  const school = state.schools.find((entry) => entry.status === 'frozen');
  if (!school) throw new Error('Expected a frozen sample school');
  const changed = updateSubscriptionPreview(state, 'platform_owner', school.id, {
    ...school.subscription,
    status: 'active',
    amount: 2400,
    renewalDate: '2026-12-01',
  });
  expect(changed.schools.find((entry) => entry.id === school.id)?.status).toBe('frozen');
  expect(changed.schools.find((entry) => entry.id === school.id)?.subscription.amount).toBe(2400);
});

it('derives a message recipient from the selected school and keeps the original state unchanged', () => {
  const state = initialSchoolPreview();
  const school = state.schools[0];
  if (!school) throw new Error('Expected a sample school');
  const changed = prepareSchoolMessagePreview(state, 'platform_owner', {
    schoolId: school.id,
    kind: 'warning',
    channel: 'both',
    subject: 'Please review your profile',
    body: 'Contact the platform office to confirm your school details.',
    recipient: 'other@example.test',
  });
  expect(changed.messages[0]?.recipient).toBe(school.contactEmail);
  expect(changed.messages[0]?.kind).toBe('warning');
  expect(state.messages).toHaveLength(0);
});

it('keeps Manager preview actions read-only', () => {
  const state = initialSchoolPreview();
  const school = state.schools[0];
  if (!school) throw new Error('Expected a sample school');
  expect(() => createSchoolPreview(state, 'platform_manager', {})).toThrow(/Super Admin access/);
  expect(() => changeSchoolStatusPreview(state, 'platform_manager', school.id, {})).toThrow(
    /Super Admin access/,
  );
  expect(() => updateSubscriptionPreview(state, 'platform_manager', school.id, {})).toThrow(
    /Super Admin access/,
  );
  expect(() => prepareSchoolMessagePreview(state, 'platform_manager', {})).toThrow(
    /Super Admin access/,
  );
  expect(state.events).toHaveLength(0);
});
