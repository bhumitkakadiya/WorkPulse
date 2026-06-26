const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['company', 'team', 'individual'], required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Employee/Manager ID
  parentGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' }, // For OKR cascading
  status: { type: String, enum: ['on_track', 'at_risk', 'behind', 'completed'], default: 'on_track' },
  progressPercent: { type: Number, default: 0 },
  targetDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
