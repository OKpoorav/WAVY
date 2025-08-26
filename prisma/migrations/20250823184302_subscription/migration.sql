/*
  Warnings:

  - The `subscriptionStatus` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[subscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('FREE', 'PENDING', 'ACTIVE', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3),
DROP COLUMN "subscriptionStatus",
ADD COLUMN     "subscriptionStatus" "public"."SubscriptionStatus" NOT NULL DEFAULT 'FREE';

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "public"."User"("subscriptionId");
