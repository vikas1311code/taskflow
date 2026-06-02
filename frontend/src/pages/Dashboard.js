import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, adminAPI } from '../api';

const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high'];

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value ?? 0}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.5px', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function TaskForm({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    status: task?.status || 'pending', priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.substring(0, 16) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const u = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = { ...form, due_date: form.due_date || null };
      if (task) await tasksAPI.update(task.id, data);
      else await tasksAPI.create(data);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{task ? 'Edit Task' : 'New Task'}</h2>
        {error && <div className="alert alert-error"> {error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={u('title')} placeholder="Task title" required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={u('description')}
              rows={3} placeholder="Optional description..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={u('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={u('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="datetime-local" value={form.due_date} onChange={u('due_date')} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Saving...</> : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete }) {
  return (
    <div className="card" style={{ marginBottom: 12, transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{task.title}</span>
            <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          </div>
          {task.description && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>
              {task.description.length > 100 ? task.description.substring(0, 100) + '…' : task.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            {task.owner_name && <span> {task.owner_name}</span>}
            {task.due_date && <span> {new Date(task.due_date).toLocaleDateString()}</span>}
            <span> {new Date(task.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(task.id)}>Del</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState(null);

  const loadTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 8, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.data.tasks);
      setPagination(data.pagination);
    } catch { showMsg('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try { const { data } = await tasksAPI.getStats(); setStats(data.data.stats); } catch {}
  }, []);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try { const { data } = await adminAPI.getUsers(); setUsers(data.data.users); } catch {}
  }, [isAdmin]);

  useEffect(() => { loadTasks(1); loadStats(); }, [loadTasks, loadStats]);
  useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab, loadUsers]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      showMsg('Task deleted');
      loadTasks(pagination.page);
      loadStats();
    } catch { showMsg('Failed to delete', 'error'); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSaved = () => {
    setShowForm(false); setEditTask(null);
    loadTasks(1); loadStats();
    showMsg('Task saved successfully!');
  };

  const handleToggleUser = async (u) => {
    try {
      await adminAPI.updateUser(u.id, { is_active: !u.is_active });
      showMsg(`User ${u.is_active ? 'deactivated' : 'activated'}`);
      loadUsers();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed to update', 'error'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
  style={{
    width: 30,
    height: 30,
    background: 'var(--accent)',
    color: '#fff',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800
  }}
>
  T
</span>
          <span style={{ fontWeight: 800, fontSize: 18 }}>TaskFlow</span>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
              {['tasks', 'users'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className="btn btn-ghost btn-sm"
                  style={{
                    background: activeTab === t ? 'var(--accent-dim)' : 'transparent',
                    color: activeTab === t ? 'var(--accent)' : 'var(--text-muted)',
                    borderColor: activeTab === t ? 'var(--accent)' : 'transparent',
                    textTransform: 'capitalize'
                  }}>{t}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Notification */}
      {msg && (
        <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 999 }}>
          <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}
            style={{ minWidth: 250, boxShadow: 'var(--shadow)' }}>
            {msg.type === 'error' ? '⚠' : '✓'} {msg.text}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats */}
        {stats && activeTab === 'tasks' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="Total" value={stats.total} color="var(--text)" />
            <StatCard label="Pending" value={stats.pending} color="var(--warning)" />
            <StatCard label="In Progress" value={stats.in_progress} color="var(--accent)" />
            <StatCard label="Completed" value={stats.completed} color="var(--success)" />
          </div>
        )}

        {activeTab === 'tasks' && (
          <>
            {/* Filters bar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <input placeholder="Search tasks..." value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                style={{ flex: 1, minWidth: 180 }} />
              <select value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                style={{ width: 140 }}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <select value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
                style={{ width: 130 }}>
                <option value="">All Priority</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', search: '' })}>
                Clear
              </button>
              <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowForm(true); }}>
                 New Task
              </button>
            </div>

            {/* Task list */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32 }} />
                <div>Loading tasks...</div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No tasks yet</div>
                <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowForm(true); }}>
                  Create your first task
                </button>
              </div>
            ) : (
              tasks.map(task => (
                <TaskCard key={task.id} task={task}
                  onEdit={(t) => { setEditTask(t); setShowForm(true); }}
                  onDelete={handleDelete} />
              ))
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, alignItems: 'center' }}>
                <button className="btn btn-ghost btn-sm" disabled={!pagination.hasPrev}
                  onClick={() => loadTasks(pagination.page - 1)}>← Prev</button>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <button className="btn btn-ghost btn-sm" disabled={!pagination.hasNext}
                  onClick={() => loadTasks(pagination.page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && isAdmin && (
          <div>
            <h2 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700 }}> User Management</h2>
            {users.map(u => (
              <div key={u.id} className="card" style={{ marginBottom: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{u.email}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                    {!u.is_active && <span className="badge badge-cancelled">Deactivated</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {u.id !== user?.id && (
                    <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={() => handleToggleUser(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TaskForm task={editTask} onSave={handleSaved}
          onClose={() => { setShowForm(false); setEditTask(null); }} />
      )}
    </div>
  );
}
