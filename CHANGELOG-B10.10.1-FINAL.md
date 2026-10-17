# Changelog · B10.10.1 Final

- Audited the existing root CRM implementation for quote persistence, calculations, lead acceptance, sale conversion and Realtime.
- Corrected quote input normalization and calculation boundaries.
- Updated the existing lead by primary key when accepting a quote to avoid accidental duplicate lead creation.
- Added collision-resistant quote/sale number suffixes.
- Corrected sale payment due date when converting a quote.
- Added handling for concurrent quote-to-sale conversion.
- Added Realtime subscription for `crm_quotes`.
- Added an idempotent combined SQL deployment for quote/sales schema, RLS, indexes, updated-at triggers and quote audit snapshots.
- Preserved website root files and existing WhatsApp Edge Functions.
