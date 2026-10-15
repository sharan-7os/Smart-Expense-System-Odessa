const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
      index: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: [true, 'Debtor (from) is required'],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: [true, 'Creditor (to) is required'],
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount in paise is required'],
      min: [1, 'Amount must be at least 1 paisa'],
    },
    status: {
      type: String,
      enum: ['completed', 'pending'],
      default: 'completed',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settlement', settlementSchema);
