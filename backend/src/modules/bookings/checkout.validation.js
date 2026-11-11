import { z } from 'zod';
import { bookingSchema } from './booking.validation.js';
import { windowSchema } from '../availability/availability.validation.js';

export const checkoutQuoteInput = windowSchema.extend({
  items: z
    .array(z.object({ vehicleId: z.string().uuid(), quantity: z.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
  helmets: z.number().int().min(0).max(10000).default(0),
  addOns: z
    .array(z.object({ addOnId: z.string().uuid(), quantity: z.number().int().min(1).max(10000) }))
    .max(50)
    .default([]),
});
export const checkoutReservationInput = bookingSchema
  .omit({ vehicleId: true, source: true, verified: true, notes: true })
  .extend({
    ...checkoutQuoteInput.shape,
    submissionKey: z.string().uuid(),
    reservationToken: z.string().regex(/^[a-f0-9]{64}$/),
    expectedTotal: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    quoteSignature: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
  });
