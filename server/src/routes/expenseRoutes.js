const express = require('express');
const router = express.Router({ mergeParams: true });
const expenseController = require('../controllers/expenseController');

router.route('/')
  .get(expenseController.getExpenses)
  .post(expenseController.createExpense);

router.route('/:id')
  .put(expenseController.updateExpense)
  .delete(expenseController.deleteExpense);

module.exports = router;
