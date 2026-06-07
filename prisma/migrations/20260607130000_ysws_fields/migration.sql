-- Unified YSWS export fields on submissions.
-- Submitter-provided fields (collected in the submit wizard) plus reviewer
-- feedback and an optional hours override captured during review. All nullable.
-- AlterTable
ALTER TABLE "submissions"
    ADD COLUMN "playable_url" TEXT,
    ADD COLUMN "heard_about" TEXT,
    ADD COLUMN "screenshot_url" TEXT,
    ADD COLUMN "address_line1" TEXT,
    ADD COLUMN "address_line2" TEXT,
    ADD COLUMN "city" TEXT,
    ADD COLUMN "state" TEXT,
    ADD COLUMN "country" TEXT,
    ADD COLUMN "zip" TEXT,
    ADD COLUMN "review_doing_well" TEXT,
    ADD COLUMN "review_improve" TEXT,
    ADD COLUMN "override_hours" DOUBLE PRECISION,
    ADD COLUMN "override_hours_justification" TEXT;
