-- Submission: personal info collected on the submit wizard.
-- AlterTable
ALTER TABLE "submissions"
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT,
  ADD COLUMN "github_username" TEXT,
  ADD COLUMN "date_of_birth" TEXT,
  ADD COLUMN "slack_id" TEXT,
  ADD COLUMN "submission_type" TEXT;

-- ShopOrder: grant + shipping details collected at redemption.
-- AlterTable
ALTER TABLE "shop_orders"
  ADD COLUMN "grant_type" TEXT,
  ADD COLUMN "fulfilment" TEXT,
  ADD COLUMN "address_line1" TEXT,
  ADD COLUMN "address_line2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "zip" TEXT,
  ADD COLUMN "country" TEXT;
