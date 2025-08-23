import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = 'https://qmaybonebepuhgpcvvpw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYXlib25lYmVwdWhncGN2dnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NjUzMTUsImV4cCI6MjA3MTM0MTMxNX0.tc1aNzNZ28O2TydmTrL2CqvJS2gltFZeUDUg842SI00';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testViews() {
  try {
    console.log('Testing KPI views...');
    
    // Test v_kpi_pipeline_value
    console.log('\nTesting v_kpi_pipeline_value...');
    const { data: pipelineData, error: pipelineError } = await supabase
      .from('v_kpi_pipeline_value')
      .select('*')
      .single();
    
    if (pipelineError) {
      console.error('❌ v_kpi_pipeline_value not found:', pipelineError.message);
    } else {
      console.log('✓ v_kpi_pipeline_value exists:', pipelineData);
    }
    
    // Test v_kpi_expected_revenue
    console.log('\nTesting v_kpi_expected_revenue...');
    const { data: revenueData, error: revenueError } = await supabase
      .from('v_kpi_expected_revenue')
      .select('*')
      .single();
    
    if (revenueError) {
      console.error('❌ v_kpi_expected_revenue not found:', revenueError.message);
    } else {
      console.log('✓ v_kpi_expected_revenue exists:', revenueData);
    }
    
    // Test v_kpi_tasks_due
    console.log('\nTesting v_kpi_tasks_due...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('v_kpi_tasks_due')
      .select('*')
      .single();
    
    if (tasksError) {
      console.error('❌ v_kpi_tasks_due not found:', tasksError.message);
    } else {
      console.log('✓ v_kpi_tasks_due exists:', tasksData);
    }
    
    // Test v_kpi_leads_by_source_30d
    console.log('\nTesting v_kpi_leads_by_source_30d...');
    const { data: leadsData, error: leadsError } = await supabase
      .from('v_kpi_leads_by_source_30d')
      .select('*');
    
    if (leadsError) {
      console.error('❌ v_kpi_leads_by_source_30d not found:', leadsError.message);
    } else {
      console.log('✓ v_kpi_leads_by_source_30d exists:', leadsData);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testViews();