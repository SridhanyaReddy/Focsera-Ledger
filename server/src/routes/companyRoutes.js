import express from 'express';
import {
  getCompanySettings,
  updateCompanySettings,
  exportDatabaseBackup,
  clearOperationalData,
} from '../controllers/companyController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getCompanySettings);
router.put('/', updateCompanySettings);
router.get('/backup/export', exportDatabaseBackup);
router.post('/reset-data', clearOperationalData);

export default router;

