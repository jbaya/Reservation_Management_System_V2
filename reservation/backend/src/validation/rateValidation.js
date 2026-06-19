import { z } from 'zod';

export const rateSchema = z.object({
  agentId: z.number().int().positive('agentId is required'),
  categoryId: z.number().int().positive('categoryId is required'),
  seasonId: z.number().int().positive('seasonId is required'),
  roomRate: z.coerce.number().min(0),
  extraPersonRate: z.coerce.number().min(0).optional(),
});
