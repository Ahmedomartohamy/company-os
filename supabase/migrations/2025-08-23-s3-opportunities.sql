BEGIN;
create extension if not exists "pg_trgm";

create table if not exists public.pipelines(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.stages(
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  position int not null,
  probability int check(probability between 0 and 100) default 0,
  created_at timestamptz default now(),
  unique(pipeline_id, position)
);
create index if not exists stages_pipeline_idx on public.stages(pipeline_id);

create table if not exists public.opportunities(
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  name text not null,
  amount numeric(12,2) default 0,
  currency text default 'USD',
  pipeline_id uuid references public.pipelines(id) on delete set null,
  stage_id uuid references public.stages(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  close_date date,
  probability int check(probability between 0 and 100) default 0,
  status text check(status in ('open','won','lost')) default 'open',
  created_at timestamptz default now()
);
create index if not exists opp_stage_idx  on public.opportunities(stage_id);
create index if not exists opp_pipe_idx   on public.opportunities(pipeline_id);
create index if not exists opp_status_idx on public.opportunities(status);
create index if not exists opp_owner_idx  on public.opportunities(owner_id);
create index if not exists opp_close_idx  on public.opportunities(close_date);
create index if not exists opp_name_trgm  on public.opportunities using gin (name gin_trgm_ops);
create index if not exists opp_amount_idx on public.opportunities(amount);

alter table public.pipelines     enable row level security;
alter table public.stages        enable row level security;
alter table public.opportunities enable row level security;

drop policy if exists pipelines_read_all_auth on public.pipelines;
create policy pipelines_read_all_auth on public.pipelines
  for select to authenticated using (true);
drop policy if exists pipelines_write_mgr_admin on public.pipelines;
create policy pipelines_write_mgr_admin on public.pipelines
  for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','sales_manager')))
  with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','sales_manager')));

drop policy if exists stages_read_all_auth on public.stages;
create policy stages_read_all_auth on public.stages
  for select to authenticated using (true);
drop policy if exists stages_write_mgr_admin on public.stages;
create policy stages_write_mgr_admin on public.stages
  for all to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','sales_manager')))
  with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','sales_manager')));

drop policy if exists opp_read_all_auth on public.opportunities;
create policy opp_read_all_auth on public.opportunities
  for select to authenticated using (true);
drop policy if exists opp_insert_roles on public.opportunities;
create policy opp_insert_roles on public.opportunities
  for insert to authenticated with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','sales_manager','sales_rep')));
drop policy if exists opp_update_owner_or_mgr on public.opportunities;
create policy opp_update_owner_or_mgr on public.opportunities
  for update to authenticated using (owner_id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in('admin','sales_manager')));
drop policy if exists opp_delete_admin_only on public.opportunities;
create policy opp_delete_admin_only on public.opportunities
  for delete to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create or replace function public.log_opp_changes() returns trigger language plpgsql as $$
begin
  if tg_op='INSERT' then
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values('opportunities',new.id,'insert',auth.uid(),to_jsonb(new));
    return new;
  elsif tg_op='UPDATE' then
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values('opportunities',new.id,'update',auth.uid(),jsonb_strip_nulls(to_jsonb(new)-to_jsonb(old)));
    return new;
  else
    insert into public.audit_logs(table_name,row_id,action,actor_id,diff)
    values('opportunities',old.id,'delete',auth.uid(),to_jsonb(old));
    return old;
  end if;
end;$$;

drop trigger if exists trg_opp_audit on public.opportunities;
create trigger trg_opp_audit after insert or update or delete on public.opportunities
for each row execute function public.log_opp_changes();
COMMIT;

BEGIN;
create or replace function public.move_opportunity_stage(
  _opp_id uuid,
  _stage_id uuid
) returns void
language plpgsql as $$
declare v_prob int; begin
  select probability into v_prob from public.stages where id=_stage_id;
  update public.opportunities
  set stage_id=_stage_id, probability=coalesce(v_prob,probability)
  where id=_opp_id;
end;$$;
COMMIT;