import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
} from '../controllers/projectController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.patch('/:id/archive', archiveProject);

export default router;

