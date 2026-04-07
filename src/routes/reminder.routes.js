'use strict';

const router = require('express').Router();
const ReminderController = require('../controllers/reminder.controller');
const { authenticate } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const {
  createReminderSchema,
  updateReminderSchema,
} = require('../utils/validators/reminder.validator');

/**
 * Reminder Routes
 * Base path: /api/reminders  (mounted in app.js)
 * All routes are protected by JWT auth middleware
 */

router.post('/',   authenticate, validate(createReminderSchema), ReminderController.create);
router.get('/',    authenticate, ReminderController.getAll);
router.get('/:id', authenticate, ReminderController.getOne);
router.put('/:id', authenticate, validate(updateReminderSchema), ReminderController.update);
router.delete('/:id', authenticate, ReminderController.delete);

module.exports = router;