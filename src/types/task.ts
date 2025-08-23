import { z } from 'zod';
export const TaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2, 'عنوان المهمة قصير'),
  description: z.string().optional(),
  project_id: z.string().uuid().optional(),
  assignee: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;
