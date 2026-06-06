/*
  Warnings:

  - You are about to drop the column `title_` on the `Stream` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Upvote" DROP CONSTRAINT "Upvote_streamId_fkey";

-- AlterTable
ALTER TABLE "Stream" DROP COLUMN "title_",
ADD COLUMN     "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "played" SET DEFAULT false;

-- AddForeignKey
ALTER TABLE "Upvote" ADD CONSTRAINT "Upvote_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;
