const mongoose = require('mongoose');

const BrowsingHistoryEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  url: { type: String, required: true },
  domain: { type: String, required: true },
  pageTitle: { type: String, default: '' },
  visitedAt: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 0 },
  category: { 
    type: String, 
    enum: ['productive', 'neutral', 'distracting'],
    default: 'neutral'
  }
});

module.exports = mongoose.model('BrowsingHistoryEntry', BrowsingHistoryEntrySchema);
