import LedgerEntry from '../models/LedgerEntry.js';
import Transaction from '../models/Transaction.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import { getNextSequenceNumber } from './numberingService.js';
import { round } from './calculationService.js';

/**
 * Recalculates and reconciles the entire chronological running balance for a client.
 * Enforces financial integrity: Running Balance = Opening Balance + Sum(Debit) - Sum(Credit)
 */
export async function recalculateClientLedger(clientId) {
  const client = await Client.findById(clientId);
  if (!client) return;

  const entries = await LedgerEntry.find({ client: clientId }).sort({ date: 1, _id: 1 });

  let currentBalance = round(client.openingBalance || 0);

  for (const entry of entries) {
    const debit = round(entry.debit || 0);
    const credit = round(entry.credit || 0);
    currentBalance = round(currentBalance + debit - credit);
    entry.runningBalance = currentBalance;
    await entry.save();
  }

  return currentBalance;
}

/**
 * Gets the latest running balance for a client prior to a new entry.
 */
async function getLatestClientBalance(clientId) {
  const lastEntry = await LedgerEntry.findOne({ client: clientId }).sort({ date: -1, _id: -1 });
  if (lastEntry) {
    return round(lastEntry.runningBalance);
  }
  const client = await Client.findById(clientId);
  return round(client?.openingBalance || 0);
}

/**
 * Records an Invoice in the Client Ledger and Centralized Transactions
 */
export async function recordInvoiceInLedger({ invoice, client, project, division }) {
  const grandTotal = round(invoice.grandTotal);
  const latestBalance = await getLatestClientBalance(client._id);
  const newBalance = round(latestBalance + grandTotal);

  const txnId = await getNextSequenceNumber('transaction', null, invoice.invoiceDate);

  const ledgerEntry = await LedgerEntry.create({
    client: client._id,
    project: project?._id,
    division: division?._id,
    date: invoice.invoiceDate || new Date(),
    transactionId: txnId,
    entryType: 'INVOICE_ISSUED',
    referenceDocumentType: 'Invoice',
    referenceDocumentId: invoice._id,
    referenceNumber: invoice.invoiceNumber,
    description: `Tax Invoice Issued - ${invoice.invoiceNumber} (${project?.name || 'General Project'})`,
    debit: grandTotal,
    credit: 0,
    runningBalance: newBalance,
  });

  // Centralized company transaction
  await Transaction.create({
    transactionId: txnId,
    date: invoice.invoiceDate || new Date(),
    client: client._id,
    project: project?._id,
    division: division?._id,
    category: 'Invoice',
    referenceDocumentType: 'Invoice',
    referenceDocumentId: invoice._id,
    referenceNumber: invoice.invoiceNumber,
    debit: grandTotal,
    credit: 0,
    description: `Invoice ${invoice.invoiceNumber} issued for ${client.name} - ₹${grandTotal}`,
  });

  return ledgerEntry;
}

/**
 * Records a Payment or Advance in the Client Ledger and Centralized Transactions
 */
export async function recordPaymentInLedger({ payment, client, project, invoice, division }) {
  const amount = round(payment.amount);
  const latestBalance = await getLatestClientBalance(client._id);
  const newBalance = round(latestBalance - amount);

  const isAdvance = payment.paymentType === 'Advance' || !invoice;
  const entryType = isAdvance ? 'ADVANCE_RECEIVED' : 'PAYMENT_RECEIVED';
  const desc = isAdvance
    ? `Advance Received - ${payment.paymentMethod} (Ref: ${payment.referenceNumber || 'Direct'})`
    : `Payment Received for ${invoice?.invoiceNumber || 'Invoice'} via ${payment.paymentMethod}`;

  const ledgerEntry = await LedgerEntry.create({
    client: client._id,
    project: project?._id,
    division: division?._id,
    date: payment.paymentDate || new Date(),
    transactionId: payment.transactionId,
    entryType,
    referenceDocumentType: 'Payment',
    referenceDocumentId: payment._id,
    referenceNumber: payment.paymentNumber,
    description: desc,
    debit: 0,
    credit: amount,
    runningBalance: newBalance,
  });

  await Transaction.create({
    transactionId: payment.transactionId,
    date: payment.paymentDate || new Date(),
    client: client._id,
    project: project?._id,
    division: division?._id,
    category: isAdvance ? 'Advance' : 'Payment',
    referenceDocumentType: 'Payment',
    referenceDocumentId: payment._id,
    referenceNumber: payment.paymentNumber,
    paymentMethod: payment.paymentMethod,
    debit: 0,
    credit: amount,
    description: `${isAdvance ? 'Advance' : 'Payment'} received from ${client.name} - ₹${amount} (${payment.paymentMethod})`,
  });

  return ledgerEntry;
}

