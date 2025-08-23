import { supabase } from './supabaseClient';
import { z } from 'zod';

// Lead type and schema
export const LeadSchema = z
  .object({
    id: z.string().uuid().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company: z.string().optional(),
    email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
    phone: z.string().optional(),
    source: z.enum(['website', 'referral', 'ads', 'social', 'cold_call', 'other']).default('other'),
    status: z.enum(['new', 'contacted', 'qualified', 'unqualified']).default('new'),
    score: z.number().int().min(0).max(100).default(0),
    owner_id: z.string().uuid().optional(),
    notes: z.string().optional(),
    created_at: z.string().optional(),
  })
  .refine((data) => data.first_name || data.company, {
    message: 'يجب إدخال الاسم الأول أو اسم الشركة على الأقل',
    path: ['first_name'],
  });

export type Lead = z.infer<typeof LeadSchema>;

// Extended lead with owner info for display
export interface LeadWithOwner extends Lead {
  owner?: {
    id: string;
    full_name: string;
  };
}

// Lead filters interface
export interface LeadFilters {
  q?: string;
  status?: string;
  source?: string;
  ownerId?: string;
  page?: number; // Page number (1-based)
  limit?: number; // Items per page
}

// Convert lead result interface
export interface ConvertLeadResult {
  lead_id: string;
  client_id: string | null;
  contact_id: string | null;
}

const TABLE = 'leads';

/**
 * List leads with optional filters
 */
export async function listLeads(filters: LeadFilters = {}): Promise<LeadWithOwner[]> {
  const { page = 1, limit = 25, ...searchFilters } = filters;

  let query = supabase
    .from(TABLE)
    .select(
      `
      *,
      owner:profiles!leads_owner_id_fkey(
        id,
        full_name
      )
    `,
    )
    .order('created_at', { ascending: false });

  // Apply text search filter
  if (searchFilters.q) {
    query = query.or(
      `first_name.ilike.%${searchFilters.q}%,last_name.ilike.%${searchFilters.q}%,company.ilike.%${searchFilters.q}%,email.ilike.%${searchFilters.q}%`,
    );
  }

  // Apply status filter
  if (searchFilters.status) {
    query = query.eq('status', searchFilters.status);
  }

  // Apply source filter
  if (searchFilters.source) {
    query = query.eq('source', searchFilters.source);
  }

  // Apply owner filter
  if (searchFilters.ownerId) {
    query = query.eq('owner_id', searchFilters.ownerId);
  }

  // Apply pagination using range
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) throw error;
  return data as LeadWithOwner[];
}

/**
 * Get a single lead by ID
 */
export async function getLead(id: string): Promise<LeadWithOwner | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      `
      *,
      owner:profiles!leads_owner_id_fkey(
        id,
        full_name
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as LeadWithOwner;
}

/**
 * Create a new lead
 */
export async function createLead(payload: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> {
  // Get current user ID for owner assignment
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const leadData = {
    ...payload,
    owner_id: payload.owner_id || user?.id,
  };

  const { data, error } = await supabase.from(TABLE).insert(leadData).select().single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Update an existing lead
 */
export async function updateLead(id: string, payload: Partial<Lead>): Promise<Lead> {
  const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select().single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);

  if (error) throw error;
}

/**
 * Convert lead to client and contact using RPC function
 */
export async function convertLead(params: {
  leadId: string;
  clientId?: string;
  createClient?: boolean;
  createContact?: boolean;
}): Promise<ConvertLeadResult> {
  const { leadId, clientId, createClient = true, createContact = true } = params;

  const { data, error } = await supabase.rpc('convert_lead', {
    _lead_id: leadId,
    _client_id: clientId || null,
    _create_client: createClient,
    _create_contact: createContact,
  });

  if (error) throw error;
  return data as ConvertLeadResult;
}

/**
 * Get lead statistics
 */
export async function getLeadStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
}> {
  // Get total count
  const { count: total, error: countError } = await supabase
    .from(TABLE)
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;

  // Get counts by status
  const { data: statusData, error: statusError } = await supabase
    .from(TABLE)
    .select('status')
    .not('status', 'is', null);

  if (statusError) throw statusError;

  // Get counts by source
  const { data: sourceData, error: sourceError } = await supabase
    .from(TABLE)
    .select('source')
    .not('source', 'is', null);

  if (sourceError) throw sourceError;

  // Calculate status counts
  const byStatus = statusData.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Calculate source counts
  const bySource = sourceData.reduce(
    (acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    total: total || 0,
    byStatus,
    bySource,
  };
}
