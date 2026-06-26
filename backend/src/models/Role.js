const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Or Organization model if extracted
  parentRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
  level: { type: Number, default: 0 }, // 0 = highest, auto-calculated from tree depth
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false },
  color: { type: String, default: '#6B7280' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Pre-save hook to calculate level if parentRoleId is set
RoleSchema.pre('save', async function(next) {
  if (this.isModified('parentRoleId')) {
    if (!this.parentRoleId) {
      this.level = 0;
    } else {
      const parent = await mongoose.model('Role').findById(this.parentRoleId);
      if (parent) {
        this.level = parent.level + 1;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Role', RoleSchema);
