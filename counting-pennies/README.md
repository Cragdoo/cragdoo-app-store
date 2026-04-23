# Counting Pennies 💰

A self-hosted personal finance dashboard for tracking expenses, income, investments and savings — designed to run on [Umbrel OS](https://umbrel.com) as a Docker container.

## Features

### Expense & Income Tracking
- Log every transaction with date, description, category and amount
- Mark transactions as recurring (weekly / monthly / yearly)
- Filter by month, category, type or keyword search
- Pre-loaded with 23 common categories out of the box

### Pre-built Categories
| Household | Subscriptions | Transport | Income |
|---|---|---|---|
| Food & Grocery | Netflix | Gas & Fuel | Salary |
| Electricity | Sky TV | Transport | Freelance |
| Broadband | Apple TV+ | | Other Income |
| Rent / Mortgage | Amazon Prime | | |
| Insurance | Spotify | | |
| | Disney+ | | |

### Budget Tracking
- Set a monthly budget for any category
- Live progress bars showing spent vs budget
- Over-budget categories highlighted in red
- Inline editing — click any budget amount to update it instantly

### Investment Portfolio
- Track stocks, crypto, funds, bonds, property and other assets
- Unrealised gain / loss per holding and overall portfolio
- Allocation pie chart by asset type
- Symbol / ticker support

### Savings Goals
- Create goals with a target amount and optional target date
- Progress bars with quick-contribute modal
- Colour-coded goal cards

### Dashboard
- Monthly income, expenses, net balance and savings rate at a glance
- Expense breakdown pie chart
- 6-month income vs expense bar chart
- Budget progress summary
- Recent transactions feed
- Portfolio and savings goal widgets

### UI & Customisation
- **Dark and Light mode** with system-preference detection
- Collapsible sidebar navigation
- Fully customisable categories (name, colour, icon, budget, subscription flag)
- Multi-currency support (GBP, USD, EUR, CAD, AUD, JPY, CHF, NOK, SEK)
- Responsive layout

---

## Self-Hosting

### Requirements
- Docker and Docker Compose
- ~250 MB disk space

### Quick Start

```bash
git clone https://github.com/Cragdoo/counting-pennies
cd counting-pennies
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Data is stored in `./data/finance.db` (SQLite) and persists across container restarts.

### Umbrel OS

Add via the Cragdoo community app store:

1. Open Umbrel → **App Store**
2. Scroll to **Community App Stores** → **Add Store**
3. Enter: `https://github.com/Cragdoo/cragdoo-app-store`
4. Install **Counting Pennies**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (via better-sqlite3, WAL mode) |
| Deployment | Docker Compose, nginx |

### Container Architecture

```
┌─────────────────────────────────┐
│  nginx  :80  (frontend)         │
│  React SPA + static assets      │
│  /api/* → proxied to backend    │
└────────────┬────────────────────┘
             │ internal network
┌────────────▼────────────────────┐
│  Node.js  :3001  (backend)      │
│  Express REST API               │
│  SQLite → /data/finance.db      │
└─────────────────────────────────┘
```

---

## Development

```bash
# Backend
cd backend
npm install
npm run dev        # runs on :3001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev        # runs on :5173, proxies /api to :3001
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Monthly totals, recent transactions, portfolio |
| GET | `/api/dashboard/trends` | 6-month income vs expense trend |
| GET/POST | `/api/transactions` | List / create transactions |
| PUT/DELETE | `/api/transactions/:id` | Update / delete transaction |
| GET/POST | `/api/categories` | List / create categories |
| PUT/DELETE | `/api/categories/:id` | Update / delete category |
| GET/POST | `/api/investments` | List / create investments |
| GET | `/api/investments/summary` | Portfolio totals and allocation |
| GET/POST | `/api/savings` | List / create savings goals |
| POST | `/api/savings/:id/contribute` | Add funds to a savings goal |
| GET/PUT | `/api/settings` | Get / update app settings |

---

## License

MIT
