import { z } from 'zod';

// Shared shape for travel_agents and third_parties — same fields, two
// separate tables/services (see docs/01-ANALYSIS.md for why they were not
// merged into one polymorphic table).
export const partnerSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  company: z.string().max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  mobile: z.string().max(20).optional().nullable(),
  gst: z.string().max(50).optional().nullable(),
});
