/*
  Warnings:

  - Added the required column `chatId` to the `Questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Questions" ADD COLUMN     "chatId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;
