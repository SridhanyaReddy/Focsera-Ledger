import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';
import Receipt from '../models/Receipt.js';
import Transaction from '../models/Transaction.js';

export async function globalSearch(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { clients: [], projects: [], invoices: [], quotations: [], receipts: [], transactions: [] } });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');

    const [clients, projects, invoices, quotations, receipts, transactions] = await Promise.all([
      Client.find({
        isArchived: false,
        $or: [{ name: regex }, { businessName: regex }, { phone: regex }, { email: regex }, { clientId: regex }],
      }).limit(5),

      Project.find({
        isArchived: false,
        $or: [{ name: regex }, { projectId: regex }, { serviceCategory: regex }],
      }).populate('client division').limit(5),

      Invoice.find({
        $or: [{ invoiceNumber: regex }, { notes: regex }],
      }).populate('client project division').limit(5),

      Quotation.find({
        $or: [{ quotationNumber: regex }, { notes: regex }],
      }).populate('client project division').limit(5),

      Receipt.find({
        $or: [{ receiptNumber: regex }, { transactionReference: regex }],
      }).populate('client project invoice').limit(5),

      Transaction.find({
        $or: [{ transactionId: regex }, { referenceNumber: regex }, { description: regex }],
      }).populate('client project division').limit(5),
    ]);

    return res.json({
      success: true,
      data: {
        clients,
        projects,
        invoices,
        quotations,
        receipts,
        transactions,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

