const mongoose = require('mongoose');

const ProductivityScoreSnapshotSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, index: true },    // YYYY-MM-DD
  score: { type: Number, min: 0, max: 100, required: true },
  totalActiveSeconds: { type: Number, default: 0 },
  totalIdleSeconds: { type: Number, default: 0 },
  productiveSeconds: { type: Number, default: 0 },
  neutralSeconds: { type: Number, default: 0 },
  distractingSeconds: { type: Number, default: 0 },
  focusSessionSeconds: { type: Number, default: 0 },
  topApps: [{ appName: String, durationSeconds: Number, category: String }],
  breakdown: {
    productivePercent: Number,
    neutralPercent: Number,
    distractingPercent: Number,
    idlePercent: Number,
  },
}, { timestamps: true });

ProductivityScoreSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('ProductivityScoreSnapshot', ProductivityScoreSnapshotSchema);
