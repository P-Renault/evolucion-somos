# Somos Software — B9.4 CRM Real + Mobile

## Qué cambia
B9.4 conserva la arquitectura visual de B9.3 y agrega dos capas:

1. **Experiencia móvil CRM**: en escritorio permanece el Kanban horizontal; en móvil se transforma en pipeline vertical por estados, sin desplazamiento horizontal.
2. **Backend preparado para Supabase**: autenticación por correo/contraseña, persistencia centralizada y RLS. Si Supabase no está configurado, el CRM continúa en modo local para no romper la demo.

## Activación del backend
1. Crear un proyecto en Supabase.
2. Ejecutar `supabase-schema.sql` en SQL Editor.
3. Crear un usuario en Authentication → Users.
4. Crear su registro en `public.profiles`.
5. Editar `supabase-config.js` con la URL del proyecto y la anon/publishable key.
6. Cambiar `enabled:false` a `enabled:true`.
7. Publicar el proyecto.

### Seguridad
- Nunca poner `service_role` en GitHub Pages.
- La key pública/anon solo es segura con RLS correctamente configurado.
- La política inicial permite CRUD de leads a usuarios autenticados; en una siguiente iteración conviene endurecer permisos por rol.

## Flujo
Landing → captura comercial → localStorage (fallback) / Supabase → CRM → pipeline → seguimiento → cotización/cierre.

## Próxima evolución recomendada: B9.5
- roles reales admin/vendedor/lector;
- actividades y bitácora por lead;
- agenda integrada;
- recordatorios;
- cotizaciones;
- métricas de conversión;
- auditoría;
- políticas de retención y privacidad.

## Configuración aplicada — Producción Supabase

El CRM queda configurado para el proyecto Supabase de Somos Software mediante una **publishable/anon key**. No se incorpora ninguna `service_role`/secret key.

### Sesión persistente

El cliente Supabase usa `persistSession:true` + `autoRefreshToken:true` y un almacenamiento persistente basado en IndexedDB, con fallback a `localStorage`.

Comportamiento esperado:
- cerrar el navegador: **no obliga a iniciar sesión nuevamente**;
- abrir nuevamente el CRM en el mismo navegador/perfil: **recupera la sesión automáticamente** mientras siga válida;
- borrar el historial de navegación normal: la sesión de autenticación se mantiene porque no depende del historial;
- usar "borrar cookies/datos del sitio" o borrar almacenamiento de la aplicación: **sí puede eliminar la sesión**, por seguridad y por las reglas del navegador;
- cerrar sesión desde el CRM: elimina la sesión local y exige autenticación nuevamente.

La contraseña del usuario **no se guarda** en el código ni en el almacenamiento del navegador. El navegador conserva la sesión/token administrado por Supabase.
