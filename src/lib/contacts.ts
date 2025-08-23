import { supabase } from './supabaseClient';
import { z } from 'zod';

// Contact type and schema
export const ContactSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, 'الاسم الأول مطلوب'),
  last_name: z.string().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  client_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export type Contact = z.infer<typeof ContactSchema>;

// Extended contact with client info for display
export interface ContactWithClient extends Contact {
  client?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    full_name: string;
  };
}

interface ListContactsParams {
  q?: string; // Search query for name/email
  clientId?: string; // Filter by client
  ownerId?: string; // Filter by owner
  page?: number; // Page number (1-based)
  limit?: number; // Items per page
}

const TABLE = 'contacts';

/**
 * List contacts with optional filters and search
 */
export async function listContacts(params: ListContactsParams = {}): Promise<ContactWithClient[]> {
  const { page = 1, limit = 25, ...filters } = params;
  
  let query = supabase
    .from(TABLE)
    .select(`
      *,
      client:clients(id, name),
      owner:profiles!contacts_owner_id_fkey(id, full_name)
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }
  
  if (filters.ownerId) {
    query = query.eq('owner_id', filters.ownerId);
  }

  // Apply search - basic text search on name and email
  if (filters.q) {
    const searchTerm = `%${filters.q}%`;
    query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
  }

  // Apply pagination using range
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query;
  if (error) throw error;
  return data as ContactWithClient[];
}

/**
 * Get a single contact by ID
 */
export async function getContact(id: string): Promise<ContactWithClient> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(`
      *,
      client:clients(id, name),
      owner:profiles!contacts_owner_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as ContactWithClient;
}

/**
 * Create a new contact
 */
export async function createContact(payload: Partial<Contact>): Promise<Contact> {
  // Get current user ID if owner_id not provided
  if (!payload.owner_id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      payload.owner_id = user.id;
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();
  
  if (error) throw error;
  return data as Contact;
}

/**
 * Update an existing contact
 */
export async function updateContact(id: string, payload: Partial<Contact>): Promise<Contact> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Contact;
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

/**
 * Get contacts count for a client (useful for client details)
 */
export async function getContactsCountByClient(clientId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);
  
  if (error) throw error;
  return count || 0;
}