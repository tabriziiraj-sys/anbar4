import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
  description: z.string().default(''),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'نام دسته‌بندی الزامی است'),
  description: z.string().default(''),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
