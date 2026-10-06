import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_GRAPH_VERSION = "v26.0";
const META_TIMEOUT_MS = 15000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function nestedMediaUrl(item: any) {
  return cleanText(
    item?.media_url ??
    item?.media?.image?.src ??
    item?.media?.source ??
    item?.media?.url ??
    null,
  );
}

function parseUtm(url: string | null, caption: string | null) {
  const out: Record<string, string | null> = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
  };
  try {
    if (url) {
      const u = new URL(url);
      for (const key of Object.keys(out)) out[key] = u.searchParams.get(key);
    }
  } catch (_) {}

  if (caption) {
    const patterns: Record<string, RegExp> = {
      utm_source: /utm_source=([^\s&#]+)/i,
      utm_medium: /utm_medium=([^\s&#]+)/i,
      utm_campaign: /utm_campaign=([^\s&#]+)/i,
      utm_content: /utm_content=([^\s&#]+)/i,
    };
    for (const [key, re] of Object.entries(patterns)) {
      if (!out[key]) out[key] = caption.match(re)?.[1] ?? null;
    }
  }
  return out;
}

function mapFacebook(item: any, pageId: string) {
  const reactions = Number(item?.reactions?.summary?.total_count ?? 0);
  const comments = Number(item?.comments?.summary?.total_count ?? 0);
  const shares = Number(item?.shares?.count ?? 0);
  const permalink = cleanText(item?.permalink_url);
  const message = cleanText(item?.message);
  const utm = parseUtm(permalink, message);
  const attachment = item?.attachments?.data?.[0] ?? item?.attachments?.data?.[0];
  return {
    platform: "facebook",
    external_id: String(item.id),
    account_id: pageId,
    account_name: null,
    published_at: item.created_time ?? null,
    media_type: cleanText(attachment?.media_type),
    message,
    caption: null,
    permalink_url: permalink,
    media_url: nestedMediaUrl(attachment),
    thumbnail_url: nestedMediaUrl(attachment),
    campaign: utm.utm_campaign,
    ...utm,
    reach: null,
    impressions: null,
    engagement: reactions + comments + shares,
    likes: reactions,
    comments,
    shares,
    clicks: null,
    raw: item,
  };
}

function mapInstagram(item: any, instagramId: string) {
  const caption = cleanText(item?.caption);
  const permalink = cleanText(item?.permalink);
  const likes = Number(item?.like_count ?? 0);
  const comments = Number(item?.comments_count ?? 0);
  const utm = parseUtm(permalink, caption);
  return {
    platform: "instagram",
    external_id: String(item.id),
    account_id: instagramId,
    account_name: null,
    published_at: item.timestamp ?? null,
    media_type: cleanText(item?.media_type),
    message: null,
    caption,
    permalink_url: permalink,
    media_url: cleanText(item?.media_url),
    thumbnail_url: cleanText(item?.thumbnail_url),
    campaign: utm.utm_campaign,
    ...utm,
    reach: null,
    impressions: null,
    engagement: likes + comments,
    likes,
    comments,
    shares: null,
    clicks: null,
    raw: item,
  };
}

async function graphGet(version: string, path: string, token: string) {
  const url = `https://graph.facebook.com/${version}/${path}`;
  const response = await fetchWithTimeout(`${url}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || `Meta Graph API respondió HTTP ${response.status}`;
    const error = new Error(message);
    (error as any).meta = body?.error ?? body;
    throw error;
  }
  return body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ ok: false, code: "UNAUTHORIZED", message: "Sesión de Supabase no válida." }, 401);
    }

    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const pageId = Deno.env.get("META_PAGE_ID");
    const instagramId = Deno.env.get("META_INSTAGRAM_ID");
    const graphVersion = Deno.env.get("META_GRAPH_VERSION") || DEFAULT_GRAPH_VERSION;

    if (!accessToken || !pageId || !instagramId) {
      return json({
        ok: false,
        code: "META_NOT_CONFIGURED",
        configured: {
          access_token: Boolean(accessToken),
          page_id: Boolean(pageId),
          instagram_id: Boolean(instagramId),
          graph_version: graphVersion,
        },
      }, 503);
    }

    const [facebookResult, instagramResult] = await Promise.allSettled([
      graphGet(graphVersion, `${pageId}/posts?fields=id,message,created_time,permalink_url,attachments{media_type,media},shares,comments.summary(true),reactions.summary(true)}&limit=50`, accessToken),
      graphGet(graphVersion, `${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=50`, accessToken),
    ]);

    const rows: any[] = [];
    const errors: any[] = [];

    if (facebookResult.status === "fulfilled") {
      for (const item of facebookResult.value?.data ?? []) rows.push(mapFacebook(item, pageId));
    } else {
      errors.push({ platform: "facebook", message: facebookResult.reason?.message ?? String(facebookResult.reason) });
    }

    if (instagramResult.status === "fulfilled") {
      for (const item of instagramResult.value?.data ?? []) rows.push(mapInstagram(item, instagramId));
    } else {
      errors.push({ platform: "instagram", message: instagramResult.reason?.message ?? String(instagramResult.reason) });
    }

    if (!rows.length && errors.length) {
      return json({ ok: false, code: "META_POSTS_FETCH_FAILED", errors }, 502);
    }

    const { error: upsertError } = await supabase
      .from("social_posts")
      .upsert(rows, { onConflict: "platform,external_id" });

    if (upsertError) {
      return json({ ok: false, code: "DB_UPSERT_FAILED", message: upsertError.message, errors }, 500);
    }

    return json({
      ok: true,
      total: rows.length,
      facebook: rows.filter((x) => x.platform === "facebook").length,
      instagram: rows.filter((x) => x.platform === "instagram").length,
      errors,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    if ((error as any)?.name === "AbortError") {
      return json({ ok: false, code: "META_TIMEOUT", message: "Meta tardó demasiado en responder." }, 504);
    }
    return json({ ok: false, code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : String(error) }, 500);
  }
});
