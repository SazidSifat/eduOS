import type { z } from 'zod';
import { errorSchema } from '@eduos/contracts';
import { config } from './config';
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(
      status === 401
        ? 'Please sign in to continue.'
        : 'The request could not be completed. Please try again.',
    );
  }
}
export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(new URL(path, config.VITE_API_BASE_URL), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
    ...(signal ? { signal } : {}),
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = errorSchema.safeParse(body);
    throw new ApiError(response.status, error.success ? error.data.error.requestId : undefined);
  }
  return schema.parse(body);
}
