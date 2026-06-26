import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskAPI, adminAPI, managerAPI } from '../api/index';
import { Plus, Clock, MessageSquare, X, Send, GripVertical } from 'lucide-react';
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
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
  const [noteText, setNoteText] = useState('');
  const [formError, setFormError] = useState(null);

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

  // --- Drag and Drop Logic ---
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set to enable dragging
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

    // Optimistic UI update
    setTasks(prev => prev.map(t => t._id === draggedTaskId ? { ...t, status: colId } : t));

    try {
      await taskAPI.updateTaskStatus(draggedTaskId, colId);
    } catch (err) {
      console.error('Failed to update status', err);
      fetchTasks(); // Revert on failure
    }
    setDraggedTaskId(null);
  };

  // --- Task Actions ---
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!taskForm.title.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!taskForm.assignedTo) {
      setFormError('Please select a team member to assign this task to');
      return;
    }
    try {
      await taskAPI.createTask(taskForm);
      closeModal();
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create task');
      console.error(err);
    }
  };

  const closeModal = () => {
    setShowAssignModal(false);
    setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
    setFormError(null);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedTask) return;
    try {
      const res = await taskAPI.addTaskNote(selectedTask._id, noteText);
      setSelectedTask(res.data.task);
      setNoteText('');
      fetchTasks(); // Update list in background
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <><div style={{ padding: 20 }}>Loading tasks...</div></>;

  return (
    <>
      <div className="tasks-page">
        <div className="page-header" style={{ margin: '0 20px 20px 20px' }}>
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

      <div style={{ position: 'relative', flex: 1, display: 'flex', minHeight: 0 }}>
        <div className="kanban-board" style={{ padding: '0 20px', width: '100%' }}>
          {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                        <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                        {task.assignedBy?.role === 'admin' && user?.role === 'manager' && (
                          <span className="badge" style={{ fontSize: 10, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>From Admin</span>
                        )}
                      </div>
                      {task.progressNotes?.length > 0 && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MessageSquare size={12} /> {task.progressNotes.length}
                        </div>
                      )}
                    </div>
                    <div className="task-title">{task.title}</div>
                    {task.dueDate && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                        <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    <div className="task-footer">
                      <div 
                        className="task-assignee" 
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user?.role === 'employee') return;
                          navigate(`/${user?.role === 'admin' ? 'admin/users' : 'manager/team'}/${task.assignedTo?._id}/activity`);
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
              {formError && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '13px' }}>
                  {formError}
                </div>
              )}
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
                    {assignableUsers.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
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
              <div className="input-group">
                <label className="input-label">Due Date</label>
                <input type="date" className="input-field" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      {selectedTask && (
        <div className="task-drawer-overlay" onClick={() => setSelectedTask(null)}>
          <div className="task-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 8 }}>
                  {selectedTask.title}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`task-priority ${selectedTask.priority}`}>{selectedTask.priority}</span>
                  {selectedTask.assignedBy?.role === 'admin' && user?.role === 'manager' && (
                    <span className="badge" style={{ fontSize: 11, background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>From Admin</span>
                  )}
                  {selectedTask.parentTask && (
                    <span className="badge" style={{ fontSize: 11, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--brand-primary)' }}>Subtask</span>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status: {COLUMNS.find(c => c.id === selectedTask.status)?.title}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedTask.assignedBy?.role === 'admin' && user?.role === 'manager' && (
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setTaskForm({ ...taskForm, parentTask: selectedTask._id });
                      setShowAssignModal(true);
                    }}
                  >
                    Delegate (Create Subtask)
                  </button>
                )}
                <button className="btn btn-ghost btn-icon" onClick={() => setSelectedTask(null)}><X size={20}/></button>
              </div>
            </div>
            
            <div className="drawer-content">
              <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Assigned To</div>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: user?.role !== 'employee' ? 'pointer' : 'default' }}
                    onClick={(e) => {
                      if (user?.role === 'employee') return;
                      navigate(`/${user?.role === 'admin' ? 'admin/users' : 'manager/team'}/${selectedTask.assignedTo?._id}/activity`);
                    }}
                  >
                    <div className="task-assignee-avatar">{selectedTask.assignedTo?.name?.charAt(0)}</div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedTask.assignedTo?.name}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Assigned By</div>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: user?.role !== 'employee' ? 'pointer' : 'default' }}
                    onClick={(e) => {
                      if (user?.role === 'employee') return;
                      navigate(`/${user?.role === 'admin' ? 'admin/users' : 'manager/team'}/${selectedTask.assignedBy?._id}/activity`);
                    }}
                  >
                    <div className="task-assignee-avatar" style={{ background: 'var(--text-muted)' }}>{selectedTask.assignedBy?.name?.charAt(0)}</div>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{selectedTask.assignedBy?.name}</span>
                  </div>
                </div>
              </div>

              {selectedTask.description && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
                  <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {selectedTask.description}
                  </div>
                </div>
              )}

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
                <input 
                  className="input-field" 
                  style={{ flex: 1 }} 
                  placeholder="Add a progress note..." 
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-icon" disabled={!noteText.trim()}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      </div>
    </>
  );
}
