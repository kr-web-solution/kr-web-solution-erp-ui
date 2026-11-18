# ERP UI routing map

Canonical paths (see `lib/routes.ts`). Old URLs redirect via `next.config.mjs`.

| Area | Path |
|------|------|
| Home (auth) | `/` → `/dashboard` or `/login` |
| Dashboard | `/dashboard` |
| Projects | `/projects`, `/projects/[id]` |
| Pipeline | `/pipeline`, `/pipeline/new`, `/pipeline/[id]` |
| Leads | `/leads`, `/leads/new`, `/leads/[id]` |
| Clients | `/clients`, `/clients/[id]` |
| Invoices | `/invoices`, `/invoices/new`, `/invoices/[id]` |
| Settings | `/settings` |
| Profile | `/profile` |

## Legacy redirects

- `/app` → `/dashboard`
- `/crm/leads/*` → `/leads/*`
- `/finance/invoices/*` → `/invoices/*`
- `/settings/company` → `/settings`
