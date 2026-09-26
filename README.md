# StockSense

A modular **Inventory Management System** that replaces manual registers and spreadsheets with a
centralized, real-time app for receipts, deliveries, internal transfers, stock adjustments and a
full stock ledger across multiple warehouses.

> Hackathon project. It's built in phases, with the state after each phase packaged as a handoff ZIP.
> See [`HANDOFF.md`](HANDOFF.md) for the current stage and the next steps.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS v4 (JavaScript) |
| Backend | Node.js, Express 5, Mongoose, JWT, bcryptjs, dotenv (JavaScript, ES modules) |
| Database | MongoDB Atlas (a replica set, needed for multi-document transactions) |

## Prerequisites

- Node.js **20+** (developed on 24)
- A MongoDB Atlas cluster and its connection string. Allow your IP in Atlas under **Network Access**.

## Quick start

```bash
# 1. Install everything (root, server, client)
npm run install:all

# 2. Configure environment
cp server/.env.example server/.env   # then set MONGODB_URI and JWT_SECRET
cp client/.env.example client/.env   # default API URL works for local dev

# 3. (Optional) load demo data: login admin01 / Admin@12345
npm run seed --prefix server

# 4. Run API + web app together
npm run dev
```

- Web app: http://localhost:5173
- API: http://localhost:5000/api (health check: http://localhost:5000/api/health)

On Windows PowerShell, use `Copy-Item server/.env.example server/.env` instead of `cp`.

### Run separately

```bash
npm run dev:server     # API with auto-reload (node --watch)
npm run dev:client     # Vite dev server
npm run build          # production build of the client -> client/dist
npm start              # API without auto-reload

npm run seed --prefix server              # demo data (refuses if users already exist)
npm run seed --prefix server -- --reset   # wipe all StockSense data, then seed
npm run smoke --prefix server             # end-to-end stock flow checks against the running API
```

`npm run smoke` creates its own user, warehouse and product (random codes), runs the receipt, transfer,
delivery and adjustment scenarios plus the guard rails, and prints PASS/FAIL for each check. It leaves
that test data in the database.

## Environment variables

### `server/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | **yes** | | MongoDB Atlas connection string. The server exits with a clear message if it's missing |
| `PORT` | no | `5000` | API port |
| `NODE_ENV` | no | `development` | `production` hides 500 error details and disables request logging |
| `CLIENT_URL` | no | `http://localhost:5173` | Allowed CORS origin(s), comma-separated |
| `JWT_SECRET` | **yes** | | Secret for signing JWTs (long random string) |
| `JWT_EXPIRES_IN` | no | `7d` | JWT lifetime |
| `OTP_TTL_MINUTES` | no | `10` | Password-reset OTP lifetime |
| `OTP_DEV_RESPONSE` | no | `false` | `true` returns the OTP in the forgot-password response (never in production). Handy for demos without email |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | no | | SMTP for OTP emails. Without `SMTP_HOST` the OTP is printed in the server console |

### `client/.env`

| Variable | Required | Example | Description |
|---|---|---|---|
| `VITE_API_URL` | **yes** | `http://localhost:5000/api` | API base URL, including `/api` |

There is **no Vite proxy**. The browser calls `VITE_API_URL` directly, and the server allows the
client's origin through CORS. If you change the client port or host, add it to `CLIENT_URL`.

Never commit `.env` files. Only the `.env.example` files are tracked.

## Project structure

```
stocksense/
├── client/                    React + Vite web app
│   └── src/
│       ├── components/        ui/ (Button, Input, Select, Modal, Table, Badge, Card, Form, ...),
│       │                      layout/ (Header, Logo), operations/ (LinesEditor, KanbanBoard)
│       ├── context/           AuthContext (JWT + user session), ToastContext
│       ├── hooks/             useAuth, useAsync, useForm, useLookups, useToast, useDebounce
│       ├── layouts/           AppLayout (top nav + page), AuthLayout
│       ├── mocks/             mock data used by the services until the API is wired (Phase 3 only)
│       ├── pages/             auth, dashboard, products, operations, ledger, settings, profile
│       ├── routes/            AppRoutes, ProtectedRoute, PublicRoute, paths.js
│       ├── services/          api.js (axios instance) + authApi, productApi, warehouseApi,
│       │                      operationApi, ledgerApi, dashboardApi
│       └── utils/             constants, format, operations config, validation, storage
├── server/                    Express REST API
│   └── src/
│       ├── config/            env.js (validated env), db.js (Mongo connection)
│       ├── controllers/       HTTP layer: parse request, call service, send response
│       ├── middleware/        auth (JWT), validate (zod), errorHandler, notFound
│       ├── models/            Mongoose schemas
│       ├── routes/            index.js mounts all routers under /api
│       ├── scripts/           seed.js (demo data), smoke.js (end-to-end checks)
│       ├── services/          business logic; stock.service.js is the only writer of stock
│       ├── utils/             ApiError, sendSuccess, transactions, query helpers
│       ├── validators/        zod request schemas
│       ├── app.js             Express app (middleware + routes)
│       └── server.js          entry: connect DB, start HTTP server
├── docs/
│   ├── API.md                 API contract (source of truth)
│   └── MOCKUP_NOTES.md        requirements read from the mockup
├── HANDOFF.md                 current stage, next steps
└── package.json               root scripts (install:all, dev, build)
```

## Conventions

**API responses.** Always `{ "success": true, "data": ... }` or
`{ "success": false, "message": "...", "errors"?: [...] }`. See [`docs/API.md`](docs/API.md).

**Backend layering.** routes → controllers → services → models. Controllers stay thin. Any code that
changes stock goes through the stock service, which also writes the ledger entry. Express 5 forwards
errors from async handlers automatically, so controllers can just `throw ApiError.badRequest('...')`.

**Frontend data access.** Pages never call axios directly. They call functions in `src/services/*Api.js`,
which return the `data` payload. Errors reach the page as `Error` objects with `message`, `status` and
optional `errors`.

**URLs.** Use `PATHS` from `src/routes/paths.js` instead of string literals.

**Styling.** Use the Tailwind theme tokens in `src/index.css` (`bg-bg`, `bg-surface`, `text-accent`,
`border-border`, ...), not raw hex values.

**Git.** Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`), one
coherent change per commit, and every commit must run.

## Handoff packages

Each phase ends with a ZIP built from the committed tree, so `node_modules`, `.env`, `.git` and build
output are never included:

```bash
git archive --format=zip -o stocksense-handoff-01.zip HEAD
```

The receiver unzips it, runs `npm run install:all`, creates the two `.env` files and runs `npm run dev`.
