BEGIN;
-- Enable RLS (idempotent)
alter table if exists public.projects enable row level security;
alter table if exists public.tasks    enable row level security;

-- Policies: SELECT for all authenticated
drop policy if exists projects_read_all on public.projects;
create policy projects_read_all on public.projects for select to authenticated using (true);
drop policy if exists tasks_read_all on public.tasks;
create policy tasks_read_all on public.tasks for select to authenticated using (true);

-- INSERT: admin | sales_manager | sales_rep
drop policy if exists projects_insert_roles on public.projects;
create policy projects_insert_roles on public.projects for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager','sales_rep')));
drop policy if exists tasks_insert_roles on public.tasks;
create policy tasks_insert_roles on public.tasks for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager','sales_rep')));

-- UPDATE: owner OR admin/sales_manager (fallback to managers-only if no owner_id)
do $$
begin
  if public._has_owner_id('public.projects') then
    execute $q$ drop policy if exists projects_update_owner_or_mgr on public.projects; $q$;
    execute $q$ drop policy if exists projects_update_mgr_only on public.projects; $q$;
    execute $q$ create policy projects_update_owner_or_mgr on public.projects
      for update to authenticated using (
        owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  else
    execute $q$ drop policy if exists projects_update_owner_or_mgr on public.projects; $q$;
    execute $q$ drop policy if exists projects_update_mgr_only on public.projects; $q$;
    execute $q$ create policy projects_update_mgr_only on public.projects
      for update to authenticated using (
        exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  end if;

  if public._has_owner_id('public.tasks') then
    execute $q$ drop policy if exists tasks_update_owner_or_mgr on public.tasks; $q$;
    execute $q$ drop policy if exists tasks_update_mgr_only on public.tasks; $q$;
    execute $q$ create policy tasks_update_owner_or_mgr on public.tasks
      for update to authenticated using (
        owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  else
    execute $q$ drop policy if exists tasks_update_owner_or_mgr on public.tasks; $q$;
    execute $q$ drop policy if exists tasks_update_mgr_only on public.tasks; $q$;
    execute $q$ create policy tasks_update_mgr_only on public.tasks
      for update to authenticated using (
        exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  end if;
end $$;

-- DELETE: admin only
drop policy if exists projects_delete_admin_only on public.projects;
create policy projects_delete_admin_only on public.projects for delete to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists tasks_delete_admin_only on public.tasks;
create policy tasks_delete_admin_only on public.tasks for delete to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Audit triggers (idempotent)
drop trigger if exists trg_projects_audit on public.projects;
create trigger trg_projects_audit after insert or update or delete on public.projects for each row execute function public._audit_generic();

drop trigger if exists trg_tasks_audit on public.tasks;
create trigger trg_tasks_audit after insert or update or delete on public.tasks for each row execute function public._audit_generic();
COMMIT;