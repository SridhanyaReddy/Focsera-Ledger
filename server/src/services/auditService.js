import AuditLog from '../models/AuditLog.js';

export async function logAuditEvent({ action, entity, entityId, performedBy = 'Admin', details = {}, ip = '' }) {
  try {
    return await AuditLog.create({
      action,
      entity,
      entityId: String(entityId || ''),
      performedBy,
      details,
      ipAddress: ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

