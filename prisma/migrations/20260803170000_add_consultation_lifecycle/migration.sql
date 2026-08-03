-- Track one human consultation and one survey delivery at a time.
ALTER TABLE "Chat"
ADD COLUMN "consultationPsychologistId" TEXT,
ADD COLUMN "consultationStartedAt" TIMESTAMP(3),
ADD COLUMN "consultationEndedAt" TIMESTAMP(3),
ADD COLUMN "surveyRequestedAt" TIMESTAMP(3),
ADD COLUMN "surveyCompletedAt" TIMESTAMP(3);

ALTER TABLE "Consultation"
ADD COLUMN "sessionStartedAt" TIMESTAMP(3);

-- Recover the psychologist for legacy survey rows where the frontend did not
-- send psyId, but the chat still retained the assigned psychologist.
UPDATE "Consultation" AS consultation
SET "psyId" = chat."psy"
FROM "Chat" AS chat
WHERE consultation."chatId" = chat."chatId"
  AND consultation."psyId" IS NULL
  AND chat."psy" IS NOT NULL;

UPDATE "Questions" AS question
SET "psyId" = consultation."psyId"
FROM "Consultation" AS consultation
WHERE question."chatId" = consultation."chatId"
  AND question."psyId" IS NULL
  AND consultation."psyId" IS NOT NULL;

-- Existing surveys represent already completed consultations. Mark them as
-- completed and return their chats to AI mode.
UPDATE "Consultation"
SET "sessionStartedAt" = "createdAt"
WHERE "sessionStartedAt" IS NULL;

UPDATE "Chat" AS chat
SET
  "consultationPsychologistId" = latest."psyId",
  "consultationStartedAt" = latest."sessionStartedAt",
  "consultationEndedAt" = latest."createdAt",
  "surveyRequestedAt" = latest."createdAt",
  "surveyCompletedAt" = latest."createdAt",
  "psy" = NULL,
  "call" = false,
  "members" = ARRAY['Assistant', COALESCE(latest."userId", latest."userNoAuthId")]::TEXT[]
FROM (
  SELECT DISTINCT ON ("chatId")
    "chatId",
    "userId",
    "userNoAuthId",
    "psyId",
    "sessionStartedAt",
    "createdAt"
  FROM "Consultation"
  ORDER BY "chatId", "createdAt" DESC
) AS latest
WHERE chat."chatId" = latest."chatId";

-- Chats with an assigned psychologist and no saved survey are active legacy
-- consultations. Their lifecycle starts when this migration is applied.
UPDATE "Chat"
SET
  "consultationPsychologistId" = "psy",
  "consultationStartedAt" = CURRENT_TIMESTAMP
WHERE "psy" IS NOT NULL
  AND "consultationStartedAt" IS NULL;

CREATE UNIQUE INDEX "Consultation_chatId_sessionStartedAt_key"
ON "Consultation"("chatId", "sessionStartedAt");
