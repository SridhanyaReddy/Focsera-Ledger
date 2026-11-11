import express from 'express';
import {
  getServices,
  createService,
  updateService,
  getPackages,
  createPackage,
} from '../controllers/serviceController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getServices);
router.post('/', createService);
router.put('/:id', updateService);

router.get('/packages', getPackages);
router.post('/packages', createPackage);

export default router;

