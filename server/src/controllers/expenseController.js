const Expense = require('../models/Expense');
const Participant = require('../models/Participant');
const Group = require('../models/Group');
const {
  toPaise,
  toRupees,
  validateExpenseInput,
} = require('../services/calculationEngine');

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amount, payerId, beneficiaryIds, category, date } = req.body;

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Get all valid group participants
    const participants = await Participant.find({ groupId });

    // Validate input using calculation engine
    validateExpenseInput(
      {
        description,
        amount,
        payerId,
        beneficiaryIds,
      },
      participants
    );

    const amountPaise = toPaise(amount);

    const expense = await Expense.create({
      groupId,
      description: description.trim(),
      amountPaise,
      payer: payerId,
      beneficiaries: beneficiaryIds,
      category: category || 'Other',
      date: date ? new Date(date) : new Date(),
    });

    const populated = await Expense.findById(expense._id)
      .populate('payer', 'name')
      .populate('beneficiaries', 'name');

    res.status(201).json({
      success: true,
      data: {
        ...populated.toObject(),
        amount: toRupees(populated.amountPaise),
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all expenses for a group
exports.getExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const expenses = await Expense.find({ groupId })
      .populate('payer', 'name')
      .populate('beneficiaries', 'name')
      .sort({ date: -1, createdAt: -1 });

    const formatted = expenses.map((exp) => ({
      ...exp.toObject(),
      amount: toRupees(exp.amountPaise),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update an existing expense
exports.updateExpense = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const { description, amount, payerId, beneficiaryIds, category, date } = req.body;

    const participants = await Participant.find({ groupId });
    validateExpenseInput(
      {
        description,
        amount,
        payerId,
        beneficiaryIds,
      },
      participants
    );

    const amountPaise = toPaise(amount);

    const updated = await Expense.findOneAndUpdate(
      { _id: id, groupId },
      {
        description: description.trim(),
        amountPaise,
        payer: payerId,
        beneficiaries: beneficiaryIds,
        category: category || 'Other',
        date: date ? new Date(date) : new Date(),
      },
      { new: true, runValidators: true }
    )
      .populate('payer', 'name')
      .populate('beneficiaries', 'name');

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({
      success: true,
      data: {
        ...updated.toObject(),
        amount: toRupees(updated.amountPaise),
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const deleted = await Expense.findOneAndDelete({ _id: id, groupId });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
