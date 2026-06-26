const mongoose = require('mongoose');

const AICommandLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  inputType: { type: String, enum: ['text', 'voice'], default: 'text' },
  rawInput: { type: String, required: true },
  parsedAction: {
    name: { type: String },       // e.g. open_app, close_app, open_url, web_search, run_routine
    args: { type: mongoose.Schema.Types.Mixed },
  },
  result: { type: String, enum: ['success', 'failed', 'rejected', 'pending'], default: 'pending' },
  errorMessage: { type: String, default: null },
  executedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('AICommandLog', AICommandLogSchema);
