import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Division from '../models/Division.js';
import CompanySettings from '../models/CompanySettings.js';
import { getNextSequenceNumber } from '../services/numberingService.js';
import { calculateDocumentFinancials } from '../services/calculationService.js';
import { recordInvoiceInLedger } from '../services/ledgerService.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getQuotations(req, res) {
  try {
    const { client, division, status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (client && client !== 'all') filter.client = client;
    if (division && division !== 'all') filter.division = division;
    if (status && status !== 'all') filter.status = status;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ quotationNumber: searchRegex }, { notes: searchRegex }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [quotations, total] = await Promise.all([
      Quotation.find(filter)
        .populate('client', 'clientId name businessName phone email')
        .populate('project', 'projectId name')
        .populate('division', 'name code category')
        .sort({ quotationDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Quotation.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: quotations,
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

export async function getQuotationById(req, res) {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id)
      .populate('client')
      .populate('project')
      .populate('division')
      .populate('convertedToInvoice', 'invoiceNumber grandTotal status');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const settings = await CompanySettings.getSettings();

    return res.json({
      success: true,
      data: {
        quotation,
        company: settings,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createQuotation(req, res) {
  try {
    const {
      clientId,
      projectId,
      divisionId,
      quotationDate = new Date(),
      validityDays = 30,
      validUntil,
      items = [],
      additionalCharges = [],
      invoiceDiscount = 0,
      paymentSchedule,
      exclusions = [],
      termsAndConditions,
      notes,
      status = 'Draft',
    } = req.body;

    const actualClientId = clientId || req.body.client;
    const actualProjectId = projectId || req.body.project;
    const actualDivisionId = divisionId || req.body.division;

    if (!actualClientId || !actualDivisionId) {
      return res.status(400).json({ success: false, message: 'Client and Division are required.' });
    }

    const client = await Client.findById(actualClientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const division = await Division.findById(actualDivisionId);
    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found.' });
    }

    const settings = await CompanySettings.getSettings();

    const calculated = calculateDocumentFinancials({
      items,
      additionalCharges,
      invoiceDiscount,
      companyStateCode: settings.stateCode || '36',
      placeOfSupplyStateCode: client.stateCode || '36',
    });

    const quotationNumber = await getNextSequenceNumber('quotation', null, new Date(quotationDate));

    const finalValidUntil = validUntil
      ? new Date(validUntil)
      : new Date(new Date(quotationDate).getTime() + Number(validityDays) * 24 * 60 * 60 * 1000);

    const quotation = await Quotation.create({
      quotationNumber,
      quotationDate: new Date(quotationDate),
      validUntil: finalValidUntil,
      client: actualClientId,
      project: actualProjectId || null,
      division: actualDivisionId,
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
      paymentSchedule: paymentSchedule || '',
      exclusions: exclusions || [],
      termsAndConditions: termsAndConditions || settings.defaultTermsAndConditions || [],
      notes: notes || '',
      status,
    });

    await logAuditEvent({
      action: 'CREATE_QUOTATION',
      entity: 'Quotation',
      entityId: quotation._id,
      performedBy: req.admin?.email || 'Admin',
      details: { quotationNumber: quotation.quotationNumber, grandTotal: quotation.grandTotal },
      ip: req.ip,
    });

    const populated = await Quotation.findById(quotation._id)
      .populate('client')
      .populate('project')
      .populate('division');

    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateQuotation(req, res) {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (quotation.status === 'Converted') {
      return res.status(400).json({
        success: false,
        message: 'Converted quotations cannot be modified. They are preserved for financial audit integrity.',
      });
    }

    const {
      quotationDate,
      validUntil,
      divisionId,
      projectId,
      items,
      additionalCharges,
      invoiceDiscount,
      paymentSchedule,
      exclusions,
      termsAndConditions,
      notes,
      status,
    } = req.body;

    const client = await Client.findById(quotation.client);
    const settings = await CompanySettings.getSettings();

    if (items) {
      const calculated = calculateDocumentFinancials({
        items,
        additionalCharges: additionalCharges !== undefined ? additionalCharges : quotation.additionalCharges,
        invoiceDiscount: invoiceDiscount !== undefined ? invoiceDiscount : quotation.invoiceDiscount,
        companyStateCode: settings.stateCode || '36',
        placeOfSupplyStateCode: client?.stateCode || '36',
      });

      quotation.items = calculated.items;
      quotation.additionalCharges = calculated.additionalCharges;
      quotation.subtotal = calculated.subtotal;
      quotation.itemDiscountTotal = calculated.itemDiscountTotal;
      quotation.invoiceDiscount = calculated.invoiceDiscount;
      quotation.taxableAmount = calculated.taxableAmount;
      quotation.cgst = calculated.cgst;
      quotation.sgst = calculated.sgst;
      quotation.igst = calculated.igst;
      quotation.totalTax = calculated.totalTax;
      quotation.additionalChargesTotal = calculated.additionalChargesTotal;
      quotation.roundOff = calculated.roundOff;
      quotation.grandTotal = calculated.grandTotal;
    }

    if (quotationDate) quotation.quotationDate = new Date(quotationDate);
    if (validUntil) quotation.validUntil = new Date(validUntil);
    if (divisionId) quotation.division = divisionId;
    if (projectId !== undefined) quotation.project = projectId || null;
    if (paymentSchedule !== undefined) quotation.paymentSchedule = paymentSchedule;
    if (exclusions !== undefined) quotation.exclusions = exclusions;
    if (termsAndConditions !== undefined) quotation.termsAndConditions = termsAndConditions;
    if (notes !== undefined) quotation.notes = notes;
    if (status !== undefined) quotation.status = status;

    await quotation.save();

    await logAuditEvent({
      action: 'UPDATE_QUOTATION',
      entity: 'Quotation',
      entityId: quotation._id,
      performedBy: req.admin?.email || 'Admin',
      details: req.body,
      ip: req.ip,
    });

    const populated = await Quotation.findById(quotation._id)
      .populate('client')
      .populate('project')
      .populate('division');

    return res.json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Converts an accepted Quotation directly into a Tax Invoice (Section 10)
 */
export async function convertQuotationToInvoice(req, res) {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id).populate('client project division');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (quotation.status === 'Converted' && quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        message: 'This quotation has already been converted to an invoice.',
      });
    }

    const { invoiceType = 'Tax Invoice', dueDate, notes } = req.body;

    const settings = await CompanySettings.getSettings();
    const invoiceNumber = await getNextSequenceNumber('invoice');

    const invDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days default

    // If project was not assigned on quotation, ensure project exists or create default
    let projectRef = quotation.project;
    if (!projectRef) {
      const prjId = await getNextSequenceNumber('project');
      projectRef = await Project.create({
        projectId: prjId,
        name: `Project - ${quotation.client.name}`,
        client: quotation.client._id,
        division: quotation.division._id,
        agreedProjectValue: quotation.grandTotal,
        serviceCategory: quotation.items[0]?.serviceName || 'General Services',
      });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceType,
      invoiceDate: new Date(),
      dueDate: invDueDate,
      client: quotation.client._id,
      project: projectRef._id,
      division: quotation.division._id,
      placeOfSupply: quotation.client.state || 'Telangana',
      placeOfSupplyStateCode: quotation.client.stateCode || '36',
      isInterState: String(settings.stateCode) !== String(quotation.client.stateCode),
      items: quotation.items.map((i) => ({
        service: i.service,
        serviceName: i.serviceName,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.rate,
        discount: i.discount,
        taxPercentage: i.taxPercentage,
        taxableAmount: i.taxableAmount,
        cgst: i.cgst || (i.taxAmount ? i.taxAmount / 2 : 0),
        sgst: i.sgst || (i.taxAmount ? i.taxAmount / 2 : 0),
        igst: i.igst || 0,
        totalAmount: i.totalAmount,
      })),
      additionalCharges: quotation.additionalCharges,
      subtotal: quotation.subtotal,
      itemDiscountTotal: quotation.itemDiscountTotal,
      invoiceDiscount: quotation.invoiceDiscount,
      taxableAmount: quotation.taxableAmount,
      cgst: quotation.cgst,
      sgst: quotation.sgst,
      igst: quotation.igst,
      totalTax: quotation.totalTax,
      additionalChargesTotal: quotation.additionalChargesTotal,
      roundOff: quotation.roundOff,
      grandTotal: quotation.grandTotal,
      advanceAdjusted: 0,
      paidAmount: 0,
      outstandingBalance: quotation.grandTotal,
      status: 'Issued',
      paymentTerms: quotation.paymentSchedule || settings.defaultPaymentTerms,
      notes: notes || quotation.notes || '',
      termsAndConditions: quotation.termsAndConditions || settings.defaultTermsAndConditions,
      quotationReference: quotation._id,
      isLocked: false,
    });

    // Mark quotation converted
    quotation.status = 'Converted';
    quotation.convertedToInvoice = invoice._id;
    await quotation.save();

    // Record invoice in client ledger and centralized transactions
    await recordInvoiceInLedger({
      invoice,
      client: quotation.client,
      project: projectRef,
      division: quotation.division,
    });

    await logAuditEvent({
      action: 'CONVERT_QUOTATION_TO_INVOICE',
      entity: 'Quotation',
      entityId: quotation._id,
      performedBy: req.admin?.email || 'Admin',
      details: { quotationNumber: quotation.quotationNumber, invoiceNumber: invoice.invoiceNumber },
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: `Quotation converted to Invoice ${invoice.invoiceNumber} successfully.`,
      data: {
        invoice,
        quotation,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

