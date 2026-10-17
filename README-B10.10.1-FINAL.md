# Somos Software CRM · B10.10.1 Final Integrado

## Alcance
Entrega integral sobre el proyecto completo. Conserva la landing principal, Somos Impulsa, autenticación, contactos, calendario, redes/canales, WhatsApp y los módulos comerciales existentes.

## Correcciones incluidas
- Validación y normalización de ítems y montos de cotización.
- Descuento limitado al subtotal y tasa de IVA limitada a 0–100%.
- Validación de vigencia respecto de la fecha de emisión.
- Actualización del lead asociado por su ID real al aceptar una cotización; evita crear leads duplicados mediante `upsert`.
- Números generados con sufijo aleatorio de seis dígitos para reducir colisiones.
- Conversión a venta con fecha de vencimiento de pago independiente de la vigencia de la cotización.
- Recuperación ante una conversión concurrente de la misma cotización.
- Suscripción Realtime a `crm_quotes`.
- Migración única que prepara cotizaciones, ventas, RLS, índices, Realtime y bitácora de cambios de cotizaciones.

## Archivos principales
- `crm.html`
- `crm-data.js`
- `DEPLOY-B10.10.1-FINAL.sql`
- `DEPLOY-B10.10.1-FINAL.txt`

## Despliegue
1. En Supabase, ejecutar el archivo `DEPLOY-B10.10.1-FINAL.sql` completo una sola vez.
2. Si el script se detiene porque detecta varias ventas para una misma cotización, revisar primero los duplicados en `crm_sales`; no borrar registros sin decidir cuál es el válido.
3. Publicar el contenido del ZIP manteniendo la estructura de raíz del repositorio. Los archivos del sitio principal y `/somos-impulsa/` se conservan.
4. No reemplazar ni modificar las Edge Functions `whatsapp-api` ni `whatsapp-webhook`.
5. Tras el despliegue, probar los casos listados en `DEPLOY-B10.10.1-FINAL.txt`.

## Bitácora de auditoría
Los cambios en `crm_quotes` generan registros en `public.crm_quote_audit` con acción, actor, fecha y snapshots anterior/nuevo. La bitácora no sustituye los respaldos ni el control de acceso a Supabase.

## Límites de validación
La revisión del paquete y las comprobaciones estáticas no prueban la configuración real de Supabase, los permisos desplegados ni la entrega de mensajes en producción. Esas comprobaciones deben completarse en el entorno publicado.
