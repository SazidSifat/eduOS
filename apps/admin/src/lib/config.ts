import { z } from 'zod';
const origin = z.url().refine((value) => {
  const url = new URL(value);
  return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
}, 'Use an exact HTTP(S) origin');
export const config = z
  .object({ VITE_API_BASE_URL: origin, VITE_AUTH_BASE_URL: origin })
  .parse(import.meta.env);
