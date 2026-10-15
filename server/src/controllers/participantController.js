const Participant = require('../models/Participant');
const Group = require('../models/Group');
const Expense = require('../models/Expense');

// Add participant to group
exports.addParticipant = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Participant name is required' });
    }

    const trimmedName = name.trim();

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // Check duplicate name inside group (case-insensitive)
    const existing = await Participant.findOne({
      groupId,
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Participant "${trimmedName}" already exists in this group`,
      });
    }

    const participant = await Participant.create({
      groupId,
      name: trimmedName,
    });

    res.status(201).json({ success: true, data: participant });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'A participant with this name already exists in this group',
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all participants of a group
exports.getParticipants = async (req, res) => {
  try {
    const { groupId } = req.params;
    const participants = await Participant.find({ groupId }).sort({ createdAt: 1 });
    res.json({ success: true, data: participants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete participant from group (only if not linked to any expense)
exports.deleteParticipant = async (req, res) => {
  try {
    const { groupId, id } = req.params;

    const linkedExpense = await Expense.findOne({
      groupId,
      $or: [{ payer: id }, { beneficiaries: id }],
    });

    if (linkedExpense) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete participant who is linked to one or more expenses. Delete or reassign those expenses first.',
      });
    }

    const deleted = await Participant.findOneAndDelete({ _id: id, groupId });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Participant not found' });
    }

    res.json({ success: true, message: 'Participant removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
