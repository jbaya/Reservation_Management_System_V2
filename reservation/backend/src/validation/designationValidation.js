import { z } from 'zod';

export const designationSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
});
