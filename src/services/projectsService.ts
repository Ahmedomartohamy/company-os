import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/project';
const TABLE = 'projects';

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Project[];
}
export async function createProject(payload: Partial<Project>) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  return data as Project;
}
export async function updateProject(id: string, payload: Partial<Project>) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as Project;
}
export async function deleteProject(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}
