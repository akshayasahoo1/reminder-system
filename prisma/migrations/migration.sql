-- ─────────────────────────────────────────
-- Migration: 20240101000000_init
-- Creates users, reminders tables and ReminderStatus enum
-- ─────────────────────────────────────────

-- ReminderStatus enum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- Users table
CREATE TABLE "users" (
    "id"         TEXT         NOT NULL,
    "email"      TEXT         NOT NULL,
    "password"   TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on email
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Reminders table
CREATE TABLE "reminders" (
    "id"             TEXT             NOT NULL,
    "user_id"        TEXT             NOT NULL,
    "title"          TEXT             NOT NULL,
    "description"    TEXT,
    "scheduled_time" TIMESTAMP(3)     NOT NULL,
    "status"         "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- Performance indexes
CREATE INDEX "reminders_user_id_idx"        ON "reminders"("user_id");
CREATE INDEX "reminders_status_idx"          ON "reminders"("status");
CREATE INDEX "reminders_scheduled_time_idx"  ON "reminders"("scheduled_time");

-- Foreign key: reminders.user_id → users.id (cascade delete)
ALTER TABLE "reminders"
    ADD CONSTRAINT "reminders_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
