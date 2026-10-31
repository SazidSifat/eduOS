import { z } from 'zod';

export const enrollmentHistoryQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});
export const enrollmentHistorySchema = z.strictObject({
  items: z.array(
    z.strictObject({
      id: z.uuid(),
      actorName: z.string(),
      previousStart: z.iso.date().nullable(),
      previousEnd: z.iso.date().nullable(),
      startsOn: z.iso.date().nullable(),
      endsOn: z.iso.date().nullable(),
      reason: z.string(),
      createdAt: z.iso.datetime(),
    }),
  ),
  hasMore: z.boolean(),
});
