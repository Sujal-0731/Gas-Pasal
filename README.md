# Anam Store

A gas cylinder management system for Nepali kirana stores.

This repository contains a React + Vite frontend and a Node.js + Express backend. The app is designed to manage:
- customer registration and search
- cylinder exchange transactions
- dealer refill records
- stock tracking for filled and empty cylinders
- queue management for incoming customers
- customer transaction history with Nepali UI labels

## Project Goals
- Provide a lightweight store management dashboard optimized for local Nepali businesses
- Use PIN-based protection instead of full user auth for easy deployment in a shop
- Keep data storage simple with Supabase / PostgreSQL
- Use Nepali language labels and locale formatting for better local usability

## Architecture
- `frontend/`: React application built with Vite and Tailwind CSS
- `backend/`: Express API server communicating with Supabase
- `package.json`: root scripts for local development and build orchestration

## Folder Structure
- `frontend/`
  - `src/App.jsx`: main app and tab navigation
  - `src/pages/`: feature pages like `Dashboard`, `Exchange`, `CustomerHistory`, `DealerRefill`, `Queue`, `RefillHistory`, `StockSummary`, `NewCustomer`
  - `src/components/`: reusable UI components and icons
- `backend/`
  - `index.js`: Express server with API routes and Supabase integration
- `README.md`: this file

## Key Features
- PIN lock screen on the frontend
- customer search and registration
- exchange transaction recording (filled cylinder given, empty cylinder returned)
- dealer refill logging with stock updates
- stock tracking by cylinder type
- queue creation, completion, and stock adjustment
- customer history display
- Nepali-language UI 

## Local Setup

### Prerequisites
- Node.js 18+ / npm
- Supabase project with tables for `customers`, `transactions`, `stock`, `dealer_refills`, and `queue`


### Install Dependencies

From the root:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Run Locally

From the root:
```bash
npm run dev
```

This runs both backend and frontend together using `concurrently`.

#### Or run separately
- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`

### Build
```bash
npm run build
```

## Backend API Summary
All backend API routes require the header `x-pin` with the correct `PIN_CODE`.

### Health
- `GET /api/health`

### Customers
- `GET /api/customers?search=...`
- `POST /api/customers`
  - body: `{ name, phone, address, remarks }`
- `GET /api/customers/:name/history`
  - returns customer details and transaction history

### Transactions
- `POST /api/transactions`
  - body: `{ customerName, emptyCylinder, filledCylinder, remarks, queueId? }`
  - updates stock counts and records exchange transactions

### Stock
- `GET /api/stock`
  - returns stock counts for each cylinder type

### Dealer Refills
- `POST /api/refills`
  - body includes `refillDate`, counts per cylinder, notes, and optional exchange values
- `GET /api/refills`
  - returns refill history

### Queue
- `GET /api/queue`
- `POST /api/queue`
  - body: `{ customerId, customerName, emptyCylinder, notes }`
- `DELETE /api/queue/:id`
  - removes queue record and adjusts empty stock

## Data Notes
- The backend stores data in Supabase tables and uses a normal timestamp-based workflow.
- Customer history uses Nepali locale formatting in the frontend/back-end display, but the core stored dates are Gregorian.

## How an AI Agent Should Understand This Repo
- This is a small shop management app for gas cylinder trading.
- The frontend is a React SPA with pages for transaction entry, customer history, refill recording, queue, and stock summary.
- The backend exposes REST endpoints to manage customers, transactions, refills, stock, and queue state.
- Supabase is used as the data store, and a simple PIN header is used for authorization.
- The project is designed for local use in a Nepali small business, with Nepali labels and some locale-specific behavior.

## Important Files
- `frontend/src/pages/Exchange.jsx`: customer exchange / transaction flow
- `frontend/src/pages/CustomerHistory.jsx`: shows customer history
- `frontend/src/pages/DealerRefill.jsx`: handles refill entries
- `frontend/src/pages/Queue.jsx`: queue management
- `backend/index.js`: all API route logic and stock updates

## Future Improvements
- implement true BS calendar date conversion for storage and display
- add Supabase row-level security or proper user auth
- improve validation and error handling across API routes
- add automated tests for backend and frontend
