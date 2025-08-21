/*
  Warnings:

  - The values [ASSISTANT] on the enum `MessageRole` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `userId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MessageRole_new" AS ENUM ('USER', 'ASSITANT');
ALTER TABLE "public"."Message" ALTER COLUMN "role" TYPE "public"."MessageRole_new" USING ("role"::text::"public"."MessageRole_new");
ALTER TYPE "public"."MessageRole" RENAME TO "MessageRole_old";
ALTER TYPE "public"."MessageRole_new" RENAME TO "MessageRole";
DROP TYPE "public"."MessageRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "userId" TEXT NOT NULL;
