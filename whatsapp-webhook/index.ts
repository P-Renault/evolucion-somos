import { createClient } from "jsr:@supabase/supabase-js@2";

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function cleanPhone(v: unknown) {
  return String(v || "").replace(/[^0-9]/g, "");
}

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

Deno.serve(async (req) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token && token === VERIFY_TOKEN) {
      return new Response(challenge || "", { status: 200 });
    }

    return json({ ok: false, error: "Webhook verification failed." }, 403);
  }

  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const payload = await req.json();

    if (payload?.object !== "whatsapp_business_account") {
      return json({ ok: true, ignored: true });
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change?.value || {};

        // Incoming messages
        for (const message of value.messages || []) {
          const phone = cleanPhone(message.from);
          if (!phone || !message.id) continue;

          const contactName =
            value.contacts?.find((c: any) => cleanPhone(c?.wa_id) === phone)?.profile?.name || null;

          const timestamp = message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          await supabase.from("whatsapp_messages").upsert({
            phone_number: phone,
            direction: "inbound",
            message_type: message.type || "unknown",
            body: messageBody(message),
            wamid: message.id,
            status: "received",
            contact_name: contactName,
            message_timestamp: timestamp,
            raw: message,
          }, { onConflict: "wamid" });
        }

        // Outbound status updates
        for (const status of value.statuses || []) {
          if (!status?.id) continue;
          await supabase
            .from("whatsapp_messages")
            .update({
              status: status.status || null,
              raw: status,
            })
            .eq("wamid", status.id);
        }
      }
    }

    return json({ ok: true });
  } catch (error) {
    return json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
