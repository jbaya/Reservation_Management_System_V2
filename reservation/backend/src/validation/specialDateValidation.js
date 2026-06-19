import { z } from 'zod';

export const specialDateSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  type: z.string().max(50).optional().nullable(),
  fromDate: z.string().min(1, 'fromDate is required'),
  toDate: z.string().min(1, 'toDate is required'),
  color: z.string().max(20).optional(),
}).refine((data) => new Date(data.fromDate) <= new Date(data.toDate), {
  message: 'fromDate must be before or equal to toDate',
  path: ['toDate'],
});
