'use strict';

const { prisma } = require('../config/database');

/**
 * User Model
 * Thin abstraction over Prisma for user-related queries.
 * Services call these methods; they never call prisma directly.
 */
const UserModel = {
  /**
   * Find a user by their email address.
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  findByEmail: (email) =>
    prisma.user.findUnique({
      where: { email },
    }),

  /**
   * Find a user by their UUID.
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  findById: (id) =>
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        // Never select password here — use findByEmail for auth
      },
    }),

  /**
   * Create a new user.
   * @param {{ email: string, password: string }} data
   * @returns {Promise<User>}
   */
  create: ({ email, password }) =>
    prisma.user.create({
      data: { email, password },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    }),

  /**
   * Check if a user exists by email (lightweight — no full record).
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  existsByEmail: async (email) => {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },
};

module.exports = UserModel;
