/*
  Warnings:

  - You are about to drop the column `parentTeamId` on the `Team` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_parentTeamId_fkey";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "parentTeamId",
ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
