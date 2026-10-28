# 📖 PROJECT_GUIDE.md — Anam Store (Gas Pasal)

> A one-file guide to **what this repository is** and **how it works**.
> Read top to bottom and you'll know where everything lives.

---

## 1. What is this project?

**Anam Store / "Gas Pasal"** — a small shop-management app for a Nepali gas-cylinder store.
It replaces the paper register: customers, cylinder exchanges, dealer refills, stock, and daily
transactions, with a Nepali + English mobile-friendly UI.

| | |
|---|---|
| **Frontend** | React 19 + Vite + Tailwind CSS (SPA, no router — tab-based navigation) |
| **Backend** | Node.js + Express (REST API under `/api/*`) |
| **Database** | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| **Auth** | PIN/username + password → JWT stored in an **httpOnly cookie** |
| **Extras** | Web Push (web-push + VAPID), Nepali dates (`nepali-date-converter`), rate limiting, Helmet |
| **Deployment** | Frontend → Vercel, Backend → Render |

### Core features
- 🔐 PIN login, session restored on refresh (`GET /api/auth/me`)
- 👥 Customer registration & search
- 💰 Cylinder exchange recording (Lokpriya / Sugam / Everest brands)
- 📜 Per-customer transaction history
- 🚚 Dealer refill tracking (direct number input)
- 📊 Automatic stock + dashboard summaries
- 🧾 Full transaction ledger
- 🔔 Push notifications to admin devices
- 🇳🇵 Nepali ⇄ English interface

---

## 2. Directory map

```
.
├── PROJECT_GUIDE.md      ← this file
├── README.md             ← short feature list + tech stack table
├── package.json          ← root scripts (dev/build/start, uses `concurrently`)
├── start.bat             ← Windows launcher: checks Node/npm, creates .env files,
│                            installs deps, starts backend (5000) + frontend (5173)
├── start.txt             ← same script (kept as text copy)
│
├── backend/              ← Express REST API
│   ├── index.js          ← entry point: CORS, Helmet, rate limit, mounts all routes
│   ├── .env              ← SUPABASE_URL/KEYs, JWT_SECRET, PORT, VAPID_*, FRONTEND_URL
│   ├── config/
│   │   ├── database.js   ← Supabase client
│   │   └── constants.js
│   ├── routes/           ← URL → controller mapping
│   │   ├── authRoutes.js        /api/auth
│   │   ├── customerRoutes.js    /api/customers
│   │   ├── queueRoutes.js       /api/queue
│   │   ├── transactionRoutes.js /api/transactions
│   │   ├── stockRoutes.js       /api/stock
│   │   ├── refillRoutes.js      /api/refills
│   │   ├── dashboardRoutes.js   /api/dashboard
│   │   ├── adminRoutes.js       /api/admin
│   │   └── pushRoutes.js        /api/push
│   ├── controllers/      ← request handlers (business logic entry)
│   ├── services/         ← data logic: customer, transaction, stock, push
│   ├── middleware/
│   │   ├── auth.js       ← `authenticate` (JWT cookie/Bearer) + `authorize(...roles)`
│   │   └── validate.js   ← input validation
│   └── utils/            ← logger, helpers
│
└── frontend/             ← React SPA
    ├── index.html, vite.config.js, tailwind.config.js, postcss.config.js
    ├── .env              ← VITE_API_URL, VITE_VAPID_PUBLIC_KEY
    ├── public/           ← PWA bits (sw.js), icons
    └── src/
        ├── main.jsx      ← React entry
        ├── App.jsx       ← auth state + tab "router" (see §4)
        ├── pages/        ← one file per screen (Dashboard, Exchange, Queue, …)
        ├── components/
        │   ├── layout/   ← MainLayout (sidebar/bottom nav shell)
        │   ├── features/ ← customers, dealer, queue, stock, transactions
        │   ├── admin/    ← admin modals
        │   ├── ui/       ← Toast, modals
        │   └── icons/
        ├── context/LanguageContext.jsx  ← i18n (ne/en)
        ├── services/customerService.js
        ├── hooks/
        └── utils/        ← api.js, translations.js, dateUtils.js,
                             cylinderTranslator.js, pushNotifications.js
```

---

## 3. How the backend works

`backend/index.js` builds the Express app in this order:

1. Sets `TZ = Asia/Kathmandu`, loads `.env`
2. **CORS** — allows `FRONTEND_URL`, `https://gas-pasal.vercel.app`, and (dev only) `localhost:5173`
3. JSON + cookie parsers
4. **Security** — Helmet CSP/HSTS, `X-Frame-Options`, nosniff, etc.
5. 30 s request timeout
6. **Rate limit** on `/api/*` (100 req/15 min in prod, 1000 in dev) + stricter login limiter (5/15 min)
7. Health check `GET /api/health`
8. Mounts all 9 routers under `/api/...`
9. 404 handler + global error handler

### Request lifecycle

```
React page (utils/api.js)
   → fetch(`${VITE_API_URL}/...`, { credentials: 'include' })
   → Express route  (routes/xRoutes.js)
   → middleware/auth.js  authenticate  → decodes JWT cookie, loads user from Supabase `users`
   → middleware authorize('admin','mom') → role check (some routes)
   → controller (controllers/xController.js)
   → service (services/xService.js)   ← shared business logic
   → Supabase tables
   → JSON { success, data | message }
```

