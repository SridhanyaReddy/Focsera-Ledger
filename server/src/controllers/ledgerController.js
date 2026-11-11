import LedgerEntry from '../models/LedgerEntry.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Division from '../models/Division.js';
import CompanySettings from '../models/CompanySettings.js';
import { getClientFinancialProfile, recalculateClientLedger } from '../services/ledgerService.js';
import { round } from '../services/calculationService.js';

export async function getClientLedger(req, res) {
  try {
    const { clientId } = req.params;
    const { startDate, endDate, project, division, entryType, search } = req.query;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const filter = { client: clientId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (project && project !== 'all') filter.project = project;
    if (division && division !== 'all') filter.division = division;
    if (entryType && entryType !== 'all') filter.entryType = entryType;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { transactionId: searchRegex },
        { referenceNumber: searchRegex },
        { description: searchRegex },
      ];
    }

    const entries = await LedgerEntry.find(filter)
      .populate('project', 'projectId name')
      .populate('division', 'name code')
      .sort({ date: 1, _id: 1 });

    const profile = await getClientFinancialProfile(clientId);
    const company = await CompanySettings.getSettings();

    // Calculate total debits and credits in the filtered result
    const totalDebit = round(entries.reduce((acc, e) => acc + (e.debit || 0), 0));
    const totalCredit = round(entries.reduce((acc, e) => acc + (e.credit || 0), 0));

    return res.json({
      success: true,
      data: {
        client,
        company,
        summary: {
          openingBalance: round(client.openingBalance || 0),
          totalDebit,
          totalCredit,
          currentOutstanding: profile.currentOutstanding,
          unallocatedAdvances: profile.unallocatedAdvances,
          totalInvoiced: profile.totalInvoiced,
          totalReceived: profile.totalReceived,
        },
        entries,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Company-wide consolidated financial ledger
 */
export async function getCompanyLedger(req, res) {
  try {
    const { startDate, endDate, division, client, entryType, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (division && division !== 'all') filter.division = division;
    if (client && client !== 'all') filter.client = client;
    if (entryType && entryType !== 'all') filter.entryType = entryType;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { transactionId: searchRegex },
        { referenceNumber: searchRegex },
        { description: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [entries, total] = await Promise.all([
      LedgerEntry.find(filter)
        .populate('client', 'clientId name businessName')
        .populate('project', 'projectId name')
        .populate('division', 'name code')
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(Number(limit)),
      LedgerEntry.countDocuments(filter),
    ]);

    const allFiltered = await LedgerEntry.find(filter);
    const totalDebit = round(allFiltered.reduce((acc, e) => acc + (e.debit || 0), 0));
    const totalCredit = round(allFiltered.reduce((acc, e) => acc + (e.credit || 0), 0));

    return res.json({
      success: true,
      data: {
        summary: {
          totalDebit,
          totalCredit,
          netReceivables: round(totalDebit - totalCredit),
        },
        entries,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

