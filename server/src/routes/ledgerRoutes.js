import express from 'express';
import { getClientLedger, getCompanyLedger } from '../controllers/ledgerController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/client/:clientId', getClientLedger);
router.get('/company', getCompanyLedger);

export default router;

