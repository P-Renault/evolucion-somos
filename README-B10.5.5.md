# SOMOS SOFTWARE CRM B10.5.5 — Redes & Canales unificadas

## Objetivo
Corregir la lectura visual de Redes & Canales sin alterar Supabase ni WhatsApp.

## Cambios
- Los cuadros Facebook/Instagram ya no mezclan registros `demo` con métricas reales.
- Se elimina el cálculo engañoso de `-100` / `-120` causado por comparar métricas reales con registros demo.
- El origen del dato se muestra explícitamente: `META REAL`, `META REAL · sin respuesta de métrica`, `Sin conexión API` o `Solo datos demo`.
- Si existe cuenta social activa, el canal no aparece como pendiente aunque la métrica todavía sea 0.
- `Actualizar datos guardados` vuelve a cargar cuentas, métricas, sincronizaciones y publicaciones desde Supabase.
- `Sincronizar Meta` continúa siendo responsable de `social_metrics`.
- `Sincronizar publicaciones` continúa siendo responsable de `social_posts`.
- Se mantiene el timeout de 25 segundos en `crm-data.js` para ambas funciones.

## Archivos
- crm.html
- crm-data.js

## No modificar
- whatsapp-api
- WHATSAPP_ACCESS_TOKEN
- WABA / Phone Number ID
- tablas ni datos de WhatsApp

## Prueba
1. Reemplazar `crm.html` y `crm-data.js` en GitHub Pages.
2. Recargar el CRM.
3. Abrir REDES & CANALES.
4. Pulsar `Actualizar datos guardados`.
5. Verificar que Facebook e Instagram ya no comparen los registros demo con los reales.
6. Luego probar `Sincronizar Meta`.
