import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from '../config/db.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import PaymentAllocation from '../models/PaymentAllocation.js';
import Receipt from '../models/Receipt.js';
import LedgerEntry from '../models/LedgerEntry.js';
import Transaction from '../models/Transaction.js';
import NumberSequence from '../models/NumberSequence.js';
import AuditLog from '../models/AuditLog.js';
import CreditNote from '../models/CreditNote.js';
import DebitNote from '../models/DebitNote.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function resetCleanSlate() {
  console.log('--- Wiping all pre-existing operational & financial data ---');
  await connectDB();

  await Promise.all([
    Client.deleteMany({}),
    Project.deleteMany({}),
    Quotation.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    PaymentAllocation.deleteMany({}),
    Receipt.deleteMany({}),
    LedgerEntry.deleteMany({}),
    Transaction.deleteMany({}),
    CreditNote.deleteMany({}),
    DebitNote.deleteMany({}),
    NumberSequence.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('✓ Cleared all Clients, Projects, Quotations, Invoices, Payments, Receipts, and Ledger entries.');
  console.log('✓ Reset document sequence counters to 0.');
  console.log('=== Database is now 100% PRISTINE (Clean Slate) ===');
  process.exit(0);
}

// Auto-run if executed directly
if (process.argv[1] === __filename) {
  resetCleanSlate().catch((err) => {
    console.error('Reset error:', err);
    process.exit(1);
  });
}

