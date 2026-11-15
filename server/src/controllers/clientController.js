import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';
import Payment from '../models/Payment.js';
import LedgerEntry from '../models/LedgerEntry.js';
import { getNextSequenceNumber } from '../services/numberingService.js';
import { getClientFinancialProfile } from '../services/ledgerService.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getClients(req, res) {
  try {
    const { search, type, isArchived = 'false', page = 1, limit = 50 } = req.query;

    const filter = { isArchived: isArchived === 'true' };

    if (type && type !== 'all') {
      filter.clientType = type;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { businessName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { clientId: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Client.countDocuments(filter),
    ]);

    if (clients.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: Number(page), limit: Number(limit), pages: 0 },
      });
    }

    const clientIds = clients.map((c) => c._id);

    // High performance batch aggregation for all clients in ONE trip
    const [invoiceStats, paymentStats, advanceStats] = await Promise.all([
      Invoice.aggregate([
        { $match: { client: { $in: clientIds }, status: { $nin: ['Cancelled', 'Draft'] } } },
        { $group: { _id: '$client', totalInvoiced: { $sum: '$grandTotal' } } },
      ]),
      Payment.aggregate([
        { $match: { client: { $in: clientIds }, paymentType: { $nin: ['Refund', 'Reversal'] }, isReversed: false } },
        { $group: { _id: '$client', totalReceived: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { client: { $in: clientIds }, unallocatedAmount: { $gt: 0 }, isReversed: false } },
        { $group: { _id: '$client', unallocatedAdvances: { $sum: '$unallocatedAmount' } } },
      ]),
    ]);

    const invoiceMap = new Map(invoiceStats.map((i) => [i._id.toString(), i.totalInvoiced]));
    const paymentMap = new Map(paymentStats.map((p) => [p._id.toString(), p.totalReceived]));
    const advanceMap = new Map(advanceStats.map((a) => [a._id.toString(), a.unallocatedAdvances]));

    const clientsWithFinancials = clients.map((client) => {
      const cId = client._id.toString();
      const totalInvoiced = Math.round((invoiceMap.get(cId) || 0) * 100) / 100;
      const totalReceived = Math.round((paymentMap.get(cId) || 0) * 100) / 100;
      const unallocatedAdvances = Math.round((advanceMap.get(cId) || 0) * 100) / 100;
      const outstandingBalance = Math.max(0, Math.round((totalInvoiced - totalReceived) * 100) / 100);

      return {
        ...client,
        totalInvoiced,
        totalReceived,
        outstandingBalance,
        unallocatedAdvances,
      };
    });

    return res.json({
      success: true,
      data: clientsWithFinancials,
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

export async function getClientById(req, res) {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const [financials, projects, quotations, invoices, payments, ledgerEntries] = await Promise.all([
      getClientFinancialProfile(id),
      Project.find({ client: id }).populate('division').sort({ createdAt: -1 }),
      Quotation.find({ client: id }).populate('division project').sort({ quotationDate: -1 }),
      Invoice.find({ client: id }).populate('division project').sort({ invoiceDate: -1 }),
      Payment.find({ client: id }).populate('project invoice').sort({ paymentDate: -1 }),
      LedgerEntry.find({ client: id }).populate('project division').sort({ date: -1, _id: -1 }),
    ]);

    return res.json({
      success: true,
      data: {
        client,
        financials: {
          totalInvoiced: financials.totalInvoiced,
          totalReceived: financials.totalReceived,
          totalRefunded: financials.totalRefunded,
          outstandingBalance: financials.currentOutstanding,
          unallocatedAdvances: financials.unallocatedAdvances,
        },
        projects,
        quotations,
        invoices,
        payments,
        ledgerEntries,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createClient(req, res) {
  try {
    const {
      name,
      businessName,
      phone,
      email,
      billingAddress,
      gstin,
      state,
      stateCode,
      clientType,
      notes,
      openingBalance,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Client name and phone number are required.' });
    }

    const clientId = await getNextSequenceNumber('client');

    const client = await Client.create({
      clientId,
      name: name.trim(),
      businessName: businessName?.trim() || '',
      phone: phone.trim(),
      email: email?.trim().toLowerCase() || '',
      billingAddress: billingAddress || {},
      gstin: gstin?.trim().toUpperCase() || '',
      state: state || billingAddress?.state || 'Telangana',
      stateCode: stateCode || billingAddress?.stateCode || '36',
      clientType: clientType || 'Individual',
      notes: notes || '',
      openingBalance: Number(openingBalance) || 0,
    });

    await logAuditEvent({
      action: 'CREATE_CLIENT',
      entity: 'Client',
      entityId: client._id,
      performedBy: req.admin?.email || 'Admin',
      details: { clientId: client.clientId, name: client.name },
      ip: req.ip,
    });

    return res.status(201).json({ success: true, data: client });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateClient(req, res) {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const updatable = [
      'name',
      'businessName',
      'phone',
      'email',
      'billingAddress',
      'gstin',
      'state',
      'stateCode',
      'clientType',
      'notes',
      'openingBalance',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        client[field] = req.body[field];
      }
    });

    await client.save();

    await logAuditEvent({
      action: 'UPDATE_CLIENT',
      entity: 'Client',
      entityId: client._id,
      performedBy: req.admin?.email || 'Admin',
      details: req.body,
      ip: req.ip,
    });

    return res.json({ success: true, data: client });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function archiveClient(req, res) {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    client.isArchived = !client.isArchived;
    await client.save();

    await logAuditEvent({
      action: client.isArchived ? 'ARCHIVE_CLIENT' : 'UNARCHIVE_CLIENT',
      entity: 'Client',
      entityId: client._id,
      performedBy: req.admin?.email || 'Admin',
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: `Client ${client.isArchived ? 'archived' : 'restored'} successfully.`,
      data: client,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

