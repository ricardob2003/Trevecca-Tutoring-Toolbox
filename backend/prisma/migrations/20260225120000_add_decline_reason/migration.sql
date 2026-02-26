-- AlterTable (IF NOT EXISTS so migration is safe if column was added manually)
ALTER TABLE "tutoring_request" ADD COLUMN IF NOT EXISTS "decline_reason" TEXT;
