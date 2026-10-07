# Somos Software CRM B10.6.2 — Contactos 360 + Calendario Editorial + Reportes

Base: B10.6.1. No modifica las Edge Functions de WhatsApp.

## Frontend
- crm.html
- crm-data.js
- supabase-config.js

## Nuevas capacidades
- Ficha Contacto 360°.
- Actividad por contacto: nota, llamada, WhatsApp, correo, reunión, seguimiento, cotización u otro.
- Acceso directo desde contacto a WhatsApp.
- Calendario editorial con filtros por canal/estado.
- Resumen mensual de estados.
- Duplicar planificación.
- Marcar planificación como publicada.
- Reportes base con resumen multicanal.
- Realtime para contactos, actividad, calendario, publicaciones y métricas.

## Supabase
Ejecutar `contacts-social-calendar-schema.sql` completo. Si las tablas ya existen, el script es idempotente para las operaciones incluidas.

## WhatsApp
Se conserva B10.6.1: envío y recepción ya validados. La persistencia automática del chat y eliminación de botones de verificación del flujo normal queda pendiente para el cierre de WhatsApp.
