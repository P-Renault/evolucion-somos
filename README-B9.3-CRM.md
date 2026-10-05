# B9.3 CRM Comercial

CRM funcional de primera etapa integrado al flujo B9.2.

- Pipeline: Nuevo → Contactado → Calificado → Diagnóstico → Agenda → Cotización enviada → Negociación → Ganado/Perdido → Postventa.
- Ficha de lead: identidad, empresa, contacto, necesidad, estado, prioridad, próxima acción, fecha, valor, responsable y notas.
- KPIs: total, abiertos, ganados, seguimientos vencidos y valor del pipeline.
- Búsqueda y filtros.
- Exportación CSV.
- Consume `somos_leads_pending` generado por `commercial.js`.
- Datos locales para validación.

Pendiente para producción: backend seguro, autenticación, roles, base de datos multiusuario, auditoría, agenda real, notificaciones y política de retención/privacidad.
