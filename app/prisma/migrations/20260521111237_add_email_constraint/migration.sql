/*
  Warnings:

  - You are about to drop the column `upvotes` on the `Stream` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Stream" DROP COLUMN "upvotes";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
