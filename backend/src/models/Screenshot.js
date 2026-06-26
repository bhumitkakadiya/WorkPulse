const mongoose = require('mongoose');

const ScreenshotSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  imageUrl: { type: String, required: true },
  capturedAt: { type: Date, default: Date.now },
  activeApp: { type: String, default: 'Unknown' },
  activeWindowTitle: { type: String, default: '' },
  blurred: { type: Boolean, default: false }
});

module.exports = mongoose.model('Screenshot', ScreenshotSchema);
