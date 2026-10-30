import { z } from 'zod';
export const vehicleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  brand: z.string().min(2).max(50),
  category: z.enum(['Bike', 'Scooter', 'Car']),
  registration: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((s) => s.toUpperCase().replace(/\s/g, '')),
  rate: z.number().int().min(100).max(10000000),
  deposit: z.number().int().min(0).max(100000000),
  fuel: z.enum(['Petrol', 'Diesel', 'Electric', 'Hybrid']),
  transmission: z.enum(['Manual', 'Automatic']),
  seats: z.number().int().min(1).max(20),
  engine: z.string().max(30),
  image: z
    .string()
    .max(500)
    .refine(
      (s) => s.startsWith('/images/') || /^https:\/\//.test(s),
      'Use a local image path or HTTPS URL.',
    ),
  description: z.string().max(3000),
  odometer: z.number().int().min(0).max(9999999),
  status: z.enum(['Available', 'Maintenance', 'Inactive']),
});
export const addVehicleInput = vehicleSchema;
export const editVehicleInput = vehicleSchema;