/**
 * Records an Advance Allocation against an Invoice.
 * Note: Since money was already credited to the client when advance was received,
 * advance allocation does NOT alter cash received, but explicitly notes allocation in ledger.
 */
export async function recordAdvanceAllocationInLedger({
  payment,
  invoice,
  client,
  project,
  division,
  allocatedAmount,
}) {
  const amt = round(allocatedAmount);
  const latestBalance = await getLatestClientBalance(client._id);

  const txnId = await getNextSequenceNumber('transaction');

  const ledgerEntry = await LedgerEntry.create({
    client: client._id,
    project: project?._id,
    division: division?._id,
    date: new Date(),
    transactionId: txnId,
    entryType: 'ADVANCE_ALLOCATED',
    referenceDocumentType: 'Payment',
    referenceDocumentId: payment._id,
    referenceNumber: `${payment.paymentNumber} -> ${invoice.invoiceNumber}`,
    description: `Advance ₹${amt} allocated from ${payment.paymentNumber} to Invoice ${invoice.invoiceNumber}`,
    debit: 0,
    credit: 0, // 0 in receivable running balance because cash was already credited upon advance receipt!
    runningBalance: latestBalance,
  });

  await Transaction.create({
    transactionId: txnId,
    date: new Date(),
    client: client._id,
    project: project?._id,
    division: division?._id,
    category: 'Allocation',
    referenceDocumentType: 'Invoice',
    referenceDocumentId: invoice._id,
    referenceNumber: invoice.invoiceNumber,
    debit: 0,
    credit: 0,
    description: `Allocated ₹${amt} advance from ${payment.paymentNumber} to Invoice ${invoice.invoiceNumber}`,
  });

  return ledgerEntry;
}

/**
 * Records a Refund Issued to a client
 * Accounting convention: Debit entry increases receivable / reverses credit.
 */
export async function recordRefundInLedger({
  refundPayment,
  originalPayment,
  client,
  project,
  invoice,
  division,
}) {
  const amount = round(refundPayment.amount);
  const latestBalance = await getLatestClientBalance(client._id);
  const newBalance = round(latestBalance + amount);

  const ledgerEntry = await LedgerEntry.create({
    client: client._id,
    project: project?._id,
    division: division?._id,
    date: refundPayment.paymentDate || new Date(),
    transactionId: refundPayment.transactionId,
    entryType: 'REFUND_ISSUED',
    referenceDocumentType: 'Payment',
    referenceDocumentId: refundPayment._id,
    referenceNumber: refundPayment.paymentNumber,
    description: `Refund Issued of ₹${amount} (Orig Payment: ${originalPayment?.paymentNumber || 'N/A'}) - ${refundPayment.notes || 'Client refund'}`,
    debit: amount,
    credit: 0,
    runningBalance: newBalance,
  });

  await Transaction.create({
    transactionId: refundPayment.transactionId,
    date: refundPayment.paymentDate || new Date(),
    client: client._id,
    project: project?._id,
    division: division?._id,
    category: 'Refund',
    referenceDocumentType: 'Payment',
    referenceDocumentId: refundPayment._id,
    referenceNumber: refundPayment.paymentNumber,
    paymentMethod: refundPayment.paymentMethod,
    debit: amount,
    credit: 0,
    description: `Refund issued to ${client.name} - ₹${amount} (${refundPayment.paymentMethod})`,
  });

  return ledgerEntry;
}

/**
 * Records a Credit Note in Ledger
 * Credit Note decreases client receivable
 */
export async function recordCreditNoteInLedger({ creditNote, invoice, client, project, division }) {
  const amount = round(creditNote.totalAmount);
  const latestBalance = await getLatestClientBalance(client._id);
  const newBalance = round(latestBalance - amount);

  const txnId = await getNextSequenceNumber('transaction');

  const ledgerEntry = await LedgerEntry.create({
    client: client._id,
    project: project?._id,
    division: division?._id,
    date: creditNote.noteDate || new Date(),
    transactionId: txnId,
    entryType: 'CREDIT_NOTE',
    referenceDocumentType: 'CreditNote',
    referenceDocumentId: creditNote._id,
    referenceNumber: creditNote.noteNumber,
    description: `Credit Note against ${invoice.invoiceNumber}: ${creditNote.reason}`,
    debit: 0,
    credit: amount,
    runningBalance: newBalance,
  });

  await Transaction.create({
    transactionId: txnId,
    date: creditNote.noteDate || new Date(),
    client: client._id,
    project: project?._id,
    division: division?._id,
    category: 'Credit Note',
    referenceDocumentType: 'CreditNote',
    referenceDocumentId: creditNote._id,
    referenceNumber: creditNote.noteNumber,
    debit: 0,
    credit: amount,
    description: `Credit Note ${creditNote.noteNumber} issued to ${client.name} - ₹${amount}`,
  });

  return ledgerEntry;
}

/**
 * Records a Debit Note in Ledger
 * Debit Note increases client receivable
 */
