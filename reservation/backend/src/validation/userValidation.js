import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().min(1, 'fullName is required').max(200),
  gender: z.string().max(20).optional().nullable(),
  mobile: z.string().max(20).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  designationId: z.number().int().positive().optional().nullable(),
  username: z.string().min(1, 'username is required').max(100),
  password: z.string().min(4, 'password must be at least 4 characters'),
  userType: z.enum(['admin', 'manager', 'staff']),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateUserSchema = createUserSchema.partial({
  username: true,
  password: true,
  userType: true,
}).extend({
  password: z.string().min(4).optional().or(z.literal('')),
});
