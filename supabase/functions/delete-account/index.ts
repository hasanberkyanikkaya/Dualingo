import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405 });
  }
  const authorization = request.headers.get('Authorization');
  if (authorization === null) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (url === undefined || serviceRoleKey === undefined) {
    return Response.json({ error: 'server_not_configured' }, { status: 500 });
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authorization.replace(/^Bearer\s+/i, '');
  const { data, error } = await admin.auth.getUser(token);
  if (error !== null || data.user === null) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const deletion = await admin.auth.admin.deleteUser(data.user.id, false);
  if (deletion.error !== null) {
    return Response.json({ error: 'delete_failed' }, { status: 500 });
  }
  return Response.json({ deleted: true });
});

