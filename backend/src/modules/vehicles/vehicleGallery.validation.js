import { z } from 'zod';
const imageSource = z
  .string()
  .max(500)
  .refine((value) => {
    if (
      value.startsWith('/images/') &&
      !value.includes('\\') &&
      !value.includes('..') &&
      !/[?#]/.test(value)
    )
      return true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'Use a local /images/ path or HTTPS URL.');
export const vehicleGalleryInput = z
  .object({
    images: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(50),
          label: z.string().trim().min(1).max(100),
          url: imageSource,
        }),
      )
      .max(5),
  })
  .superRefine(({ images }, context) => {
    if (
      new Set(images.map((image) => image.id)).size !== images.length ||
      new Set(images.map((image) => image.url)).size !== images.length
    )
      context.addIssue({
        code: 'custom',
        message: 'Image IDs and URLs must be unique.',
        path: ['images'],
      });
  });
