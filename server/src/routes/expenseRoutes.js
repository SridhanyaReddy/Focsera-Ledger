import express from 'express';
import Expense from '../models/Expense.js';
import Division from '../models/Division.js';
import Project from '../models/Project.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all expenses with filters
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { category, division, status, search, startDate, endDate } = req.query;
    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }
    if (division && division !== 'all') {
      query.division = division;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { expenseNumber: { $regex: term, $options: 'i' } },
        { vendor: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { referenceNumber: { $regex: term, $options: 'i' } },
      ];
    }

    const expenses = await Expense.find(query)
      .populate('division', 'name')
      .populate('project', 'name projectId')
      .sort({ expenseDate: -1, createdAt: -1 });

    const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return res.json({
      success: true,
      data: expenses,
      summary: {
        count: expenses.length,
        totalAmount: totalExpenseAmount,
      },
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching expenses' });
  }
});

// POST create new expense
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      category,
      division,
      project,
      vendor,
      amount,
      expenseDate,
      paymentMethod,
      referenceNumber,
      description,
      notes,
      status,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid expense amount is required' });
    }

    // Auto-generate expense number EXP-YYYYMM-XXXX
    const count = await Expense.countDocuments();
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const expenseNumber = `EXP-${dateStr}-${String(count + 1).padStart(4, '0')}`;

    const newExpense = new Expense({
      expenseNumber,
      category: category || 'Operations',
      division: division || null,
      project: project || null,
      vendor: vendor || 'General Vendor',
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paymentMethod: paymentMethod || 'Bank Transfer',
      referenceNumber: referenceNumber || '',
      description: description || '',
      notes: notes || '',
      status: status || 'Paid',
    });

    await newExpense.save();

    const populated = await Expense.findById(newExpense._id)
      .populate('division', 'name')
      .populate('project', 'name projectId');

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: populated,
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    return res.status(500).json({ success: false, message: 'Server error recording expense' });
  }
});

// DELETE expense
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    return res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting expense' });
  }
});

export default router;

