-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "logged_seconds" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "devlogs" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "hack_club_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devlogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "devlogs_submission_id_idx" ON "devlogs"("submission_id");

-- AddForeignKey
ALTER TABLE "devlogs" ADD CONSTRAINT "devlogs_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
