const express = require('express');
const router = express.Router({ mergeParams: true });
const settlementController = require('../controllers/settlementController');

// GET /api/groups/:groupId/balances-and-settlements
router.get('/balances-and-settlements', settlementController.getBalancesAndSettlements);

// POST /api/groups/:groupId/settlements (record payment)
router.post('/', settlementController.recordSettlement);

// DELETE /api/groups/:groupId/settlements/:id (remove payment record)
router.delete('/:id', settlementController.deleteSettlement);

module.exports = router;
