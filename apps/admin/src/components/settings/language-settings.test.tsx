import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider, languageStorageKey } from '@eduos/ui';
import { LanguageSettings } from './language-settings';
import { bangla } from '../../lib/i18n/translations';
import { canOpenSchoolPath } from '../../app/_school/_component/school-access';

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

it('changes and saves the display language from the Settings panel', () => {
  render(
    <LanguageProvider defaultLanguage="bn" translations={bangla}>
      <LanguageSettings />
    </LanguageProvider>,
  );
  expect(screen.getByRole('region', { name: 'প্রদর্শনের ভাষা' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByRole('region', { name: 'Display language' })).toBeTruthy();
  expect(localStorage.getItem(languageStorageKey)).toBe('en');
  fireEvent.click(screen.getByRole('button', { name: 'বাংলা' }));
  expect(localStorage.getItem(languageStorageKey)).toBe('bn');
});

it('allows personal Settings without granting access to school configuration', () => {
  const personalAccess = { permissions: [], modules: [] };
  expect(canOpenSchoolPath(personalAccess, '/settings')).toBe(true);
  expect(canOpenSchoolPath(personalAccess, '/settings/')).toBe(true);
  for (const path of ['/settings/school', '/settings/academics', '/settings/people']) {
    expect(canOpenSchoolPath(personalAccess, path)).toBe(false);
    expect(canOpenSchoolPath({ permissions: ['school.settings'], modules: [] }, path)).toBe(true);
  }
});
