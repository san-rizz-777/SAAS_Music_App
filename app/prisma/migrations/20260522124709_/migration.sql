/*
  Warnings:

  - You are about to drop the column `title` on the `Stream` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Stream" DROP COLUMN "title",
ADD COLUMN     "title_" TEXT NOT NULL DEFAULT '';
