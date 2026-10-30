import { z } from 'zod';
export const scheduleMaintenanceInput = z.object({
  vehicleId: z.string().uuid(),
  startsAt: z.string(),
  endsAt: z.string(),
  reason: z.string().min(3).max(500),
});
