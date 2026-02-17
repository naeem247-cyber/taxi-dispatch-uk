# UK Private Hire Taxi Dispatch Backend (Scaffold)

Backend scaffold for a **single-base UK private hire dispatch operation**.

## Stack
- Node.js + NestJS
- PostgreSQL
- TypeORM
- Socket.io (Nest WebSocket gateway)
- Docker / Docker Compose

## Implemented in this scaffold
- Clean module-based NestJS structure
- TypeORM migration-based schema (no raw init SQL)
- Core database entities/tables:
  - `accounts`
  - `drivers`
  - `vehicles`
  - `customers`
  - `jobs`
  - `recurring_jobs`
- JWT login endpoint (`POST /api/v1/auth/login`)
- Role model (`admin`, `operator`, `driver`)
- Driver GPS update endpoint (`PATCH /api/v1/drivers/:id/location`) with strict ownership for driver role
- Manual job creation endpoint (`POST /api/v1/jobs`)
- Job assignment endpoint (`PATCH /api/v1/jobs/:id/assign`) with nearest-driver fallback (Haversine)
- Job lifecycle transition endpoint (`PATCH /api/v1/jobs/:id/status`)
- Status lifecycle enforcement:
  - `requested -> accepted -> arrived -> on_trip -> completed`
- Socket.io gateway namespace `/dispatch` that emits `job.updated`
- Swagger docs at `/docs`
- Basic integration tests for auth and job lifecycle

## Project Structure

```text
src/
  app.module.ts
  main.ts
  common/
    decorators/roles.decorator.ts
    enums/
      role.enum.ts
      job-status.enum.ts
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    dto/login.dto.ts
    guards/
    strategies/
  accounts/
  drivers/
  jobs/
  customers/
  vehicles/
  recurring-jobs/
  database/entities/

migrations/
  (TypeORM migration files live under src/migrations)
```

## Environment
Copy:

```bash
cp .env.example .env
```

Then set secrets (`JWT_SECRET`) and DB credentials.

## Run with Docker

```bash
docker compose up --build
```

API base URL:
- `http://localhost:3000/api/v1`

Swagger:
- `http://localhost:3000/docs`

## Local Run (without Docker)

```bash
npm install
npm run migration:run
npm run start:dev
```

Run integration tests:

```bash
npm run test:integration
```

## Notes for Production Hardening (next steps)
- Add refresh token flow / token revocation
- Add account registration + password hashing policy
- Add migrations for schema evolution
- Add audit logs for job and assignment actions
- Add richer policy engine for complex operator/driver business rules
- Add operator queue / nearest-driver assignment strategy
- Add Redis adapter for multi-instance Socket.io scale
- Add rate limiting, request logging, and observability
- Add unit/integration tests and CI pipeline
