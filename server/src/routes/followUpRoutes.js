import express from 'express';
import FollowUp from '../models/FollowUp.js';
import Project from '../models/Project.js';
import AuditLog from '../models/AuditLog.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all project follow-ups with filters
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { project, type, search } = req.query;
    const query = {};

    if (project && project !== 'all') {
      query.project = project;
    }
    if (type && type !== 'all') {
      query.type = type;
    }
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { notes: { $regex: term, $options: 'i' } },
        { handlerName: { $regex: term, $options: 'i' } },
        { actionItems: { $regex: term, $options: 'i' } },
      ];
    }

    const items = await FollowUp.find(query)
      .populate('project', 'name projectId division')
      .populate('client', 'name businessName')
      .sort({ meetingDate: -1, createdAt: -1 });

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('Error fetching follow-ups:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving follow-ups' });
  }
});

// POST record new project follow-up / meeting / note
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      project,
      title,
      type,
      meetingDate,
      handlerName,
      notes,
      actionItems,
      nextFollowUpDate,
      status,
    } = req.body;

    if (!project) {
      return res.status(400).json({ success: false, message: 'Project reference is required' });
    }
    if (!title || !notes) {
      return res.status(400).json({ success: false, message: 'Title and notes are required' });
    }

    const targetProject = await Project.findById(project);
    if (!targetProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const followUp = new FollowUp({
      project,
      client: targetProject.client,
      title,
      type: type || 'Meeting',
      meetingDate: meetingDate ? new Date(meetingDate) : new Date(),
      handlerName: handlerName || 'Project Lead',
      notes,
      actionItems: actionItems || '',
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      status: status || 'Completed',
    });

    await followUp.save();

    await AuditLog.create({
      action: 'PROJECT_FOLLOWUP_RECORDED',
      entity: 'PROJECT',
      entityId: targetProject.projectId,
      performedBy: handlerName || 'Project Handler',
      details: { title, type, meetingDate },
    });

    const populated = await FollowUp.findById(followUp._id)
      .populate('project', 'name projectId')
      .populate('client', 'name');

    return res.status(201).json({
      success: true,
      message: 'Project meeting/followup recorded successfully',
      data: populated,
    });
  } catch (err) {
    console.error('Error recording follow-up:', err);
    return res.status(500).json({ success: false, message: 'Server error recording follow-up' });
  }
});

// DELETE follow-up
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await FollowUp.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    return res.json({ success: true, message: 'Follow-up removed successfully' });
  } catch (err) {
    console.error('Error deleting follow-up:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting follow-up' });
  }
});

export default router;

