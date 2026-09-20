import { z } from 'zod';

export const stockEntrySchema = z.object({
  productId: z.string().min(1, 'انتخاب محصول الزامی است'),
  quantity: z.number().int().min(1, 'مقدار باید بزرگتر از صفر باشد'),
  transactionDate: z.string().min(1, 'تاریخ الزامی است'),
  reference: z.string(),
  description: z.string(),
});

export const stockExitSchema = z.object({
  productId: z.string().min(1, 'انتخاب محصول الزامی است'),
  quantity: z.number().int().min(1, 'مقدار باید بزرگتر از صفر باشد'),
  transactionDate: z.string().min(1, 'تاریخ الزامی است'),
  reference: z.string(),
  recipient: z.string().min(1, 'گیرنده الزامی است'),
  description: z.string(),
});

export type StockEntryInput = z.infer<typeof stockEntrySchema>;
export type StockExitInput = z.infer<typeof stockExitSchema>;
