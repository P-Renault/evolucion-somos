// B9.4 — Configuración pública de Supabase.
// Este archivo NO debe contener service_role keys.
// La anon/publishable key es apropiada para frontend SIEMPRE que RLS esté correctamente configurado.
// Para pruebas locales puedes dejar enabled:false.
// Para activar el backend:
// 1) Crea el proyecto Supabase.
// 2) Ejecuta supabase-schema.sql en SQL Editor.
// 3) Crea el usuario de acceso en Authentication.
// 4) Reemplaza url y anonKey.
// 5) Cambia enabled a true.
// 6) Publica ambos archivos junto con crm.html.
window.SOMOS_SUPABASE = {
  enabled: false,
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
};
