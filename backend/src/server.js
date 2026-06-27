require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const reportEngine = require('./services/reportEngine');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agent');
const employeeRoutes = require('./routes/employee');
const managerRoutes = require('./routes/manager');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const taskRoutes = require('./routes/tasks');
const conversationRoutes = require('./routes/conversations');
const performanceRoutes = require('./routes/performance');
const publicRoutes = require('./routes/public');
const usersRoutes = require('./routes/users');
const activityRoutes = require('./routes/activity');
const roleRoutes = require('./routes/roles');
const leavesRoutes = require('./routes/leaves');
const attendanceRoutes = require('./routes/attendance');
const wellbeingRoutes = require('./routes/wellbeing');
const goalsRoutes = require('./routes/goals');
const insightsRoutes = require('./routes/insights');
const auditLogRoutes = require('./routes/audit-logs');
const burnoutEngine = require('./services/burnoutEngine');
const insightEngine = require('./services/insightEngine');

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }
});

app.set('io', io);

// Socket.IO Auth & Events
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded;
      next();
    });
  } else {
    next(new Error('Authentication error'));
  }
}).on('connection', (socket) => {
  socket.join(socket.user.id); // Join personal room

  socket.on('typing:start', (data) => {
    if (data.targetUserId) socket.to(data.targetUserId).emit('typing:start', { conversationId: data.conversationId, userId: socket.user.id });
  });
  
  socket.on('typing:stop', (data) => {
    if (data.targetUserId) socket.to(data.targetUserId).emit('typing:stop', { conversationId: data.conversationId, userId: socket.user.id });
  });

  // Basic message sending via socket (persistence handled in REST or here)
  socket.on('message:send', async (data) => {
    try {
      const convo = await Conversation.findById(data.conversationId);
      if (!convo || !convo.participantIds.includes(socket.user.id)) return;
      
      const msg = await Message.create({
        conversationId: convo._id,
        senderId: socket.user.id,
        body: data.body,
        readBy: [socket.user.id]
      });
      await msg.populate('senderId', 'name avatar');
      
      convo.lastMessageAt = new Date();
      await convo.save();

      // Broadcast to all participants including sender (to update UI)
      convo.participantIds.forEach(pid => {
        io.to(pid.toString()).emit('message:new', msg);
      });
    } catch (err) {
      console.error('Socket message send error:', err);
    }
  });

  socket.on('message:read', async (data) => {
    try {
      await Message.updateMany(
        { conversationId: data.conversationId, readBy: { $ne: socket.user.id } },
        { $push: { readBy: socket.user.id } }
      );
      // Let other participants know messages were read
      const convo = await Conversation.findById(data.conversationId);
      if (convo) {
        convo.participantIds.forEach(pid => {
          if (pid.toString() !== socket.user.id) {
            io.to(pid.toString()).emit('message:read', { conversationId: data.conversationId, readBy: socket.user.id });
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  });
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting for auth endpoints
const rateLimit = (() => {
  try { return require('express-rate-limit'); } catch { return null; }
})();
if (rateLimit) {
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  }));
}
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/wellbeing', wellbeingRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'WorkPulse API is running 🚀', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Start background CRON jobs
reportEngine.start();
burnoutEngine.start();
insightEngine.start();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 WorkPulse API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server };
