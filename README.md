# Invoice Approval Desk — API

NestJS 12 + TypeORM + PostgreSQL backend for the invoice approval workflow. Invoices move through `PROCESSING → NEEDS_REVIEW → APPROVED | REJECTED`, and the API flags likely duplicate submissions and blocks approving them.

- Stack: NestJS 12, TypeORM, PostgreSQL 17, class-validator, oxlint, Vitest
- Deployed to Vercel as a single Vercel Function (Fluid compute)

## Requirements

- Node.js 20+
- Docker (for the local PostgreSQL) or any reachable PostgreSQL instance

## Run locally

```bash
git clone https://github.com/rehmanstackdev/invoice-desk-backend.git
cd invoice-desk-backend

npm install
cp .env.example .env
docker compose up -d db

npm run db:migrate
npm run db:seed
npm run start:dev
```

The API listens on <http://localhost:3001>. Verify it:

```bash
curl http://localhost:3001/invoices
```

`db:seed` is idempotent (it inserts with `ON CONFLICT DO NOTHING`), so it is safe to re-run. It creates six sample invoices, including a duplicate pair sharing vendor `Pioneer Concrete Supply` and invoice number `PCS-80396`.

To clean up the database container and its volume:

```bash
docker compose down -v
```

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `DATABASE_SSL` | no | Set `true` for managed providers (Neon, Supabase, RDS) |
| `PORT` | no | Defaults to `3001`; Vercel injects this automatically |
| `WEB_ORIGIN` | no | CORS origin, defaults to `http://localhost:3000` |
| `TYPEORM_MIGRATIONS_RUN` | no | Set `true` to run migrations on boot (used in production) |
| `OBSERVE_APP_KEY` / `OBSERVE_APP_SECRET` | no | Enables [Nest Observe](https://observe.nestjs.com) telemetry when both are set |

`src/config/load-env.ts` also reads a `.env` one directory up, so the API can be run from a workspace checkout that keeps shared env files at the root.

## API

| Method | Route | Notes |
| --- | --- | --- |
| `GET` | `/invoices` | Optional `?status=` filter; rejects unknown statuses with `400` |
| `GET` | `/invoices/:id` | `404` when not found; `400` on a non-UUID id |
| `POST` | `/invoices` | Requires at least one line item |
| `PATCH` | `/invoices/:id/status` | Body `{ "status": "APPROVED" \| "REJECTED" }` |

Every invoice response carries two computed fields that are not columns on the table:

- `isDuplicate` — true when another invoice shares the same normalized vendor name and invoice number
- `duplicateOf` — the id of the matching invoice, or `null`

`PATCH /invoices/:id/status` enforces two business rules: only `NEEDS_REVIEW` invoices can be decided, and a flagged duplicate cannot be approved. Everything else returns `400` with a message explaining which rule was hit.

### Example

```bash
curl -X POST http://localhost:3001/invoices \
  -H 'Content-Type: application/json' \
  -d '{
    "vendorName": "Pioneer Concrete Supply",
    "vendorEmail": "billing@pioneerconcrete.example",
    "invoiceNumber": "PCS-81000",
    "invoiceDate": "2026-09-30",
    "dueDate": "2026-10-30",
    "subtotal": 1000,
    "tax": 80,
    "total": 1080,
    "projectName": "Riverfront Medical Center",
    "lineItems": [
      { "description": "Ready-mix concrete", "quantity": 2, "unitPrice": 500, "amount": 1000 }
    ]
  }'
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled build |
| `npm run db:migrate` / `db:revert` | Apply / roll back migrations |
| `npm run db:seed` | Load sample invoices |
| `npm run lint` | oxlint with type-aware rules |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests |
| `npm run test:cov` | Coverage report |

## Deploy to Vercel

1. Import `rehmanstackdev/invoice-desk-backend` at [vercel.com/new](https://vercel.com/new). Leave Root Directory at the repo root.
2. `src/main.ts` is the Serverless Function. It default-exports a handler that lazily boots Nest once per container and forwards the request to the Express instance. The `listen()` call is guarded by `!process.env.VERCEL`, so local runs bind to `PORT` and Vercel runs do not. `vercel.json` routes every path to that file.
3. Add environment variables for Production and Preview:

   ```
   DATABASE_URL=postgresql://...
   DATABASE_SSL=true
   WEB_ORIGIN=https://<your-web-domain>
   TYPEORM_MIGRATIONS_RUN=true
   ```

4. Deploy. Vercel sets `PORT` itself; `src/main.ts` already reads it.

Set `TYPEORM_MIGRATIONS_RUN=true` on the first deploy so the schema is created, then leave it on. Migrations use `IF NOT EXISTS`-free raw DDL, so switching it off after the first successful run avoids re-running DDL on every cold start. Watch the deploy log for migration errors before promoting to production.

## Design notes

- **`synchronize: false` everywhere.** Schema changes only happen through the migration in `src/database/migrations/`. There is no path where entity decorators silently rewrite production tables.
- **Money as `numeric`.** `subtotal`, `tax`, `total`, `quantity`, `unitPrice`, and `amount` are `numeric` columns, surfaced as strings in the API. `InvoicesService.toDecimalString` normalizes every incoming value to two decimal places before it reaches TypeORM, so floats never round-trip through the database.
- **Duplicate detection at read time.** `findAll` groups by a normalized `vendor::invoiceNumber` key in memory and annotates the result. There is no unique index on those columns, because a real duplicate needs to persist so a human can review and reject it — enforcing uniqueness in the schema would make the exact case the workflow exists to catch impossible to store.
- **Validation at the pipe, not the service.** `ValidationPipe` in `src/main.ts` runs with `whitelist` and `forbidNonWhitelisted`, so unknown properties are a `400` and the DTOs in `dto/` are the contract.
