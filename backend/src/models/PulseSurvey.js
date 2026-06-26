const mongoose = require('mongoose');

const PulseSurveySchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Or actual Organization model
  weekStartDate: { type: Date, required: true },
  responses: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moodScore: { type: Number, min: 1, max: 5 },
    workloadScore: { type: Number, min: 1, max: 5 },
    blockerText: { type: String },
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('PulseSurvey', PulseSurveySchema);
