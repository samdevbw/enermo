# ecoguide-chat (Supabase Edge Function)

Server side of **ENERMO EcoGuide**. Keeps the OpenAI key off the website, checks who is asking,
rate-limits, retrieves knowledge, and lets the model call only three approved tools.

| File | Purpose |
|---|---|
| `index.ts` | Deno entry: CORS, Supabase + OpenAI adapters, background embedding |
| `handler.ts` | Orchestration (validate → identify → rate-limit → retrieve → model + tools → save → log). All I/O injected. |
| `tools.ts` | `search_products`, `search_vendors`, `estimate_solar_system` — fixed, parameterised queries; the model never writes SQL |
| `sizing.ts` | Preliminary solar sizing engine with visible, configurable assumptions |
| `prompt.ts` | System instructions (role-aware, anti-fabrication rules) |
| `validate.ts` | Input validation and limits |

## Secrets (Supabase → Edge Functions → Secrets)
| Name | Required | Default |
|---|---|---|
| `OPENAI_API_KEY` | **yes** (until set, EcoGuide replies "being set up") | — |
| `OPENAI_MODEL` | no | `gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | no | `text-embedding-3-small` (must be 1536-dim) |
| `ECOGUIDE_ALLOWED_ORIGINS` | no | `https://enermo.co.bw,https://www.enermo.co.bw,http://localhost:5173` (+ Netlify previews) |
| `ECOGUIDE_VISITOR_HOURLY_LIMIT` / `ECOGUIDE_USER_HOURLY_LIMIT` | no | 15 / 40 |
| `ECOGUIDE_GLOBAL_DAILY_LIMIT` | no | 1500 answered questions per 24 h (cost guard) |

## Deploy
```bash
supabase functions deploy ecoguide-chat --no-verify-jwt
```
`--no-verify-jwt` is intentional: the site uses a publishable (non-JWT) key and visitors may chat
without signing in. The function verifies user tokens itself.

## Tests
```bash
deno test --allow-env supabase/functions/ecoguide-chat/
# or: node --experimental-strip-types --test supabase/functions/ecoguide-chat/*.test.ts
```
