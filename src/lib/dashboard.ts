import { supabase } from './supabaseClient';

// Types for KPI data
export interface PipelineValue {
  pipeline_value: number;
}

export interface ExpectedRevenue {
  expected_revenue: number;
}

export interface LeadsBySource {
  source: string;
  cnt: number;
}

export interface TasksDue {
  due_today: number;
  due_tomorrow: number;
}

/**
 * Get total pipeline value from open opportunities
 */
export async function getPipelineValue(): Promise<PipelineValue> {
  const { data, error } = await supabase
    .from('v_kpi_pipeline_value')
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to fetch pipeline value: ${error.message}`);
  }

  return data;
}

/**
 * Get expected revenue based on opportunity amounts and probabilities
 */
export async function getExpectedRevenue(): Promise<ExpectedRevenue> {
  const { data, error } = await supabase
    .from('v_kpi_expected_revenue')
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to fetch expected revenue: ${error.message}`);
  }

  return data;
}

/**
 * Get leads by source for the last 30 days
 */
export async function getLeadsBySource30d(): Promise<LeadsBySource[]> {
  const { data, error } = await supabase
    .from('v_kpi_leads_by_source_30d')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch leads by source: ${error.message}`);
  }

  return data || [];
}

/**
 * Get tasks due today and tomorrow
 */
export async function getTasksDue(): Promise<TasksDue> {
  const { data, error } = await supabase
    .from('v_kpi_tasks_due')
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to fetch tasks due: ${error.message}`);
  }

  return data;
}