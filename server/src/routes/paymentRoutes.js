import express from 'express';
import {
  getPayments,
  recordPayment,
  allocateAdvance,
  recordRefund,
  getReceipts,
  getReceiptById,
} from '../controllers/paymentController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getPayments);
router.post('/', recordPayment);
router.post('/allocate-advance', allocateAdvance);
router.post('/refund', recordRefund);

router.get('/receipts/list', getReceipts);
router.get('/receipts/:id', getReceiptById);

export default router;

