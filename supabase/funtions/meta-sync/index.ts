// SOMOS SOFTWARE · B10.2 · Meta Social Intelligence Sync
// Secrets stay exclusively in Supabase Edge Functions.
// The caller must have an authenticated CRM session.

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const env = (name: string) => Deno.env.get(name)?.trim() || '';

async function graph(path: string, token: string, version: string) {
  const url = `https://graph.facebook.com/${version}/${path}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || `Meta API HTTP ${response.status}`);
  }
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST requerido' }, 405);

  const supabaseUrl = env('SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  const metaToken = env('META_ACCESS_TOKEN');
  const pageId = env('META_PAGE_ID');
  const instagramId = env('META_INSTAGRAM_ID');
  const version = env('META_GRAPH_VERSION');

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'Falta configuración interna de Supabase.' }, 500);
  }
  if (!metaToken) return json({ ok: false, error: 'Falta META_ACCESS_TOKEN en Secrets.' }, 500);
  if (!version) return json({ ok: false, error: 'Falta META_GRAPH_VERSION en Secrets.' }, 500);
  if (!pageId && !instagramId) {
    return json({ ok: false, error: 'Falta META_PAGE_ID y/o META_INSTAGRAM_ID en Secrets.' }, 400);
  }

  const bearer = req.headers.get('Authorization') || '';
  const userToken = bearer.replace(/^Bearer\s+/i, '').trim();
  if (!userToken) return json({ ok: false, error: 'Autenticación requerida.' }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(userToken);
  if (userError || !userData?.user) {
    return json({ ok: false, error: 'Sesión CRM no válida.' }, 401);
  }

  const startedAt = new Date().toISOString();
  const { data: logRow, error: logInsertError } = await admin
    .from('social_sync_logs')
    .insert({ requested_by: userData.user.id, started_at: startedAt })
    .select('id')
    .single();

  if (logInsertError) {
    console.error('social_sync_logs insert:', logInsertError);
  }

  const result: Record<string, unknown> = {
    ok: true,
    metric_date: startedAt.slice(0, 10),
    version,
    facebook: null,
    instagram: null,
  };

  let facebookOk = false;
  let instagramOk = false;
  let facebookFollowers: number | null = null;
  let instagramFollowers: number | null = null;
  let firstError = '';

  try {
    if (pageId) {
      try {
        const page = await graph(
          `${encodeURIComponent(pageId)}?fields=id,name,followers_count,fan_count`,
          metaToken,
          version,
        );
        const accountId = String(page.id || pageId);
        const followers = Number(page.followers_count ?? page.fan_count ?? 0);
        facebookFollowers = followers;

        await admin.from('social_accounts').upsert({
          platform: 'facebook',
          account_id: accountId,
          account_name: page.name || 'Facebook Page',
          account_url: `https://www.facebook.com/${accountId}`,
          active: true,
          last_sync_at: new Date().toISOString(),
          sync_status: 'ok',
        }, { onConflict: 'platform,account_id' });

        const { data: previous } = await admin
          .from('social_metrics')
          .select('followers')
          .eq('platform', 'facebook')
          .eq('account_id', accountId)
          .lt('metric_date', result.metric_date)
          .order('metric_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const prev = Number(previous?.followers ?? followers);
        const gained = Math.max(0, followers - prev);
        const lost = Math.max(0, prev - followers);

        await admin.from('social_metrics').upsert({
          platform: 'facebook',
          account_id: accountId,
          metric_date: result.metric_date,
          followers,
          followers_gained: gained,
          followers_lost: lost,
          raw: page,
        }, { onConflict: 'platform,account_id,metric_date' });

        result.facebook = { id: page.id, name: page.name, followers, gained, lost };
        facebookOk = true;
      } catch (error) {
        firstError ||= error instanceof Error ? error.message : String(error);
        result.facebook = { ok: false, error: firstError };
      }
    }

    if (instagramId) {
      try {
        const ig = await graph(
          `${encodeURIComponent(instagramId)}?fields=id,username,name,followers_count,media_count`,
          metaToken,
          version,
        );
        const accountId = String(ig.id || instagramId);
        const followers = Number(ig.followers_count ?? 0);
        instagramFollowers = followers;

        await admin.from('social_accounts').upsert({
          platform: 'instagram',
          account_id: accountId,
          account_name: ig.username ? `@${ig.username}` : (ig.name || 'Instagram Professional'),
          account_url: ig.username ? `https://www.instagram.com/${ig.username}/` : 'https://www.instagram.com/',
          active: true,
          last_sync_at: new Date().toISOString(),
          sync_status: 'ok',
        }, { onConflict: 'platform,account_id' });

        const { data: previous } = await admin
          .from('social_metrics')
          .select('followers')
          .eq('platform', 'instagram')
          .eq('account_id', accountId)
          .lt('metric_date', result.metric_date)
          .order('metric_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        const prev = Number(previous?.followers ?? followers);
        const gained = Math.max(0, followers - prev);
        const lost = Math.max(0, prev - followers);

        await admin.from('social_metrics').upsert({
          platform: 'instagram',
          account_id: accountId,
          metric_date: result.metric_date,
          followers,
          followers_gained: gained,
          followers_lost: lost,
          raw: ig,
        }, { onConflict: 'platform,account_id,metric_date' });

        result.instagram = { id: ig.id, username: ig.username, followers, gained, lost };
        instagramOk = true;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        firstError ||= msg;
        result.instagram = { ok: false, error: msg };
      }
    }

    const successCount = Number(facebookOk) + Number(instagramOk);
    const requestedCount = Number(!!pageId) + Number(!!instagramId);
    const status = successCount === requestedCount ? 'success' : successCount > 0 ? 'partial' : 'error';

    if (logRow?.id) {
      await admin.from('social_sync_logs').update({
        finished_at: new Date().toISOString(),
        status,
        facebook_ok: facebookOk,
        instagram_ok: instagramOk,
        facebook_followers: facebookFollowers,
        instagram_followers: instagramFollowers,
        error_message: firstError || null,
        details: result,
      }).eq('id', logRow.id);
    }

    return json({
      ...result,
      status,
      message: status === 'success' ? 'Meta sincronizado correctamente.' :
        status === 'partial' ? 'Sincronización parcial: revisa el canal con error.' :
        'No fue posible sincronizar Meta.',
    }, status === 'error' ? 502 : 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (logRow?.id) {
      await admin.from('social_sync_logs').update({
        finished_at: new Date().toISOString(),
        status: 'error',
        error_message: message,
      }).eq('id', logRow.id);
    }
    return json({ ok: false, status: 'error', error: message }, 500);
  }
});
