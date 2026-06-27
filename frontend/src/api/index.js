import axios from 'axios';
import { toast } from 'react-hot-toast';

// Centralized error handling and request wrapper
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('wp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    // Don't toast 401s repeatedly if handled by auth context, but for now we toast all errors
    if (error.response?.status !== 401) {
      toast.error(message);
    } else {
      // Phase 7: Redirect to login on 401
      localStorage.removeItem('wp_token');
      localStorage.removeItem('wp_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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
  getTeamActivity: (date) => axios.get('/api/manager/team/activity', { params: { date } }),
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

export const aiAPI = {
  sendCommand: (text, inputType = 'text') => axios.post('/api/ai/command', { text, inputType }),
  query: (text) => axios.post('/api/ai/query', { text }),
};

// Task API
export const taskAPI = {
  getTasks: (params) => axios.get('/api/tasks', { params }),
  getTaskById: (id) => axios.get(`/api/tasks/${id}`),
  createTask: (data) => axios.post('/api/tasks', data),
  updateTask: (id, data) => axios.put(`/api/tasks/${id}`, data),
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

// Conversations API
export const conversationAPI = {
  getAll: () => axios.get('/api/conversations'),
  startDirect: (userId) => axios.post('/api/conversations', { userId }),
  getMessages: (id, limit = 50, skip = 0) => axios.get(`/api/conversations/${id}/messages`, { params: { limit, skip } }),
  sendMessage: (id, body) => axios.post(`/api/conversations/${id}/messages`, { body }),
};
