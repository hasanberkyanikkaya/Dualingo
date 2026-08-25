create sequence if not exists public.sync_server_version_seq;

create table if not exists public.sync_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_key text not null,
  payload jsonb not null default '{}'::jsonb,
  client_updated_at bigint not null,
  deleted_at bigint,
  server_version bigint not null default nextval('public.sync_server_version_seq'),
  updated_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_key)
) partition by list (entity_type);

create table if not exists public.activity_days partition of public.sync_records
  for values in ('activity_day');
create table if not exists public.badge_unlocks partition of public.sync_records
  for values in ('badge_unlock');
create table if not exists public.learning_attempts partition of public.sync_records
  for values in ('learning_attempt');
create table if not exists public.progress_states partition of public.sync_records
  for values in ('progress_state');
create table if not exists public.prayer_logs partition of public.sync_records
  for values in ('prayer_log');
create table if not exists public.quran_goals partition of public.sync_records
  for values in ('quran_goal');
create table if not exists public.quran_read_events partition of public.sync_records
  for values in ('quran_read_event');
create table if not exists public.quran_reading_positions partition of public.sync_records
  for values in ('quran_reading_position');

create index if not exists sync_records_user_version_idx
  on public.sync_records (user_id, server_version);

create table if not exists public.sync_mutations (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  accepted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, mutation_id)
);

alter table public.sync_records enable row level security;
alter table public.sync_mutations enable row level security;

create policy sync_records_owner_only on public.sync_records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy sync_mutations_owner_only on public.sync_mutations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.sync_records from anon, authenticated;
revoke all on public.sync_mutations from anon, authenticated;
revoke all on public.activity_days from anon, authenticated;
revoke all on public.badge_unlocks from anon, authenticated;
revoke all on public.learning_attempts from anon, authenticated;
revoke all on public.progress_states from anon, authenticated;
revoke all on public.prayer_logs from anon, authenticated;
revoke all on public.quran_goals from anon, authenticated;
revoke all on public.quran_read_events from anon, authenticated;
revoke all on public.quran_reading_positions from anon, authenticated;

create or replace function public.merge_sync_payload(
  p_entity_type text,
  p_current jsonb,
  p_incoming jsonb
) returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case p_entity_type
    when 'activity_day' then jsonb_build_object(
      'date', coalesce(p_incoming->>'date', p_current->>'date'),
      'firstAt', least(
        coalesce((p_current->>'firstAt')::bigint, (p_incoming->>'firstAt')::bigint),
        coalesce((p_incoming->>'firstAt')::bigint, (p_current->>'firstAt')::bigint)
      ),
      'lastAt', greatest(
        coalesce((p_current->>'lastAt')::bigint, (p_incoming->>'lastAt')::bigint),
        coalesce((p_incoming->>'lastAt')::bigint, (p_current->>'lastAt')::bigint)
      ),
      'lessonCount', greatest(
        coalesce((p_current->>'lessonCount')::integer, 0),
        coalesce((p_incoming->>'lessonCount')::integer, 0)
      ),
      'xpEarned', greatest(
        coalesce((p_current->>'xpEarned')::integer, 0),
        coalesce((p_incoming->>'xpEarned')::integer, 0)
      )
    )
    when 'badge_unlock' then jsonb_build_object(
      'badgeId', coalesce(p_incoming->>'badgeId', p_current->>'badgeId'),
      'earnedAt', least(
        coalesce((p_current->>'earnedAt')::bigint, (p_incoming->>'earnedAt')::bigint),
        coalesce((p_incoming->>'earnedAt')::bigint, (p_current->>'earnedAt')::bigint)
      )
    )
    when 'quran_read_event' then jsonb_build_object(
      'date', coalesce(p_incoming->>'date', p_current->>'date'),
      'verseKey', coalesce(p_incoming->>'verseKey', p_current->>'verseKey'),
      'firstReadAt', least(
        coalesce((p_current->>'firstReadAt')::bigint, (p_incoming->>'firstReadAt')::bigint),
        coalesce((p_incoming->>'firstReadAt')::bigint, (p_current->>'firstReadAt')::bigint)
      ),
      'lastReadAt', greatest(
        coalesce((p_current->>'lastReadAt')::bigint, (p_incoming->>'lastReadAt')::bigint),
        coalesce((p_incoming->>'lastReadAt')::bigint, (p_current->>'lastReadAt')::bigint)
      )
    )
    else p_current || p_incoming
  end;
