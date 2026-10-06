# SOMOS SOFTWARE CRM B10.5.1

Corrección incremental sobre B10.5. No reemplaza la arquitectura existente.

## Correcciones

1. `crm.html`: la tabla `social_posts` ahora se renderiza dentro de `renderSocial()`, después de cargar los datos desde Supabase. Esto corrige el caso en que existen publicaciones en `social_posts` pero el CRM muestra "Sin publicaciones sincronizadas todavía".
2. `crm.html`: la sincronización de publicaciones muestra conteos separados de Facebook e Instagram y distingue sincronización parcial.
3. `meta-posts/index.ts`: usa `META_ACCESS_TOKEN` exclusivamente para Facebook/Instagram; no utiliza `WHATSAPP_ACCESS_TOKEN`.
4. `meta-posts/index.ts`: registra/actualiza `social_accounts` con los IDs reales.
5. `meta-posts/index.ts`: conserva Instagram operativo y reporta errores de Facebook sin ocultarlos.
6. `social-b1051-repair.sql`: ajuste no destructivo de índices/permisos de `social_accounts`.

## Secrets requeridos para Meta social

- `META_ACCESS_TOKEN`
- `META_PAGE_ID`
- `META_INSTAGRAM_ID`
- `META_GRAPH_VERSION` (recomendado `v26.0`)

`WHATSAPP_ACCESS_TOKEN` queda reservado para `whatsapp-api`.

## Despliegue

### 1. SQL
Ejecutar `social-b1051-repair.sql` en Supabase SQL Editor.

### 2. Edge Function
Actualizar la función existente `meta-posts` con `meta-posts/index.ts`.

### 3. CRM
Reemplazar `crm.html` y `crm-data.js` en el repositorio/Pages correspondiente.

### 4. Prueba
1. Iniciar sesión en CRM.
2. Pulsar `Sincronizar Meta`.
3. Pulsar `Sincronizar publicaciones`.
4. Verificar que la tabla muestre las 2 publicaciones existentes de Instagram.
5. Verificar la nueva publicación creada directamente en Facebook.
6. Consultar `social_posts` si se necesita auditoría.

## Importante

No modificar `whatsapp-api` ni sus Secrets.
No borrar los registros existentes de `social_posts`.
No colocar tokens en GitHub Pages, HTML o JavaScript del navegador.
