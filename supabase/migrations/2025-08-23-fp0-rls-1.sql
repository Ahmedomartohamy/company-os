BEGIN;
-- Enable RLS (idempotent)
alter table if exists public.clients  enable row level security;
alter table if exists public.contacts enable row level security;

-- Helper: check if owner_id exists on a table
create or replace function public._has_owner_id(tbl regclass)
returns boolean language sql stable as $$
  select exists (
    select 1 from information_schema.columns
    where table_schema = split_part($1::text,'.',1)
      and table_name   = split_part($1::text,'.',2)
      and column_name  = 'owner_id'
  );
$$;

-- Policies: SELECT for all authenticated
drop policy if exists clients_read_all on public.clients;
create policy clients_read_all on public.clients for select to authenticated using (true);
drop policy if exists contacts_read_all on public.contacts;
create policy contacts_read_all on public.contacts for select to authenticated using (true);

-- INSERT: admin | sales_manager | sales_rep
drop policy if exists clients_insert_roles on public.clients;
create policy clients_insert_roles on public.clients for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager','sales_rep')));
drop policy if exists contacts_insert_roles on public.contacts;
create policy contacts_insert_roles on public.contacts for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager','sales_rep')));

-- UPDATE: owner OR admin/sales_manager (fallback to managers-only if no owner_id)
do $$
begin
  if public._has_owner_id('public.clients') then
    execute $q$ drop policy if exists clients_update_owner_or_mgr on public.clients; $q$;
    execute $q$ drop policy if exists clients_update_mgr_only on public.clients; $q$;
    execute $q$ create policy clients_update_owner_or_mgr on public.clients
      for update to authenticated using (
        owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  else
    execute $q$ drop policy if exists clients_update_owner_or_mgr on public.clients; $q$;
    execute $q$ drop policy if exists clients_update_mgr_only on public.clients; $q$;
    execute $q$ create policy clients_update_mgr_only on public.clients
      for update to authenticated using (
        exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  end if;

  if public._has_owner_id('public.contacts') then
    execute $q$ drop policy if exists contacts_update_owner_or_mgr on public.contacts; $q$;
    execute $q$ drop policy if exists contacts_update_mgr_only on public.contacts; $q$;
    execute $q$ create policy contacts_update_owner_or_mgr on public.contacts
      for update to authenticated using (
        owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  else
    execute $q$ drop policy if exists contacts_update_owner_or_mgr on public.contacts; $q$;
    execute $q$ drop policy if exists contacts_update_mgr_only on public.contacts; $q$;
    execute $q$ create policy contacts_update_mgr_only on public.contacts
      for update to authenticated using (
        exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager'))
      ); $q$;
  end if;
end $$;

-- DELETE: admin only
drop policy if exists clients_delete_admin_only on public.clients;
create policy clients_delete_admin_only on public.clients for delete to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists contacts_delete_admin_only on public.contacts;
create policy contacts_delete_admin_only on public.contacts for delete to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Audit triggers (idempotent)
create or replace function public._audit_generic()
returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values (tg_table_name::text, (case when tg_op='INSERT' then new.id else old.id end), 'insert', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op='UPDATE' then
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values (tg_table_name::text, new.id, 'update', auth.uid(), jsonb_strip_nulls(to_jsonb(new)-to_jsonb(old)));
    return new;
  else
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values (tg_table_name::text, old.id, 'delete', auth.uid(), to_jsonb(old));
    return old;
  end if;
end;$$;

drop trigger if exists trg_clients_audit  on public.clients;
create trigger trg_clients_audit  after insert or update or delete on public.clients  for each row execute function public._audit_generic();

drop trigger if exists trg_contacts_audit on public.contacts;
create trigger trg_contacts_audit after insert or update or delete on public.contacts for each row execute function public._audit_generic();
COMMIT;