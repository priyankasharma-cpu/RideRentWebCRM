import { z } from 'zod';
export const addStaffInput = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(12).max(150),
  role: z.enum(['admin', 'staff']),
});
export const changeStaffAccessInput = z.object({
  active: z.boolean(),
});
export const changePasswordInput = z.object({
  current: z.string().max(200),
  password: z.string().min(12).max(150),
});
