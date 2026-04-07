'use strict';

/**
 * Prisma Seed Script
 * Run: node prisma/seed.js
 *
 * Seeds one demo user and two reminders for local development.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing seed data (idempotent)
  await prisma.reminder.deleteMany({});
  await prisma.user.deleteMany({ where: { email: 'demo@example.com' } });

  // Create demo user
  const hashedPassword = await bcrypt.hash('Password123!', SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password: hashedPassword,
    },
  });

  console.log(`✅ Created user: ${user.email} (id: ${user.id})`);

  // Create sample reminders
  const now = new Date();

  const reminders = await prisma.reminder.createMany({
    data: [
      {
        userId: user.id,
        title: 'Team Standup',
        description: 'Daily team sync at 10am',
        scheduledTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
        status: 'PENDING',
      },
      {
        userId: user.id,
        title: 'Deploy to Production',
        description: 'Deploy v2.1.0 release after QA sign-off',
        scheduledTime: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
        status: 'PENDING',
      },
    ],
  });

  console.log(`✅ Created ${reminders.count} reminders`);
  console.log('\n📋 Seed credentials:');
  console.log('   Email:    demo@example.com');
  console.log('   Password: Password123!');
  console.log('\n✅ Seeding complete.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
