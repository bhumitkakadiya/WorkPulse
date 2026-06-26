const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // Store as a Date object for the specific day
  firstActivity: { type: Date },
  lastActivity: { type: Date },
  totalActiveMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'absent', 'half_day', 'on_leave', 'weekend'], default: 'absent' }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
