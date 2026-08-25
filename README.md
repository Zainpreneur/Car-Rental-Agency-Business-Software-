# FleetRent — Car Rental Agency Business Software

A full-stack web application for running a car rental agency: fleet management,
online bookings, customer accounts, payments, and vehicle maintenance tracking —
with role-based access for **Admins**, **Staff**, and **Customers**.

## Tech Stack

**Backend** (`/server`)
- Node.js + Express + TypeScript
- Prisma ORM + SQLite (zero-config, file-based — swap the datasource for Postgres/MySQL in production)
- JWT authentication, bcrypt password hashing
- Zod request validation

**Frontend** (`/client`)
- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Axios

## Features

- **Auth & roles** — register/login with JWT; Admin, Staff, and Customer roles with
  route- and API-level access control.
- **Fleet management** — add/edit/delete vehicles, categories, daily rates, status
  (available/rented/maintenance/retired), search & filter.
- **Bookings** — customers browse and reserve vehicles by date range with live
  availability/conflict checking and automatic price calculation; staff can create
  bookings on behalf of customers and drive the full lifecycle
  (Pending → Confirmed → Active → Completed, or Cancelled), which keeps vehicle
  status in sync automatically.
- **Customers** — staff directory of all customers with full booking history;
  customers manage their own profile.
- **Payments** — record and refund payments against bookings, revenue reporting.
- **Maintenance** — log service/repair/inspection records per vehicle; vehicle
  status automatically flips to "Maintenance" while work is scheduled/in progress.
- **Dashboard** — fleet utilization, active/pending bookings, monthly revenue,
  upcoming returns, and recent activity (Admin/Staff).

## Getting Started

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate   # creates the SQLite DB and applies the schema
npm run seed              # loads demo vehicles, bookings, and accounts
npm run dev                # http://localhost:4000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev                # http://localhost:5173 (proxies /api to :4000)
```

Open http://localhost:5173 in your browser.

### Demo accounts (password: `password123`)

| Role     | Email                    |
|----------|---------------------------|
| Admin    | admin@fleetrent.com       |
| Staff    | staff@fleetrent.com       |
| Customer | john.doe@example.com      |
| Customer | jane.smith@example.com    |

## Project Structure

```
server/
  prisma/schema.prisma   # data model (User, Vehicle, Booking, Payment, MaintenanceRecord)
  prisma/seed.ts          # demo data
  src/
    routes/                # one router per resource (auth, vehicles, bookings, ...)
    middleware/            # JWT auth, role guards, validation, error handling
    utils/

client/
  src/
    pages/                 # one file per screen
    components/            # Layout, ProtectedRoute, shared UI
    context/AuthContext.tsx
    api/                    # axios client
    types/                  # shared TypeScript types
```

## API Overview

All endpoints are namespaced under `/api` and (aside from `/auth/*`) require a
`Authorization: Bearer <token>` header.

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET/POST/PUT/DELETE /vehicles`, `GET /vehicles/:id/availability`
- `GET/POST /bookings`, `PATCH /bookings/:id/status`, `PUT /bookings/:id`
- `GET/PUT /customers`
- `GET/POST/PATCH /payments`
- `GET/POST/PUT/DELETE /maintenance`
- `GET /dashboard/stats` (Admin/Staff)

## Production Notes

- Swap `DATABASE_URL`/`provider` in `server/prisma/schema.prisma` for Postgres/MySQL
  and re-run migrations for production deployments.
- Set a strong `JWT_SECRET` and restrict `CLIENT_ORIGIN` via environment variables.
- Build the frontend with `npm run build` in `/client` and serve `/client/dist`
  behind a static host or the API server.
