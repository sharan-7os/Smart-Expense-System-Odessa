const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amountPaise: {
      type: Number,
      required: [true, 'Amount in paise is required'],
      min: [1, 'Amount must be at least 1 paisa'],
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: [true, 'Payer is required'],
    },
    beneficiaries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
        required: true,
      },
    ],
    category: {
      type: String,
      enum: ['Food', 'Travel', 'Accommodation', 'Tickets', 'Other'],
      default: 'Other',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
