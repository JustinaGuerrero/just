-- CreateEnum
CREATE TYPE "Category" AS ENUM ('TEE', 'SHIRT', 'PANTS', 'SKIRT', 'DRESS', 'OUTERWEAR', 'SHOES', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');

-- CreateEnum
CREATE TYPE "Style" AS ENUM ('CASUAL', 'FORMAL', 'SPORT', 'ELEGANT', 'STREET');

-- CreateEnum
CREATE TYPE "Occasion" AS ENUM ('UNIVERSITY', 'WORK', 'OUTING', 'EVENT', 'SPORT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Garment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "colors" TEXT[],
    "styles" "Style"[],
    "seasons" "Season"[],
    "brand" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePublicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "occasion" "Occasion" NOT NULL DEFAULT 'OTHER',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outfit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutfitItem" (
    "id" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "zIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OutfitItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedOutfit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "occasion" "Occasion",
    "notes" TEXT,

    CONSTRAINT "PlannedOutfit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Garment_userId_category_idx" ON "Garment"("userId", "category");

-- CreateIndex
CREATE INDEX "Outfit_userId_isFavorite_idx" ON "Outfit"("userId", "isFavorite");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitItem_outfitId_garmentId_key" ON "OutfitItem"("outfitId", "garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedOutfit_userId_date_key" ON "PlannedOutfit"("userId", "date");

-- AddForeignKey
ALTER TABLE "Garment" ADD CONSTRAINT "Garment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outfit" ADD CONSTRAINT "Outfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitItem" ADD CONSTRAINT "OutfitItem_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitItem" ADD CONSTRAINT "OutfitItem_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedOutfit" ADD CONSTRAINT "PlannedOutfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedOutfit" ADD CONSTRAINT "PlannedOutfit_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
