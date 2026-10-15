const express = require('express');
const router = express.Router({ mergeParams: true });
const participantController = require('../controllers/participantController');

router.route('/')
  .get(participantController.getParticipants)
  .post(participantController.addParticipant);

router.route('/:id')
  .delete(participantController.deleteParticipant);

module.exports = router;
