-- Points become fractional (0.1 granularity): widen the integer point columns
-- to double precision. Existing whole-number values are preserved (e.g. 5 -> 5).
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "balance" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "users" ALTER COLUMN "total_earned" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "submissions" ALTER COLUMN "points_awarded" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ledger_entries" ALTER COLUMN "delta" SET DATA TYPE DOUBLE PRECISION;
