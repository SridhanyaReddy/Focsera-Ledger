# Focsera — Financial Ledger & Invoicing System

> **Production-Ready, Single-Tenant Financial Management Platform built exclusively for Focsera Innovations.**  
> **Official Website:** [https://www.focsera.in/](https://www.focsera.in/)  
> **Live Web App:** [https://focsera-ledger.vercel.app](https://focsera-ledger.vercel.app)

---

## 🏛️ 1. Architecture & Design Principles

The **Focsera Financial Ledger & Invoicing System** is a purpose-built enterprise financial solution designed strictly to the operations and brand identity of **Focsera Innovations Private Limited**:

- **Single-Company, Single-Tenant Architecture**: Operating exclusively for Focsera Innovations. Zero multi-tenant complexity, no company registration friction, no arbitrary SaaS tiers.
- **Admin-Only Authentication**: Secure single-role access control (`ADMIN`) protected by JSON Web Tokens (JWT) and Bcrypt hashing.
- **Unified Ledger Engine**: Chronological running-balance ledger for all clients and projects, tracking debits (invoices, refunds) and credits (payments, advances) with automatic balance recalculation.
- **Advance & Milestone Payment Allocations**: Full support for advance retainer receipts, partial payments, and split allocations against outstanding milestone invoices without duplicate cash accounting.
- **Indian GST & Financial Compliance**: Dynamic calculation of Intra-State (CGST 9% + SGST 9%) vs Inter-State (IGST 18%), State code validation (e.g. Telangana - `36`), PAN/GSTIN tracking, and Indian numbering-to-words currency formatting on all printable vouchers.
- **Sequential Concurrency-Safe Numbering**: Atomic numbering sequence generator formatted for Indian Financial Years:
  - Invoices: `FOC/INV/2026-27/001`
  - Quotations: `FOC/QUO/2026-27/001`
  - Receipts: `FOC/REC/2026-27/001`
  - Credit Notes: `FOC/CN/2026-27/001`
  - Debit Notes: `FOC/DN/2026-27/001`

---

## 🏢 2. Predefined Focsera Business Divisions

The system comes pre-configured with Focsera's 9 core business divisions:

1. **Focsera Celebrate** — Events, Weddings, Stage Design & Celebrations
2. **Focsera Create** — Studios, Photography, Reels & Creative Editing
3. **Focsera Market** — Marketing, Performance Ads, Brand Strategy & Growth
4. **Focsera Grow** — Business, Cloud Solutions, Web & Digital Software
5. **Focsera Interiors** — Interior Design, Turnkey Execution & Furnishing
6. **Media and Branding** — Brand Identity Systems & Communications
7. **Pilo by Focsera** — Curated Experiences & Lifestyle
8. **Beyond by Focsera** — Experimental & Future Ventures
9. **ArenaX** — Sports Arenas & Interactive Gaming Tech

All divisions share Focsera's centralized legal profile, single chart of accounts, bank details, and ledger engine while allowing division-filtered financial reporting.

---

## 🛠️ 3. Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, HTML2PDF / Print CSS
- **Backend**: Node.js, Express, Mongoose ODM
- **Database**: MongoDB Atlas
- **Deployment**: Vercel Serverless Functions (`@vercel/node`) + Static Hosting

---

## 🚀 4. Quick Start & Local Development

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm or pnpm
- MongoDB Atlas cluster URI or local MongoDB instance

### Installation
```bash
# Clone the repository
git clone https://github.com/SridhanyaReddy/Focsera-Ledger.git
cd Focsera-Ledger

# Install dependencies across root, server, and client
npm run install:all
```

### Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5050
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.zaeqytj.mongodb.net/test?retryWrites=true&w=majority
```

### Seed Initial Database
Populate divisions, service templates, admin user, and sample projects/invoices:
```bash
npm --prefix server run seed
```

### Run Locally
```bash
# Terminal 1: Backend Server (Port 5050)
npm run server

# Terminal 2: Frontend Vite App (Port 5173)
npm run client
```

---

## ☁️ 5. Deployment on Vercel

The application is fully configured for zero-configuration continuous deployment on Vercel via [vercel.json](./vercel.json):

1. **Import Repository**: Connect `https://github.com/SridhanyaReddy/Focsera-Ledger` into your Vercel account.
2. **Set Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI pointing to the active database (e.g., `.../test?retryWrites=true&w=majority`).
   - `JWT_SECRET`: A secure key used for signing authentication tokens.
3. **MongoDB Atlas Network Access**: Ensure MongoDB Atlas allows access from `0.0.0.0/0` (Network Access &rarr; Allow Access from Anywhere) so Vercel's serverless lambdas can query your database.

---

## 🧪 6. Automated Test Suite (10/10 Passed)

The system includes a full end-to-end integration test suite verifying core business rules:

1. **Company Singleton Enforcement**: Guarantees only one company profile exists.
2. **Admin Authentication**: JWT generation, Bcrypt password hashing, and token validation.
3. **Division Data Integrity**: Verifies all 9 divisions with correct legal prefixes.
4. **GST Tax Engine**: Accurate calculation of CGST, SGST, IGST, and rounding.
5. **Sequential Numbering**: Prevents duplicate numbers under concurrent invoice creation.
6. **Double-Entry Ledger Engine**: Balances debit and credit entries on invoice issuance and settlement.
7. **Advance Payment Allocations**: Correctly draws down advance balances without double-counting revenue.
8. **Credit & Debit Notes**: Automatic ledger adjustments against issued invoices.
9. **Financial Reports Generation**: P&L, balance sheets, and division revenue breakdown.
10. **Audit Trail Logging**: Immutable logging for all sensitive financial actions.

Run tests locally:
```bash
npm test
```

---

## 📄 License

Proprietary — Built exclusively for **Focsera Innovations Private Limited**. All rights reserved.
