const Group = require('../models/Group');
const Participant = require('../models/Participant');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const {
  calculateBalances,
  generateSettlements,
  toRupees,
} = require('../services/calculationEngine');

/**
 * Helper to check if all settlements for a group are completed.
 * Returns { isSettled: boolean, unsettledCount: number, totalSpend: number }
 */
async function checkGroupSettlementStatus(groupId) {
  const participants = await Participant.find({ groupId }).lean();
  const expenses = await Expense.find({ groupId }).lean();

  const totalSpendPaise = expenses.reduce((sum, e) => sum + (e.amountPaise || 0), 0);
  const totalSpend = toRupees(totalSpendPaise);

  if (expenses.length === 0) {
    return { isSettled: true, unsettledCount: 0, totalSpend: 0 };
  }

  // Derive balances and settlements
  const balances = calculateBalances(participants, expenses);
  const suggested = generateSettlements(balances);

  if (suggested.length === 0) {
    return { isSettled: true, unsettledCount: 0, totalSpend };
  }

  const completed = await Settlement.find({ groupId }).lean();

  // Find any suggested settlement not matched by a completed record
  const unsettled = suggested.filter((s) => {
    return !completed.some(
      (c) =>
        String(c.from) === String(s.fromId) &&
        String(c.to) === String(s.toId) &&
        c.amountPaise === s.amountPaise
    );
  });

  return {
    isSettled: unsettled.length === 0,
    unsettledCount: unsettled.length,
    totalSpend,
  };
}

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : '',
    });

    res.status(201).json({
      success: true,
      data: {
        ...group.toObject(),
        participantCount: 0,
        expenseCount: 0,
        isSettled: true,
        unsettledCount: 0,
        totalSpend: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all groups with participant count, expense count, and settlement status
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 }).lean();

    const enrichedGroups = await Promise.all(
      groups.map(async (g) => {
        const participantCount = await Participant.countDocuments({ groupId: g._id });
        const expenseCount = await Expense.countDocuments({ groupId: g._id });
        const { isSettled, unsettledCount, totalSpend } = await checkGroupSettlementStatus(g._id);

        return {
          ...g,
          participantCount,
          expenseCount,
          isSettled,
          unsettledCount,
          totalSpend,
        };
      })
    );

    res.json({ success: true, data: enrichedGroups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single group details with settlement status
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const participantCount = await Participant.countDocuments({ groupId: group._id });
    const expenseCount = await Expense.countDocuments({ groupId: group._id });
    const { isSettled, unsettledCount, totalSpend } = await checkGroupSettlementStatus(group._id);

    res.json({
      success: true,
      data: {
        ...group.toObject(),
        participantCount,
        expenseCount,
        isSettled,
        unsettledCount,
        totalSpend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete group - STRICTLY permitted only if all settlements are done
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Check if group is fully settled
    const { isSettled, unsettledCount } = await checkGroupSettlementStatus(id);

    if (!isSettled) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete group "${group.name}": There are still ${unsettledCount} pending settlement(s). All debts must be marked as paid before deleting this group.`,
      });
    }

    // Clean up all related documents
    await Promise.all([
      Participant.deleteMany({ groupId: id }),
      Expense.deleteMany({ groupId: id }),
      Settlement.deleteMany({ groupId: id }),
      Group.findByIdAndDelete(id),
    ]);

    res.json({
      success: true,
      message: `Group "${group.name}" and all associated records deleted successfully.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
