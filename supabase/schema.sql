-- Run in the SQL editor of your own Supabase project. No player data here.
create table if not exists public.coach_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 0,
 payload jsonb not null check (payload->>'version' = '3'),
 updated_at timestamptz not null default now()
);
alter table public.coach_workspaces enable row level security;
alter table public.coach_workspaces force row level security;
revoke all on public.coach_workspaces from anon;
grant select,insert,update on public.coach_workspaces to authenticated;
drop policy if exists own_workspace on public.coach_workspaces;
create policy own_workspace on public.coach_workspaces to authenticated
 using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.save_coach_workspace(expected_revision bigint, new_payload jsonb)
returns setof public.coach_workspaces
language plpgsql security invoker set search_path = '' as $$
declare current_revision bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if new_payload->>'version' is distinct from '3' then raise exception 'Unsupported data version'; end if;
 insert into public.coach_workspaces(user_id,revision,payload)
 values(auth.uid(),0,new_payload) on conflict(user_id) do nothing;
 select revision into current_revision from public.coach_workspaces where user_id=auth.uid() for update;
 if current_revision is distinct from expected_revision then
  raise exception 'Workspace changed on another device' using errcode='40001';
 end if;
 return query update public.coach_workspaces set revision=current_revision+1,payload=new_payload,updated_at=now()
 where user_id=auth.uid() returning *;
end;
$$;
revoke all on function public.save_coach_workspace(bigint,jsonb) from public,anon;
grant execute on function public.save_coach_workspace(bigint,jsonb) to authenticated;
