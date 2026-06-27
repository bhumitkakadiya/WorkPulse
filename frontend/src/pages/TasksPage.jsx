import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI, adminAPI, managerAPI } from '../api/index';
import { Plus, Clock, MessageSquare, X, Send, GripVertical, Trash2, Tag, Calendar, User, Search, Filter } from 'lucide-react';
import './TasksPage.css';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' }
];

export default function TasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

  // Modal / Drawer state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form state
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '', labels: '' });
  const [noteText, setNoteText] = useState('');
  const [formError, setFormError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({ assignee: '', priority: '', label: '', dueDate: '' });

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchUsers();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const res = await taskAPI.getTasks();
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      if (user?.role === 'admin') {
        const res = await adminAPI.getUsers();
        setAssignableUsers(res.data.users || []);
      } else if (user?.role === 'manager') {
        const res = await managerAPI.getTeam();
        setAssignableUsers(res.data.team || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId); 
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverColId(null);
  };

  const handleDrop = async (e, colId) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!draggedTaskId) return;

    const task = tasks.find(t => t._id === draggedTaskId);
    if (!task || task.status === colId) return;

    setTasks(prev => prev.map(t => t._id === draggedTaskId ? { ...t, status: colId } : t));

    try {
      await taskAPI.updateTaskStatus(draggedTaskId, colId);
      if (selectedTask && selectedTask._id === draggedTaskId) {
        setSelectedTask(prev => ({ ...prev, status: colId }));
      }
    } catch (err) {
      console.error('Failed to update status', err);
      fetchTasks();
    }
    setDraggedTaskId(null);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!taskForm.title.trim()) return setFormError('Title is required');
    if (!taskForm.assignedTo) return setFormError('Please select a team member');
    
    try {
      const payload = { ...taskForm, labels: taskForm.labels.split(',').map(l => l.trim()).filter(Boolean) };
      await taskAPI.createTask(payload);
      closeModal();
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const closeModal = () => {
    setShowAssignModal(false);
    setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '', labels: '' });
    setFormError(null);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedTask) return;
    try {
      const res = await taskAPI.addTaskNote(selectedTask._id, noteText);
      setSelectedTask(res.data.task);
      setNoteText('');
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskInline = async (field, value) => {
    if (!selectedTask) return;
    try {
      const payload = { [field]: value };
      const res = await taskAPI.updateTask(selectedTask._id, payload);
      setSelectedTask(res.data.task);
      fetchTasks();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task permanently?')) return;
    try {
      await taskAPI.deleteTask(taskId);
      setSelectedTask(null);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const getActivityUrl = (userId) => {
    if (user?.role === 'admin') return `/admin/users/${userId}/activity`;
    if (user?.role === 'manager') return `/manager/employee/${userId}/activity`;
    return null;
  };

  const removeFilter = (key) => setFilters(prev => ({ ...prev, [key]: '' }));

  const filteredTasks = tasks.filter(task => {
    if (filters.assignee && task.assignedTo?._id !== filters.assignee) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.label && !task.labels?.includes(filters.label)) return false;
    if (filters.dueDate) {
      const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
      if (taskDate !== filters.dueDate) return false;
    }
    return true;
  });

  const uniqueLabels = Array.from(new Set(tasks.flatMap(t => t.labels || [])));

  if (loading) return <div style={{ padding: 20 }}>Loading tasks...</div>;

  return (
    <>
      <div className="tasks-page">
        <div className="page-header" style={{ margin: '0 20px 10px 20px' }}>
          <div>
            <h1>Tasks</h1>
            <div className="breadcrumbs">Workspace / Tasks</div>
          </div>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
              <Plus size={16} /> Assign Task
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div style={{ margin: '0 20px 20px 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', background: 'var(--surface-50)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <Filter size={16} /> <span style={{ fontSize: 13, fontWeight: 500 }}>Filters:</span>
          </div>
          
          <select className="input-field" style={{ width: 'auto', padding: '6px 12px', height: 32, fontSize: 13 }} value={filters.assignee} onChange={e => setFilters({...filters, assignee: e.target.value})}>
            <option value="">All Assignees</option>
            {assignableUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
          
          <select className="input-field" style={{ width: 'auto', padding: '6px 12px', height: 32, fontSize: 13 }} value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select className="input-field" style={{ width: 'auto', padding: '6px 12px', height: 32, fontSize: 13 }} value={filters.label} onChange={e => setFilters({...filters, label: e.target.value})}>
            <option value="">All Labels</option>
            {uniqueLabels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <input type="date" className="input-field" style={{ width: 'auto', padding: '6px 12px', height: 32, fontSize: 13 }} value={filters.dueDate} onChange={e => setFilters({...filters, dueDate: e.target.value})} />

          {/* Active Filter Pills */}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {Object.entries(filters).map(([k, v]) => v ? (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--brand-primary)', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                {k}: {k === 'assignee' ? assignableUsers.find(u => u._id === v)?.name : v}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeFilter(k)} />
              </span>
            ) : null)}
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, display: 'flex', minHeight: 0 }}>
          <div className="kanban-board" style={{ padding: '0 20px', width: '100%' }}>
            {COLUMNS.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              return (
                <div 
                  key={col.id} 
                  className="kanban-column"
                  data-col={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div className="kanban-column-header">
                    {col.title} <span className="kanban-count">{colTasks.length}</span>
                  </div>
                  <div className={`kanban-column-content ${dragOverColId === col.id ? 'drag-over' : ''}`}>
                    {colTasks.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 20, opacity: 0.6 }}>
                        <div style={{ marginBottom: 4 }}><Clock size={20} style={{ margin: '0 auto' }} /></div>
                        No tasks here
                      </div>
                    )}
                    {colTasks.map(task => (
                      <div 
                        key={task._id} 
                        className={`task-card ${draggedTaskId === task._id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onClick={() => setSelectedTask(task)}
                      >
                        <div className="task-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                            <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                            {task.labels?.map((label, idx) => (
                              <span key={idx} style={{ fontSize: 10, background: 'var(--surface-50)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                                {label}
                              </span>
                            ))}
                          </div>
                          {task.progressNotes?.length > 0 && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MessageSquare size={12} /> {task.progressNotes.length}
                            </div>
                          )}
                        </div>
                        <div className="task-title">{task.title}</div>
                        {task.dueDate && (
                          <div style={{ fontSize: 11, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                            <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        <div className="task-footer">
                          <div 
                            className="task-assignee" 
                            style={{ cursor: user?.role !== 'employee' ? 'pointer' : 'default' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = getActivityUrl(task.assignedTo?._id);
                              if (url) navigate(url);
                            }}
                          >
                            <div className="task-assignee-avatar">
                              {task.assignedTo?.name?.charAt(0) || '?'}
                            </div>
                            <span style={{ fontSize: 11 }}>{task.assignedTo?.name || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="kanban-scroll-fade" />
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="task-modal" onClick={e => e.stopPropagation()}>
              <div className="task-modal-header">
                Assign New Task
                <button type="button" className="btn btn-ghost btn-icon" onClick={closeModal}><X size={20}/></button>
              </div>
              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {formError && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '13px' }}>{formError}</div>}
                <div className="input-group">
                  <label className="input-label">Title <span style={{color: 'var(--danger)'}}>*</span></label>
                  <input className="input-field" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="E.g. Update marketing site" />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea className="input-field" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} rows={3} placeholder="Add details..." />
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Assign To <span style={{color: 'var(--danger)'}}>*</span></label>
                    <select className="input-field" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                      <option value="">Select user...</option>
                      {assignableUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                    </select>
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Priority</label>
                    <select className="input-field" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Due Date</label>
                    <input type="date" className="input-field" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Labels</label>
                    <input type="text" className="input-field" value={taskForm.labels} onChange={e => setTaskForm({...taskForm, labels: e.target.value})} placeholder="design, frontend (comma separated)" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail Drawer */}
        {selectedTask && (
          <div className="task-drawer-overlay" onClick={() => setSelectedTask(null)}>
            <div className="task-drawer" onClick={e => e.stopPropagation()}>
              <div className="drawer-header" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <input 
                    className="input-field" 
                    style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 12, background: 'transparent', border: '1px solid transparent', padding: '4px 8px', width: '100%' }}
                    value={selectedTask.title}
                    onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})}
                    onBlur={(e) => handleUpdateTaskInline('title', e.target.value)}
                  />
                  
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingLeft: 8 }}>
                    <select 
                      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: 'var(--text-primary)' }}
                      value={selectedTask.priority}
                      onChange={(e) => {
                        setSelectedTask({...selectedTask, priority: e.target.value});
                        handleUpdateTaskInline('priority', e.target.value);
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>

                    <select 
                      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: 'var(--text-primary)' }}
                      value={selectedTask.status}
                      onChange={(e) => {
                        handleDrop({ preventDefault: () => {} }, e.target.value);
                        setDraggedTaskId(selectedTask._id);
                      }}
                    >
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteTask(selectedTask._id)} title="Delete Task">
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTask(null)}><X size={20}/></button>
                </div>
              </div>
              
              <div className="drawer-content">
                <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Due Date</div>
                    <input 
                      type="date"
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                      value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        setSelectedTask({...selectedTask, dueDate: e.target.value});
                        handleUpdateTaskInline('dueDate', e.target.value);
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Labels</div>
                    <input 
                      type="text"
                      className="input-field"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                      placeholder="comma separated..."
                      value={selectedTask.labels?.join(', ') || ''}
                      onChange={(e) => setSelectedTask({...selectedTask, labels: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                      onBlur={(e) => handleUpdateTaskInline('labels', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
                  <textarea 
                    className="input-field" 
                    style={{ minHeight: 100, resize: 'vertical' }}
                    value={selectedTask.description}
                    onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                    onBlur={(e) => handleUpdateTaskInline('description', e.target.value)}
                    placeholder="Add task description here..."
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Progress Notes</div>
                  {selectedTask.progressNotes?.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes yet.</div>
                  ) : (
                    <div className="notes-list">
                      {selectedTask.progressNotes.map((note, i) => (
                        <div key={i} className="note-item">
                          <div className="note-header">
                            <div className="task-assignee-avatar" style={{ width: 20, height: 20, fontSize: 10 }}>{note.author?.name?.charAt(0) || '?'}</div>
                            <span className="note-author">{note.author?.name || 'Unknown'}</span>
                            <span className="note-time">{new Date(note.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{note.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="drawer-footer">
                <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 12 }}>
                  <input className="input-field" style={{ flex: 1 }} placeholder="Add a progress note..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                  <button type="submit" className="btn btn-primary btn-icon" disabled={!noteText.trim()}><Send size={16} /></button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
