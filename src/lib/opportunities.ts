import { supabase } from './supabaseClient';
import { z } from 'zod';

// Opportunity type and schema
export const OpportunitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'اسم الفرصة مطلوب').max(255, 'اسم الفرصة طويل جداً'),
  client_id: z.string().uuid('معرف العميل مطلوب'),
  stage_id: z.string().uuid('مرحلة الفرصة مطلوبة'),
  amount: z.number().min(0, 'المبلغ يجب أن يكون أكبر من أو يساوي صفر').optional(),
  currency: z.string().default('EGP'),
  status: z.enum(['open', 'won', 'lost']).default('open'),
  probability: z
    .number()
    .min(0, 'الاحتمالية يجب أن تكون أكبر من أو تساوي 0')
    .max(100, 'الاحتمالية يجب أن تكون أقل من أو تساوي 100')
    .default(0),
  close_date: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;

// Stage type
export interface Stage {
  id: string;
  name: string;
  position: number;
  probability: number;
  pipeline_id: string;
  opportunities?: OpportunityWithDetails[];
}

// Pipeline type
export interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

// Extended opportunity with related data for display
export interface OpportunityWithDetails extends Opportunity {
  client?: {
    id: string;
    name: string;
  };
  stage?: {
    id: string;
    name: string;
    probability: number;
  };
  owner?: {
    id: string;
    full_name: string;
  };
}

// Opportunity filters interface
export interface OpportunityFilters {
  q?: string;
  stageId?: string;
  clientId?: string;
  ownerId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number; // Page number (1-based)
  limit?: number; // Items per page
}

// Type alias for list opportunities parameters
export type ListOpportunitiesParams = OpportunityFilters & {
  contactId?: string;
  status?: string;
};

const OPPORTUNITIES_TABLE = 'opportunities';
const PIPELINES_TABLE = 'pipelines';
const STAGES_TABLE = 'stages';

/**
 * Get pipeline with stages and nested opportunities
 */
export async function getPipeline(
  pipelineId: string,
  page: number = 1,
  limit: number = 25,
): Promise<Pipeline | null> {
  const { data: pipeline, error: pipelineError } = await supabase
    .from(PIPELINES_TABLE)
    .select('id, name')
    .eq('id', pipelineId)
    .maybeSingle();

  if (pipelineError) {
    console.error('Error fetching pipeline:', pipelineError);
    return null;
  }

  if (!pipeline) {
    console.warn('Pipeline not found:', pipelineId);
    return null;
  }

  // Fetch stages first
  const { data: stages, error: stagesError } = await supabase
    .from(STAGES_TABLE)
    .select('id, name, position, probability, pipeline_id')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: true });

  if (stagesError) {
    console.error('Error fetching stages:', stagesError);
    return null;
  }

  // Calculate pagination range
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Fetch opportunities for each stage separately with pagination
  const stagesWithOpportunities = await Promise.all(
    (stages || []).map(async (stage) => {
      const { data: opportunities, error: oppError } = await supabase
        .from(OPPORTUNITIES_TABLE)
        .select(
          `
          *,
          client:clients(id, name)
        `,
        )
        .eq('stage_id', stage.id)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (oppError) {
        console.error(`Error fetching opportunities for stage ${stage.id}:`, oppError);
        return { ...stage, opportunities: [] };
      }

      return { ...stage, opportunities: opportunities || [] };
    }),
  );

  return {
    ...pipeline,
    stages: stagesWithOpportunities,
  };
}

/**
 * List opportunities with optional filters
 */
export async function listOpportunities(
  params: ListOpportunitiesParams = {},
): Promise<Opportunity[]> {
  const { page = 1, limit = 25, ...filters } = params;

  let query = supabase.from(OPPORTUNITIES_TABLE).select(`
      *,
      client:clients(id, name),
      stage:stages(id, name, probability)
    `);

  // Apply filters
  if (filters.q) {
    query = query.ilike('name', `%${filters.q}%`);
  }

  if (filters.stageId) {
    query = query.eq('stage_id', filters.stageId);
  }

  if (filters.ownerId) {
    query = query.eq('owner_id', filters.ownerId);
  }

  if (filters.contactId) {
    query = query.eq('contact_id', filters.contactId);
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.minAmount !== undefined) {
    query = query.gte('amount', filters.minAmount);
  }

  if (filters.maxAmount !== undefined) {
    query = query.lte('amount', filters.maxAmount);
  }

  // Apply pagination using range
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    throw new Error('فشل في جلب الفرص التجارية');
  }

  return data || [];
}

