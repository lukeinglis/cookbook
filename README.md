# cookbook

Personal digital cookbook at `cooking.lukeinglis.me`. Single user, single password gate, phones and iPads as the primary clients.

Two layers: the cookbook (every recipe in one place, editable from a phone, with dated notes tracking how each dish changes over time) and the tooling (cook mode, grocery lists, meal timeline). The cookbook layer ships first.

## Stack

- Next.js on Vercel
- Vercel Postgres
- Vercel Blob (images)
- Password gate via middleware: shared password from env var, HttpOnly session cookie, every route behind it

## Docs

- [Product spec](docs/prd.md)
- [Schema](docs/schema.md)

## Local setup

```bash
git clone https://github.com/lukeinglis/cookbook.git
cd cookbook
npm install
```

### Required env vars

| Variable | Purpose |
| --- | --- |
| `POSTGRES_URL` | Vercel Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Direct connection for migrations |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access |
| `SITE_PASSWORD` | The shared password for the middleware gate |

```bash
cp .env.example .env.local
# fill in the values above
npm run dev
```

## Deployment

Vercel, matching the conventions of the other `*.lukeinglis.me` subdomains. Push to `main` deploys to production.
