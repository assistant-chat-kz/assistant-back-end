-- Bring databases created by the earlier incremental migrations in sync with
-- the schema that was already running in production at this point.

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "visits" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserNoAuth" (
    "id" TEXT NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT,

    CONSTRAINT "UserNoAuth_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Consultation"
ALTER COLUMN "userId" DROP NOT NULL,
ADD COLUMN "userNoAuthId" TEXT;

-- AlterTable
ALTER TABLE "Questions"
ALTER COLUMN "userId" DROP NOT NULL,
ADD COLUMN "userNoAuthId" TEXT;