### Auth flow
1. `POST /api/auth/login` (rate-limited) → verifies credentials (bcrypt) → sets **httpOnly cookie `auth_token`**
2. Every protected call: `authenticate` reads the cookie (or `Bearer` header), verifies JWT with `JWT_SECRET`, and re-checks the user is `is_active` in the `users` table
3. `GET /api/auth/me` restores the session on page refresh; `POST /api/auth/logout` clears it
4. `authorize(...roles)` gates admin-only endpoints (roles seen in code: `admin`, `mom`, plus regular users)

### Database tables (Supabase)
| Table | Purpose |
|---|---|
| `users` | accounts, roles, active flag |
| `customers` | customer registry |
| `queue` | customers waiting to be served |
| `transactions` | cylinder exchanges / sales ledger |
| `stock` | per-cylinder-type stock counts |
| `dealer_refills` | refills received from the dealer |
| `push_subscriptions` | Web Push subscriptions for admin devices |

### Main endpoints
| Mount | Notable routes |
|---|---|
| `/api/auth` | `POST /login`, `GET /me`, `POST /logout` |
| `/api/customers` | `GET /`, `POST /`, `GET /:name/history`, `PUT /:id` |
| `/api/queue` | `GET /`, `POST /`, `DELETE /:id` |
| `/api/transactions` | `GET /`, `POST /`, `GET /:id`, `GET /customer/:name/history` |
| `/api/stock` | `GET /`, `PUT /:type` |
| `/api/refills` | `GET /`, `POST /`, `GET /count` |
| `/api/dashboard` | `GET /` (summary numbers) |
| `/api/admin` | `GET/POST/PUT/DELETE /users`, `POST /users/:id/reset-password`, `GET /users/stats` |
| `/api/push` | `POST /subscribe`, `GET /status`, `GET /devices`, `DELETE /devices/:id` |

---

## 4. How the frontend works

There is **no react-router**. `App.jsx` holds all navigation state:

```
loading?  → spinner
not logged in?  → <Login>            (calls POST /auth/me-style check on mount)
logged in  → <MainLayout>            (persistent shell / nav)
              activeTab === 'dashboard'      → <Dashboard>
                          'exchange'         → <Exchange>   (from Queue select)
                          'newcustomer'      → <NewCustomer>
                          'customers'        → <CustomerHistory>
                          'queue'            → <Queue>
                          'dealer'           → <DealerRefill>
                          'refillhistory'    → <RefillHistory>
                          'stock'            → <StockSummary>
                          'transactions'     → <Transactions>
                          'admin'            → <AdminPanel>
```

Key behaviours:
- **Session restore** — on mount `GET /auth/me`; 429 (rate limit) retries after 5 s.
- **Queue → Exchange flow** — picking a customer in `Queue`/`CustomerHistory` sets `queueCustomer`
  and switches the tab to `exchange`, pre-filling the exchange form.
- **Push** — after login, users with role `admin`/`mom` call `subscribeAdminToPush()` (`utils/pushNotifications.js`,
  uses `VITE_VAPID_PUBLIC_KEY`); the browser SW is in `public/sw.js`.
- **i18n** — `LanguageProvider` wraps the app; strings live in `utils/translations.js`,
  cylinder brand names in `utils/cylinderTranslator.js`.
- **API base** — `import.meta.env.VITE_API_URL` (see `frontend/src/utils/api.js`).

---

## 5. Running it

### Quick (Windows)
```bat
start.bat
```
Creates missing `.env` files, installs deps if needed, then starts:
- 🔧 Backend → http://localhost:5000
- 📱 Frontend → http://localhost:5173

### Manual
```bash
npm install            # root: concurrently
npm run dev            # runs backend + frontend together
```
or separately:
```bash
npm run dev:backend    # cd backend && nodemon index.js
npm run dev:frontend   # cd frontend && vite
```
Other root scripts: `npm run build` (frontend production build), `npm start` (backend only).

### Environment variables
**`backend/.env`**
```
PORT=5000
NODE_ENV=development
JWT_SECRET=...                 # required — server refuses to start without it
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
FRONTEND_URL=...
VAPID_PUBLIC_KEY=...  VAPID_PRIVATE_KEY=...  VAPID_SUBJECT=mailto:...
```
**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000/api   # includes the /api prefix (fallback in src/utils/api.js)
VITE_VAPID_PUBLIC_KEY=...
```
> Note: `start.bat` writes `VITE_API_URL=http://localhost:5000` without `/api` — add the
> `/api` suffix if requests 404 in dev.

---

## 6. Where to change what

| I want to… | Go to |
|---|---|
| Add a new API endpoint | `backend/routes/*Routes.js` → `controllers/*Controller.js` |
| Change data/business rules | `backend/services/*.js` |
| Add a DB table/column | Supabase, then the service that reads it |
| Change role/permission checks | `backend/middleware/auth.js` + `authorize(...)` in routes |
| Add a screen / nav tab | `frontend/src/pages/X.jsx`, then a branch in `App.jsx` + nav in `components/layout/MainLayout` |
| Translate UI text | `frontend/src/utils/translations.js` |
| Change API base URL / push keys | `frontend/.env` |
| CORS / rate limits / security headers | `backend/index.js` |
