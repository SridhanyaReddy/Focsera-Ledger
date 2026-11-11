import express from 'express';
import { getDivisions, createDivision, updateDivision } from '../controllers/divisionController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getDivisions);
router.post('/', createDivision);
router.put('/:id', updateDivision);

export default router;

