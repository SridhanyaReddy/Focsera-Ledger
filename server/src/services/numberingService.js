import NumberSequence from '../models/NumberSequence.js';
import CompanySettings from '../models/CompanySettings.js';
import { getFinancialYear } from '../config/constants.js';

/**
 * Generates next sequential document number atomically.
 * Formats:
 * - Invoice: FOC/INV/2026-27/001
 * - Quotation: FOC/QUO/2026-27/001
 * - Receipt: FOC/REC/2026-27/001
 * - Credit Note: FOC/CN/2026-27/001
 * - Debit Note: FOC/DN/2026-27/001
 * - Payment: PAY-2026-001
 * - Transaction: TXN-2026-001
 * - Client: CLI-001
 * - Project: PRJ-001
 */
export async function getNextSequenceNumber(type, customPrefix = null, date = new Date()) {
  const settings = await CompanySettings.getSettings();
  const prefixes = settings.numberingPrefixes || {};
  const currentFy = getFinancialYear(date);

  let prefix = customPrefix;
  let hasFy = true;
  let padLength = 3;

  switch (type.toLowerCase()) {
    case 'invoice':
      prefix = prefix || prefixes.invoice || 'FOC/INV';
      break;
    case 'quotation':
      prefix = prefix || prefixes.quotation || 'FOC/QUO';
      break;
    case 'receipt':
      prefix = prefix || prefixes.receipt || 'FOC/REC';
      break;
    case 'creditnote':
    case 'credit_note':
      prefix = prefix || prefixes.creditNote || 'FOC/CN';
      break;
    case 'debitnote':
    case 'debit_note':
      prefix = prefix || prefixes.debitNote || 'FOC/DN';
      break;
    case 'payment':
      prefix = prefix || prefixes.payment || 'PAY';
      break;
    case 'transaction':
      prefix = prefix || prefixes.transaction || 'TXN';
      break;
    case 'client':
      prefix = prefix || prefixes.client || 'CLI';
      hasFy = false;
      break;
    case 'project':
      prefix = prefix || prefixes.project || 'PRJ';
      hasFy = false;
      break;
    default:
      prefix = prefix || type.toUpperCase();
  }

  const key = hasFy ? `${type.toUpperCase()}_${currentFy}` : type.toUpperCase();

  const sequenceDoc = await NumberSequence.findOneAndUpdate(
    { key },
    {
      $inc: { lastSequence: 1 },
      $setOnInsert: {
        key,
        prefix,
        financialYear: hasFy ? currentFy : '',
      },
    },
    { new: true, upsert: true }
  );

  const seqStr = sequenceDoc.lastSequence.toString().padStart(padLength, '0');

  if (hasFy) {
    // If prefix already has slashes like FOC/INV, join as FOC/INV/2026-27/001
    // If prefix is simple like PAY, join as PAY-2026-27-001 or PAY/2026-27/001
    if (prefix.includes('/')) {
      return `${prefix}/${currentFy}/${seqStr}`;
    } else {
      return `${prefix}-${currentFy.split('-')[0]}-${seqStr}`;
    }
  } else {
    return `${prefix}-${seqStr}`;
  }
}

