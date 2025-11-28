/*
  Warnings:

  - You are about to drop the column `artistId` on the `ReleaseGroup` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[musicbrainzId]` on the table `ReleaseGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "ReleaseGroup" DROP CONSTRAINT "ReleaseGroup_artistId_fkey";

-- DropIndex
DROP INDEX "ReleaseGroup_artistId_title_year_key";

-- AlterTable
ALTER TABLE "ReleaseGroup" DROP COLUMN "artistId",
ADD COLUMN     "musicbrainzId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseGroup_musicbrainzId_key" ON "ReleaseGroup"("musicbrainzId");

-- CreateIndex
CREATE INDEX "ReleaseGroup_musicbrainzId_idx" ON "ReleaseGroup"("musicbrainzId");
