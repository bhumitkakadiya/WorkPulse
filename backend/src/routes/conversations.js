const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

router.use(protect);

// GET /api/conversations
router.get('/', async (req, res) => {
  const conversations = await Conversation.find({ participantIds: req.user.id })
    .populate('participantIds', 'name avatar onlineStatus')
    .sort({ lastMessageAt: -1 });
  res.json({ success: true, conversations });
});

// POST /api/conversations (Start new direct convo)
router.post('/', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Target userId required' });
  
  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    type: 'direct',
    participantIds: { $all: [req.user.id, userId], $size: 2 }
  }).populate('participantIds', 'name avatar onlineStatus');
  
  if (!conversation) {
    conversation = await Conversation.create({
      type: 'direct',
      participantIds: [req.user.id, userId]
    });
    conversation = await conversation.populate('participantIds', 'name avatar onlineStatus');
  }
  
  res.json({ success: true, conversation });
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user.id });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  
  const limit = parseInt(req.query.limit) || 50;
  const skip = parseInt(req.query.skip) || 0;
  
  const messages = await Message.find({ conversationId: conversation._id })
    .populate('senderId', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  res.json({ success: true, messages: messages.reverse() });
});

// POST /api/conversations/:id/messages
// (Note: also emitted via socket in real implementation, but API acts as backup/persistence)
router.post('/:id/messages', async (req, res) => {
  const { body } = req.body;
  const conversation = await Conversation.findOne({ _id: req.params.id, participantIds: req.user.id });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
  
  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user.id,
    body,
    readBy: [req.user.id]
  });
  
  conversation.lastMessageAt = new Date();
  await conversation.save();
  
  res.status(201).json({ success: true, message });
});

// GET /api/tasks/:id/conversation
// This handles fetching or creating the task-linked thread. Wait, standard routing would put this under /api/conversations/task/:taskId or similar, but the spec says /api/tasks/:id/conversation.
// I'll define it here but use it from server.js or mount differently.
// Let's actually define it in tasks.js, or I'll just map it here for now since I'm in conversations.js.
// Since router is mounted at /api/conversations, I'll add /task/:taskId here instead to keep it clean, but I'll make sure it's accessible.
router.get('/task/:taskId', async (req, res) => {
  let conversation = await Conversation.findOne({
    type: 'task_thread',
    taskId: req.params.taskId,
    participantIds: req.user.id
  }).populate('participantIds', 'name avatar onlineStatus');
  
  if (!conversation) {
    // We need to know who the participants should be. Usually the assignee and the creator.
    const Task = require('../models/Task');
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Only allow participants to create/fetch
    if (task.assignedTo.toString() !== req.user.id && task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this task thread' });
    }
    
    // Unique participants
    const participants = [...new Set([task.createdBy.toString(), task.assignedTo.toString()])];
    
    conversation = await Conversation.create({
      type: 'task_thread',
      taskId: task._id,
      participantIds: participants
    });
    conversation = await conversation.populate('participantIds', 'name avatar onlineStatus');
  }
  
  res.json({ success: true, conversation });
});

module.exports = router;
