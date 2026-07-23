# Attendance Biometric System (نظام البصمة وتسجيل الحضور)

A full-stack Arabic-language attendance and biometric management system.

## Stack

- **Frontend**: React 19, Vite, TailwindCSS v4, shadcn/ui, tRPC client, TanStack Query, Wouter (routing)
- **Backend**: Node.js, Express, tRPC server
- **Database**: PostgreSQL via Drizzle ORM (Replit's managed PostgreSQL)
- **Auth**: Manus OAuth (JWT session cookies)
- **Language**: Arabic UI (RTL)

## How to run

```
pnpm run dev
```

This starts the combined dev server (Express + Vite) on port **5000**.

## Database

Schema is defined in `drizzle/schema.ts`. To regenerate and apply migrations:

```
pnpm db:push
```

The `DATABASE_URL` environment variable is managed automatically by Replit.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Runtime-managed by Replit |
| `SESSION_SECRET` | ✅ | Used as JWT cookie signing key |
| `JWT_SECRET` | Optional | Falls back to SESSION_SECRET |
| `OAUTH_SERVER_URL` | Optional | Manus OAuth server URL for login |
| `VITE_APP_ID` | Optional | App ID for Manus OAuth |
| `OWNER_OPEN_ID` | Optional | OpenID of the admin owner |

## Project structure

```
client/        React frontend (src/)
server/        Express + tRPC backend
  _core/       Server bootstrap, OAuth, env, SDK
  db.ts        Database access layer
  routers.ts   tRPC router definitions
drizzle/       Schema and migrations
shared/        Shared types and constants
```

## User preferences

- Keep the Arabic UI and RTL layout as-is
- Do not restructure or migrate the existing stack
