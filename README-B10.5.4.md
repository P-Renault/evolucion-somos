# Somos Software CRM B10.5.4

Corrige el estado de carga infinito de **Sincronizar publicaciones**.

## Cambio
- `crm-data.js`: agrega timeout de 25 segundos a `meta-posts`.
- Si `meta-posts` no responde, el CRM muestra el error en vez de quedar en “Consultando Facebook + Instagram…”.

## Importante
La pantalla del usuario muestra **“Consultando Facebook + Instagram…”**, que pertenece al botón **Sincronizar publicaciones**, no al botón **Sincronizar Meta**.
