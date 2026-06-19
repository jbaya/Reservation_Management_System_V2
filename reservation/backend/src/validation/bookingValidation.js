import { z } from 'zod';

export const bookingSchema = z.object({
  id: z.string().min(1).max(50),
  guestName: z.string().min(1, 'guestName is required').max(200),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  nationality: z.string().max(50).optional().nullable(),

  categoryId: z.number().int().positive().optional().nullable(),
  agentId: z.number().int().positive().optional().nullable(),
  thirdPartyId: z.number().int().positive().optional().nullable(),

  arrival: z.string().min(1, 'arrival is required'),
  departure: z.string().min(1, 'departure is required'),
  arrivalTime: z.string().max(10).optional().nullable(),
  departureTime: z.string().max(10).optional().nullable(),

  numGuests: z.coerce.number().int().min(1).optional(),
  numChildren: z.coerce.number().int().min(0).optional(),
  childrenAges: z.array(z.coerce.number()).optional(),

  mealPlan: z.string().max(10).optional().nullable(),
  status: z.enum(['tentative', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
  source: z.string().max(50).optional().nullable(),
  otaPlatform: z.string().max(100).optional().nullable(),
  externalBookingRef: z.string().max(100).optional().nullable(),

  baseRate: z.coerce.number().min(0).optional(),
  extraChildCharge: z.coerce.number().min(0).optional(),
  extraBed: z.string().max(20).optional().nullable(),
  extraBedCharge: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  advanceParticulars: z.coerce.number().min(0).optional(),
  advancePaymentType: z.string().max(50).optional().nullable(),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'refunded']).optional(),
  paymentMode: z.string().max(50).optional().nullable(),
  totalAmount: z.coerce.number().min(0).optional(),
  paidAmount: z.coerce.number().min(0).optional(),

  dnc: z.boolean().optional(),
  roomIds: z.array(z.number().int().positive()).optional(),
  tags: z.array(z.string()).optional(),
}).refine((data) => new Date(data.arrival) <= new Date(data.departure), {
  message: 'arrival must be before or equal to departure',
  path: ['departure'],
});

export const commentSchema = z.object({
  author: z.string().max(200).optional().nullable(),
  commentText: z.string().min(1, 'commentText is required'),
});