export async function recordDebitNoteInLedger({ debitNote, invoice, client, project, division }) {
  const amount = round(debitNote.totalAmount);
  const latestBalance = await getLatestClientBalance(client._id);
  const newBalance = round(latestBalance + amount);

  const txnId = await getNextSequenceNumber('transaction');

  const ledgerEntry = await LedgerEntry.create({
    client: client._id,
    project: project?._id,
    division: division?._id,
    date: debitNote.noteDate || new Date(),
    transactionId: txnId,
    entryType: 'DEBIT_NOTE',
    referenceDocumentType: 'DebitNote',
    referenceDocumentId: debitNote._id,
    referenceNumber: debitNote.noteNumber,
    description: `Debit Note against ${invoice.invoiceNumber}: ${debitNote.reason}`,
    debit: amount,
    credit: 0,
    runningBalance: newBalance,
  });

  await Transaction.create({
    transactionId: txnId,
    date: debitNote.noteDate || new Date(),
    client: client._id,
    project: project?._id,
    division: division?._id,
    category: 'Debit Note',
    referenceDocumentType: 'DebitNote',
    referenceDocumentId: debitNote._id,
    referenceNumber: debitNote.noteNumber,
    debit: amount,
    credit: 0,
    description: `Debit Note ${debitNote.noteNumber} issued to ${client.name} - ₹${amount}`,
  });

  return ledgerEntry;
}

/**
 * Calculates complete live financial profile for a Client
 */
export async function getClientFinancialProfile(clientId) {
  const client = await Client.findById(clientId);
  if (!client) throw new Error('Client not found');

  // Invoices (exclude Cancelled and Draft)
  const invoices = await Invoice.find({
    client: clientId,
    status: { $nin: ['Cancelled', 'Draft'] },
  });

  const totalInvoiced = round(invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));

  // Payments (Actual money received; exclude Refunds and Reversed payments)
  const payments = await Payment.find({
    client: clientId,
    paymentType: { $nin: ['Refund', 'Reversal'] },
    isReversed: false,
  });

  const totalReceived = round(payments.reduce((acc, p) => acc + (p.amount || 0), 0));

  // Refunds
  const refunds = await Payment.find({
    client: clientId,
    paymentType: 'Refund',
  });
  const totalRefunded = round(refunds.reduce((acc, r) => acc + (r.amount || 0), 0));

  // Unallocated advances: advances with remaining unallocated balance
  const advancePayments = await Payment.find({
    client: clientId,
    unallocatedAmount: { $gt: 0 },
    isReversed: false,
  });
  const unallocatedAdvances = round(
    advancePayments.reduce((acc, p) => acc + (p.unallocatedAmount || 0), 0)
  );

  // Current outstanding receivable balance: Invoiced - Received + Refunded + Opening
  const currentOutstanding = round(
    (client.openingBalance || 0) + totalInvoiced - totalReceived + totalRefunded
  );

  return {
    client,
    totalInvoiced,
    totalReceived,
    totalRefunded,
    unallocatedAdvances,
    currentOutstanding,
  };
}

/**
 * Calculates live financial overview for a Project
 */
export async function getProjectFinancialOverview(projectId) {
  const project = await Project.findById(projectId).populate('client division');
  if (!project) throw new Error('Project not found');

  const invoices = await Invoice.find({
    project: projectId,
    status: { $nin: ['Cancelled', 'Draft'] },
  });

  const totalInvoiced = round(invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0));

  const payments = await Payment.find({
    project: projectId,
    paymentType: { $nin: ['Refund', 'Reversal'] },
    isReversed: false,
  });

  const totalReceived = round(payments.reduce((acc, p) => acc + (p.amount || 0), 0));

  const advances = payments.filter((p) => p.paymentType === 'Advance');
  const advanceReceived = round(advances.reduce((acc, p) => acc + (p.amount || 0), 0));

  const milestones = payments.filter((p) => p.paymentType === 'Milestone');
  const milestonePayments = round(milestones.reduce((acc, p) => acc + (p.amount || 0), 0));

  const agreedProjectValue = round(project.agreedProjectValue || 0);
  const outstandingAmount = Math.max(0, round(agreedProjectValue - totalReceived));

  // Find next upcoming milestone
  const upcomingMilestone = project.milestones?.find((m) => m.status === 'Pending') || null;

  let paymentStatus = 'Pending';
  if (totalReceived >= agreedProjectValue && agreedProjectValue > 0) {
    paymentStatus = 'Fully Settled';
  } else if (totalReceived > 0) {
    paymentStatus = 'Partially Received';
  }

  return {
    project,
    agreedProjectValue,
    totalInvoiced,
    totalReceived,
    advanceReceived,
    milestonePayments,
    outstandingAmount,
    upcomingMilestone,
    paymentStatus,
    invoices,
    payments,
  };
}

