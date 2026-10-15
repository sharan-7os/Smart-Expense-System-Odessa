const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
      maxlength: [50, 'Participant name cannot exceed 50 characters'],
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate participant names inside the same group
participantSchema.index({ groupId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Participant', participantSchema);
