import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import api from '../../api';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function TodoPage() {
  const { success, error } = useToast();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/todos');
      if (res.data.success) {
        setTodos(res.data.data);
      }
    } catch (err) {
      error('Failed to load to-do items');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/todos/${id}/toggle`);
      if (res.data.success) {
        fetchTodos();
      }
    } catch (err) {
      error('Failed to update task');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/todos/${id}`);
      if (res.data.success) {
        success('Task removed');
        fetchTodos();
      }
    } catch (err) {
      error('Failed to delete task');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return error('Please enter a task');
    }
    setSaving(true);
    try {
      const res = await api.post('/todos', {
        title: formData.title.trim(),
        dueDate: formData.dueDate || new Date(),
      });
      if (res.data.success) {
        success('Task added');
        setIsModalOpen(false);
        setFormData({
          title: '',
          dueDate: new Date().toISOString().slice(0, 10),
        });
        fetchTodos();
      }
    } catch (err) {
      error('Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  // Group to-do items by date
  const groupedByDate = {};
  todos.forEach((t) => {
    const dateKey = t.dueDate ? t.dueDate.slice(0, 10) : 'No Date';
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(t);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(b) - new Date(a);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[#182333] tracking-tight">To-Do List</h1>
          <p className="text-xs font-sans text-[#697586] mt-0.5">
            Simple chronological task list organized date-wise
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#52799D] hover:bg-[#233D5B] text-white font-medium font-sans text-xs rounded-lg shadow-subtle transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Date-Wise Grouped To-Do List */}
      <div className="space-y-5">
        {sortedDates.map((dateKey) => {
          const items = groupedByDate[dateKey];
          const isToday =
            dateKey !== 'No Date' &&
            new Date(dateKey).toDateString() === new Date().toDateString();

          return (
            <div
              key={dateKey}
              className="bg-white rounded-lg border border-[#E2E7ED] shadow-subtle overflow-hidden"
            >
              {/* Date Header */}
              <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E7ED] flex items-center justify-between">
                <div className="flex items-center gap-2 font-financial text-xs font-semibold text-[#182333]">
                  <Calendar className="w-3.5 h-3.5 text-[#52799D]" />
                  <span>{dateKey !== 'No Date' ? formatDate(dateKey) : 'Undated Tasks'}</span>
                  {isToday && (
                    <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-[#E9F5EF] text-[#287A57] border border-[#BBE2CF]">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-sans text-[#697586]">
                  {items.filter((i) => i.isCompleted).length} / {items.length} completed
                </span>
              </div>

              {/* Tasks for this date */}
              <div className="divide-y divide-[#EEF2F6]">
                {items.map((todo) => (
                  <div
                    key={todo._id}
                    onClick={() => handleToggle(todo._id)}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(todo._id);
                        }}
                        className="text-[#52799D] shrink-0"
                      >
                        {todo.isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-[#287A57]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#697586] group-hover:text-[#52799D]" />
                        )}
                      </button>

                      <span
                        className={`text-xs font-sans ${
                          todo.isCompleted
                            ? 'line-through text-[#697586]'
                            : 'text-[#182333] font-medium'
                        }`}
                      >
                        {todo.title}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDelete(todo._id, e)}
                      className="p-1 text-[#697586] hover:text-[#B84B4B] hover:bg-[#FDEFEF] rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {todos.length === 0 && !loading && (
          <EmptyState
            icon={CheckSquare}
            title="No Tasks Found"
            description="Add your daily to-do items and keep track of your schedule date-wise."
          />
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Task"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#182333] mb-1 font-sans">
              Task <span className="text-[#B84B4B]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Call client regarding contract signing"
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-sans text-[#182333] outline-none focus:border-[#52799D]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#182333] mb-1 font-sans">
              Date <span className="text-[#B84B4B]">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-[#F4F7FA] border border-[#E2E7ED] rounded-lg text-xs font-financial text-[#182333] outline-none focus:border-[#52799D]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E7ED]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-[#F4F7FA] hover:bg-[#EEF4F8] text-[#697586] text-xs font-medium font-sans rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#52799D] hover:bg-[#233D5B] text-white text-xs font-medium font-sans rounded-lg transition-colors shadow-subtle disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
