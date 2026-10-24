-- CreateTable
CREATE TABLE "program_templates" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_days" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "template_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_exercises" (
    "id" TEXT NOT NULL,
    "templateDayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "restInterval" TEXT,
    "notes" TEXT,
    "videoUrl" TEXT,
    "videoFile" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "program_templates_trainerId_idx" ON "program_templates"("trainerId");

-- CreateIndex
CREATE INDEX "template_days_templateId_orderIndex_idx" ON "template_days"("templateId", "orderIndex");

-- CreateIndex
CREATE INDEX "template_exercises_templateDayId_orderIndex_idx" ON "template_exercises"("templateDayId", "orderIndex");

-- AddForeignKey
ALTER TABLE "program_templates" ADD CONSTRAINT "program_templates_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_days" ADD CONSTRAINT "template_days_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "program_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_templateDayId_fkey" FOREIGN KEY ("templateDayId") REFERENCES "template_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
