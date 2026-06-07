-- Reviewer system: a two-stage review workflow.
--
-- Stage 1 (first-grade review): a REVIEWER (or an admin) records an approve/deny
-- recommendation with a reason. Stage 2 (final review): an admin makes the call.
-- A submission stays in `status = 'Submitted'` for the whole review period; the
-- `review_stage` column tracks which stage it is in ('first' -> 'final').

-- Add the REVIEWER role. (Postgres 12+ allows ADD VALUE inside a transaction as
-- long as the new value is not used in the same transaction — it is not here.)
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'REVIEWER';

-- First-grade review fields + the stage marker.
-- AlterTable
ALTER TABLE "submissions"
    ADD COLUMN "review_stage" TEXT NOT NULL DEFAULT 'first',
    ADD COLUMN "first_review_status" TEXT,
    ADD COLUMN "first_review_note" TEXT,
    ADD COLUMN "first_reviewed_at" TIMESTAMP(3),
    ADD COLUMN "first_reviewed_by_id" TEXT;
