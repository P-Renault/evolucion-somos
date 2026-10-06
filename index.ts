import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v26.0";
const META_ACCESS_TOKEN = Deno.env.get("META_ACCESS_TOKEN") || "";
const META_PAGE_ID = Deno.env.get("META_PAGE_ID") || "";
const META_INSTAGRAM_ID = Deno.env.get("META_INSTAGRAM_ID") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanError(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

async function metaGet(path: string) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  url.searchParams.set("access_token", META_ACCESS_TOKEN);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response: Response;
  try {
    response = await fetch(url.toString(), { signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Meta timeout después de 12 segundos: ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const text = await response.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw_text: text }; }
  if (!response.ok || data?.error) {
    const message = data?.error?.message || `Meta HTTP ${response.status}`;
    const error = new Error(message);
    (error as any).meta = data;
    (error as any).status = response.status;
    throw error;
  }
  return data;
}

function followerValue(data: any): number | null {
  const candidates = [data?.followers_count, data?.followers, data?.fan_count];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Math.trunc(Number(value));
  }
  return null;
}

function accountName(platform: string, data: any) {
  if (platform === "instagram") return data?.name || data?.username || "Instagram";
  return data?.name || "Facebook";
}

async function main(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") {
    return jsonResponse({
      ok: true,
      service: "meta-sync",
      graph_version: GRAPH_VERSION,
      configured: {
        meta_access_token: Boolean(META_ACCESS_TOKEN),
        page_id: Boolean(META_PAGE_ID),
        instagram_id: Boolean(META_INSTAGRAM_ID),
      },
    });
  }
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ ok: false, code: "SUPABASE_CONFIG_MISSING", error: "Faltan secretos de Supabase en la Edge Function." }, 500);
  }
  if (!META_ACCESS_TOKEN) {
    return jsonResponse({ ok: false, code: "META_ACCESS_TOKEN_MISSING", error: "Falta META_ACCESS_TOKEN en Supabase Secrets." }, 500);
  }
  if (!META_PAGE_ID && !META_INSTAGRAM_ID) {
    return jsonResponse({ ok: false, code: "META_IDS_MISSING", error: "Falta META_PAGE_ID y/o META_INSTAGRAM_ID." }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return jsonResponse({ ok: false, code: "AUTH_REQUIRED", error: "Sesión CRM requerida." }, 401);
  }

  const jwt = authorization.slice("Bearer ".length).trim();
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return jsonResponse({ ok: false, code: "INVALID_SESSION", error: userError?.message || "Sesión CRM inválida." }, 401);
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const startedAt = new Date();
  const today = startedAt.toISOString().slice(0, 10);
  const result: any = {
    ok: true,
    partial: false,
    graph_version: GRAPH_VERSION,
    synced_at: startedAt.toISOString(),
    user_id: userData.user.id,
    facebook: { ok: false, account_id: META_PAGE_ID || null, followers: null },
    instagram: { ok: false, account_id: META_INSTAGRAM_ID || null, followers: null },
    errors: [],
  };

  let successful = 0;
  let failed = 0;

  async function syncAccount(platform: "facebook" | "instagram", accountId: string) {
    try {
      const fields = platform === "facebook"
        ? "id,name,link,followers_count,fan_count"
        : "id,name,username,profile_picture_url,followers_count,media_count";
      const data = await metaGet(`/${encodeURIComponent(accountId)}?fields=${fields}`);
      const followers = followerValue(data);
      const name = accountName(platform, data);
      const url = platform === "instagram"
        ? (data?.username ? `https://www.instagram.com/${data.username}/` : null)
        : (data?.link || null);

      const accountUpsert = await db.from("social_accounts").upsert({
        platform,
        account_id: accountId,
        account_name: name,
        account_url: url,
        active: true,
        last_sync_at: new Date().toISOString(),
        sync_status: "success",
      }, { onConflict: "platform,account_id" });
      if (accountUpsert.error) throw new Error(`social_accounts: ${accountUpsert.error.message}`);

      const metricUpsert = await db.from("social_metrics").upsert({
        platform,
        account_id: accountId,
        metric_date: today,
        followers,
        followers_gained: null,
        followers_lost: null,
        reach: null,
        impressions: null,
        engagement: null,
        profile_visits: null,
        website_clicks: null,
        whatsapp_clicks: null,
        messages: null,
        leads: null,
        revenue: 0,
        raw: data,
      }, { onConflict: "platform,account_id,metric_date" });
      if (metricUpsert.error) throw new Error(`social_metrics: ${metricUpsert.error.message}`);

      result[platform] = {
        ok: true,
        account_id: accountId,
        account_name: name,
        followers,
        raw_fields: Object.keys(data || {}),
      };
      successful++;
    } catch (error) {
      failed++;
      const message = cleanError(error);
      result[platform] = { ok: false, account_id: accountId, followers: null, error: message };
      result.errors.push({ platform, message, meta: (error as any)?.meta || null });
      try {
        await db.from("social_accounts").upsert({
          platform,
          account_id: accountId,
          account_name: platform === "facebook" ? "Facebook" : "Instagram",
          active: true,
          last_sync_at: new Date().toISOString(),
          sync_status: "error",
        }, { onConflict: "platform,account_id" });
      } catch { /* preserve original error */ }
    }
  }

  if (META_PAGE_ID) await syncAccount("facebook", META_PAGE_ID);
  if (META_INSTAGRAM_ID) await syncAccount("instagram", META_INSTAGRAM_ID);

  const durationMs = Date.now() - startedAt.getTime();
  result.duration_ms = durationMs;
  result.total = successful;
  result.partial = successful > 0 && failed > 0;
  result.ok = successful > 0 && failed === 0;

  const status = successful === 0 ? "error" : failed > 0 ? "partial" : "success";
  try {
    await db.from("social_sync_logs").insert({
      platform: "meta",
      status,
      started_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      records_updated: successful,
      accounts_processed: successful + failed,
      error_message: result.errors.length ? result.errors.map((x: any) => `${x.platform}: ${x.message}`).join(" | ") : null,
      details: {
        facebook_ok: result.facebook.ok,
        instagram_ok: result.instagram.ok,
        facebook_followers: result.facebook.followers,
        instagram_followers: result.instagram.followers,
        errors: result.errors,
        graph_version: GRAPH_VERSION,
        user_id: userData.user.id,
      },
    });
  } catch (logError) {
    result.log_error = cleanError(logError);
  }

  return jsonResponse(result, successful === 0 ? 502 : 200);
}

Deno.serve(async (req) => {
  try {
    return await main(req);
  } catch (error) {
    return jsonResponse({ ok: false, code: "UNHANDLED_ERROR", error: cleanError(error) }, 500);
  }
});
