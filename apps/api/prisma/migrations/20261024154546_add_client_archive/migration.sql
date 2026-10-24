-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "clients_trainerId_archivedAt_idx" ON "clients"("trainerId", "archivedAt");
