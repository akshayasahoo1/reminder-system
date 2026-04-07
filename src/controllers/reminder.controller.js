'use strict';

const ReminderService = require('../services/reminder.service');
const { sendSuccess } = require('../utils/response');

/**
 * Reminder Controller
 * Thin layer — extracts data from request, calls service, sends response.
 * Zero business logic lives here.
 */
const ReminderController = {
  /**
   * POST /api/reminders
   */
  create: async (req, res, next) => {
    try {
      const { title, description, scheduledTime } = req.body;
      const userId = req.user.id;

      const reminder = await ReminderService.create(userId, {
        title,
        description,
        scheduledTime,
      });

      sendSuccess(res, { reminder }, 'Reminder created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/reminders
   * Supports: ?status=pending&page=1&limit=20
   */
  getAll: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { status, page, limit } = req.query;

      const result = await ReminderService.getAll(userId, {
        status,
        page,
        limit,
      });

      sendSuccess(res, result, 'Reminders fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/reminders/:id
   */
  getOne: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const reminder = await ReminderService.getOne(id, userId);

      sendSuccess(res, { reminder }, 'Reminder fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/reminders/:id
   */
  update: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const reminder = await ReminderService.update(id, userId, req.body);

      sendSuccess(res, { reminder }, 'Reminder updated successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/reminders/:id
   */
  delete: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await ReminderService.delete(id, userId);

      sendSuccess(res, null, 'Reminder deleted successfully');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ReminderController;