import express from 'express';
import { getTransactions, getAuditLogs } from '../controllers/transactionController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getTransactions);
router.get('/audit-logs', getAuditLogs);

export default router;

