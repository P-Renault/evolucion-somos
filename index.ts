import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v26.0";
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const PAGE_ID = Deno.env.get("META_PAGE_ID") || "";
const INSTAGRAM_ID = Deno.env.get("META_INSTAGRAM_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const TIMEOUT_MS = 15000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errText(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

async function graphGet(path: string, token: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  url.searchParams.set("access_token", token);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    const raw = await response.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { data = { raw_text: raw }; }
    if (!response.ok || data?.error) {
      const e = new Error(data?.error?.message || `Meta HTTP ${response.status}`);
      (e as any).meta = data?.error || data;
      (e as any).status = response.status;
      throw e;
    }
    return data;
  } catch (e) {
    if ((e as any)?.name === "AbortError") throw new Error(`Meta timeout después de ${TIMEOUT_MS / 1000}s: ${path}`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function followerValue(data: any): number | null {
  const candidates = [data?.followers_count, data?.followers, data?.fan_count];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Math.trunc(Number(value));
  }
  return null;
}

function metricDiagnostic(platform: "facebook" | "instagram", data: any) {
  const rawFields = Object.keys(data || {});
  const candidates = platform === "facebook"
    ? ["followers_count", "fan_count", "followers"]
    : ["followers_count", "followers"];
  const present = candidates.filter((key) => data?.[key] !== undefined && data?.[key] !== null);
  const value = followerValue(data);

  let status = "UNAVAILABLE";
  if (value !== null) status = "REAL";
  else if (present.length > 0) status = "INVALID_VALUE";

  return {
    status,
    value,
    fields_requested: candidates,
    fields_received: present,
    raw_fields: rawFields,
    raw: data,
  };
}

function accountName(platform: "facebook" | "instagram", data: any) {
  return platform === "instagram"
    ? data?.name || data?.username || "Instagram"
    : data?.name || "Facebook";
}

async function getPageToken(systemToken: string, pageId: string) {
  try {
    const pages = await graphGet(`/me/accounts?fields=id,name,access_token&limit=100`, systemToken);
    const page = (pages?.data || []).find((x: any) => String(x?.id) === String(pageId));
    if (page?.access_token) return { token: page.access_token, source: "page_access_token" };
    return { token: systemToken, source: "system_user_token" };
  } catch (e) {
    return { token: systemToken, source: "system_user_token", warning: errText(e) };
  }
}

async function upsertAccount(db: any, platform: "facebook" | "instagram", data: any, accountId: string, status: string) {
  const row = {
    platform,
    account_id: accountId,
    account_name: accountName(platform, data),
    account_url: platform === "instagram"
      ? (data?.username ? `https://www.instagram.com/${data.username}/` : null)
      : (data?.link || `https://www.facebook.com/${accountId}`),
    active: true,
    last_sync_at: new Date().toISOString(),
    sync_status: status,
  };
  const { error } = await db.from("social_accounts").upsert(row, { onConflict: "platform,account_id" });
  if (error) throw new Error(`social_accounts: ${error.message}`);
}

async function previousMetric(db: any, platform: string, accountId: string, today: string) {
  const { data, error } = await db.from("social_metrics")
    .select("followers,metric_date")
    .eq("platform", platform)
    .eq("account_id", accountId)
    .lt("metric_date", today)
    .order("metric_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data || null;
}

async function saveMetric(db: any, platform: "facebook" | "instagram", accountId: string, today: string, metaData: any) {
  const followers = followerValue(metaData);
  const previous = await previousMetric(db, platform, accountId, today);
  const previousFollowers = typeof previous?.followers === "number" ? previous.followers : null;
  const gained = followers !== null && previousFollowers !== null && followers > previousFollowers ? followers - previousFollowers : 0;
  const lost = followers !== null && previousFollowers !== null && followers < previousFollowers ? previousFollowers - followers : 0;

  const row = {
    platform,
    account_id: accountId,
    metric_date: today,
    followers,
    followers_gained: gained,
    followers_lost: lost,
    reach: null,
    impressions: null,
    engagement: null,
    profile_visits: null,
    website_clicks: null,
    whatsapp_clicks: null,
    messages: null,
    leads: null,
    revenue: 0,
    raw: metaData,
  };

  const { error } = await db.from("social_metrics").upsert(row, { onConflict: "platform,account_id,metric_date" });
  if (error) throw new Error(`social_metrics: ${error.message}`);

  return { followers, previous_followers: previousFollowers, followers_gained: gained, followers_lost: lost, raw_fields: Object.keys(metaData || {}), diagnostic: metricDiagnostic(platform, metaData) };
}

async function syncAccount(db: any, platform: "facebook" | "instagram", accountId: string, token: string) {
  const fields = platform === "facebook"
    ? "id,name,link,followers_count,fan_count"
    : "id,name,username,profile_picture_url,followers_count,media_count";

  const data = await graphGet(`/${encodeURIComponent(accountId)}?fields=${fields}`, token);
  await upsertAccount(db, platform, data, accountId, "success");
  const metric = await saveMetric(db, platform, accountId, new Date().toISOString().slice(0, 10), data);

  return {
    ok: true,
    account_id: accountId,
    account_name: accountName(platform, data),
    followers: metric.followers,
    previous_followers: metric.previous_followers,
    followers_gained: metric.followers_gained,
    followers_lost: metric.followers_lost,
    raw_fields: metric.raw_fields,
    diagnostic: metric.diagnostic,
    raw: data,
  };
}

async function main(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    return json({
      ok: true,
      service: "meta-sync",
      version: "B10.5.12",
      graph_version: GRAPH_VERSION,
      configured: {
        whatsapp_access_token: Boolean(ACCESS_TOKEN),
        page_id: Boolean(PAGE_ID),
        instagram_id: Boolean(INSTAGRAM_ID),
      },
    });
  }

  if (req.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json({ ok: false, code: "SUPABASE_CONFIG_MISSING", error: "Faltan secretos de Supabase." }, 500);
  }
  if (!ACCESS_TOKEN) {
    return json({ ok: false, code: "WHATSAPP_ACCESS_TOKEN_MISSING", error: "Falta WHATSAPP_ACCESS_TOKEN en Secrets." }, 500);
  }
  if (!PAGE_ID && !INSTAGRAM_ID) {
    return json({ ok: false, code: "META_IDS_MISSING", error: "Faltan META_PAGE_ID y META_INSTAGRAM_ID." }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return json({ ok: false, code: "AUTH_REQUIRED", error: "Sesión CRM requerida." }, 401);

  const jwt = authorization.slice(7).trim();
  const authClient = createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ ok: false, code: "INVALID_SESSION", error: userError?.message || "Sesión CRM inválida." }, 401);

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });
  const started = new Date();
  const today = started.toISOString().slice(0, 10);
  const result: any = {
    ok: true,
    partial: false,
    version: "B10.5.12",
    graph_version: GRAPH_VERSION,
    synced_at: started.toISOString(),
    facebook: { ok: false, account_id: PAGE_ID || null, followers: null },
    instagram: { ok: false, account_id: INSTAGRAM_ID || null, followers: null },
    errors: [],
  };

  const pageTokenInfo = PAGE_ID ? await getPageToken(ACCESS_TOKEN, PAGE_ID) : { token: ACCESS_TOKEN, source: "system_user_token" };
  result.facebook_token_source = pageTokenInfo.source;
  if (pageTokenInfo.warning) result.facebook_token_warning = pageTokenInfo.warning;

  let success = 0;
  let failed = 0;

  if (PAGE_ID) {
    try {
      result.facebook = await syncAccount(db, "facebook", PAGE_ID, pageTokenInfo.token);
      success++;
    } catch (e) {
      failed++;
      result.facebook = { ok: false, account_id: PAGE_ID, followers: null, error: errText(e), meta: (e as any)?.meta || null };
      result.errors.push({ platform: "facebook", message: errText(e), meta: (e as any)?.meta || null });
      try { await upsertAccount(db, "facebook", { id: PAGE_ID, name: "Facebook" }, PAGE_ID, "error"); } catch {}
    }
  }

  if (INSTAGRAM_ID) {
    try {
      result.instagram = await syncAccount(db, "instagram", INSTAGRAM_ID, ACCESS_TOKEN);
      success++;
    } catch (e) {
      failed++;
      result.instagram = { ok: false, account_id: INSTAGRAM_ID, followers: null, error: errText(e), meta: (e as any)?.meta || null };
      result.errors.push({ platform: "instagram", message: errText(e), meta: (e as any)?.meta || null });
      try { await upsertAccount(db, "instagram", { id: INSTAGRAM_ID, name: "Instagram" }, INSTAGRAM_ID, "error"); } catch {}
    }
  }

  result.total = success;
  result.partial = success > 0 && failed > 0;
  result.ok = success > 0 && failed === 0;
  result.duration_ms = Date.now() - started.getTime();

  try {
    await db.from("social_sync_logs").insert({
      platform: "meta",
      status: success === 0 ? "error" : failed ? "partial" : "success",
      started_at: started.toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: result.duration_ms,
      records_updated: success,
      accounts_processed: success + failed,
      error_message: result.errors.length ? result.errors.map((x: any) => `${x.platform}: ${x.message}`).join(" | ") : null,
      details: {
        version: "B10.5.12",
        facebook_ok: result.facebook.ok,
        instagram_ok: result.instagram.ok,
        facebook_followers: result.facebook.followers,
        instagram_followers: result.instagram.followers,
        facebook_raw_fields: result.facebook.raw_fields || [],
        instagram_raw_fields: result.instagram.raw_fields || [],
        facebook_metric_status: result.facebook.diagnostic?.status || null,
        instagram_metric_status: result.instagram.diagnostic?.status || null,
        facebook_metric_fields_received: result.facebook.diagnostic?.fields_received || [],
        instagram_metric_fields_received: result.instagram.diagnostic?.fields_received || [],
        errors: result.errors,
        graph_version: GRAPH_VERSION,
        facebook_token_source: pageTokenInfo.source,
        user_id: userData.user.id,
      },
    });
  } catch (e) {
    result.log_error = errText(e);
  }

  return json(result, success === 0 ? 502 : 200);
}

Deno.serve(async (req) => {
  try {
    return await main(req);
  } catch (e) {
    return json({ ok: false, code: "UNHANDLED_ERROR", error: errText(e) }, 500);
  }
});
