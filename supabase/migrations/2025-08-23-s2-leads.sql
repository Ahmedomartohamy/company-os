BEGIN;
create extension if not exists "pg_trgm";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name  text,
  company    text,
  email      text,
  phone      text,
  source text check (source in ('website','referral','ads','social','cold_call','other')) default 'other',
  status text check (status in ('new','contacted','qualified','unqualified')) default 'new',
  score int default 0,
  owner_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create index if not exists leads_status_idx  on public.leads(status);
create index if not exists leads_source_idx  on public.leads(source);
create index if not exists leads_owner_idx   on public.leads(owner_id);
create index if not exists leads_company_idx on public.leads(lower(company));
create index if not exists leads_name_trgm   on public.leads using gin ((first_name || ' ' || coalesce(last_name,'')) gin_trgm_ops);
create index if not exists leads_email_idx   on public.leads(email);

alter table public.leads enable row level security;

drop policy if exists leads_read_all_auth on public.leads;
create policy leads_read_all_auth
  on public.leads for select to authenticated using (true);

drop policy if exists leads_insert_role on public.leads;
create policy leads_insert_role
  on public.leads for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager','sales_rep')));

drop policy if exists leads_update_owner_or_mgr on public.leads;
create policy leads_update_owner_or_mgr
  on public.leads for update to authenticated
  using (owner_id = auth.uid() or exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','sales_manager')));

drop policy if exists leads_delete_admin_only on public.leads;
create policy leads_delete_admin_only
  on public.leads for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- audit into public.audit_logs (created in Sprint 1)
create or replace function public.log_leads_changes()
returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values ('leads', new.id, 'insert', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op='UPDATE' then
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values ('leads', new.id, 'update', auth.uid(), jsonb_strip_nulls(to_jsonb(new)-to_jsonb(old)));
    return new;
  else
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values ('leads', old.id, 'delete', auth.uid(), to_jsonb(old));
    return old;
  end if;
end;$$;

drop trigger if exists trg_leads_audit on public.leads;
create trigger trg_leads_audit
after insert or update or delete on public.leads
for each row execute function public.log_leads_changes();
COMMIT;

BEGIN;
create or replace function public.convert_lead(
  _lead_id uuid,
  _client_id uuid default null,
  _create_client boolean default true,
  _create_contact boolean default true
) returns jsonb
language plpgsql as $$
declare
  v_lead public.leads%rowtype;
  v_client_id uuid;
  v_contact_id uuid;
begin
  select * into v_lead from public.leads where id=_lead_id;
  if not found then
    raise exception 'Lead not found';
  end if;

  if _client_id is not null then
    v_client_id := _client_id;
  elsif coalesce(v_lead.company,'') <> '' then
    select c.id into v_client_id from public.clients c where lower(c.name)=lower(v_lead.company) limit 1;
    if v_client_id is null and _create_client then
      insert into public.clients (id,name,phone,owner_id,created_at)
      values (gen_random_uuid(), v_lead.company, v_lead.phone, v_lead.owner_id, now())
      returning id into v_client_id;
    end if;
  end if;

  if _create_contact and v_client_id is not null then
    insert into public.contacts (id,client_id,first_name,last_name,email,phone,title,owner_id,created_at)
    values (gen_random_uuid(), v_client_id, v_lead.first_name, v_lead.last_name, v_lead.email, v_lead.phone, null, v_lead.owner_id, now())
    returning id into v_contact_id;
  end if;

  update public.leads set status='qualified' where id=_lead_id;

  return jsonb_build_object('lead_id',_lead_id,'client_id',v_client_id,'contact_id',v_contact_id);
end;$$;
COMMIT;