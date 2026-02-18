# Taxi Dispatch Frontend

Operator web dashboard for the Taxi Dispatch system.

## Stack
- React + Vite
- TypeScript
- Socket.io client
- JWT auth

## Pages
- Login
- Live Dispatch Board
- Drivers List
- Jobs Table

## Backend API
Uses existing backend API:
`http://localhost:3000/api/v1`

Configure with:

```bash
cp .env.example .env
```

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Notes
- Auth expects `POST /auth/login` returning `{ token: string }`
- Data endpoints used:
  - `GET /drivers`
  - `GET /jobs`
- Socket connects to backend host (API base minus `/api/v1`)
- Expected live events (if emitted by backend):
  - `dispatch:update`
  - `job:created`
  - `job:updated`
