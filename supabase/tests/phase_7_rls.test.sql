begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'one@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'two@example.test');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.push_sync_batch('[{"mutation_id":"10000000-0000-0000-0000-000000000001","entity_type":"badge_unlock","entity_key":"sample","operation":"upsert","payload":{"badgeId":"sample","earnedAt":1},"client_updated_at":1}]'::jsonb)$$,
  'authenticated owner can push'
);
select is((select count(*)::integer from public.pull_sync_changes(0, 250, false)), 1, 'owner sees own row');

select lives_ok(
  $$select public.push_sync_batch('[{"mutation_id":"10000000-0000-0000-0000-000000000002","entity_type":"progress_state","entity_key":"main","operation":"upsert","payload":{"state":"new","baselineXp":0,"baselineAttemptCounts":"{}"},"client_updated_at":20}]'::jsonb)$$,
  'newer snapshot can be pushed'
);
select lives_ok(
  $$select public.push_sync_batch('[{"mutation_id":"10000000-0000-0000-0000-000000000003","entity_type":"progress_state","entity_key":"main","operation":"upsert","payload":{"state":"old","baselineXp":0,"baselineAttemptCounts":"{}"},"client_updated_at":10}]'::jsonb)$$,
  'delayed offline snapshot is accepted idempotently'
);
select is(
  (select payload->>'state' from public.pull_sync_changes(0, 250, false) where entity_type = 'progress_state'),
  'new',
  'older client timestamp cannot overwrite newer state'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.pull_sync_changes(0, 250, false)), 0, 'other user cannot pull row');

reset role;
set local role anon;
select throws_ok(
  $$select public.pull_sync_changes(0, 250, false)$$,
  '42501',
  null,
  'anonymous role cannot execute pull'
);
select throws_ok(
  $$select public.push_sync_batch('[]'::jsonb)$$,
  '42501',
  null,
  'anonymous role cannot execute push'
);

select * from finish();
rollback;
