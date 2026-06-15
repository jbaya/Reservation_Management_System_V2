# Reservation Management System (RMS)

A multi-tenant hotel reservation SaaS prototype focused on Google Sheets-style calendar UX with a modern PMS flow.

## What is included

- Multi-tenant Node.js backend with PostgreSQL-ready schema
- React + Vite frontend with calendar booking grid and booking form
- API structure for hotels, reservations, rooms, guests, payments, and housekeeping
- PWA-ready frontend base with offline-first caching points

## Architecture

- `backend/`: Express API, tenant isolation middleware, PostgreSQL connection
- `frontend/`: React app with calendar row/date grid, drag-ready booking cards, booking form panel

### System layers

1. **Authentication / Tenant layer**
   - Super admin management of hotels and users
   - Tenant context from subdomain or request header
2. **Reservation engine**
   - Booking lifecycle states
   - Room or category assignment
   - No-overbooking constraints
3. **Calendar UI**
   - Month view with rows as rooms/categories and columns as dates
   - Booking cards with guest, duration, rate plan, status colors
   - Drag / resize UX hooks
4. **Pricing & payments**
   - Configurable rate plans and seasonal rules
   - Payment ledger per reservation
5. **Guest & housekeeping**
   - Persistent guest profiles and booking history
   - Room status tracking

## Getting started

### Install dependencies

From root:

```bash
npm install
```

### Run development servers

```bash
npm run dev
```

### API server

- `http://localhost:4000`
- expects a `TENANT_ID` header for tenant isolation in development

### Frontend

- `http://localhost:5173`

## Notes

- This is a working prototype scaffold. The UI is built for calendar performance and simple booking workflow.
- The project is designed to be extended with audit logs, rate rules, and import tools from Google Sheets.
