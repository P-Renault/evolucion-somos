# CMCRM B10.9 · Cotizaciones Comerciales

Evolución sobre B10.8. Añade gestión de cotizaciones y cierre comercial.

## Incluye
- Cotizaciones con número, cliente, empresa, email y teléfono.
- Ítems, cantidades, precios, descuento e IVA.
- Estados: Borrador, Emitida, Enviada, Aceptada, Rechazada, Vencida.
- Cálculo automático de subtotal, neto, IVA y total.
- Búsqueda y filtros.
- Vista de detalle.
- Impresión / generación de PDF mediante diálogo del navegador.
- Mensaje prellenado para WhatsApp.
- Email mediante cliente de correo.
- Conversión de cotización aceptada a lead Ganado cuando existe lead asociado.
- Persistencia Supabase mediante `crm_quotes`.

## Despliegue
Reemplazar únicamente `crm.html` y `crm-data.js`.

Si `crm_quotes` no existe en Supabase, ejecutar `quote-schema-B10.9.sql` una sola vez. No modificar las Edge Functions `whatsapp-api` ni `whatsapp-webhook`.

## Validación
1. COTIZACIONES → Nueva cotización.
2. Agregar 2 ítems.
3. Verificar subtotal, IVA y total.
4. Guardar y editar.
5. Abrir detalle → Imprimir/PDF.
6. Probar WhatsApp y Email.
7. Marcar aceptada y comprobar que el lead asociado pase a Ganado.
8. Confirmar que REPORTES, ACTIVIDADES, WhatsApp y Somos Impulsa continúan funcionando.
