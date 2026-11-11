import express from 'express';
import {
  getSetupStatus,
  setupInitialAdmin,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/setup/status', getSetupStatus);
router.post('/setup/initialize', setupInitialAdmin);
router.post('/login', login);
router.post('/logout', requireAdmin, async (req, res) => {
  try {
    const { logAuditEvent } = await import('../utils/auditLogger.js');
    await logAuditEvent({
      action: 'ADMIN_LOGOUT',
      entity: 'AUTH',
      entityId: req.admin?._id,
      performedBy: req.admin?.email || 'admin@focsera.in',
      details: { timestamp: new Date() },
      ip: req.ip,
    });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.json({ success: true, message: 'Logged out' });
  }
});
router.get('/me', requireAdmin, getMe);
router.post('/change-password', requireAdmin, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;

