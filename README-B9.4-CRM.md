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
