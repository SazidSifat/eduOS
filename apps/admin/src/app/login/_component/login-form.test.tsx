import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { LoginForm } from './login-form';

const { signIn, navigate, clear, cancelQueries } = vi.hoisted(() => ({
  signIn: vi.fn(),
  navigate: vi.fn(),
  clear: vi.fn(),
  cancelQueries: vi.fn(),
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
vi.mock('../_api/auth', () => ({ authClient: { signIn: { email: signIn } } }));
vi.mock('../../../lib/query-client', () => ({ queryClient: { clear, cancelQueries } }));

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

function enterCredentials() {
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'teacher@example.test' },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'x'.repeat(16) },
  });
}

it('shows accessible validation and does not send invalid credentials', async () => {
  render(<LoginForm />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad-email' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
  expect(signIn).not.toHaveBeenCalled();
});

it('toggles password visibility without changing its value or submitting', () => {
  render(<LoginForm />);
  enterCredentials();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password').getAttribute('type')).toBe('text');
  expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe(
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password');
  expect(screen.getByLabelText('Password').getAttribute('autocomplete')).toBe('current-password');
  expect(signIn).not.toHaveBeenCalled();
});

it('locks credentials during sign-in and clears prior server state before navigating', async () => {
  let finish: ((value: { error: null }) => void) | undefined;
  signIn.mockImplementation(
    () =>
      new Promise<{ error: null }>((resolve) => {
        finish = resolve;
      }),
  );
  render(<LoginForm />);
  enterCredentials();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  const pending = await screen.findByRole('button', { name: 'Signing in…' });
  expect(pending.hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('group').hasAttribute('disabled')).toBe(true);
  expect(navigate).not.toHaveBeenCalled();
  if (!finish) throw new Error('Expected a pending sign-in');
  finish({ error: null });
  await waitFor(() => expect(navigate).toHaveBeenCalledWith({ to: '/app', replace: true }));
  expect(cancelQueries).toHaveBeenCalledOnce();
  expect(clear).toHaveBeenCalledOnce();
  const [cancelled] = cancelQueries.mock.invocationCallOrder;
  const [cleared] = clear.mock.invocationCallOrder;
  const [navigated] = navigate.mock.invocationCallOrder;
  if (cancelled === undefined || cleared === undefined || navigated === undefined)
    throw new Error('Expected cache cancellation, clearing and navigation');
  expect(cancelled).toBeLessThan(cleared);
  expect(cleared).toBeLessThan(navigated);
});

it('shows a safe credential failure and clears it when the user edits a field', async () => {
  signIn.mockResolvedValue({ error: { message: 'Internal provider detail' } });
  render(<LoginForm />);
  enterCredentials();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Sign in failed. Check your credentials or try again later.',
  );
  expect(screen.getByLabelText('Password').getAttribute('aria-describedby')).toBe('login-error');
  expect(screen.queryByText('Internal provider detail')).toBeNull();
  expect(clear).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'principal@example.test' } });
  expect(screen.queryByRole('alert')).toBeNull();
});

it('keeps the user on the form when the server cannot be reached', async () => {
  signIn.mockRejectedValue(new TypeError('Failed to fetch'));
  render(<LoginForm />);
  enterCredentials();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Unable to connect. Please try again.',
  );
  expect(navigate).not.toHaveBeenCalled();
});
