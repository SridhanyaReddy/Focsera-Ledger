<div align="center">

# Focsera Ledger

**A clean, single-tenant financial ledger and invoice management platform built for Focsera Innovations.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-focsera--ledger.vercel.app-2563eb?style=flat-square&logo=vercel)](https://focsera-ledger.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_•_Node_•_Express_•_MongoDB-1e293b?style=flat-square)](https://github.com/SridhanyaReddy/Focsera-Ledger)
[![License](https://img.shields.io/badge/License-Proprietary-64748b?style=flat-square)](LICENSE)

[View Live App](https://focsera-ledger.vercel.app) • [Key Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start)

</div>

---

### Overview

**Focsera Ledger** is a full-stack accounting and invoicing web application custom-built for **Focsera Innovations Private Limited**. It streamlines milestone-based billing, client accounts, advance allocations, and double-entry ledger bookkeeping across Focsera’s 9 business divisions with full Indian GST compliance.

---

### Features

- **Double-Entry Running Ledger** — Real-time tracking of debits, credits, and running balance for every client and project.
- **Advance & Milestone Allocations** — Collect upfront retainers and allocate them across progress milestone invoices without double-counting cash.
- **Indian GST Compliance** — Automatic calculation of Intra-State (`CGST` + `SGST`) vs Inter-State (`IGST`) tax rules and currency amount-to-words conversion on printable vouchers.
- **Atomic Sequential Numbering** — Concurrency-safe sequence generation formatted per financial year (e.g. `FOC/INV/2026-27/001`).
- **9 Pre-Configured Divisions** — Unified reporting across Events, Studios, Marketing, Tech, Interiors, and more.
- **Export & Print** — Clean, formatted tax invoices, quotations, and payment receipts ready for client delivery.

---

### Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express (Serverless via Vercel)
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Authentication:** JWT, BcryptJS

---

### Architecture

```
[ Client: React + Vite ] ──( HTTPS / JWT )──> [ Vercel Serverless API ] ──( Mongoose )──> [ MongoDB Atlas ]
                                                         │
                                        ┌────────────────┴────────────────┐
                                        ▼                                 ▼
                               [ Ledger & Tax Engine ]        [ Atomic Numbering ]
```

---

### Quick Start

#### 1. Clone & Install
```bash
git clone https://github.com/SridhanyaReddy/Focsera-Ledger.git
cd Focsera-Ledger
npm run install:all
```

#### 2. Environment Variables
Add your credentials to `server/.env`:
```env
PORT=5050
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=your_mongodb_atlas_connection_string
```

#### 3. Run Locally
```bash
# Backend (Port 5050)
npm run server

# Frontend (Port 5173)
npm run client
```

---

### Automated Tests

Run the test suite verifying ledger calculations, GST apportionment, and sequencing:
```bash
npm test
```

---

<div align="center">

Built with care by **[Sridhanya Reddy](https://github.com/SridhanyaReddy)**

</div>
