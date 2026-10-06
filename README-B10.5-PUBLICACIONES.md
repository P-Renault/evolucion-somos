# Somos Software CRM B10.5 — Registro de publicaciones

## Objetivo
Agregar al módulo **REDES & CANALES** un registro persistente de publicaciones de Facebook e Instagram, sin modificar la integración existente de WhatsApp ni el `whatsapp-api`.

## Archivos
- `crm.html` — interfaz B10.5 con botón y tabla de publicaciones.
- `crm-data.js` — lectura de `social_posts` y llamada a la nueva Edge Function.
- `social-posts-schema.sql` — tabla `public.social_posts`, índices, RLS y trigger.
- `meta-posts/index.ts` — Edge Function `meta-posts` para consultar publicaciones de Facebook/Instagram mediante Meta Graph API y guardarlas en Supabase.

## Secrets utilizados
La función reutiliza los Secrets ya existentes/configurados:
- `WHATSAPP_ACCESS_TOKEN`
- `META_PAGE_ID`
- `META_INSTAGRAM_ID`
- `META_GRAPH_VERSION`

No crea ni requiere `META_ACCESS_TOKEN`.

## Despliegue recomendado
1. En Supabase SQL Editor ejecutar `social-posts-schema.sql`.
2. En Supabase Edge Functions crear una función llamada exactamente `meta-posts`.
3. Pegar `meta-posts/index.ts` y desplegar.
4. Reemplazar en GitHub Pages el `crm.html` y `crm-data.js` por los de este paquete.
5. Abrir CRM → REDES & CANALES.
6. Pulsar **Sincronizar publicaciones**.

## Seguridad
- No se incluye ningún valor de token en estos archivos.
- No modificar `whatsapp-api`.
- No regenerar el token existente.
- Los tokens permanecen en Supabase Secrets.

## Alcance B10.5
Se registra por publicación: plataforma, ID externo de Meta, fecha, tipo de contenido, texto/caption, enlace, URL de media cuando está disponible, campaña/UTM si se detecta, interacciones disponibles y payload bruto (`raw`).

Las métricas de alcance/impresiones no se inventan: quedan `NULL` cuando el endpoint utilizado no las devuelve. Se podrán incorporar en una siguiente fase mediante endpoints de Insights y permisos específicos.
