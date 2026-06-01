-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "url" TEXT NOT NULL DEFAULT '',
    "github_url" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "hack_club_id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "slack_id" TEXT,
    "verification_status" TEXT,
    "avatar" TEXT,
    "last_signed_in_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "hack_club_id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "repo" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'Other',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Submitted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listings_external_id_key" ON "listings"("external_id");

-- CreateIndex
CREATE INDEX "listings_priority_idx" ON "listings"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "users_hack_club_id_key" ON "users"("hack_club_id");

-- CreateIndex
CREATE INDEX "submissions_hack_club_id_idx" ON "submissions"("hack_club_id");

-- CreateIndex
CREATE INDEX "submissions_email_idx" ON "submissions"("email");
