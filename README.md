# Focsera — Invoice Generator & Ledger Management System

> **Production-Ready, Single-Tenant Financial Management Platform built exclusively for Focsera Innovations.**  
> Official Website Reference: [https://www.focsera.in/](https://www.focsera.in/)

---

## 🏛️ 1. Architecture & Design Principles

Focsera Invoice Generator & Ledger Management System is built strictly to the specifications of **Focsera**:

- **Single-Company, Single-Tenant Application**: The system operates exclusively for **Focsera Innovations Private Limited**. There is zero multi-tenant or multi-company overhead, no company registration, no company switching, and no SaaS subscriptions.
- **Admin-Only Authentication**: Secure single-role access control (`ADMIN`). Public signup, staff tiers, employee management, and arbitrary role sprawl are permanently disabled.
- **Unified Ledger Engine**: A chronological running-balance ledger for all clients and projects, tracking debits (invoices, refunds) and credits (payments) with automatic balance recalculation.
- **Advance & Milestone Handling**: Full support for advance payments, partial payments, and advance allocations that update invoices without double-counting received cash.
- **Sequential Indian Accounting Numbering**: Atomic, concurrency-safe numbering engine formatted with Indian Financial Years (e.g., `FOC/INV/2026-27/001`, `FOC/QUO/2026-27/001`, `FOC/REC/2026-27/001`, `FOC/CN/2026-27/001`).
- **Indian GST & Currency Compliance**: Dynamic calculation of Intra-State (CGST + SGST) vs Inter-State (IGST), state codes, PAN/GSTIN tracking, and Indian number-to-words representation on receipts and tax invoices.

---

## 🏢 2. Predefined Focsera Business Divisions

The system is configured with Focsera's 9 core business divisions:

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

## 🚀 3. Quick Start & Setup

### Prerequisites
- Node.js 18+ (tested on Node v20 & v24)
- npm or pnpm
- MongoDB Atlas URI (optional; the application includes an embedded in-memory database fallback that starts automatically if `MONGODB_URI` is omitted)

### Step 1: Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### Step 2: Configure Environment
Copy `.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=focsera-production-secure-financial-ledger-jwt-secret-key-2026
# Optional: Connect to your MongoDB Atlas database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/focsera?retryWrites=true&w=majority
```

### Step 3: Seed Initial Data (Optional)
Populate the 9 divisions, service templates, default admin user, and sample projects/invoices:
```bash
npm run seed
```

**Default Admin Credentials:**
- **Email:** `admin@focsera.in`
- **Password:** `Admin@Focsera2026`

*(Alternatively, launch a fresh database and complete the interactive one-time setup wizard in the browser!)*

### Step 4: Run the Application

#### Option A: Unified Full-Stack Server (Recommended)
Builds the React client and serves everything from Node.js on port 5000:
```bash
npm run build:client
npm start
```
Visit: **[http://localhost:5000](http://localhost:5000)**

#### Option B: Concurrent Development Mode
Runs the Vite development server with Hot Module Reloading (HMR) and the backend API server concurrently:
```bash
# Terminal 1: Backend API
npm run server

# Terminal 2: Vite React Frontend
npm run client
```
Visit: **[http://localhost:5173](http://localhost:5173)** (proxies `/api` requests to port 5000).

---

## 🧪 4. Acceptance Test Suite (10/10 Passed)

The system includes an automated acceptance test suite in `server/tests/acceptance.test.js` validating all 10 core operational scenarios:

| # | Scenario | Test Verification | Status |
|---|---|---|---|
| **1** | New Client & Project | Created client and assigned project to Focsera Celebrate | ✅ Passed |
| **2** | Quotation → Invoice Conversion | Generated quotation with line items & GST; 1-click converted into invoice preserving all details | ✅ Passed |
| **3** | Partial Payment | Recorded ₹10,000 advance + ₹5,000 partial payment on ₹30,000 invoice; balance ₹15,000; status `Partially Paid` | ✅ Passed |
| **4** | Full Settlement | Paid remaining ₹15,000; balance reached ₹0; status automatically updated to `Paid` | ✅ Passed |
| **5** | Client Receivables Ledger | Verified chronological debit/credit ledger entries with exact running balance calculation | ✅ Passed |
| **6** | Advance Allocation | Applied unallocated advance to new invoice without double-counting total cash received | ✅ Passed |
| **7** | Multi-Project Accounting | Verified isolated financial tracking for separate projects under a single client profile | ✅ Passed |
| **8** | Division-Wise Reporting | Tested revenue isolation and reporting across Focsera business divisions | ✅ Passed |
| **9** | Refund & Ledger Debit | Recorded refund as an audited ledger debit transaction without deleting original payment receipt | ✅ Passed |
| **10** | Data Persistence | Confirmed all documents, audit trails, and financial records persist and query cleanly | ✅ Passed |

Run the test suite anytime:
```bash
npm test
```

---

## 💼 5. Core Modules & Functionality

### 1. Dashboard
- Real-time financial summary metrics: **Total Invoiced**, **Total Received**, **Outstanding Balance**, **Overdue Amount**, **Active Projects**, **Total Clients**, **Total Invoices**, **Pending Quotations**.
- Interactive charts: Monthly invoicing trend, payment collection trends, division-wise revenue distribution, and outstanding vs. received comparison.
- Quick action tables: Recent invoices, recent payments, overdue receivables, and recent client activity.
- Date range and division filter presets (Today, This Week, This Month, This Quarter, This FY, Custom).

### 2. Client Management
- Automated sequential Client IDs (`CLI-001`, `CLI-002`, ...).
- Complete client profile displaying total invoiced, total received, net balance, linked projects, quotations, invoices, payment receipts, refund history, and full chronological ledger.
- Soft-archiving protection (clients with financial ledger records cannot be permanently destroyed).

### 3. Project Management
- Every project belongs to one client and one Focsera division.
- Agreed project value, milestone schedules, start and completion dates.
- Financial overview tracking total invoiced, total collected, advance received, outstanding balance, and milestone payment status.

### 4. Services & Packages Catalog
- Service categories tailored for Focsera's operations (Events, Studios, Marketing, Digital, Interiors).
- Predefined service items with default rates, unit types (`per event`, `per month`, `per project`, `per sq.ft`), and standard tax percentages.
- Custom line items can always be entered freely on quotations and invoices.

### 5. Quotation Generator
- Sequential quotation numbering (`FOC/QUO/2026-27/001`).
- Line item builder with quantity, rate, discount, GST breakup, and additional charges.
- Customizable payment terms, scope exclusions, validity dates, and notes.
- **1-Click Conversion**: Accepted quotations can be converted into Tax Invoices in a single click, carrying over all line items, terms, and project references.

### 6. Invoice Generator with Live Preview
- Tax Invoice, Proforma Invoice, Bill of Supply, Advance Invoice, and Credit/Debit Notes.
- Real-time side-by-side A4 invoice preview matching Focsera's official brand aesthetics.
- Automatic Intra-State (CGST 9% + SGST 9%) vs Inter-State (IGST 18%) calculation based on place of supply.
- PDF generation and high-resolution printing using `html2canvas` and `jsPDF`.

### 7. Payments & Receipts
- Records advance payments, partial payments, milestone settlements, and full settlements.
- Payment modes: UPI, Bank Transfer (NEFT/RTGS/IMPS), Cheque, Cash.
- Auto-generates official A5 Payment Receipts (`FOC/REC/2026-27/001`) with amount in Indian Words (e.g. *"Rupees One Lakh Only"*).
- Unallocated advance payment handling with 1-click allocation to subsequent invoices.

### 8. Client Receivables Ledger
- Comprehensive chronological transaction history for every client.
- Debits (Invoices, Refunds) vs Credits (Payments, Advance Adjustments).
- Dynamic running balance column indicating exact receivables status.
- Export to Excel (`.xlsx`) and printable PDF statements.

### 9. Centralized Transactions & Audit Trail
- System-wide transaction journal recording every financial event with timestamp, reference number, client, project, and division.
- Immutable security audit log tracking admin operations, logins, document creation, and configuration updates.

### 10. Financial Reports & Analytics (14 Reports)
1. Invoiced vs Received Report
2. Client-Wise Revenue Report
3. Division-Wise Revenue Report
4. Project-Wise Financial Summary
5. Receivables Aging Report (Current, 1-30, 31-60, 61-90, 90+ days)
6. Overdue Payments Report
7. Monthly Collection Trend
8. Tax / GST Collection Report (CGST, SGST, IGST)
9. Quotation Conversion Rate Analysis
10. Advance Payment Tracking Report
11. Refund Summary
12. Top Clients by Revenue
13. Outstanding Balances Summary
14. System Financial Health Summary

### 11. Company Profile & Settings
- Singleton Focsera company profile with registered Hyderabad address, contact details, GSTIN, bank account, and UPI ID.
- Document numbering prefix customization.
- Manage Focsera business divisions (activate/deactivate/rename).
- Admin security settings (password change, session management).
- Full JSON database backup and restore utility.

---

## 🗄️ 6. Tech Stack

- **Backend**: Node.js, Express.js (ES Modules), Mongoose, Helmet, Morgan, Bcrypt.js, JSON Web Tokens
- **Database**: MongoDB (Atlas / Local) with embedded `mongodb-memory-server` fallback
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React Icons
- **Data Visualization**: Recharts (Revenue trends, Division pie charts, Collection bars)
- **Document Exporting**: jsPDF, html2canvas, SheetJS (xlsx)

---

## 🔒 7. Security & Business Compliance

- **No Public Signup**: Admin creation is locked down permanently after initial configuration.
- **Strict Single-Tenant Isolation**: Invariants enforced at schema and controller layers preventing multi-company leakage.
- **Zero Double-Counting**: Advance allocations are isolated as ledger audit adjustments rather than duplicate cash receipts.
- **Audit Logging**: Every financial action records IP address, timestamp, admin identifier, and before/after metadata.

---

© 2026 **Focsera Innovations Private Limited**. All rights reserved.

