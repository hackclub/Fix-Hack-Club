-- AlterTable
ALTER TABLE "users"
    ADD COLUMN "hackatime_user_id" TEXT,
    ADD COLUMN "hackatime_username" TEXT,
    ADD COLUMN "hackatime_seconds" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "hackatime_synced_at" TIMESTAMP(3),
    ADD COLUMN "hackatime_connected_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "submissions"
    ADD COLUMN "hackatime_project" TEXT;
