import Payment from '../models/Payment.js';
import PaymentAllocation from '../models/PaymentAllocation.js';
import Receipt from '../models/Receipt.js';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import CompanySettings from '../models/CompanySettings.js';
import { getNextSequenceNumber } from '../services/numberingService.js';
import { round, getInvoiceStatus } from '../services/calculationService.js';
import {
  recordPaymentInLedger,
  recordAdvanceAllocationInLedger,
  recordRefundInLedger,
  recalculateClientLedger,
} from '../services/ledgerService.js';
import { numberToIndianWords } from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getPayments(req, res) {
  try {
    const { client, project, invoice, paymentMethod, paymentType, search, page = 1, limit = 50 } = req.query;
    const filter = { isReversed: false };

    if (client && client !== 'all') filter.client = client;
    if (project && project !== 'all') filter.project = project;
    if (invoice && invoice !== 'all') filter.invoice = invoice;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;
    if (paymentType && paymentType !== 'all') filter.paymentType = paymentType;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { paymentNumber: searchRegex },
        { transactionId: searchRegex },
        { referenceNumber: searchRegex },
        { notes: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('client', 'clientId name businessName phone')
        .populate('project', 'projectId name')
        .populate('invoice', 'invoiceNumber grandTotal outstandingBalance')
        .populate('receipt', 'receiptNumber')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function recordPayment(req, res) {
  try {
    const {
      clientId,
      projectId,
      invoiceId,
      amount,
      paymentMethod = 'UPI',
      paymentType = 'Full',
      referenceNumber = '',
      paymentDate = new Date(),
      notes = '',
    } = req.body;

    const parsedAmount = round(Number(amount));
    if (!clientId || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid client and payment amount are required.' });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    let invoice = null;
    let project = null;

    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId).populate('division');
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found.' });
      }
      if (invoice.status === 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Cannot record payment for a cancelled invoice.' });
      }
      project = await Project.findById(invoice.project);
    } else if (projectId) {
      project = await Project.findById(projectId);
    }

    const paymentNumber = await getNextSequenceNumber('payment', null, new Date(paymentDate));
    const transactionId = await getNextSequenceNumber('transaction', null, new Date(paymentDate));

    // Determine allocation
    let allocatedAmount = 0;
    let unallocatedAmount = parsedAmount;

    if (invoice) {
      allocatedAmount = Math.min(parsedAmount, invoice.outstandingBalance);
      unallocatedAmount = Math.max(0, round(parsedAmount - allocatedAmount));
    }

    const payment = await Payment.create({
      paymentNumber,
      transactionId,
      client: client._id,
      project: project?._id,
      invoice: invoice?._id,
      paymentDate: new Date(paymentDate),
      amount: parsedAmount,
      allocatedAmount,
      unallocatedAmount,
      paymentMethod,
      paymentType,
      referenceNumber: referenceNumber.trim(),
      notes: notes.trim(),
    });

    // Update invoice if payment was applied
    let remainingInvoiceBalance = 0;
    if (invoice) {
      invoice.paidAmount = round((invoice.paidAmount || 0) + allocatedAmount);
      invoice.outstandingBalance = Math.max(
        0,
        round(invoice.grandTotal - (invoice.advanceAdjusted || 0) - invoice.paidAmount)
      );
      invoice.status = getInvoiceStatus(invoice);
      invoice.isLocked = true;
      await invoice.save();
      remainingInvoiceBalance = invoice.outstandingBalance;

      // Create allocation record
      await PaymentAllocation.create({
        payment: payment._id,
        invoice: invoice._id,
        client: client._id,
        project: project?._id,
        amount: allocatedAmount,
        allocatedDate: new Date(paymentDate),
        notes: `Direct payment allocation from ${payment.paymentNumber}`,
      });
    }

    // Auto-generate Payment Receipt
    const receiptNumber = await getNextSequenceNumber('receipt', null, new Date(paymentDate));
    const amountInWords = numberToIndianWords(parsedAmount);

    const receipt = await Receipt.create({
      receiptNumber,
      receiptDate: new Date(paymentDate),
      payment: payment._id,
      client: client._id,
      project: project?._id,
      invoice: invoice?._id,
      amount: parsedAmount,
      amountInWords,
      paymentMethod,
      transactionReference: referenceNumber,
      remainingBalance: remainingInvoiceBalance,
      notes: notes || '',
    });

    payment.receipt = receipt._id;
    await payment.save();

    // Record in Client Ledger & Centralized Transactions
    await recordPaymentInLedger({
      payment,
      client,
      project,
      invoice,
      division: invoice?.division || project?.division,
    });

    await logAuditEvent({
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment._id,
      performedBy: req.admin?.email || 'Admin',
      details: {
        paymentNumber: payment.paymentNumber,
        amount: parsedAmount,
        client: client.name,
        invoiceNumber: invoice?.invoiceNumber,
      },
      ip: req.ip,
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('client')
      .populate('project')
      .populate('invoice')
      .populate('receipt');

    return res.status(201).json({
      success: true,
      message: 'Payment recorded and receipt generated successfully.',
      data: {
        payment: populatedPayment,
        receipt,
        invoice,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Allocate unallocated advance to an invoice without double counting
 */
export async function allocateAdvance(req, res) {
  try {
    const { paymentId, invoiceId, amount } = req.body;
    const allocationAmount = round(Number(amount));

    if (!paymentId || !invoiceId || allocationAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment, invoice, and allocation amount are required.' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

    if (payment.unallocatedAmount < allocationAmount) {
      return res.status(400).json({
        success: false,
        message: `Requested allocation (₹${allocationAmount}) exceeds unallocated advance (₹${payment.unallocatedAmount}).`,
      });
    }

    const invoice = await Invoice.findById(invoiceId).populate('division');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    if (invoice.outstandingBalance < allocationAmount) {
      return res.status(400).json({
        success: false,
        message: `Requested allocation (₹${allocationAmount}) exceeds invoice outstanding balance (₹${invoice.outstandingBalance}).`,
      });
    }

    const client = await Client.findById(invoice.client);
    const project = await Project.findById(invoice.project);

    // Update payment
    payment.unallocatedAmount = round(payment.unallocatedAmount - allocationAmount);
    payment.allocatedAmount = round((payment.allocatedAmount || 0) + allocationAmount);
    await payment.save();

    // Update invoice: adjust advanceAdjusted
    invoice.advanceAdjusted = round((invoice.advanceAdjusted || 0) + allocationAmount);
    invoice.outstandingBalance = Math.max(
      0,
      round(invoice.grandTotal - invoice.advanceAdjusted - (invoice.paidAmount || 0))
    );
    invoice.status = getInvoiceStatus(invoice);
    invoice.isLocked = true;
    await invoice.save();

    // Create allocation record
    const allocation = await PaymentAllocation.create({
      payment: payment._id,
      invoice: invoice._id,
      client: client._id,
      project: project?._id,
      amount: allocationAmount,
      allocatedDate: new Date(),
      notes: `Advance allocated from ${payment.paymentNumber} to ${invoice.invoiceNumber}`,
    });

    // Record in ledger without double-counting received money
    await recordAdvanceAllocationInLedger({
      payment,
      invoice,
      client,
      project,
      division: invoice.division,
      allocatedAmount: allocationAmount,
    });

    await logAuditEvent({
      action: 'ALLOCATE_ADVANCE',
      entity: 'PaymentAllocation',
      entityId: allocation._id,
      performedBy: req.admin?.email || 'Admin',
      details: {
        paymentNumber: payment.paymentNumber,
        invoiceNumber: invoice.invoiceNumber,
        amount: allocationAmount,
      },
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: `Advance of ₹${allocationAmount} successfully allocated to Invoice ${invoice.invoiceNumber}.`,
      data: {
        payment,
        invoice,
        allocation,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Record a Refund for a client or invoice
 */
export async function recordRefund(req, res) {
  try {
    const {
      clientId,
      originalPaymentId,
      invoiceId,
      amount,
      paymentMethod = 'Bank Transfer',
      referenceNumber = '',
      refundDate = new Date(),
      reason = 'Client refund',
    } = req.body;

    const refundAmount = round(Number(amount));
    if (!clientId || refundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Client and valid refund amount are required.' });
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found.' });

    let originalPayment = null;
    if (originalPaymentId) {
      originalPayment = await Payment.findById(originalPaymentId);
    }

    let invoice = null;
    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId).populate('division');
    }

    const paymentNumber = await getNextSequenceNumber('payment', 'REF', new Date(refundDate));
    const transactionId = await getNextSequenceNumber('transaction', null, new Date(refundDate));

    const refundPayment = await Payment.create({
      paymentNumber,
      transactionId,
      client: client._id,
      project: invoice?.project || originalPayment?.project,
      invoice: invoice?._id || originalPayment?.invoice,
      paymentDate: new Date(refundDate),
      amount: refundAmount,
      allocatedAmount: 0,
      unallocatedAmount: 0,
      paymentMethod,
      paymentType: 'Refund',
      referenceNumber,
      originalPaymentId: originalPayment?._id,
      notes: reason,
    });

    // Update invoice if applicable
    if (invoice) {
      invoice.paidAmount = Math.max(0, round((invoice.paidAmount || 0) - refundAmount));
      invoice.outstandingBalance = Math.max(
        0,
        round(invoice.grandTotal - (invoice.advanceAdjusted || 0) - invoice.paidAmount)
      );
      invoice.status = invoice.paidAmount === 0 ? 'Refunded' : 'Partially Refunded';
      await invoice.save();
    }

    // Record in ledger & transactions (Debit entry)
    await recordRefundInLedger({
      refundPayment,
      originalPayment,
      client,
      project: invoice?.project || originalPayment?.project,
      invoice,
      division: invoice?.division,
    });

    await logAuditEvent({
      action: 'ISSUE_REFUND',
      entity: 'Payment',
      entityId: refundPayment._id,
      performedBy: req.admin?.email || 'Admin',
      details: { refundNumber: refundPayment.paymentNumber, amount: refundAmount, reason },
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Refund recorded and ledger adjusted successfully.',
      data: refundPayment,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Receipts
export async function getReceipts(req, res) {
  try {
    const { client, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (client && client !== 'all') filter.client = client;
    if (search) {
      filter.$or = [
        { receiptNumber: new RegExp(search.trim(), 'i') },
        { transactionReference: new RegExp(search.trim(), 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate('client', 'clientId name businessName phone')
        .populate('project', 'projectId name')
        .populate('invoice', 'invoiceNumber')
        .populate('payment')
        .sort({ receiptDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Receipt.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: receipts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getReceiptById(req, res) {
  try {
    const { id } = req.params;
    const receipt = await Receipt.findById(id)
      .populate('client')
      .populate('project')
      .populate('invoice')
      .populate('payment');

    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found.' });

    const company = await CompanySettings.getSettings();

    return res.json({
      success: true,
      data: {
        receipt,
        company,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

