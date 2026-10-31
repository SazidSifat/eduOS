import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EnrollmentDates } from './enrollment-dates';

const { dispatch, notify, invalidateQueries, snapshot } = vi.hoisted(() => ({
  dispatch: vi.fn(),
  notify: vi.fn(),
  invalidateQueries: vi.fn(),
  snapshot: {
    identity: { id: 'synthetic-admin' },
    institutionId: 'synthetic-school',
    permissions: ['academics.manage'],
    modules: ['academics'],
    classes: [],
    students: [
      {
        id: '10000000-0000-4000-8000-000000000001',
        enrollmentId: '20000000-0000-4000-8000-000000000001',
        name: 'Synthetic Student',
        roll: '01',
        classId: 'synthetic-class',
        startsOn: null,
        endsOn: null,
      },
    ],
  },
}));
vi.mock('../../_component/demo-provider', () => ({
  useDemo: () => ({ snapshot, dispatch, notify, busy: false }),
}));
vi.mock('../../../../lib/query-client', () => ({ queryClient: { invalidateQueries } }));
vi.mock('../../../../lib/config', () => ({
  config: { VITE_API_BASE_URL: 'http://localhost:3001' },
}));
vi.mock('./enrollment-date-history', () => ({
  EnrollmentDateHistory: () => <p>History region</p>,
}));
beforeEach(() => {
  vi.resetAllMocks();
  snapshot.permissions = ['academics.manage'];
  snapshot.modules = ['academics'];
  invalidateQueries.mockResolvedValue(undefined);
});
afterEach(cleanup);

it('requires an accessible reason before sending an enrollment change', async () => {
  render(<EnrollmentDates />);
  fireEvent.click(screen.getByRole('button', { name: 'Save enrollment dates' }));
  expect(await screen.findByText('Reason for date change is required.')).toBeTruthy();
  expect(screen.getByLabelText(/Reason for date change/).getAttribute('aria-invalid')).toBe('true');
  expect(dispatch).not.toHaveBeenCalled();
});
it('sends unknown dates as null and refreshes only the scoped history after success', async () => {
  dispatch.mockResolvedValue({});
  render(<EnrollmentDates />);
  fireEvent.change(screen.getByLabelText(/Reason for date change/), {
    target: { value: 'Verified synthetic register' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save enrollment dates' }));
  await waitFor(() => expect(notify).toHaveBeenCalled());
  expect(dispatch).toHaveBeenCalledWith({
    type: 'enrollment-dates',
    enrollmentId: snapshot.students[0]?.enrollmentId,
    startsOn: null,
    endsOn: null,
    reason: 'Verified synthetic register',
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: [
      'enrollment-history',
      'synthetic-admin',
      'synthetic-school',
      snapshot.students[0]?.enrollmentId,
    ],
  });
  expect(
    screen.getByLabelText(/Reason for date change/).getAttribute('value') ??
      screen.getByLabelText(/Reason for date change/).textContent,
  ).toBe('');
});
it('retains the entered reason when the server rejects the change', async () => {
  dispatch.mockResolvedValue(null);
  render(<EnrollmentDates />);
  const reason = screen.getByLabelText<HTMLTextAreaElement>(/Reason for date change/);
  fireEvent.change(reason, { target: { value: 'Synthetic correction request' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save enrollment dates' }));
  await waitFor(() => expect(dispatch).toHaveBeenCalled());
  expect(reason.value).toBe('Synthetic correction request');
  expect(notify).not.toHaveBeenCalled();
  expect(invalidateQueries).not.toHaveBeenCalled();
});
it('hides the editor when permission or Academics entitlement is absent', () => {
  snapshot.permissions = [];
  const view = render(<EnrollmentDates />);
  expect(screen.queryByText('Enrollment dates')).toBeNull();
  snapshot.permissions = ['academics.manage'];
  snapshot.modules = [];
  view.rerender(<EnrollmentDates />);
  expect(screen.queryByText('Enrollment dates')).toBeNull();
});
