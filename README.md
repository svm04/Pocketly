# Pocketly

**A full-stack personal finance tracker — budgets, recurring transactions, savings goals, and one-click Excel reporting, built on the MERN stack.**

[![Frontend](https://img.shields.io/badge/frontend-React_19-61DAFB?logo=react&logoColor=white)](https://pocketly-six.vercel.app)
[![Backend](https://img.shields.io/badge/backend-Express_5-000000?logo=express&logoColor=white)](https://pocketly-api-amba.onrender.com)
[![Database](https://img.shields.io/badge/database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

**Live app:** [pocketly-six.vercel.app](https://pocketly-six.vercel.app)
**API:** [pocketly-api-amba.onrender.com](https://pocketly-api-amba.onrender.com)

> The API runs on Render's free tier, which spins the server down after periods of inactivity — the very first request after a quiet spell can take up to a minute to wake it back up. Everything after that is fast.

---

## Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Deployment](#deployment)
- [Notable engineering decisions](#notable-engineering-decisions)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

Pocketly is a personal expense and budgeting app: every income and expense entry is categorized, budgeted against, and rolled up into a live dashboard. Beyond basic CRUD, it handles the parts that make a finance tracker actually useful day to day — recurring bills that post themselves, budgets that carry forward each month, savings goals with progress tracking, and a one-click Excel export for anyone who wants their data outside the app.

It's built as two independently deployed services (a React SPA and an Express API) talking over a REST API, backed by MongoDB Atlas.

## Screenshots

<!--
  Drop screenshots or a short demo GIF here, e.g.:
  ![Dashboard](docs/screenshots/dashboard.png)
  ![Add Expense](docs/screenshots/add-expense.png)
-->

_Screenshots coming soon — see the [live app](https://pocketly-six.vercel.app) in the meantime._

## Features

**Tracking**
- Add, edit, and delete income and expenses, each with a category, icon, amount, date, and an optional description (e.g. "Dinner — Uber Eats" under Food).
- Category autocomplete that suggests your existing categories as you type, snaps typos to the closest existing match, and keeps icons in sync with whichever category you pick.
- Dashboard overview with balance/income/expense totals, recent transactions, and category/source breakdown charts — switchable between a monthly and yearly view.

**Budgeting & planning**
- Set a monthly spending limit per category, with live budget-vs-actual status and alerts on the dashboard.
- "Start New Month" closes out the current month (snapshotting its totals and budget performance) and copies budgets forward automatically — with catch-up logic so a missed month (e.g. the server was asleep on the 1st) is still handled correctly.
- Recurring transactions (rent, subscriptions, salary, etc.) that post themselves automatically on schedule via a daily cron job, with the same catch-up handling for downtime.
- Savings goals with contribution tracking and progress toward a target.

**Reporting**
- One-click "Export Report" download: a multi-sheet Excel workbook (via ExcelJS) with a yearly overview, income/expense ledgers with category breakdowns, a running-balance all-transactions sheet, and a per-month budget breakdown — for any selected year.
- Per-page Excel export also available directly from the Income and Expense views.

**Account & security**
- JWT authentication with short-lived access tokens and rotating refresh tokens (reuse of a stale refresh token forces re-login rather than being silently trusted).
- Forgot/reset password flow with hashed, time-limited (15 min) reset tokens, delivered by email via Brevo's REST API.
- Passwords hashed with bcrypt; profile updates and avatar upload (stored as a data URI in MongoDB, so it survives the API's ephemeral filesystem on redeploy).
- Rate limiting on login, registration, and password-reset endpoints; input validation and NoSQL-injection guards on every auth field; `helmet` for baseline HTTP security headers.

**UX**
- Dark mode, fully responsive layout.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS v4, Recharts, Axios |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB (Atlas) |
| Auth | JSON Web Tokens (access + refresh), bcrypt |
| Email | Brevo transactional email REST API |
| Reporting | ExcelJS |
| Scheduling | node-cron |
| Hosting | Vercel (frontend), Render (API) |

## Architecture

```
┌─────────────────┐        HTTPS / REST        ┌──────────────────┐        ┌──────────────────┐
│  React (Vite)    │ ─────────────────────────▶ │  Express API      │ ─────▶ │  MongoDB Atlas    │
│  Vercel           │ ◀───────────────────────── │  Render            │ ◀───── │                    │
└─────────────────┘         JWT in header        └──────────────────┘        └──────────────────┘
                                                          │
                                                          ▼
                                                   Brevo REST API
                                                  (transactional email)
```

The frontend and backend are separate deployments with no shared runtime — the frontend talks to the API purely over HTTP, authenticating with a bearer token. Password-reset emails go out over Brevo's HTTPS API rather than SMTP, since Render's free tier blocks outbound SMTP ports (more on that below).

## Project structure

```
Pocketly/
├── backend/
│   ├── config/            # DB connection
│   ├── controllers/       # Route handlers (business logic)
│   ├── middleware/        # Auth guard, rate limiting, file upload
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── utils/             # Token helpers, email sender, validators
│   └── server.js          # App entry point
└── frontend/
    └── expense-tracker/
        └── src/
            ├── components/ # Reusable UI (cards, forms, layouts, charts)
            ├── context/     # Auth/user + theme context
            ├── hooks/       # Custom hooks (e.g. auth guard)
            ├── pages/       # Route-level views (Auth, Dashboard)
            └── utils/       # Axios instance, API path constants
```

## Getting started

### Prerequisites

- Node.js 18+ (the backend uses the native `fetch` API for email, which needs 18+)
- A MongoDB connection string (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works fine)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in the values (see below)
npm run dev             # nodemon, restarts on file changes
```

The API listens on `http://localhost:8000` by default.

### Frontend

```bash
cd frontend/expense-tracker
npm install
cp .env.example .env   # optional locally — defaults to localhost:8000
npm run dev
```

The app runs on Vite's default dev port (`http://localhost:5173`).

## Environment variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Random string used to sign JWTs — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PORT` | No | Local dev port (default `8000`); ignored on hosts like Render that set their own |
| `CLIENT_URL` | Yes in prod | Deployed frontend URL — used for CORS and building password-reset links |
| `NODE_ENV` | Yes in prod | Set to `production` on your host — disables the dev-only fallback that returns the reset link in the API response |
| `BREVO_API_KEY` | Optional | Enables real password-reset emails via Brevo's REST API. Without it, the reset link is logged to the console/API response instead |
| `EMAIL_FROM` | Optional | Sender address, must be verified in Brevo |
| `EMAIL_FROM_NAME` | Optional | Sender display name (defaults to "Pocketly") |

### `frontend/expense-tracker/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes in prod | Deployed backend URL. Leave unset locally — falls back to `http://localhost:8000` |

## API reference

All routes are prefixed `/api/v1`. Routes marked 🔒 require a `Bearer` access token.

<details>
<summary><strong>Auth</strong> — <code>/auth</code></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create an account |
| POST | `/login` | Log in, returns access + refresh tokens |
| GET 🔒 | `/getuser` | Get the current user's profile |
| POST | `/refresh-token` | Exchange a refresh token for a new token pair |
| POST 🔒 | `/logout` | Revoke the current refresh token |
| POST | `/forgot-password` | Request a password reset email |
| POST | `/reset-password/:token` | Reset password using a valid reset token |
| PUT 🔒 | `/profile` | Update name / avatar |
| PUT 🔒 | `/change-password` | Change password while logged in |
| POST | `/upload-image` | Upload a profile picture |

</details>

<details>
<summary><strong>Expenses</strong> — <code>/expense</code> 🔒</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/add` | Add an expense |
| GET | `/get` | List all expenses |
| GET | `/monthly-summary` | Category totals for a given month |
| GET | `/categories` | Distinct categories (for autocomplete) |
| GET | `/downloadexcel` | Export expenses to Excel |
| PUT | `/:id` | Update an expense |
| DELETE | `/:id` | Delete an expense |

</details>

<details>
<summary><strong>Income</strong> — <code>/income</code> 🔒</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/add` | Add an income entry |
| GET | `/get` | List all income |
| GET | `/monthly-summary` | Source totals for a given month |
| GET | `/downloadexcel` | Export income to Excel |
| PUT | `/:id` | Update an income entry |
| DELETE | `/:id` | Delete an income entry |

</details>

<details>
<summary><strong>Budgets</strong> — <code>/budget</code> 🔒</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/add` | Set a monthly budget for a category |
| GET | `/status` | Budget vs. actual spend, with alert flags |
| POST | `/copy-forward` | Copy this month's budgets to next month |
| PUT | `/:id` | Update a budget |
| DELETE | `/:id` | Delete a budget |

</details>

<details>
<summary><strong>Recurring transactions</strong> — <code>/recurring</code> 🔒</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/add` | Create a recurring transaction |
| GET | `/get` | List recurring transactions |
| PUT | `/:id/toggle` | Enable/disable a recurring transaction |
| DELETE | `/:id` | Delete a recurring transaction |

</details>

<details>
<summary><strong>Savings goals</strong> — <code>/goals</code> 🔒</summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/add` | Create a savings goal |
| GET | `/get` | List savings goals |
| PUT | `/:id` | Update a goal |
| PUT | `/:id/contribute` | Add a contribution toward a goal |
| DELETE | `/:id` | Delete a goal |

</details>

<details>
<summary><strong>Dashboard, transactions & monthly rollover</strong> 🔒</summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Aggregated dashboard data for a period |
| GET | `/transactions/get` | Combined income + expense ledger |
| GET | `/transactions/export/excel` | Export the combined ledger to Excel |
| GET | `/transactions/export/monthly-report` | Full-year workbook export |
| POST | `/monthly-rollover/start-new-month` | Close out the current month |
| GET | `/monthly-rollover/summary` | Last closed month's snapshot |

</details>

## Deployment

- **Frontend** — deployed on Vercel, built from `frontend/expense-tracker`. Set `VITE_API_BASE_URL` in the project's environment variables.
- **Backend** — deployed on Render as a web service, built from `backend`. Set the environment variables listed above; make sure `NODE_ENV=production` is set.
- **Database** — MongoDB Atlas.

**A gotcha worth knowing if you fork this:** Render's free tier blocks outbound traffic on SMTP ports (25/465/587). A plain `nodemailer`/SMTP setup will silently hang there — that's why password-reset email goes over Brevo's HTTPS REST API instead.

## Notable engineering decisions

A few things worth calling out beyond the feature list:

- **Category data integrity.** Categories are free-text with autocomplete, which meant `"Rent"` and `"Rent "` (trailing whitespace) could exist as two distinct categories, silently splitting a single category into two slices on every chart and budget total. Fixed at three layers: schema-level `trim: true`, a one-time backfill migration for existing data, and defensive trimming in every aggregation query — so the bug class can't reappear even if a future code path forgets to trim on input.
- **Email delivery under a platform constraint.** When Render started blocking outbound SMTP as an infrastructure-level policy change, password-reset emails began silently timing out in production. Rather than just upgrading to a paid tier, the email sender was rewritten to use Brevo's REST API over HTTPS — with the exact same function signature, so the calling code needed zero changes.
- **Auth hardening as a deliberate pass**, not an afterthought: rate limiting sized specifically to protect the free-tier email quota from abuse, NoSQL-injection guards on every field that reaches a database query, and consistent password/email validation across every auth endpoint.

## Roadmap

Ideas not yet implemented:

- Multi-currency support
- Shared/household budgets across multiple users
- Push/email budget-alert notifications (currently dashboard-only)
- Code-splitting the frontend bundle (currently a single ~1.2 MB chunk)

## License

MIT — see [LICENSE](./LICENSE).

---

Developed by **Senithi Malalanayake**
