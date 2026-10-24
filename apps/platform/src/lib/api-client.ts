import type { z } from 'zod';
import { errorSchema } from '@eduos/contracts';
import { config } from './config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly requestId?: string,
    public readonly code?: string,
  ) {
    super(
      status === 401
        ? 'Please sign in to continue.'
        : status === 403
          ? 'Your account does not have platform access.'
          : 'The request could not be completed. Please try again.',
    );
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit): Promise<T> {
  const response = await fetch(new URL(path, config.VITE_API_BASE_URL), {
    credentials: 'include',
    headers: { Accept: 'application/json', ...init.headers },
    ...init,
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = errorSchema.safeParse(body);
    throw new ApiError(
      response.status,
      error.success ? error.data.error.requestId : undefined,
      error.success ? error.data.error.code : undefined,
    );
  }
  return schema.parse(body);
}

export function apiGet<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal) {
  return request(path, schema, { method: 'GET', ...(signal ? { signal } : {}) });
}

export function apiPut<T>(path: string, schema: z.ZodType<T>, body: unknown) {
  return request(path, schema, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function apiPost<T>(path: string, schema: z.ZodType<T>, body: unknown) {
  return request(path, schema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
