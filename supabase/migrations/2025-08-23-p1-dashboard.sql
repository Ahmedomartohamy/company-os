BEGIN;
-- إجمالي قيمة البايبلاين المفتوح
create or replace view public.v_kpi_pipeline_value as
select coalesce(sum(amount),0) as pipeline_value
from public.opportunities
where status='open';

-- الإيراد المتوقع (amount * probability)
create or replace view public.v_kpi_expected_revenue as
select coalesce(sum(amount * (greatest(least(probability,100),0)::numeric / 100.0)),0) as expected_revenue
from public.opportunities
where status='open';

-- ليدز حسب المصدر آخر 30 يوم
create or replace view public.v_kpi_leads_by_source_30d as
select source, count(*) as cnt
from public.leads
where created_at >= now() - interval '30 days'
group by source
order by cnt desc;

-- مهام مستحقة اليوم وغدًا
create or replace view public.v_kpi_tasks_due as
select
  sum(case when due_date = current_date then 1 else 0 end) as due_today,
  sum(case when due_date = current_date + 1 then 1 else 0 end) as due_tomorrow
from public.tasks;
COMMIT;