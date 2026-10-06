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

function parseUtm(url: string | null, text: string | null) {
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

  if (text) {
    const patterns: Record<string, RegExp> = {
      utm_source: /utm_source=([^\s&#]+)/i,
      utm_medium: /utm_medium=([^\s&#]+)/i,
      utm_campaign: /utm_campaign=([^\s&#]+)/i,
      utm_content: /utm_content=([^\s&#]+)/i,
    };
    for (const [key, re] of Object.entries(patterns)) {
      if (!out[key]) out[key] = text.match(re)?.[1] ?? null;
    }
  }

  return out;
}

function attachmentUrl(attachment: any) {
  return cleanText(
    attachment?.media?.image?.src ??
    attachment?.media?.source ??
    attachment?.media_url ??
    attachment?.media?.url ??
    null,
  );
}

function mapFacebook(item: any, pageId: string) {
  const message = cleanText(item?.message);
  const permalink = cleanText(item?.permalink_url);
  const reactions = Number(item?.reactions?.summary?.total_count ?? 0);
  const comments = Number(item?.comments?.summary?.total_count ?? 0);
  const shares = Number(item?.shares?.count ?? 0);
  const attachment = item?.attachments?.data?.[0] ?? null;
  const utm = parseUtm(permalink, message);

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
    media_url: attachmentUrl(attachment),
    thumbnail_url: attachmentUrl(attachment),
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
  const separator = path.includes("?") ? "&" : "?";
  const url = `https://graph.facebook.com/${version}/${path}${separator}access_token=${encodeURIComponent(token)}`;
  const response = await fetchWithTimeout(url);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      body?.error?.message || `Meta Graph API respondió HTTP ${response.status}`,
    );
    (error as any).meta = body?.error ?? body;
    throw error;
  }

  return body;
}

async function ensureAccounts(supabase: any, page: any, instagram: any) {
  const now = new Date().toISOString();
  const rows = [
    {
      platform: "facebook",
      account_id: String(page.id),
      account_name: page.name ?? "Facebook Page",
      account_url: `https://www.facebook.com/${page.id}`,
      active: true,
      last_sync_at: now,
      sync_status: "success",
    },
    {
      platform: "instagram",
      account_id: String(instagram.id),
      account_name: instagram.name ?? instagram.username ?? "Instagram",
      account_url: instagram.username
        ? `https://www.instagram.com/${instagram.username}/`
        : null,
      active: true,
      last_sync_at: now,
      sync_status: "success",
    },
  ];

  const { error } = await supabase
    .from("social_accounts")
    .upsert(rows, { onConflict: "platform,account_id" });

  if (error) throw new Error(`social_accounts: ${error.message}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);

  const startedAt = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ ok: false, code: "UNAUTHORIZED", message: "Sesión de Supabase no válida." }, 401);
    }

    const accessToken = Deno.env.get("META_ACCESS_TOKEN");
    const pageId = Deno.env.get("META_PAGE_ID");
    const instagramId = Deno.env.get("META_INSTAGRAM_ID");
    const graphVersion = Deno.env.get("META_GRAPH_VERSION") || DEFAULT_GRAPH_VERSION;

    if (!accessToken || !pageId || !instagramId) {
      return json({
        ok: false,
        code: "META_NOT_CONFIGURED",
        message: "Faltan Secrets de Meta para publicaciones.",
        configured: {
          meta_access_token: Boolean(accessToken),
          page_id: Boolean(pageId),
          instagram_id: Boolean(instagramId),
          graph_version: graphVersion,
        },
      }, 503);
    }

    const [pageInfo, instagramInfo] = await Promise.allSettled([
      graphGet(graphVersion, `${pageId}?fields=id,name,link,followers_count`, accessToken),
      graphGet(graphVersion, `${instagramId}?fields=id,name,username,followers_count`, accessToken),
    ]);

    if (pageInfo.status === "rejected" && instagramInfo.status === "rejected") {
      return json({
        ok: false,
        code: "META_ACCOUNTS_FETCH_FAILED",
        facebook_error: pageInfo.reason?.message ?? String(pageInfo.reason),
        instagram_error: instagramInfo.reason?.message ?? String(instagramInfo.reason),
      }, 502);
    }

    const page = pageInfo.status === "fulfilled" ? pageInfo.value : { id: pageId, name: null };
    const instagram = instagramInfo.status === "fulfilled"
      ? instagramInfo.value
      : { id: instagramId, name: null, username: null };

    try {
      await ensureAccounts(supabase, page, instagram);
    } catch (accountError) {
      return json({
        ok: false,
        code: "SOCIAL_ACCOUNTS_UPSERT_FAILED",
        message: accountError instanceof Error ? accountError.message : String(accountError),
      }, 500);
    }

    // Facebook: primero usamos una consulta mínima y robusta.
    // Algunas combinaciones de permisos/campos hacen fallar toda la petición
    // si se solicitan reactions/comments/attachments junto con /posts.
    const facebookBasicFields = `id,message,created_time,permalink_url,from{id,name}`;

    async function fetchFacebookPosts() {
      const attempts = [
        `${pageId}/posts?fields=${facebookBasicFields}&limit=50`,
        `${pageId}/published_posts?fields=${facebookBasicFields}&limit=50`,
        `${pageId}/feed?fields=${facebookBasicFields}&limit=50`,
      ];
      const errors: string[] = [];

      for (const path of attempts) {
        try {
          const result = await graphGet(graphVersion, path, accessToken);
          const data = Array.isArray(result?.data) ? result.data : [];
          const own = data.filter((item: any) =>
            !item?.from?.id || String(item.from.id) === String(pageId)
          );

          if (own.length > 0) {
            return {
              data: own,
              source: path.split('?')[0].split('/').pop(),
              attempts: errors,
            };
          }

          // Si la colección respondió correctamente pero está vacía,
          // continuamos con el siguiente endpoint.
        } catch (error) {
          errors.push(`${path.split('?')[0]}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const error = new Error(
        errors.length
          ? `Facebook no devolvió publicaciones propias. ${errors.join(' | ')}`
          : 'Facebook respondió correctamente pero no devolvió publicaciones propias.'
      );
      (error as any).attempts = errors;
      throw error;
    }

    const [facebookPosts, instagramPosts] = await Promise.allSettled([
      fetchFacebookPosts(),
      graphGet(
        graphVersion,
        `${instagramId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=50`,
        accessToken,
      ),
    ]);

    const rows: any[] = [];
    const errors: Array<{ platform: string; message: string }> = [];
    let facebookSource: string | null = null;

    if (facebookPosts.status === "fulfilled") {
      facebookSource = facebookPosts.value?.source ?? null;
      for (const item of facebookPosts.value?.data ?? []) rows.push(mapFacebook(item, pageId));
    } else {
      const reason = facebookPosts.reason;
      errors.push({ platform: "facebook", message: reason?.message ?? String(reason) });
    }

    if (instagramPosts.status === "fulfilled") {
      for (const item of instagramPosts.value?.data ?? []) rows.push(mapInstagram(item, instagramId));
    } else {
      errors.push({ platform: "instagram", message: instagramPosts.reason?.message ?? String(instagramPosts.reason) });
    }

    if (rows.length) {
      const { error: upsertError } = await supabase
        .from("social_posts")
        .upsert(rows, { onConflict: "platform,external_id" });
      if (upsertError) {
        return json({ ok: false, code: "DB_UPSERT_FAILED", message: upsertError.message, errors }, 500);
      }
    }

    const facebookCount = rows.filter((x) => x.platform === "facebook").length;
    const instagramCount = rows.filter((x) => x.platform === "instagram").length;
    const durationMs = Date.now() - startedAt;

    return json({
      ok: true,
      partial: errors.length > 0,
      total: rows.length,
      facebook: facebookCount,
      instagram: instagramCount,
      facebook_source: facebookSource,
      errors,
      duration_ms: durationMs,
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    if ((error as any)?.name === "AbortError") {
      return json({ ok: false, code: "META_TIMEOUT", message: "Meta tardó demasiado en responder." }, 504);
    }
    return json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
