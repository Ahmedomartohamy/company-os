import { z } from "zod";
export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "اسم المشروع قصير"),
  description: z.string().optional(),
  client_id: z.string().uuid().optional(),
  status: z.enum(["active","completed","on_hold"]).default("active"),
  budget: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Project = z.infer<typeof ProjectSchema>;
