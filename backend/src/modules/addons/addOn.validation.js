import { z } from 'zod';

const quantity = z.number().int().min(0).max(10000);
export const addOnInput = z
  .object({
    code: z.string().regex(/^[a-z][a-z0-9-]{1,49}$/),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).default(''),
    image: z
      .string()
      .max(500)
      .refine(
        (value) => value === '' || value.startsWith('/images/') || /^https:\/\//.test(value),
        'Use a local image or HTTPS URL.',
      )
      .default(''),
    rate: z.number().int().min(0).max(100000000),
    billing: z.enum(['booking', 'hour']),
    stock: quantity,
    unserviceable: quantity,
    maxQuantity: z.number().int().min(1).max(10000),
    enabled: z.boolean(),
    categories: z
      .array(z.object({ category: z.enum(['Bike', 'Scooter', 'Car']), includedQuantity: quantity }))
      .min(1)
      .max(3),
  })
  .superRefine((value, context) => {
    if (value.unserviceable > value.stock)
      context.addIssue({
        code: 'custom',
        path: ['unserviceable'],
        message: 'Unserviceable stock cannot exceed total stock.',
      });
    if (new Set(value.categories.map((rule) => rule.category)).size !== value.categories.length)
      context.addIssue({
        code: 'custom',
        path: ['categories'],
        message: 'Choose each category once.',
      });
    if (value.categories.some((rule) => rule.includedQuantity > value.maxQuantity))
      context.addIssue({
        code: 'custom',
        path: ['categories'],
        message: 'Included quantity cannot exceed the per-checkout maximum.',
      });
  });
export const updateAddOnInput = addOnInput.safeExtend({ version: z.number().int().min(1) });
export const archiveAddOnInput = z.object({ version: z.number().int().min(1) });
