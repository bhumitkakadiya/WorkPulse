import axios from 'axios';

// Employee API
export const employeeAPI = {
  getTimeline: (date) => axios.get(`/api/employee/timeline?date=${date}`),
  getScore: (days = 7) => axios.get(`/api/employee/score?days=${days}`),
  getScreenshots: (date) => axios.get(`/api/employee/screenshots?date=${date}`),
  annotateIdle: (sessionId, annotation) => axios.post('/api/employee/idle-annotation', { sessionId, annotation }),
  focusSession: (action) => axios.post('/api/employee/focus-session', { action }),
  getAICommands: () => axios.get('/api/employee/ai-commands'),
  getSettings: () => axios.get('/api/employee/settings'),
};

// Manager API
export const managerAPI = {
  getTeam: () => axios.get('/api/manager/team'),
  getTimeline: (id, date) => axios.get(`/api/manager/employee/${id}/timeline?date=${date}`),
  getScore: (id, days = 30) => axios.get(`/api/manager/employee/${id}/score?days=${days}`),
  getAnalytics: () => axios.get('/api/manager/team/analytics'),
  getAlerts: () => axios.get('/api/manager/alerts'),
  markAlertRead: (id) => axios.put(`/api/manager/alerts/${id}/read`),
  exportData: (date) => axios.get(`/api/manager/export?date=${date}`, { responseType: 'blob' }),
};

// Admin API
export const adminAPI = {
  getStats: () => axios.get('/api/admin/stats'),
  getUsers: () => axios.get('/api/admin/users'),
  createUser: (data) => axios.post('/api/admin/users', data),
  updateUser: (id, data) => axios.put(`/api/admin/users/${id}`, data),
  deactivateUser: (id) => axios.delete(`/api/admin/users/${id}`),
  getSettings: () => axios.get('/api/admin/settings'),
  updateSettings: (data) => axios.put('/api/admin/settings', data),
  getCategories: () => axios.get('/api/admin/categories'),
  createCategory: (data) => axios.post('/api/admin/categories', data),
  updateCategory: (id, data) => axios.put(`/api/admin/categories/${id}`, data),
  deleteCategory: (id) => axios.delete(`/api/admin/categories/${id}`),
};

// AI API
export const aiAPI = {
  sendCommand: (text, inputType = 'text') => axios.post('/api/ai/command', { text, inputType }),
};

// Task API
export const taskAPI = {
  getTasks: (params) => axios.get('/api/tasks', { params }),
  getTaskById: (id) => axios.get(`/api/tasks/${id}`),
  createTask: (data) => axios.post('/api/tasks', data),
  updateTaskStatus: (id, status) => axios.patch(`/api/tasks/${id}/status`, { status }),
  addTaskNote: (id, message) => axios.post(`/api/tasks/${id}/notes`, { message }),
  deleteTask: (id) => axios.delete(`/api/tasks/${id}`),
};

// Activity API
export const activityAPI = {
  getScreenshots: (userId, date) => axios.get(`/api/activity/${userId}/screenshots`, { params: { date } }),
  getHistory: (userId, date) => axios.get(`/api/activity/${userId}/history`, { params: { date } }),
  getLiveStatus: (userId) => axios.get(`/api/activity/${userId}/live-status`),
};

