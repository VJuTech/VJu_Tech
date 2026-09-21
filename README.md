# VJU Tech Web Platform

The corporate website, client portal, and service platform for **VJU Tech Limited**.

## Stack

- Node.js and Express
- EJS server-rendered views
- PostgreSQL only, accessed through `pg`
- MVC project structure
- pnpm package management
- Helmet security headers, compression, rate limiting, and production HTTPS enforcement

## Local setup

1. Create a PostgreSQL database named `vju_tech`.
2. Update the existing `.env` file with your local connection values.
3. Run `psql "$DATABASE_URL" -f src/database/rebuild.sql` to create the schema.
4. Install dependencies with `pnpm install`.
5. Start development mode with `pnpm dev`.

The application is available at `http://localhost:3000`.

## Structure

```text
src/
  config/          Environment configuration
  controllers/     Request handlers
  database/        PostgreSQL pool and schema
  middleware/      Shared request middleware
  models/          Database access and domain data
  routes/          HTTP route declarations
  views/           EJS pages and partials
public/
  css/             Stylesheets, one file per view
  images/          Static image assets
```

## Architecture

The browser renders EJS views through the Express MVC application. Routes delegate to controllers, controllers use PostgreSQL-backed models, and PostgreSQL is the only source of persisted application state. Sessions use the PostgreSQL `session` table through `connect-pg-simple`.

The project remains on Node.js and Express as established in the product blueprint. Django is not introduced because it would create a second backend stack and duplicate the existing application boundary.

## Production requirements

- Set `NODE_ENV=production`, a strong `SESSION_SECRET`, and valid PostgreSQL credentials in `.env`.
- Terminate TLS at Render or the production reverse proxy; the application redirects non-HTTPS production requests.
- Run `src/database/rebuild.sql` against the target PostgreSQL database before starting the service.
- Configure SMTP values in `.env` before enabling email notifications.

## Seeded administrator and backups

The rebuild schema seeds a development administrator:

- Email: `admin@vjutech.com`
- Password: `VjuTechAdmin!2026`

Change this password immediately in any shared or production environment.

Run `scripts/backup-database.ps1` daily from Windows Task Scheduler or an operations job. It uses `pg_dump` and `DATABASE_URL` to create timestamped PostgreSQL custom-format backups.