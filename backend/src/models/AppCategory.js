const mongoose = require('mongoose');

const AppCategorySchema = new mongoose.Schema({
  orgId: { type: String, default: 'default_org', index: true },
  type: { type: String, enum: ['app', 'domain'], required: true },
  pattern: { type: String, required: true },        // app name or domain
  category: { type: String, enum: ['productive', 'neutral', 'distracting'], required: true },
  label: { type: String, default: '' },             // human-friendly label
  isDefault: { type: Boolean, default: false },     // built-in vs admin-configured
}, { timestamps: true });

AppCategorySchema.index({ orgId: 1, type: 1, pattern: 1 }, { unique: true });

module.exports = mongoose.model('AppCategory', AppCategorySchema);
