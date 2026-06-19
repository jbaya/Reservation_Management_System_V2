import { z } from 'zod';

export const seasonSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  fromDate: z.string().min(1, 'fromDate is required'),
  toDate: z.string().min(1, 'toDate is required'),
}).refine((data) => new Date(data.fromDate) <= new Date(data.toDate), {
  message: 'fromDate must be before or equal to toDate',
  path: ['toDate'],
});
