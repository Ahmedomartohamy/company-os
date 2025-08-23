import { supabase } from '@/lib/supabaseClient';
import type { Task } from '@/types/task';
const TABLE = 'tasks';

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Task[];
}
export async function createTask(payload: Partial<Task>) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  return data as Task;
}
export async function updateTask(id: string, payload: Partial<Task>) {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data as Task;
}
export async function deleteTask(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  if (error) throw error;
  return true;
}
