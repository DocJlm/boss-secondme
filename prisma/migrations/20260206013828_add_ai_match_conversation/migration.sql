-- CreateTable
CREATE TABLE "ai_match_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "candidate_secondme_user_id" TEXT NOT NULL,
    "employer_secondme_user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "match_score" INTEGER,
    "match_threshold" INTEGER NOT NULL DEFAULT 60,
    "conversation_history" JSONB NOT NULL,
    "current_turn" INTEGER NOT NULL DEFAULT 0,
    "evaluation_reason" TEXT,
    "candidate_conversation_id" TEXT,
    "employer_conversation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_match_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_match_conversations_user_id_job_id_key" ON "ai_match_conversations"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "ai_match_conversations" ADD CONSTRAINT "ai_match_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_match_conversations" ADD CONSTRAINT "ai_match_conversations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
