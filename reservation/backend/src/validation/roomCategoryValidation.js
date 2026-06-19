import { z } from 'zod';

export const roomCategorySchema = z.object({
  category: z.string().min(1, 'category is required').max(100),
  color: z.string().max(30).optional().nullable(),
});
