const mongoose = require('mongoose');

const AIInsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  peakHours: [{
    hour: { type: Number },
    focusScore: { type: Number }
  }],
  suggestions: [{ type: String }],
  burnoutRisk: { type: String, enum: ['low', 'medium', 'high'] },
  summaryText: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AIInsight', AIInsightSchema);
