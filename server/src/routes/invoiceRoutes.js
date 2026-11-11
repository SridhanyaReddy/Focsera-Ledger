import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  cancelInvoice,
} from '../controllers/invoiceController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.post('/:id/cancel', cancelInvoice);

export default router;

