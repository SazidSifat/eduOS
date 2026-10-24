import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LoginPage } from './login-form';
const signIn = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../api/auth-client', () => ({ authClient: { signIn: { email: signIn } } }));
vi.mock('../../../app/providers/query-client', () => ({ queryClient: { clear: vi.fn() } }));
afterEach(cleanup);
it('shows accessible validation and does not send invalid credentials', async () => {
  render(<LoginPage />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad-email' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true');
  expect(signIn).not.toHaveBeenCalled();
});
