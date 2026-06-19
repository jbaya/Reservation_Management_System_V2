import { z } from 'zod';

export const floorSchema = z.object({
  floorNo: z.coerce.number().int(),
  label: z.string().min(1, 'label is required').max(100),
});
