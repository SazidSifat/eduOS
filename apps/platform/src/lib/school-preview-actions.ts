import type { PlatformRole } from '@eduos/permissions';
import {
  createSchoolSchema,
  schoolMessageSchema,
  schoolStatusChangeSchema,
  subscriptionSchema,
  type SchoolPreviewState,
  type SchoolEvent,
} from './school-preview-model.js';

// Proposed Owner-only preview interactions. These are not backend permission grants.
function requireOwner(role: PlatformRole) {
  if (role !== 'platform_owner')
    throw new Error('Super Admin access is required to manage schools.');
}
function requireSchool(state: SchoolPreviewState, id: string) {
  const school = state.schools.find((entry) => entry.id === id);
  if (!school) throw new Error('This school is not available in the preview.');
  return school;
}
function activity(schoolId: string, summary: string, detail: string): SchoolEvent {
  return {
    id: crypto.randomUUID(),
    schoolId,
    summary,
    detail,
    createdAt: new Date().toISOString(),
  };
}
export function createSchoolPreview(state: SchoolPreviewState, role: PlatformRole, input: unknown) {
  requireOwner(role);
  const parsed = createSchoolSchema.safeParse(input);
  if (!parsed.success) throw new Error('Review the school details and try again.');
  if (state.schools.some((school) => school.slug === parsed.data.slug))
    throw new Error('A school with this slug already exists.');
  const id = crypto.randomUUID();
  const school = {
    ...parsed.data,
    id,
    timezone: 'Asia/Dhaka',
    status: 'active' as const,
    statusReason: '',
    subscription: subscriptionSchema.parse({
      plan: 'unassigned',
      status: 'not_configured',
      billingCycle: 'monthly',
      amount: 0,
      renewalDate: '',
    }),
  };
  return {
    id,
    state: {
      ...state,
      schools: [...state.schools, school],
      events: [
        activity(id, 'School created', 'Subscription has not been configured.'),
        ...state.events,
      ],
    },
  };
}
export function changeSchoolStatusPreview(
  state: SchoolPreviewState,
  role: PlatformRole,
  id: string,
  input: unknown,
): SchoolPreviewState {
  requireOwner(role);
  const school = requireSchool(state, id);
  const parsed = schoolStatusChangeSchema.safeParse(input);
  if (!parsed.success) throw new Error('Choose a school state and add a reason.');
  if (school.status === parsed.data.status) return state;
  return {
    ...state,
    schools: state.schools.map((entry) =>
      entry.id === id
        ? { ...entry, status: parsed.data.status, statusReason: parsed.data.reason }
        : entry,
    ),
    events: [
      activity(id, `School marked ${parsed.data.status}`, parsed.data.reason),
      ...state.events,
    ],
  };
}
export function updateSubscriptionPreview(
  state: SchoolPreviewState,
  role: PlatformRole,
  id: string,
  input: unknown,
): SchoolPreviewState {
  requireOwner(role);
  requireSchool(state, id);
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) throw new Error('Review the subscription fields and try again.');
  return {
    ...state,
    schools: state.schools.map((entry) =>
      entry.id === id ? { ...entry, subscription: parsed.data } : entry,
    ),
    events: [
      activity(
        id,
        'Subscription updated',
        'Plan, billing cycle and renewal details updated in the preview.',
      ),
      ...state.events,
    ],
  };
}
export function prepareSchoolMessagePreview(
  state: SchoolPreviewState,
  role: PlatformRole,
  input: unknown,
): SchoolPreviewState {
  requireOwner(role);
  const parsed = schoolMessageSchema.safeParse(input);
  if (!parsed.success) throw new Error('Review the school, subject and message.');
  const school = requireSchool(state, parsed.data.schoolId);
  const message = {
    ...parsed.data,
    id: crypto.randomUUID(),
    recipient: school.contactEmail,
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    messages: [message, ...state.messages],
    events: [
      activity(
        school.id,
        parsed.data.kind === 'warning' ? 'Warning prepared' : 'Notice prepared',
        parsed.data.subject,
      ),
      ...state.events,
    ],
  };
}
