-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "bracketPosition" INTEGER,
ADD COLUMN     "isLosersBracket" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "elo" INTEGER,
ADD COLUMN     "region" TEXT;
