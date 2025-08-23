import { z } from 'zod';
export const ClientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'اسم العميل قصير'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Client = z.infer<typeof ClientSchema>;
