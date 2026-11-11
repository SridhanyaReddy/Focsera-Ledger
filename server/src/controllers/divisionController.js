import Division from '../models/Division.js';
import { PREDEFINED_DIVISIONS } from '../config/constants.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getDivisions(req, res) {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    const divisions = await Division.find(filter).sort({ isPredefined: -1, name: 1 });
    return res.json({ success: true, data: divisions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createDivision(req, res) {
  try {
    const { name, category, description } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Division name and category are required.' });
    }

    const code = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Division.findOne({ $or: [{ name: name.trim() }, { code }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A division with this name already exists.' });
    }

    const division = await Division.create({
      name: name.trim(),
      code,
      category: category.trim(),
      description: description?.trim() || '',
      isPredefined: false,
      isActive: true,
    });

    await logAuditEvent({
      action: 'CREATE_DIVISION',
      entity: 'Division',
      entityId: division._id,
      performedBy: req.admin?.email || 'Admin',
      details: { name: division.name },
      ip: req.ip,
    });

    return res.status(201).json({ success: true, data: division });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateDivision(req, res) {
  try {
    const { id } = req.params;
    const { name, category, description, isActive } = req.body;

    const division = await Division.findById(id);
    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found.' });
    }

    if (name) division.name = name.trim();
    if (category) division.category = category.trim();
    if (description !== undefined) division.description = description.trim();
    if (isActive !== undefined) division.isActive = Boolean(isActive);

    await division.save();

    await logAuditEvent({
      action: 'UPDATE_DIVISION',
      entity: 'Division',
      entityId: division._id,
      performedBy: req.admin?.email || 'Admin',
      details: req.body,
      ip: req.ip,
    });

    return res.json({ success: true, data: division });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

