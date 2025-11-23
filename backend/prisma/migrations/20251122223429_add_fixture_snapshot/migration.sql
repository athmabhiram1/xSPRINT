-- CreateTable
CREATE TABLE "FixtureSnapshot" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "snapshotData" JSONB NOT NULL,
    "fairnessScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixtureSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixtureSnapshot_eventId_idx" ON "FixtureSnapshot"("eventId");

-- CreateIndex
CREATE INDEX "FixtureSnapshot_createdAt_idx" ON "FixtureSnapshot"("createdAt");
