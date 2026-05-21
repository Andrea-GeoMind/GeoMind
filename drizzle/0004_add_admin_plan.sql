-- Adds 'admin' to the plan enum.
-- Applied directly via set-admin-subscription.ts script; this migration makes
-- the change idempotent and keeps the Drizzle history consistent.
ALTER TYPE "public"."plan" ADD VALUE IF NOT EXISTS 'admin';
