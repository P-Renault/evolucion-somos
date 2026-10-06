import { createClient } from "jsr:@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "";
const APP_SECRET = Deno.env.get("META_APP_SECRET") || "";
const WABA_ID = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID") || "";
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");

function json(data: unknown, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }); }
function cleanPhone(v: unknown) { return String(v || "").replace(/[^0-9]/g, ""); }
function messageBody(message: any) {
  if (message?.type === "text") return message.text?.body || null;
  if (message?.type === "image") return message.image?.caption || "[Imagen recibida]";
  if (message?.type === "video") return message.video?.caption || "[Video recibido]";
  if (message?.type === "audio") return "[Audio recibido]";
  if (message?.type === "document") return message.document?.filename ? `[Documento: ${message.document.filename}]` : "[Documento recibido]";
  if (message?.type === "sticker") return "[Sticker recibido]";
  if (message?.type === "location") return "[Ubicación recibida]";
  if (message?.type === "contacts") return "[Contacto recibido]";
  return `[${message?.type || "Mensaje recibido"}]`;
}
async function verifySignature(req: Request, raw: string) {
  if (!APP_SECRET) return true;
  const header = req.headers.get("x-hub-signature-256") || "";
  if (!header.startsWith("sha256=")) return false;
  const expected = header.slice(7);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  const actual = Array.from(sig).map(b => b.toString(16).padStart(2, "0")).join("");
  if (actual.length !== expected.length) return false;
  let diff = 0; for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token && token === VERIFY_TOKEN) return new Response(challenge || "", { status: 200 });
    if (url.searchParams.get("check") === "health") return json({ ok: true, service: "whatsapp-webhook", verify_configured: !!VERIFY_TOKEN, signature_configured: !!APP_SECRET, waba_configured: !!WABA_ID, phone_number_id_configured: !!PHONE_NUMBER_ID });
    return json({ ok: false, error: "Webhook verification failed." }, 403);
  }
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
  const raw = await req.text();
  if (!(await verifySignature(req, raw))) return json({ ok: false, error: "Invalid webhook signature." }, 403);
  try {
    const payload = JSON.parse(raw);
    const eventRow = { waba_id: payload?.entry?.[0]?.id || null, phone_number_id: payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || null, field: payload?.entry?.[0]?.changes?.[0]?.field || null, received_at: new Date().toISOString(), payload, processing_status: "received", error_message: null };
    const eventInsert = await supabase.from("whatsapp_webhook_events").insert(eventRow).select("id").single();
    const eventId = eventInsert.data?.id || null;
    if (payload?.object !== "whatsapp_business_account") return json({ ok: true, ignored: true, event_id: eventId });

    let processedMessages = 0, processedStatuses = 0;
    for (const entry of payload.entry || []) for (const change of entry.changes || []) {
      const value = change?.value || {};
      const metadataPhone = cleanPhone(value?.metadata?.display_phone_number);
      const metadataId = String(value?.metadata?.phone_number_id || "");
      if (PHONE_NUMBER_ID && metadataId && metadataId !== PHONE_NUMBER_ID) continue;
      for (const message of value.messages || []) {
        const phone = cleanPhone(message.from); if (!phone || !message.id) continue;
        const contactName = value.contacts?.find((c: any) => cleanPhone(c?.wa_id) === phone)?.profile?.name || null;
        const timestamp = message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : new Date().toISOString();
        const result = await supabase.from("whatsapp_messages").upsert({ phone_number: phone, direction: "inbound", message_type: message.type || "unknown", body: messageBody(message), wamid: message.id, status: "received", contact_name: contactName, message_timestamp: timestamp, raw: { ...message, metadata_phone: metadataPhone } }, { onConflict: "wamid" });
        if (result.error) throw new Error(`whatsapp_messages inbound: ${result.error.message}`);
        processedMessages++;
      }
      for (const status of value.statuses || []) {
        if (!status?.id) continue;
        const result = await supabase.from("whatsapp_messages").update({ status: status.status || null, raw: status }).eq("wamid", status.id);
        if (result.error) throw new Error(`whatsapp_messages status: ${result.error.message}`);
        processedStatuses++;
      }
    }
    if (eventId) await supabase.from("whatsapp_webhook_events").update({ processing_status: "processed" }).eq("id", eventId);
    return json({ ok: true, event_id: eventId, processed_messages: processedMessages, processed_statuses: processedStatuses });
  } catch (error) {
    try {
      const payload = JSON.parse(raw); const eventWaba = payload?.entry?.[0]?.id || null;
      await supabase.from("whatsapp_webhook_events").insert({ waba_id: eventWaba, phone_number_id: payload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id || null, field: "error", received_at: new Date().toISOString(), payload, processing_status: "error", error_message: error instanceof Error ? error.message : String(error) });
    } catch (_) {}
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
