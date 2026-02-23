-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'student');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'pending_tutor', 'approved', 'denied');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "user" (
    "trevecca_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "password_hash" TEXT,
    "temporary_password" TEXT,
    "major" TEXT,
    "year" INTEGER,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "microsoft_object_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("trevecca_id")
);

-- CreateTable
CREATE TABLE "tutor" (
    "user_id" INTEGER NOT NULL,
    "subjects" TEXT[],
    "hourly_limit" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tutor_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_request" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "requested_tutor_id" INTEGER,
    "course_id" INTEGER NOT NULL,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutoring_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutoring_session" (
    "id" SERIAL NOT NULL,
    "tutor_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "request_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" "SessionStatus",
    "attended" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "tutoring_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_microsoft_object_id_key" ON "user"("microsoft_object_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_code_key" ON "course"("code");

-- CreateIndex
CREATE INDEX "tutoring_request_status_idx" ON "tutoring_request"("status");

-- CreateIndex
CREATE INDEX "tutoring_request_user_id_idx" ON "tutoring_request"("user_id");

-- CreateIndex
CREATE INDEX "tutoring_session_tutor_id_idx" ON "tutoring_session"("tutor_id");

-- CreateIndex
CREATE INDEX "tutoring_session_user_id_idx" ON "tutoring_session"("user_id");

-- CreateIndex
CREATE INDEX "tutoring_session_status_idx" ON "tutoring_session"("status");

-- AddForeignKey
ALTER TABLE "tutor" ADD CONSTRAINT "tutor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("trevecca_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_request" ADD CONSTRAINT "tutoring_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("trevecca_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_request" ADD CONSTRAINT "tutoring_request_requested_tutor_id_fkey" FOREIGN KEY ("requested_tutor_id") REFERENCES "tutor"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_request" ADD CONSTRAINT "tutoring_request_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_session" ADD CONSTRAINT "tutoring_session_tutor_id_fkey" FOREIGN KEY ("tutor_id") REFERENCES "tutor"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_session" ADD CONSTRAINT "tutoring_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("trevecca_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_session" ADD CONSTRAINT "tutoring_session_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "tutoring_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutoring_session" ADD CONSTRAINT "tutoring_session_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
