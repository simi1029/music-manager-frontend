-- CreateEnum
CREATE TYPE "PrimaryType" AS ENUM ('ALBUM', 'SINGLE', 'EP', 'COMPILATION', 'LIVE', 'SOUNDTRACK', 'OTHER');

-- CreateEnum
CREATE TYPE "PhysicalFormat" AS ENUM ('CD', 'VINYL', 'DVD');

-- CreateEnum
CREATE TYPE "DigitalFormat" AS ENUM ('FLAC', 'ALAC', 'MP3', 'AAC', 'WAV', 'AIFF', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceKind" AS ENUM ('RIP', 'BANDCAMP', 'ITUNES', 'OTHER');

-- CreateEnum
CREATE TYPE "CoverKind" AS ENUM ('FRONT', 'BACK', 'OBI', 'BOOKLET', 'DISC', 'LABEL', 'SPINE', 'OTHER');

-- CreateEnum
CREATE TYPE "QualityAxis" AS ENUM ('COVER', 'PRODUCTION', 'MIX');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortName" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "musicbrainzId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "primaryType" "PrimaryType" NOT NULL,
    "year" INTEGER,
    "isClassical" BOOLEAN NOT NULL DEFAULT false,
    "composer" TEXT,
    "work" TEXT,
    "movement" TEXT,
    "ensemble" TEXT,
    "conductor" TEXT,
    "soloist" TEXT,
    "artistId" TEXT NOT NULL,
    "artistCredit" TEXT,
    "coverValue" INTEGER,
    "productionValue" INTEGER,
    "mixValue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "label" TEXT,
    "barcode" TEXT,
    "catalogNo" TEXT,
    "releaseGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalCopy" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "format" "PhysicalFormat" NOT NULL,
    "location" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "price" DECIMAL(12,2),
    "currency" TEXT,

    CONSTRAINT "PhysicalCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalCopy" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "format" "DigitalFormat" NOT NULL,
    "filePath" TEXT NOT NULL,
    "source" "SourceKind" NOT NULL,

    CONSTRAINT "DigitalCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "userId" TEXT NOT NULL,
    "targetTrackId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("userId","targetTrackId")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseGroupGenre" (
    "releaseGroupId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "ReleaseGroupGenre_pkey" PRIMARY KEY ("releaseGroupId","genreId")
);

-- CreateTable
CREATE TABLE "Cover" (
    "id" TEXT NOT NULL,
    "releaseGroupId" TEXT NOT NULL,
    "kind" "CoverKind" NOT NULL,
    "url" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,

    CONSTRAINT "Cover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalRef" (
    "id" TEXT NOT NULL,
    "releaseGroupId" TEXT NOT NULL,
    "musicbrainzId" TEXT,
    "discogsId" TEXT,
    "spotifyUrl" TEXT,
    "bandcampUrl" TEXT,

    CONSTRAINT "ExternalRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseGroupArtist" (
    "releaseGroupId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "joinPhrase" TEXT,

    CONSTRAINT "ReleaseGroupArtist_pkey" PRIMARY KEY ("releaseGroupId","artistId","position")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Artist_musicbrainzId_key" ON "Artist"("musicbrainzId");

-- CreateIndex
CREATE INDEX "Artist_name_idx" ON "Artist"("name");

-- CreateIndex
CREATE INDEX "Artist_sortName_idx" ON "Artist"("sortName");

-- CreateIndex
CREATE INDEX "Artist_musicbrainzId_idx" ON "Artist"("musicbrainzId");

-- CreateIndex
CREATE INDEX "ReleaseGroup_title_idx" ON "ReleaseGroup"("title");

-- CreateIndex
CREATE INDEX "ReleaseGroup_year_idx" ON "ReleaseGroup"("year");

-- CreateIndex
CREATE UNIQUE INDEX "ReleaseGroup_artistId_title_year_key" ON "ReleaseGroup"("artistId", "title", "year");

-- CreateIndex
CREATE INDEX "Release_releaseGroupId_idx" ON "Release"("releaseGroupId");

-- CreateIndex
CREATE INDEX "Track_releaseId_number_idx" ON "Track"("releaseId", "number");

-- CreateIndex
CREATE INDEX "Track_title_idx" ON "Track"("title");

-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");

-- CreateIndex
CREATE INDEX "Rating_targetTrackId_idx" ON "Rating"("targetTrackId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "Genre_name_idx" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalRef_musicbrainzId_key" ON "ExternalRef"("musicbrainzId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalRef_discogsId_key" ON "ExternalRef"("discogsId");

-- CreateIndex
CREATE INDEX "ReleaseGroupArtist_releaseGroupId_idx" ON "ReleaseGroupArtist"("releaseGroupId");

-- CreateIndex
CREATE INDEX "ReleaseGroupArtist_artistId_idx" ON "ReleaseGroupArtist"("artistId");

-- AddForeignKey
ALTER TABLE "ReleaseGroup" ADD CONSTRAINT "ReleaseGroup_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_releaseGroupId_fkey" FOREIGN KEY ("releaseGroupId") REFERENCES "ReleaseGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalCopy" ADD CONSTRAINT "PhysicalCopy_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalCopy" ADD CONSTRAINT "DigitalCopy_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_targetTrackId_fkey" FOREIGN KEY ("targetTrackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Genre" ADD CONSTRAINT "Genre_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseGroupGenre" ADD CONSTRAINT "ReleaseGroupGenre_releaseGroupId_fkey" FOREIGN KEY ("releaseGroupId") REFERENCES "ReleaseGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseGroupGenre" ADD CONSTRAINT "ReleaseGroupGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cover" ADD CONSTRAINT "Cover_releaseGroupId_fkey" FOREIGN KEY ("releaseGroupId") REFERENCES "ReleaseGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalRef" ADD CONSTRAINT "ExternalRef_releaseGroupId_fkey" FOREIGN KEY ("releaseGroupId") REFERENCES "ReleaseGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseGroupArtist" ADD CONSTRAINT "ReleaseGroupArtist_releaseGroupId_fkey" FOREIGN KEY ("releaseGroupId") REFERENCES "ReleaseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseGroupArtist" ADD CONSTRAINT "ReleaseGroupArtist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
