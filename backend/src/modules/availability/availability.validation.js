import { z } from 'zod';
export const time = z.string().datetime({
  offset: true,
});
export const windowSchema = z.object({
  startsAt: time,
  endsAt: time,
});
