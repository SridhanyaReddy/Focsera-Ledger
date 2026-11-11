import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Division from '../models/Division.js';
import { getNextSequenceNumber } from '../services/numberingService.js';
import { getProjectFinancialOverview } from '../services/ledgerService.js';
import { logAuditEvent } from '../services/auditService.js';

export async function getProjects(req, res) {
  try {
    const { client, division, status, search, isArchived = 'false', page = 1, limit = 50 } = req.query;

    const filter = { isArchived: isArchived === 'true' };

    if (client && client !== 'all') filter.client = client;
    if (division && division !== 'all') filter.division = division;
    if (status && status !== 'all') filter.status = status;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { projectId: searchRegex }, { serviceCategory: searchRegex }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('client', 'clientId name businessName phone')
        .populate('division', 'name code category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    // Enhance with live financial overview
    const projectsWithFinancials = await Promise.all(
      projects.map(async (prj) => {
        try {
          const overview = await getProjectFinancialOverview(prj._id);
          return {
            ...prj.toObject(),
            totalInvoiced: overview.totalInvoiced,
            totalReceived: overview.totalReceived,
            outstandingAmount: overview.outstandingAmount,
            paymentStatus: overview.paymentStatus,
          };
        } catch {
          return prj.toObject();
        }
      })
    );

    return res.json({
      success: true,
      data: projectsWithFinancials,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const overview = await getProjectFinancialOverview(id);
    return res.json({ success: true, data: overview });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createProject(req, res) {
  try {
    const {
      name,
      clientId,
      divisionId,
      serviceCategory,
      description,
      startDate,
      expectedCompletionDate,
      agreedProjectValue,
      paymentTerms,
      milestones,
      status,
      internalNotes,
    } = req.body;

    const actualClientId = clientId || req.body.client;
    const actualDivisionId = divisionId || req.body.division;

    if (!name || !actualClientId || !actualDivisionId) {
      return res.status(400).json({
        success: false,
        message: 'Project name, Client, and Focsera Division are required.',
      });
    }

    const client = await Client.findById(actualClientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const division = await Division.findById(actualDivisionId);
    if (!division) {
      return res.status(404).json({ success: false, message: 'Division not found.' });
    }

    const projectId = await getNextSequenceNumber('project');

    const formattedMilestones = (milestones || []).map((m, index) => ({
      milestoneId: m.milestoneId || `M-${index + 1}`,
      name: m.name || `Milestone ${index + 1}`,
      percentage: Number(m.percentage) || 0,
      amount: Number(m.amount) || 0,
      dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
      status: m.status || 'Pending',
      notes: m.notes || '',
    }));

    const project = await Project.create({
      projectId,
      name: name.trim(),
      client: actualClientId,
      division: actualDivisionId,
      serviceCategory: serviceCategory?.trim() || '',
      description: description?.trim() || '',
      startDate: startDate ? new Date(startDate) : undefined,
      expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : undefined,
      agreedProjectValue: Number(agreedProjectValue) || 0,
      paymentTerms: paymentTerms || '',
      milestones: formattedMilestones,
      status: status || 'In Progress',
      internalNotes: internalNotes || '',
    });

    await logAuditEvent({
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: project._id,
      performedBy: req.admin?.email || 'Admin',
      details: { projectId: project.projectId, name: project.name, client: client.name },
      ip: req.ip,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('client', 'clientId name businessName')
      .populate('division', 'name code');

    return res.status(201).json({ success: true, data: populatedProject });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const updatable = [
      'name',
      'division',
      'serviceCategory',
      'description',
      'startDate',
      'expectedCompletionDate',
      'agreedProjectValue',
      'paymentTerms',
      'milestones',
      'status',
      'internalNotes',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    await project.save();

    await logAuditEvent({
      action: 'UPDATE_PROJECT',
      entity: 'Project',
      entityId: project._id,
      performedBy: req.admin?.email || 'Admin',
      details: req.body,
      ip: req.ip,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('client', 'clientId name businessName')
      .populate('division', 'name code');

    return res.json({ success: true, data: populatedProject });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function archiveProject(req, res) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    project.isArchived = !project.isArchived;
    await project.save();

    return res.json({
      success: true,
      message: `Project ${project.isArchived ? 'archived' : 'restored'} successfully.`,
      data: project,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

