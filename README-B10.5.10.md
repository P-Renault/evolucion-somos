# SOMOS SOFTWARE CRM B10.5.10
## Facebook publication retrieval — robust minimal fields

This version changes only the `meta-posts` Edge Function.

### Why
The previous Facebook request asked for `attachments`, `shares`, `comments.summary(true)` and `reactions.summary(true)` in the same `/posts` request. If the token/API rejects any of those fields, the entire Facebook collection can fail even though the Page itself is accessible.

### Fix
Facebook publication retrieval now starts with minimal fields:
- id
- message
- created_time
- permalink_url
- from{id,name}

It tries, in order:
1. `/{PAGE_ID}/posts`
2. `/{PAGE_ID}/published_posts`
3. `/{PAGE_ID}/feed`

It filters to posts authored by the Page and returns `facebook_source` in the response.

Instagram behavior remains unchanged.

### Deploy
Replace only `meta-posts/index.ts` in Supabase Edge Functions and deploy.
Do not change SQL, WhatsApp, `meta-sync`, or secrets.
