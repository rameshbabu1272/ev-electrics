# MySQL and Prisma setup

The application now uses Prisma ORM with MySQL. The old `data/volt-motion.db`
file is no longer read by the server.

## 1. Create the database and user

Run these statements as a MySQL administrator:

```sql
CREATE DATABASE sai_electics
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'sai_user'@'%' IDENTIFIED BY 'replace_with_a_strong_password';
GRANT ALL PRIVILEGES ON sai_electics.* TO 'sai_user'@'%';
FLUSH PRIVILEGES;
```

For a local-only MySQL user, replace `'%'` with `'localhost'`.

## 2. Configure the application

Copy `.env.example` to `.env` and set the real credentials:

```env
DATABASE_URL="mysql://sai_user:password@127.0.0.1:3306/sai_electics?connection_limit=5"
ADMIN_EMAIL="admin@saielectics.in"
ADMIN_PASSWORD="use-a-strong-password"
PORT="3000"
```

URL-encode special characters in the username and password.

## 3. Create and seed the schema

```powershell
npm run db:push
npm run db:seed
```

For a migration-based production workflow, use:

```powershell
npm run db:migrate -- --name init_mysql
npm run db:deploy
```

## 4. Run locally

```powershell
npm run build
npm start
```

Health check:

```text
http://localhost:3000/api/health
```

It should return:

```json
{ "ok": true, "database": "mysql" }
```

## Vercel

Use a hosted MySQL-compatible database such as PlanetScale, Aiven, Railway,
DigitalOcean, AWS RDS, or another provider with a pooled/serverless connection.
Add `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` to the Vercel project's
environment variables. Apply the schema and seed once from a trusted local
machine or CI environment before deploying the application.
