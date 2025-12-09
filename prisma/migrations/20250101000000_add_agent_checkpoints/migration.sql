-- CreateEnum
CREATE TYPE "CheckpointType" AS ENUM ('APPROVAL_REQUIRED', 'INFO', 'ERROR');

-- CreateEnum
CREATE TYPE "CheckpointStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "agent_checkpoints" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "checkpoint_type" "CheckpointType" NOT NULL,
    "status" "CheckpointStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT NOT NULL,
    "data" JSONB,
    "metadata" JSONB,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_checkpoints_job_id_idx" ON "agent_checkpoints"("job_id");

-- CreateIndex
CREATE INDEX "agent_checkpoints_status_idx" ON "agent_checkpoints"("status");

-- CreateIndex
CREATE INDEX "agent_checkpoints_checkpoint_type_idx" ON "agent_checkpoints"("checkpoint_type");

-- CreateIndex
CREATE INDEX "agent_checkpoints_created_at_idx" ON "agent_checkpoints"("created_at");

-- AddForeignKey
ALTER TABLE "agent_checkpoints" ADD CONSTRAINT "agent_checkpoints_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "ai_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