$$;

create or replace function public.push_sync_batch(p_mutations jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_item jsonb;
  v_mutation_id uuid;
  v_entity_type text;
  v_operation text;
  v_inserted uuid;
  v_client_updated_at bigint;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_mutations) <> 'array' or jsonb_array_length(p_mutations) > 100 then
    raise exception 'invalid sync batch';
  end if;

  for v_item in select value from jsonb_array_elements(p_mutations)
  loop
    v_mutation_id := (v_item->>'mutation_id')::uuid;
    v_entity_type := v_item->>'entity_type';
    v_operation := v_item->>'operation';
    v_client_updated_at := (v_item->>'client_updated_at')::bigint;

    if v_entity_type not in (
      'activity_day', 'badge_unlock', 'learning_attempt', 'progress_state',
      'prayer_log', 'quran_goal', 'quran_read_event', 'quran_reading_position'
    ) or v_operation not in ('upsert', 'delete') then
      raise exception 'unsupported sync mutation';
    end if;

    v_inserted := null;
    insert into public.sync_mutations (user_id, mutation_id)
    values (v_user, v_mutation_id)
    on conflict do nothing
    returning mutation_id into v_inserted;

    if v_inserted is null then
      continue;
    end if;

    insert into public.sync_records (
      user_id, entity_type, entity_key, payload, client_updated_at,
      deleted_at, server_version, updated_at
    ) values (
      v_user,
      v_entity_type,
      v_item->>'entity_key',
      coalesce(v_item->'payload', '{}'::jsonb),
      v_client_updated_at,
      case when v_operation = 'delete' then v_client_updated_at else null end,
      nextval('public.sync_server_version_seq'),
      now()
    )
    on conflict (user_id, entity_type, entity_key) do update set
      payload = case
        when excluded.deleted_at is null
         and public.sync_records.deleted_at is null
         and excluded.entity_type in ('activity_day', 'badge_unlock', 'quran_read_event')
          then public.merge_sync_payload(
            excluded.entity_type,
            public.sync_records.payload,
            excluded.payload
          )
        when excluded.client_updated_at >= public.sync_records.client_updated_at
          then excluded.payload
        else public.sync_records.payload
      end,
      client_updated_at = greatest(
        public.sync_records.client_updated_at,
        excluded.client_updated_at
      ),
      deleted_at = case
        when excluded.client_updated_at >= public.sync_records.client_updated_at
          then excluded.deleted_at
        else public.sync_records.deleted_at
      end,
      server_version = nextval('public.sync_server_version_seq'),
      updated_at = now();
  end loop;
end;
$$;

create or replace function public.pull_sync_changes(
  p_after_version bigint,
  p_limit integer default 250,
  p_include_prayer boolean default false
) returns table (
  entity_type text,
  entity_key text,
  payload jsonb,
  deleted_at bigint,
  server_version bigint
)
language sql
security definer
set search_path = ''
as $$
  select r.entity_type, r.entity_key, r.payload, r.deleted_at, r.server_version
    from public.sync_records as r
   where auth.uid() is not null
     and r.user_id = auth.uid()
     and r.server_version > greatest(p_after_version, 0)
     and (p_include_prayer or r.entity_type <> 'prayer_log')
   order by r.server_version asc
   limit least(greatest(p_limit, 1), 500);
$$;

revoke all on function public.merge_sync_payload(text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.push_sync_batch(jsonb) from public, anon;
revoke all on function public.pull_sync_changes(bigint, integer, boolean) from public, anon;
grant execute on function public.push_sync_batch(jsonb) to authenticated;
grant execute on function public.pull_sync_changes(bigint, integer, boolean) to authenticated;
