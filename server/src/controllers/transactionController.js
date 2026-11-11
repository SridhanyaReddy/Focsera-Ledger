import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

export async function getTransactions(req, res) {
  try {
    const { client, project, division, category, startDate, endDate, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (client && client !== 'all') filter.client = client;
    if (project && project !== 'all') filter.project = project;
    if (division && division !== 'all') filter.division = division;
    if (category && category !== 'all') filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { transactionId: searchRegex },
        { referenceNumber: searchRegex },
        { description: searchRegex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('client', 'clientId name businessName')
        .populate('project', 'projectId name')
        .populate('division', 'name code category')
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: transactions,
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

export async function getAuditLogs(req, res) {
  try {
    const { action, entity, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: logs,
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

