const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

router.route('/')
  .get(groupController.getGroups)
  .post(groupController.createGroup);

router.route('/:id')
  .get(groupController.getGroupById)
  .delete(groupController.deleteGroup);

module.exports = router;
