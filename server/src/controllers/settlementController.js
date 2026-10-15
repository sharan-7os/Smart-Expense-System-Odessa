const Participant = require('../models/Participant');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const {
  calculateBalances,
  generateSettlements,
  toRupees,
  toPaise,
} = require('../services/calculationEngine');

// Get balances, suggested settlements, and completed settlements
exports.getBalancesAndSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const participants = await Participant.find({ groupId }).sort({ createdAt: 1 });
    const expenses = await Expense.find({ groupId });

    // Calculate total spend
    const totalSpendPaise = expenses.reduce((sum, exp) => sum + exp.amountPaise, 0);

    // Compute balances using pure engine
    const balances = calculateBalances(participants, expenses);

    // Generate settlement suggestions
    const suggestedSettlements = generateSettlements(balances);

    // Fetch previously recorded completed settlements
    const completedSettlements = await Settlement.find({ groupId })
      .populate('from', 'name')
      .populate('to', 'name')
      .sort({ settledAt: -1 });

    const formattedCompleted = completedSettlements.map((s) => ({
      _id: s._id,
      fromId: s.from ? s.from._id : null,
      fromName: s.from ? s.from.name : 'Unknown',
      toId: s.to ? s.to._id : null,
      toName: s.to ? s.to.name : 'Unknown',
      amount: toRupees(s.amountPaise),
      amountPaise: s.amountPaise,
      settledAt: s.settledAt,
      note: s.note,
      status: s.status,
    }));

    // Check if recorded settlements match current suggested amounts
    // If expenses were added or edited after a payment, flag it so user is aware
    const totalCompletedPaise = completedSettlements.reduce((sum, s) => sum + s.amountPaise, 0);

    // Check if all suggested settlements are matched by completed records
    const isSettled =
      suggestedSettlements.length === 0 ||
      suggestedSettlements.every((s) =>
        completedSettlements.some(
          (c) =>
            String(c.from?._id || c.from) === String(s.fromId) &&
            String(c.to?._id || c.to) === String(s.toId) &&
            c.amountPaise === s.amountPaise
        )
      );

    res.json({
      success: true,
      data: {
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
        },
        metrics: {
          participantCount: participants.length,
          expenseCount: expenses.length,
          totalSpend: toRupees(totalSpendPaise),
          totalSpendPaise,
          perPersonAverage:
            participants.length > 0 ? toRupees(Math.round(totalSpendPaise / participants.length)) : 0,
          isSettled,
        },
        balances,
        suggestedSettlements,
        completedSettlements: formattedCompleted,
        totalCompletedSettlementAmount: toRupees(totalCompletedPaise),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Record a settlement transaction (mark payment as completed)
exports.recordSettlement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { fromId, toId, amount, note } = req.body;

    if (!fromId || !toId) {
      return res.status(400).json({ success: false, error: 'Both sender and receiver are required' });
    }

    if (String(fromId) === String(toId)) {
      return res.status(400).json({ success: false, error: 'Sender and receiver cannot be the same person' });
    }

    const amountPaise = toPaise(amount);
    if (amountPaise <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than zero' });
    }

    const settlement = await Settlement.create({
      groupId,
      from: fromId,
      to: toId,
      amountPaise,
      note: note ? note.trim() : 'Payment completed',
      status: 'completed',
      settledAt: new Date(),
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('from', 'name')
      .populate('to', 'name');

    res.status(201).json({
      success: true,
      data: {
        _id: populated._id,
        fromId: populated.from._id,
        fromName: populated.from.name,
        toId: populated.to._id,
        toName: populated.to.name,
        amount: toRupees(populated.amountPaise),
        amountPaise: populated.amountPaise,
        settledAt: populated.settledAt,
        note: populated.note,
        status: populated.status,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete/unmark a recorded settlement
exports.deleteSettlement = async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const deleted = await Settlement.findOneAndDelete({ _id: id, groupId });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Settlement record not found' });
    }

    res.json({ success: true, message: 'Settlement record removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