/**
 * Get single opportunity by ID
 */
export async function getOpportunity(id: string): Promise<OpportunityWithDetails | null> {
  const { data, error } = await supabase
    .from(OPPORTUNITIES_TABLE)
    .select(
      `
      *,
      client:clients(id, name),
      stage:stages(id, name, probability)
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching opportunity:', error);
    return null;
  }

  return data;
}

/**
 * Create new opportunity
 */
export async function createOpportunity(
  payload: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>,
  currentUserId?: string,
): Promise<Opportunity> {
  // Ensure owner_id defaults to current user if not provided
  const opportunityData = {
    ...payload,
    owner_id: payload.owner_id || currentUserId,
  };

  const { data, error } = await supabase
    .from(OPPORTUNITIES_TABLE)
    .insert([opportunityData])
    .select()
    .single();

  if (error) {
    console.error('Error creating opportunity:', error);
    throw new Error('فشل في إنشاء الفرصة التجارية');
  }

  return data;
}

/**
 * Update opportunity
 */
export async function updateOpportunity(
  id: string,
  payload: Partial<Opportunity>,
): Promise<Opportunity> {
  const { data, error } = await supabase
    .from(OPPORTUNITIES_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    throw new Error('فشل في تحديث الفرصة التجارية');
  }

  return data;
}

/**
 * Delete opportunity
 */
export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from(OPPORTUNITIES_TABLE).delete().eq('id', id);

  if (error) {
    console.error('Error deleting opportunity:', error);
    throw new Error('فشل في حذف الفرصة التجارية');
  }
}

/**
 * Move opportunity to different stage using RPC
 * Returns a Promise and throws on RPC error with message
 */
export async function moveOpportunityStage(oppId: string, stageId: string): Promise<void> {
  const { error } = await supabase.rpc('move_opportunity_stage', {
    _opp_id: oppId,
    _stage_id: stageId,
  });

  if (error) {
    console.error('Error moving opportunity stage:', error);
    const errorMessage = error.message || 'فشل في نقل الفرصة التجارية';
    throw new Error(errorMessage);
  }
}

/**
 * Get opportunity statistics
 */
export async function getOpportunityStats(): Promise<{
  total: number;
  totalValue: number;
  byStage: Record<string, { count: number; value: number }>;
}> {
  const { data, error } = await supabase.from(OPPORTUNITIES_TABLE).select(`
      id,
      amount,
      stage:stages(id, name)
    `);

  if (error) {
    console.error('Error fetching opportunity stats:', error);
    throw new Error('فشل في جلب إحصائيات الفرص التجارية');
  }

  const stats = {
    total: data?.length || 0,
    totalValue: 0,
    byStage: {} as Record<string, { count: number; value: number }>,
  };

  data?.forEach((opp) => {
    const amount = opp.amount || 0;
    stats.totalValue += amount;

    if (opp.stage) {
      const stageName = opp.stage[0]?.name || 'Unknown';
      if (!stats.byStage[stageName]) {
        stats.byStage[stageName] = { count: 0, value: 0 };
      }
      stats.byStage[stageName].count++;
      stats.byStage[stageName].value += amount;
    }
  });

  return stats;
}

/**
 * List all pipelines
 */
export async function listPipelines(): Promise<Pipeline[]> {
  const { data, error } = await supabase
    .from(PIPELINES_TABLE)
    .select(
      `
      id,
      name,
      stages:stages(
        id,
        name,
        position,
        probability,
        pipeline_id
      )
    `,
    )
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching pipelines:', error);
    throw new Error('فشل في جلب خطوط الأنابيب');
  }

  return (
    data?.map((pipeline) => ({
      ...pipeline,
      stages: (pipeline.stages || []).sort((a, b) => a.position - b.position),
    })) || []
  );
}
