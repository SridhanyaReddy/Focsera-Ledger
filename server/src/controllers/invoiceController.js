import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Division from '../models/Division.js';
import CompanySettings from '../models/CompanySettings.js';
import Payment from '../models/Payment.js';
import PaymentAllocation from '../models/PaymentAllocation.js';
import CreditNote from '../models/CreditNote.js';
import DebitNote from '../models/DebitNote.js';
import { getNextSequenceNumber } from '../services/numberingService.js';
import { calculateDocumentFinancials, getInvoiceStatus } from '../services/calculationService.js';
import { recordInvoiceInLedger, recalculateClientLedger } from '../services/ledgerService.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getInvoices(req, res) {
  try {
    const { client, project, division, status, invoiceType, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (client && client !== 'all') filter.client = client;
    if (project && project !== 'all') filter.project = project;
    if (division && division !== 'all') filter.division = division;
    if (status && status !== 'all') filter.status = status;
    if (invoiceType && invoiceType !== 'all') filter.invoiceType = invoiceType;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ invoiceNumber: searchRegex }, { notes: searchRegex }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('client', 'clientId name businessName phone email')
        .populate('project', 'projectId name')
        .populate('division', 'name code category')
        .sort({ invoiceDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: invoices,
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

export async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id)
      .populate('client')
      .populate('project')
      .populate('division')
      .populate('quotationReference', 'quotationNumber quotationDate');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const [payments, allocations, creditNotes, debitNotes, company] = await Promise.all([
      Payment.find({ invoice: id, isReversed: false }).sort({ paymentDate: -1 }),
      PaymentAllocation.find({ invoice: id }).populate('payment').sort({ allocatedDate: -1 }),
      CreditNote.find({ originalInvoice: id, status: 'Issued' }),
      DebitNote.find({ originalInvoice: id, status: 'Issued' }),
      CompanySettings.getSettings(),
    ]);

    return res.json({
      success: true,
      data: {
        invoice,
        payments,
        allocations,
        creditNotes,
        debitNotes,
        company,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createInvoice(req, res) {
  try {
    const {
      invoiceType = 'Tax Invoice',
      invoiceDate = new Date(),
      dueDate,
      clientId,
      projectId,
      divisionId,
      placeOfSupply,
      placeOfSupplyStateCode,
      items = [],
      additionalCharges = [],
      invoiceDiscount = 0,
      paymentTerms,
      notes,
      termsAndConditions,
      status = 'Issued',
    } = req.body;

    const actualClientId = clientId || req.body.client;
    const actualProjectId = projectId || req.body.project;
    const actualDivisionId = divisionId || req.body.division;

    if (!actualClientId || !actualProjectId || !actualDivisionId) {
      return res.status(400).json({
        success: false,
        message: 'Client, Project, and Focsera Division are required.',
      });
    }

    const client = await Client.findById(actualClientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const project = await Project.findById(actualProjectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const division = await Division.findById(actualDivisionId);
    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found.' });
    }

    const settings = await CompanySettings.getSettings();

    const clientSupplyStateCode = placeOfSupplyStateCode || client.stateCode || '36';
    const clientSupplyState = placeOfSupply || client.state || 'Telangana';

    const calculated = calculateDocumentFinancials({
      items,
      additionalCharges,
      invoiceDiscount,
      companyStateCode: settings.stateCode || '36',
      placeOfSupplyStateCode: clientSupplyStateCode,
      advanceAdjusted: 0,
      paidAmount: 0,
    });

    const invoiceNumber = await getNextSequenceNumber('invoice', null, new Date(invoiceDate));

    const invDueDate = dueDate
      ? new Date(dueDate)
      : new Date(new Date(invoiceDate).getTime() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceType,
      invoiceDate: new Date(invoiceDate),
      dueDate: invDueDate,
      client: actualClientId,
      project: actualProjectId,
      division: actualDivisionId,
      placeOfSupply: clientSupplyState,
      placeOfSupplyStateCode: clientSupplyStateCode,
      isInterState: calculated.isInterState,
      items: calculated.items,
      additionalCharges: calculated.additionalCharges,
      subtotal: calculated.subtotal,
      itemDiscountTotal: calculated.itemDiscountTotal,
      invoiceDiscount: calculated.invoiceDiscount,
      taxableAmount: calculated.taxableAmount,
      cgst: calculated.cgst,
      sgst: calculated.sgst,
      igst: calculated.igst,
      totalTax: calculated.totalTax,
      additionalChargesTotal: calculated.additionalChargesTotal,
      roundOff: calculated.roundOff,
      grandTotal: calculated.grandTotal,
      advanceAdjusted: 0,
      paidAmount: 0,
      outstandingBalance: calculated.grandTotal,
      status: status || 'Issued',
      paymentTerms: paymentTerms || settings.defaultPaymentTerms,
      notes: notes || '',
      termsAndConditions: termsAndConditions || settings.defaultTermsAndConditions,
      isLocked: false,
    });

    // Record in ledger if issued immediately
    if (invoice.status !== 'Draft') {
      await recordInvoiceInLedger({
        invoice,
        client,
        project,
        division,
      });
    }

    await logAuditEvent({
      action: 'CREATE_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id,
      performedBy: req.admin?.email || 'Admin',
      details: { invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal },
      ip: req.ip,
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('client')
      .populate('project')
      .populate('division');

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelInvoice(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const invoice = await Invoice.findById(id).populate('client project division');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.paidAmount > 0 || invoice.advanceAdjusted > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an invoice with allocated payments. Please issue a refund or credit note instead.',
      });
    }

    invoice.status = 'Cancelled';
    invoice.notes = `${invoice.notes || ''} [CANCELLED: ${reason || 'Admin cancellation'}]`.trim();
    await invoice.save();

    // Recalculate client ledger to reconcile running balances
    await recalculateClientLedger(invoice.client._id);

    await logAuditEvent({
      action: 'CANCEL_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id,
      performedBy: req.admin?.email || 'Admin',
      details: { reason, invoiceNumber: invoice.invoiceNumber },
      ip: req.ip,
    });

    return res.json({ success: true, message: 'Invoice cancelled successfully.', data: invoice });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

