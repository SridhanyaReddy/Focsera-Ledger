import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', globalSearch);

export default router;

