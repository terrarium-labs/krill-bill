# Krill Bill

Open, free **invoice manager and viewer** — create invoices, auto-fill from contacts, export PDF. Hono on Cloudflare Workers + React SPA in one monorepo (dropafile-style layout).

## Stack

```text
src/
├── api-server/   # Hono worker — /health, optional /api/contacts (KV)
└── app/          # React SPA — invoices + contacts in localStorage
```

- **No login** — invoices and contacts stay in the browser (`localStorage`)
- **No Supabase** — optional Cloudflare KV API for deployed sync
- **Contact auto-fill** — pick a contact when editing an invoice; bill-to fields populate instantly
- **PDF export** — browser print dialog (Save as PDF)

## Quick start

```bash
bun install
bun run dev
```

Open **http://localhost:5173**.

1. Set your **company profile** under Company (issuer / From block)
2. Add **contacts** (clients, providers, partners)
3. **New invoice** → select a contact → add line items → **Export PDF**

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Vite + Cloudflare worker |
| `bun run build` | Production build |
| `bun run deploy` | Build and deploy to Workers |

## Storage

| Layer | Key / route | Purpose |
|-------|-------------|---------|
| Browser | `krill-bill:invoices` | Saved invoices |
| Browser | `krill-bill:contacts` | Contact directory |
| Browser | `krill-bill:company` | Your company profile (invoice issuer) |
| Worker KV | `GET/POST /api/contacts` | Optional cloud backup when KV is configured |

Replace the placeholder KV namespace IDs in `wrangler.toml` before production deploy.

## Related

Former **`krill-bill-backend`** repo is merged into this monorepo.
