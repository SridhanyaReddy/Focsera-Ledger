import express from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  archiveClient,
} from '../controllers/clientController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.patch('/:id/archive', archiveClient);

export default router;

