import React, { useState } from 'react';
import { Plus, Check, Trash2, Calendar, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

interface AdminTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  project_id: string | null;
  created_at: string;
  completed_at: string | null;
}

interface MyTasksProps {
  tasks: AdminTask[];
  userId: string;
  onTasksChanged: () => void;
}

const priorityConfig = {
  high: { label: 'Hoog', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', dot: 'bg-red-400' },
  medium: { label: 'Gemiddeld', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  low: { label: 'Laag', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', dot: 'bg-blue-400' },
};

const MyTasks: React.FC<MyTasksProps> = ({ tasks, userId, onTasksChanged }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const overdueTasks = activeTasks.filter(t => {
    if (!t.due_date) return false;
    const dd = new Date(t.due_date);
    dd.setHours(0, 0, 0, 0);
    return dd < today;
  });

  const todayTasks = activeTasks.filter(t => {
    if (!t.due_date) return false;
    const dd = new Date(t.due_date);
    dd.setHours(0, 0, 0, 0);
    return dd.getTime() === today.getTime();
  });

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  const thisWeekTasks = activeTasks.filter(t => {
    if (!t.due_date) return false;
    const dd = new Date(t.due_date);
    dd.setHours(0, 0, 0, 0);
    return dd > today && dd <= endOfWeek;
  });

  const laterTasks = activeTasks.filter(t => {
    if (!t.due_date) {
      return !overdueTasks.includes(t) && !todayTasks.includes(t) && !thisWeekTasks.includes(t);
    }
    const dd = new Date(t.due_date);
    dd.setHours(0, 0, 0, 0);
    return dd > endOfWeek;
  });

  const noDueDateTasks = activeTasks.filter(t => !t.due_date);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('admin_tasks').insert({
        user_id: userId,
        title: newTitle.trim(),
        priority: newPriority,
        due_date: newDueDate || null,
        status: 'pending',
      });
      if (error) throw error;
      setNewTitle('');
      setNewPriority('medium');
      setNewDueDate('');
      setShowAddForm(false);
      onTasksChanged();
      toast.success('Taak toegevoegd');
    } catch (err: any) {
      toast.error(err.message || 'Fout bij toevoegen taak');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (task: AdminTask) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('admin_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);
      if (error) throw error;
      onTasksChanged();
    } catch (err: any) {
      toast.error(err.message || 'Fout bij bijwerken taak');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('admin_tasks').delete().eq('id', taskId);
      if (error) throw error;
      onTasksChanged();
      toast.success('Taak verwijderd');
    } catch (err: any) {
      toast.error(err.message || 'Fout bij verwijderen taak');
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d verlopen`, color: 'text-red-400' };
    if (diffDays === 0) return { text: 'Vandaag', color: 'text-amber-400' };
    if (diffDays === 1) return { text: 'Morgen', color: 'text-blue-400' };
    return { text: date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }), color: 'text-gray-400' };
  };

  const renderTaskItem = (task: AdminTask) => {
    const dueInfo = formatDueDate(task.due_date);
    const isCompleted = task.status === 'completed';
    const config = priorityConfig[task.priority];

    return (
      <div
        key={task.id}
        className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
          isCompleted
            ? 'border-gray-700/50 bg-gray-800/30 opacity-60'
            : `border-gray-700/50 hover:border-gray-600/50 bg-[#1E2530]/50`
        }`}
      >
        <button
          onClick={() => handleToggleComplete(task)}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? 'border-green-500 bg-green-500/20'
              : `${config.border} hover:bg-white/5`
          }`}
        >
          {isCompleted && <Check size={12} className="text-green-400" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <span className={`text-xs ${config.color}`}>{config.label}</span>
            {dueInfo && (
              <>
                <span className="text-gray-600">|</span>
                <Calendar size={11} className={dueInfo.color} />
                <span className={`text-xs ${dueInfo.color}`}>{dueInfo.text}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => handleDeleteTask(task.id)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
        >
          <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
        </button>
      </div>
    );
  };

  const renderSection = (title: string, items: AdminTask[], color: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${color}`}>{title}</h4>
        <div className="space-y-1.5">{items.map(renderTaskItem)}</div>
      </div>
    );
  };

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Mijn Taken</h3>
          <p className="text-xs text-gray-400">{activeTasks.length} actief{completedTasks.length > 0 ? ` / ${completedTasks.length} afgerond` : ''}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
        >
          <Plus size={18} className="text-blue-400" />
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nieuwe taak..."
            className="w-full bg-[#1E2530] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={e => e.key === 'Enter' && handleAddTask()}
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="bg-[#1E2530] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="high">Hoog</option>
              <option value="medium">Gemiddeld</option>
              <option value="low">Laag</option>
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              className="bg-[#1E2530] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddTask}
              disabled={!newTitle.trim() || submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
            >
              {submitting ? 'Toevoegen...' : 'Toevoegen'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewTitle(''); }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      <div className="overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
        {activeTasks.length === 0 && !showAddForm ? (
          <div className="text-center py-8">
            <GripVertical size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">Geen taken</p>
            <p className="text-xs text-gray-500 mt-1">Klik op + om een taak toe te voegen</p>
          </div>
        ) : (
          <>
            {renderSection('Verlopen', overdueTasks, 'text-red-400')}
            {renderSection('Vandaag', todayTasks, 'text-amber-400')}
            {renderSection('Deze week', thisWeekTasks, 'text-blue-400')}
            {renderSection('Later', laterTasks, 'text-gray-400')}
            {renderSection('Geen deadline', noDueDateTasks, 'text-gray-500')}
          </>
        )}

        {completedTasks.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700/50">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full"
            >
              {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{completedTasks.length} afgeronde {completedTasks.length === 1 ? 'taak' : 'taken'}</span>
            </button>
            {showCompleted && (
              <div className="mt-2 space-y-1.5">
                {completedTasks.slice(0, 10).map(renderTaskItem)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
