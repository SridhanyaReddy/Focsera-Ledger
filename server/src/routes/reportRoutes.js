import express from 'express';
import { getDashboardData, getFinancialReports } from '../controllers/reportController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/dashboard', getDashboardData);
router.get('/data', getFinancialReports);

export default router;

