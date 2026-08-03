-- CreateEnum
CREATE TYPE "AudienceSource" AS ENUM ('KAZAKHTELECOM', 'OTHER');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "source" "AudienceSource" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserNoAuth"
ADD COLUMN "source" "AudienceSource" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- Existing corporate accounts are classified from the same domain that the
-- previous registration form allowed.
UPDATE "User"
SET "source" = 'KAZAKHTELECOM'
WHERE LOWER("email") LIKE '%@telecom.kz';

-- CreateTable
CREATE TABLE "VisitSession" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" "AudienceSource" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitSession_visitorId_sessionId_key" ON "VisitSession"("visitorId", "sessionId");

-- CreateIndex
CREATE INDEX "VisitSession_visitorId_createdAt_idx" ON "VisitSession"("visitorId", "createdAt");
