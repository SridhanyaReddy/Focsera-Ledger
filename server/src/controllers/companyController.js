import CompanySettings from '../models/CompanySettings.js';
import { logAuditEvent } from '../services/auditService.js';
import Admin from '../models/Admin.js';
import Division from '../models/Division.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Service from '../models/Service.js';
import Package from '../models/Package.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import PaymentAllocation from '../models/PaymentAllocation.js';
import Receipt from '../models/Receipt.js';
import LedgerEntry from '../models/LedgerEntry.js';
import CreditNote from '../models/CreditNote.js';
import DebitNote from '../models/DebitNote.js';
import Transaction from '../models/Transaction.js';
import NumberSequence from '../models/NumberSequence.js';

export async function getCompanySettings(req, res) {
  try {
    const settings = await CompanySettings.getSettings();
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateCompanySettings(req, res) {
  try {
    let settings = await CompanySettings.findOne({ isSingleton: true });
    if (!settings) {
      settings = new CompanySettings({ isSingleton: true });
    }

    const updatableFields = [
      'legalName',
      'brandName',
      'tagline',
      'logo',
      'registeredAddress',
      'contactNumber',
      'businessEmail',
      'website',
      'gstin',
      'state',
      'stateCode',
      'currency',
      'currencySymbol',
      'financialYear',
      'bankDetails',
      'authorizedSignatory',
      'numberingPrefixes',
      'defaultPaymentTerms',
      'defaultTermsAndConditions',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    settings.isConfigured = true;
    await settings.save();

    await logAuditEvent({
      action: 'UPDATE_COMPANY_SETTINGS',
      entity: 'CompanySettings',
      entityId: settings._id,
      performedBy: req.admin?.email || 'Admin',
      details: req.body,
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: 'Company settings updated successfully.',
      data: settings,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportDatabaseBackup(req, res) {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      companySettings: await CompanySettings.find(),
      divisions: await Division.find(),
      clients: await Client.find(),
      projects: await Project.find(),
      services: await Service.find(),
      packages: await Package.find(),
      quotations: await Quotation.find(),
      invoices: await Invoice.find(),
      payments: await Payment.find(),
      paymentAllocations: await PaymentAllocation.find(),
      receipts: await Receipt.find(),
      ledgerEntries: await LedgerEntry.find(),
      creditNotes: await CreditNote.find(),
      debitNotes: await DebitNote.find(),
      transactions: await Transaction.find(),
      numberSequences: await NumberSequence.find(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=focsera-backup-${Date.now()}.json`);
    return res.json(backupData);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function clearOperationalData(req, res) {
  try {
    await Promise.all([
      Client.deleteMany({}),
      Project.deleteMany({}),
      Quotation.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      PaymentAllocation.deleteMany({}),
      Receipt.deleteMany({}),
      LedgerEntry.deleteMany({}),
      CreditNote.deleteMany({}),
      DebitNote.deleteMany({}),
      Transaction.deleteMany({}),
      NumberSequence.deleteMany({}),
    ]);

    await logAuditEvent({
      action: 'CLEAR_OPERATIONAL_DATA',
      entity: 'System',
      performedBy: req.admin?.email || 'Admin',
      details: { message: 'All operational documents and ledgers reset to clean slate' },
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: 'All client, project, invoice, payment, and ledger data cleared. Database is in a pristine clean-slate state.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

