import express from 'express';
import Todo from '../models/Todo.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all todos
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const query = {};

    if (status === 'completed') {
      query.isCompleted = true;
    } else if (status === 'pending') {
      query.isCompleted = false;
    }

    if (category && category !== 'all') {
      query.category = category;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const todos = await Todo.find(query)
      .populate('project', 'name projectId')
      .populate('client', 'name')
      .sort({ isCompleted: 1, dueDate: 1, createdAt: -1 });

    const totalCount = await Todo.countDocuments();
    const pendingCount = await Todo.countDocuments({ isCompleted: false });
    const completedCount = await Todo.countDocuments({ isCompleted: true });

    return res.json({
      success: true,
      data: todos,
      counts: {
        total: totalCount,
        pending: pendingCount,
        completed: completedCount,
      },
    });
  } catch (err) {
    console.error('Error fetching todos:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving todos' });
  }
});

// POST create todo
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, description, priority, dueDate, category, project, client } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const todo = new Todo({
      title: title.trim(),
      description: description || '',
      priority: priority || 'Medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      category: category || 'General',
      project: project || null,
      client: client || null,
      isCompleted: false,
    });

    await todo.save();

    const populated = await Todo.findById(todo._id)
      .populate('project', 'name projectId')
      .populate('client', 'name');

    return res.status(201).json({ success: true, message: 'Task added', data: populated });
  } catch (err) {
    console.error('Error creating todo:', err);
    return res.status(500).json({ success: false, message: 'Server error creating todo' });
  }
});

// PATCH toggle todo completion
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    todo.isCompleted = !todo.isCompleted;
    todo.completedAt = todo.isCompleted ? new Date() : null;
    await todo.save();

    return res.json({
      success: true,
      message: todo.isCompleted ? 'Task marked complete' : 'Task marked pending',
      data: todo,
    });
  } catch (err) {
    console.error('Error toggling todo:', err);
    return res.status(500).json({ success: false, message: 'Server error updating todo' });
  }
});

// DELETE todo
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting todo:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting todo' });
  }
});

export default router;

