import { createClient } from "jsr:@supabase/supabase-js@2";

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") || "v26.0";
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const WABA_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "";
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const PHONE_NUMBER = Deno.env.get("WHATSAPP_PHONE_NUMBER") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanPhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

async function graph(path: string, init: RequestInit = {}) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method === "GET") {
    const url = new URL(req.url);
    if (url.searchParams.get("check") === "meta") {
      if (!ACCESS_TOKEN || !WABA_ID) return json({ ok: false, code: "WHATSAPP_CONFIG_MISSING" }, 503);
      const response = await graph(`${WABA_ID}?fields=id,name,phone_numbers{id,display_phone_number,verified_name,quality_rating}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return json({ ok: false, code: "META_ERROR", meta: body }, response.status);
      return json({ ok: true, service: "whatsapp-api", meta: { connected: true, waba_id: body.id, name: body.name, phone_numbers: body.phone_numbers?.data || [] } });
    }
    return json({ ok: true, service: "whatsapp-api", status: "ready" });
  }

  if (req.method !== "POST") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return json({ ok: false, code: "AUTH_REQUIRED" }, 401);

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return json({ ok: false, code: "WHATSAPP_CONFIG_MISSING" }, 503);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "check_meta") {
      const response = await graph(`${PHONE_NUMBER_ID}?fields=id,display_phone_number,verified_name,quality_rating`);
      const meta = await response.json().catch(() => ({}));
      if (!response.ok) return json({ ok: false, code: "META_ERROR", error: meta?.error?.message || "Meta error", meta }, response.status);
      return json({ ok: true, meta });
    }

    if (action === "send_text") {
      const to = cleanPhone(body?.to);
      const message = String(body?.message || "").trim();
      if (!/^\d{8,15}$/.test(to)) return json({ ok: false, code: "INVALID_PHONE", error: "Número inválido. Usa formato internacional sin + ni espacios." }, 400);
      if (!message || message.length > 4096) return json({ ok: false, code: "INVALID_MESSAGE", error: "El mensaje debe tener entre 1 y 4096 caracteres." }, 400);

      const response = await graph(`${PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body: message } }),
      });
      const meta = await response.json().catch(() => ({}));
      if (!response.ok) return json({ ok: false, code: "META_SEND_ERROR", error: meta?.error?.message || "Meta rechazó el mensaje.", meta }, response.status);

      const wamid = meta?.messages?.[0]?.id || null;
      await supabase.from("whatsapp_messages").upsert({
        phone_number: to,
        direction: "outbound",
        message_type: "text",
        body: message,
        wamid,
        status: "accepted",
        contact_name: null,
        message_timestamp: new Date().toISOString(),
        raw: meta,
      }, { onConflict: "wamid" });

      return json({ ok: true, to, wamid, meta });
    }

    return json({ ok: false, code: "UNKNOWN_ACTION", error: "Acción no soportada." }, 400);
  } catch (error) {
    return json({ ok: false, code: "INTERNAL_ERROR", error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
