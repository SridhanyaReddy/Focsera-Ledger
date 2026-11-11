import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET audits (Read-only. STRICT IMMUTABILITY: No DELETE/UPDATE endpoints exist)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { type, startDate, endDate, date, search } = req.query;
    const query = {};

    if (type === 'auth') {
      // Login / Logout session audits
      query.$or = [
        { action: { $regex: 'LOGIN|LOGOUT|AUTH|SESSION', $options: 'i' } },
        { entity: 'AUTH' },
      ];
    } else if (type === 'activity') {
      // Specific day or time range detailed operational audits
      query.$nor = [
        { action: { $regex: 'LOGIN|LOGOUT', $options: 'i' }, entity: 'AUTH' },
      ];
    }

    // Single specific day filter
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (search && search.trim()) {
      const term = search.trim();
      const searchConditions = [
        { action: { $regex: term, $options: 'i' } },
        { entity: { $regex: term, $options: 'i' } },
        { entityId: { $regex: term, $options: 'i' } },
        { performedBy: { $regex: term, $options: 'i' } },
        { ipAddress: { $regex: term, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(500);

    // Compute stats
    const totalCount = await AuditLog.countDocuments();
    const authCount = await AuditLog.countDocuments({
      $or: [
        { action: { $regex: 'LOGIN|LOGOUT|AUTH|SESSION', $options: 'i' } },
        { entity: 'AUTH' },
      ],
    });

    return res.json({
      success: true,
      data: logs,
      stats: {
        totalLogs: totalCount,
        authLogs: authCount,
        activityLogs: totalCount - authCount,
      },
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving audit logs' });
  }
});

// Explicitly reject any deletion attempts
router.delete('*', requireAdmin, (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'CRITICAL SECURITY RESTRICTION: Audit trails are strictly immutable and cannot be deleted by any user or administrator. Deletion is only permitted via direct database administration.',
  });
});

export default router;

