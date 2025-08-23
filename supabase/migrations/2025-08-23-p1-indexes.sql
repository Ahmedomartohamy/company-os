BEGIN;
-- Opportunities: FK + شائعة الاستخدام
create index if not exists opp_client_idx    on public.opportunities(client_id);
create index if not exists opp_contact_idx   on public.opportunities(contact_id);
create index if not exists opp_pipe_stage    on public.opportunities(pipeline_id, stage_id);
create index if not exists opp_owner_status  on public.opportunities(owner_id, status);
create index if not exists opp_created_idx   on public.opportunities(created_at desc);
create index if not exists opp_open_partial  on public.opportunities(stage_id) where status='open';

-- Leads: فرز وحدات التحكم بالمالك/الحالة/التاريخ
create index if not exists leads_owner_status on public.leads(owner_id, status);
create index if not exists leads_created_idx  on public.leads(created_at desc);

-- Contacts: FK
create index if not exists contacts_client_idx on public.contacts(client_id);

-- Projects/Tasks: FK + المواعيد/الحالة
create index if not exists projects_client_idx on public.projects(client_id);
create index if not exists tasks_project_idx   on public.tasks(project_id);
create index if not exists tasks_status_idx    on public.tasks(status);
create index if not exists tasks_due_idx       on public.tasks(due_date);
COMMIT;