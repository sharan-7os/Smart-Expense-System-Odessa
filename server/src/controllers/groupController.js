const Group = require('../models/Group');
const Participant = require('../models/Participant');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

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

    res.status(201).json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get all groups with participant and expense counts
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 }).lean();

    const enrichedGroups = await Promise.all(
      groups.map(async (g) => {
        const participantCount = await Participant.countDocuments({ groupId: g._id });
        const expenseCount = await Expense.countDocuments({ groupId: g._id });
        return {
          ...g,
          participantCount,
          expenseCount,
        };
      })
    );

    res.json({ success: true, data: enrichedGroups });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get single group details
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Delete group and all its related participants, expenses, settlements
exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    await Promise.all([
      Participant.deleteMany({ groupId: id }),
      Expense.deleteMany({ groupId: id }),
      Settlement.deleteMany({ groupId: id }),
      Group.findByIdAndDelete(id),
    ]);

    res.json({ success: true, message: 'Group and associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
