<div align="center">

# 🏛️ FOCSERA LEDGER & INVOICE ENGINE
### Enterprise Financial Ledger, Automated Invoicing & Compliance Platform

[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-0070F3?style=for-the-badge&logo=vercel&logoColor=white)](https://focsera-ledger.vercel.app)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js_20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express_4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

<p align="center">
  A production-grade, single-tenant financial ledger and billing operating system custom engineered for <b>Focsera Innovations Private Limited</b>. Features double-entry running balance tracking, milestone-based advance allocation, atomic FY-compliant sequence generation, statutory Indian GST compliance (Intra/Inter-state), and printable tax vouchers.
</p>

[Explore Live Demo](https://focsera-ledger.vercel.app) • [View Architecture](#-system-architecture) • [Key Features](#-core-capabilities--modules) • [API Overview](#-rest-api-architecture)

---

</div>

## 📌 Executive Summary

Modern creative and turnkey conglomerates face significant friction managing multi-divisional billing, fragmented advance retainers, and milestone cashflows through generic SaaS tools. **Focsera Ledger** was architected to solve this problem from first principles.

Built specifically for **Focsera Innovations Private Limited** (operating across 9 core business divisions ranging from experiential events and interior design to creative studios and enterprise digital engineering), this platform centralizes:
- **Running Ledger Balance Engine**: Real-time chronological tracking of client receivables, advance deposits, and settlement debit/credits.
- **Milestone Advance Allocator**: Solves the double-counting cash problem by drawing down advance retainers against milestone tax invoices seamlessly.
- **Statutory Indian GST Compliance Engine**: Intelligent rule-based evaluation between Intra-State (`CGST` + `SGST`) vs Inter-State (`IGST`) taxation based on state code verification, complete with Indian Currency word transliteration on generated PDF vouchers.
- **Concurrency-Safe Sequence Generation**: Atomic incrementation engine guaranteeing zero duplicate invoice or voucher IDs across financial years (e.g. `FOC/INV/2026-27/001`).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + Vite)"]
        UI[Tailwind CSS Single-Company UI]
        State[React Context / Auth / Toast]
        PDF[PDF & Print Renderers]
    end

    subgraph Edge ["API Gateway / Edge (Vercel)"]
        Rewrite["Vercel URL Rewriter (/api/*)"]
        Serverless["Vercel Serverless Function Engine"]
    end

    subgraph Backend ["Server Engine (Node.js + Express)"]
        AuthMid["JWT & Bcrypt Security Middleware"]
        LedgerSvc["Double-Entry Running Ledger Service"]
        NumSvc["Atomic Numbering & Concurrency Engine"]
        CalcSvc["Statutory GST & Currency Engine"]
    end

    subgraph Database ["Persistence Layer (MongoDB Atlas)"]
        Atlas[("MongoDB Atlas Cloud Cluster")]
        Collections[Admins | Clients | Projects | Invoices | Payments | Ledgers | Audit]
    end

    UI -->|REST + Bearer JWT| Rewrite
    Rewrite --> Serverless
    Serverless --> AuthMid
    AuthMid --> LedgerSvc
    AuthMid --> NumSvc
    AuthMid --> CalcSvc
    LedgerSvc --> Atlas
    NumSvc --> Atlas
    CalcSvc --> Atlas
    Atlas --- Collections
```

---

## ⚡ Core Capabilities & Modules

### 1. 📒 Financial Ledger & Running Balance Engine
- **Double-Entry Transaction Integrity**: Every financial transaction triggers synchronous ledger entries with precise debit and credit associations.
- **Dynamic Client Balances**: Instant calculation of total invoiced, total settled, advance deposits, and outstanding receivables per client and per project.
- **Advance Retainer Drawdown**: Advance payments can be allocated across multiple milestone invoices without distorting cashflow or double-counting revenue.

### 2. 🧾 Concurrency-Safe Document Generator
- **Atomic FY Sequencing**: Sequential counters segregated by document type and Financial Year (`FOC/INV/2026-27/001`, `FOC/QUO/2026-27/001`, `FOC/REC/2026-27/001`, `FOC/CN/2026-27/001`, `FOC/DN/2026-27/001`).
- **GST Validation**: Automatic validation of GSTIN format, state code extraction, and tax apportionment (9% CGST + 9% SGST for Intra-State Telangana, or 18% IGST for Inter-State transactions).
- **Words Transliteration**: Automatic conversion of decimal invoice totals to official Indian Rupee currency words (`Rupees Two Lakh Forty-Five Thousand Only`).

### 3. 🏢 Multi-Division Portfolio Architecture
Centralized ledger management supporting Focsera's 9 distinct business verticals:
1. **Focsera Celebrate** — Events, Weddings & Luxury Celebrations
2. **Focsera Create** — Photography, Film Production & Studio Direction
3. **Focsera Market** — Performance Marketing & Brand Strategy
4. **Focsera Grow** — Web Development, SaaS & Enterprise Cloud
5. **Focsera Interiors** — Turnkey Architecture, Execution & Furnishings
6. **Media and Branding** — Corporate Identity & Communications
7. **Pilo by Focsera** — Curated Experiences & Lifestyle
8. **Beyond by Focsera** — Emerging & Experimental Ventures
9. **ArenaX** — Sports Arena Management & Interactive Entertainment

### 4. 📊 Business Intelligence & Auditing
- **Real-Time Dashboards**: Revenue, uncollected dues, monthly billing velocity, and division-wise profit contributions.
- **Audit Logging**: Immutable chronological activity logs recording all critical ledger mutations, invoice cancellations, and credit note issuances.
- **Project Tracking & Follow-ups**: Built-in milestone tracker, client communication logs, and payment follow-up scheduling.

---

## 💻 Tech Stack & Engineering Highlights

| Tier | Technologies | Highlights & Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide | Sub-second load times, modular atomic design, custom high-contrast institutional UI |
| **Backend** | Node.js, Express, ES Modules | Stateless serverless architecture optimized for cold-start resilience (<150ms) |
| **Database** | MongoDB Atlas, Mongoose 8 | Document-oriented schemas with compound indexing for transaction lookups |
| **Security** | JWT, BcryptJS, Helmet, CORS | Zero-trust admin endpoint protection, salted password hashes, strict CORS policies |
| **Deployment** | Vercel Serverless Functions | Continuous integration / continuous deployment directly from Git push |

---

## 📡 REST API Architecture

The backend exposes a secure, token-protected RESTful API:

| Endpoint | Method | Purpose | Protection |
| :--- | :---: | :--- | :---: |
| `/api/auth/login` | `POST` | Authenticates administrator and issues JWT token | Public |
| `/api/auth/me` | `GET` | Validates active session and loads company state | Bearer JWT |
| `/api/clients` | `GET/POST`| Manages corporate clients, GSTINs, and billing contacts | Bearer JWT |
| `/api/projects` | `GET/POST`| Tracks project milestones, allocated division, and budgets | Bearer JWT |
| `/api/invoices` | `GET/POST`| Generates sequential GST tax invoices and updates ledger | Bearer JWT |
| `/api/payments` | `GET/POST`| Records inbound settlements and advance retainer receipts | Bearer JWT |
| `/api/ledger` | `GET` | Queries chronological running ledger by client or project | Bearer JWT |
| `/api/reports` | `GET` | Aggregates P&L, division performance, and tax breakdown | Bearer JWT |

---

## 🚀 Local Development Setup

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/SridhanyaReddy/Focsera-Ledger.git
cd Focsera-Ledger

# Install dependencies across root, server, and client workspaces
npm run install:all
```

### 2. Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=5050
NODE_ENV=development
JWT_SECRET=focsera_production_secure_financial_ledger_jwt_secret_key_2026
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.zaeqytj.mongodb.net/test?retryWrites=true&w=majority
```

### 3. Seed Initial Database
Seed pre-configured divisions, services, and baseline company profile:
```bash
npm --prefix server run seed
```

### 4. Run Concurrent Development Servers
```bash
# Terminal 1: Backend Express Server (Port 5050)
npm run server

# Terminal 2: Vite React Frontend (Port 5173 with HMR)
npm run client
```

Access the local application at `http://localhost:5173`.

---

## 🧪 Quality Assurance & Acceptance Testing

The platform includes an automated integration test suite enforcing critical financial consistency:

```bash
npm test
```

- `✓` **Company Singleton Test**: Validates single-tenant lock preventing rogue company profiles.
- `✓` **Admin Authentication**: Tests password hashing, JWT signing, and expired token rejection.
- `✓` **Division Structure**: Validates all 9 business division schemas.
- `✓` **GST Engine**: Validates intra-state vs inter-state tax routing and rounding precision.
- `✓` **Atomic Sequencing**: Concurrency test asserting zero sequence collisions under rapid load.
- `✓` **Double-Entry Ledger**: Asserts that debits and credits balance to zero across full invoice lifecycles.
- `✓` **Advance Retainer Drawdown**: Verifies proper ledger offsetting when milestone invoices are settled via advances.

---

## 👤 Author & Maintainer

**Sridhanya Reddy**  
- **GitHub**: [@SridhanyaReddy](https://github.com/SridhanyaReddy)  
- **Project Repository**: [Focsera-Ledger](https://github.com/SridhanyaReddy/Focsera-Ledger)  
- **Live Deployment**: [focsera-ledger.vercel.app](https://focsera-ledger.vercel.app)

---

## ⚖️ License & Intellectual Property

Proprietary software built specifically for **Focsera Innovations Private Limited**. All rights reserved.
