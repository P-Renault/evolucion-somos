// SOMOS SOFTWARE · B10.0 · Meta/Instagram daily social sync
// Deploy as a Supabase Edge Function. Keep META_ACCESS_TOKEN and SERVICE_ROLE in secrets.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const env = (name: string) => Deno.env.get(name)?.trim() || '';

async function graph(path: string, token: string, version: string) {
  const url = `https://graph.facebook.com/${version}/${path}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const body = await r.json();
  if (!r.ok || body.error) throw new Error(body.error?.message || `Meta API HTTP ${r.status}`);
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST requerido' }, 405);

  const token = env('META_ACCESS_TOKEN');
  const pageId = env('META_PAGE_ID');
  const instagramId = env('META_INSTAGRAM_ID');
  const version = env('META_GRAPH_VERSION');
  if (!version) return json({ ok: false, error: 'Configura META_GRAPH_VERSION con una versión Graph API soportada por tu app de Meta.' }, 500);
  const supabaseUrl = env('SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');

  if (!token || !supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'Faltan secretos META_ACCESS_TOKEN / SUPABASE_*.' }, 500);
  }

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const metricDate = new Date().toISOString().slice(0, 10);
  const result: Record<string, unknown> = { ok: true, metric_date: metricDate, version };

  try {
    if (pageId) {
      const page = await graph(`${encodeURIComponent(pageId)}?fields=id,name,followers_count,fan_count`, token, version);
      const followers = Number(page.followers_count ?? page.fan_count ?? 0);
      await db.from('social_accounts').upsert({
        platform: 'facebook', account_id: String(page.id || pageId), account_name: page.name || 'Facebook Page',
        account_url: `https://www.facebook.com/${page.id || pageId}`, active: true, last_sync_at: new Date().toISOString(), sync_status: 'ok'
      }, { onConflict: 'platform,account_id' });
      const previous = await db.from('social_metrics').select('followers').eq('platform', 'facebook').eq('account_id', String(page.id || pageId)).lt('metric_date', metricDate).order('metric_date', { ascending: false }).limit(1).maybeSingle();
      const prevFollowers = Number(previous.data?.followers ?? followers);
      const gained = Math.max(0, followers - prevFollowers);
      const lost = Math.max(0, prevFollowers - followers);
      await db.from('social_metrics').upsert({
        platform: 'facebook', account_id: String(page.id || pageId), metric_date: metricDate,
        followers, followers_gained: gained, followers_lost: lost, raw: page
      }, { onConflict: 'platform,account_id,metric_date' });
      result.facebook = { id: page.id, name: page.name, followers, gained, lost };
    }

    if (instagramId) {
      const ig = await graph(`${encodeURIComponent(instagramId)}?fields=id,username,name,followers_count,media_count`, token, version);
      const followers = Number(ig.followers_count ?? 0);
      await db.from('social_accounts').upsert({
        platform: 'instagram', account_id: String(ig.id || instagramId), account_name: ig.username ? `@${ig.username}` : (ig.name || 'Instagram Professional'),
        account_url: ig.username ? `https://www.instagram.com/${ig.username}/` : 'https://www.instagram.com/', active: true, last_sync_at: new Date().toISOString(), sync_status: 'ok'
      }, { onConflict: 'platform,account_id' });
      const previous = await db.from('social_metrics').select('followers').eq('platform', 'instagram').eq('account_id', String(ig.id || instagramId)).lt('metric_date', metricDate).order('metric_date', { ascending: false }).limit(1).maybeSingle();
      const prevFollowers = Number(previous.data?.followers ?? followers);
      const gained = Math.max(0, followers - prevFollowers);
      const lost = Math.max(0, prevFollowers - followers);
      await db.from('social_metrics').upsert({
        platform: 'instagram', account_id: String(ig.id || instagramId), metric_date: metricDate,
        followers, followers_gained: gained, followers_lost: lost, raw: ig
      }, { onConflict: 'platform,account_id,metric_date' });
      result.instagram = { id: ig.id, username: ig.username, followers, gained, lost };
    }

    if (!pageId && !instagramId) return json({ ok: false, error: 'Configura META_PAGE_ID o META_INSTAGRAM_ID.' }, 400);
    return json(result);
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: e instanceof Error ? e.message : String(e), metric_date: metricDate }, 500);
  }
});
