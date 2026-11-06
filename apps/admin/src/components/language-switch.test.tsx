import { bangla } from '../lib/i18n/translations';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LanguageProvider, LanguageToggle, DatePicker, languageStorageKey } from '@eduos/ui';
import { LoginForm } from '../app/login/_component/login-form';
import { DemoForm } from '../app/_school/_component/demo-form';

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../app/login/_api/auth', () => ({ authClient: { signIn: { email: vi.fn() } } }));
vi.mock('../lib/query-client', () => ({ queryClient: { clear: vi.fn(), cancelQueries: vi.fn() } }));

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

it('switches login copy and validation without losing input and remembers the choice', async () => {
  const view = render(
    <LanguageProvider defaultLanguage="bn" translations={bangla}>
      <LanguageToggle />
      <LoginForm />
    </LanguageProvider>,
  );
  const email = screen.getByLabelText('ইমেইল');
  fireEvent.change(email, { target: { value: 'invalid-email' } });
  fireEvent.click(screen.getByRole('button', { name: 'লগইন' }));
  expect(await screen.findByText('সঠিক ইমেইল ঠিকানা লিখুন।')).toBeTruthy();
  expect(document.documentElement.lang).toBe('bn');
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByLabelText('Email')).toBe(email);
  expect(email.getAttribute('aria-invalid')).toBe('true');
  expect(screen.getByDisplayValue('invalid-email')).toBeTruthy();
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(localStorage.getItem(languageStorageKey)).toBe('en');
  view.unmount();
  render(
    <LanguageProvider defaultLanguage="bn" translations={bangla}>
      <LanguageToggle />
      <LoginForm />
    </LanguageProvider>,
  );
  expect(screen.getByRole('button', { name: 'English' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByLabelText('Email')).toBeTruthy();
});

it('translates field labels and required errors while submitting the original field keys', async () => {
  const submit = vi.fn();
  render(
    <LanguageProvider defaultLanguage="bn" translations={bangla}>
      <LanguageToggle />
      <DemoForm
        sections={[
          {
            title: 'Student information',
            fields: [{ name: 'studentName', label: 'Student name', required: true }],
          },
        ]}
        onSubmit={submit}
      />
    </LanguageProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'পরিবর্তন সংরক্ষণ' }));
  expect(await screen.findByText('শিক্ষার্থীর নাম দিতে হবে।')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('শিক্ষার্থীর নাম *'), {
    target: { value: 'Synthetic Student' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByDisplayValue('Synthetic Student')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(submit).toHaveBeenCalled());
  expect(submit.mock.calls[0]?.[0]).toEqual({ studentName: 'Synthetic Student' });
});

it('localizes the calendar display without changing its ISO date value', () => {
  const change = vi.fn();
  render(
    <LanguageProvider defaultLanguage="bn" translations={bangla}>
      <LanguageToggle />
      <DatePicker value="2026-11-06" onValueChange={change} aria-describedby="date-help" />
    </LanguageProvider>,
  );
  expect(screen.getByText(/নভে/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByText('06 Nov 2026')).toBeTruthy();
  expect(change).not.toHaveBeenCalled();
});
