import { z } from 'zod';

export const roomSchema = z.object({
  roomNo: z.string().min(1, 'roomNo is required').max(50),
  categoryId: z.number().int().positive('categoryId is required'),
  floorId: z.number().int().positive('floorId is required'),
  capacity: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const renameCategorySchema = z.object({
  oldCategoryId: z.number().int().positive(),
  newCategoryId: z.number().int().positive(),
});
