import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'نام محصول الزامی است'),
  sku: z.string().min(1, 'کد محصول الزامی است'),
  categoryId: z.string().nullable(),
  unit: z.string().min(1, 'واحد شمارش الزامی است'),
  minimumStock: z.number().int().min(0, 'حداقل موجودی نمی‌تواند منفی باشد'),
  description: z.string(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'نام محصول الزامی است'),
  sku: z.string().min(1, 'کد محصول الزامی است'),
  categoryId: z.string().nullable(),
  unit: z.string().min(1, 'واحد شمارش الزامی است'),
  minimumStock: z.number().int().min(0, 'حداقل موجودی نمی‌تواند منفی باشد'),
  description: z.string(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
