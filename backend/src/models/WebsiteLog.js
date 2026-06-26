const mongoose = require('mongoose');

const WebsiteLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
  url: { type: String, required: true },
  domain: { type: String, required: true },
  title: { type: String, default: '' },
  category: { type: String, enum: ['productive', 'neutral', 'distracting'], default: 'neutral' },
  durationSeconds: { type: Number, required: true },
  visitStart: { type: Date, required: true },
  visitEnd: { type: Date },
  date: { type: String, index: true },
}, { timestamps: true });

WebsiteLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('WebsiteLog', WebsiteLogSchema);
