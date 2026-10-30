import { z } from 'zod';
export const verifyCustomerInput = z.object({
  verified: z.boolean(),
});
