'use strict';

const { prisma } = require('../config/database');

/**
 * Reminder Model
 * Thin abstraction over Prisma for reminder-related queries.
 */
const ReminderModel = {
  /**
   * Create a new reminder.
   * @param {{ userId, title, description, scheduledTime }} data
   * @returns {Promise<Reminder>}
   */
  create: ({ userId, title, description, scheduledTime }) =>
    prisma.reminder.create({
      data: {
        userId,
        title,
        description,
        scheduledTime: new Date(scheduledTime),
        status: 'PENDING',
      },
    }),

  /**
   * Get all reminders belonging to a user.
   * Supports optional status filter and pagination.
   *
   * @param {string} userId
   * @param {{ status?: string, page?: number, limit?: number }} options
   * @returns {Promise<{ reminders: Reminder[], total: number }>}
   */
  findAllByUser: async (userId, { status, page = 1, limit = 20 } = {}) => {
    const where = {
      userId,
      ...(status && { status: status.toUpperCase() }),
    };

    const skip = (page - 1) * limit;

    const [reminders, total] = await prisma.$transaction([
      prisma.reminder.findMany({
        where,
        orderBy: { scheduledTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.reminder.count({ where }),
    ]);

    return { reminders, total };
  },

  /**
   * Find a single reminder by ID.
   * @param {string} id
   * @returns {Promise<Reminder|null>}
   */
  findById: (id) =>
    prisma.reminder.findUnique({ where: { id } }),

  /**
   * Find a reminder by ID scoped to a specific user (ownership check).
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<Reminder|null>}
   */
  findByIdAndUser: (id, userId) =>
    prisma.reminder.findFirst({ where: { id, userId } }),

  /**
   * Update a reminder. Only updates provided fields.
   * @param {string} id
   * @param {{ title?, description?, scheduledTime?, status? }} data
   * @returns {Promise<Reminder>}
   */
  update: (id, data) => {
    const payload = { ...data };
    if (data.scheduledTime) payload.scheduledTime = new Date(data.scheduledTime);

    return prisma.reminder.update({
      where: { id },
      data: payload,
    });
  },

  /**
   * Delete a reminder by ID.
   * @param {string} id
   * @returns {Promise<Reminder>}
   */
  delete: (id) =>
    prisma.reminder.delete({ where: { id } }),

  /**
   * Bulk-fetch all pending reminders due before a given time.
   * Used by the worker for recovery on restart.
   * @param {Date} before
   * @returns {Promise<Reminder[]>}
   */
  findPendingBefore: (before) =>
    prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        scheduledTime: { lte: before },
      },
    }),
};

module.exports = ReminderModel;
