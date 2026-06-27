-- CreateTable
CREATE TABLE "ChamaDeletionRequest" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerApproved" BOOLEAN NOT NULL DEFAULT true,
    "ownerApprovedAt" TIMESTAMP(3),
    "secretaryApproved" BOOLEAN NOT NULL DEFAULT false,
    "secretaryApprovedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChamaDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChamaDeletionRequest_chamaId_key" ON "ChamaDeletionRequest"("chamaId");

-- AddForeignKey
ALTER TABLE "ChamaDeletionRequest" ADD CONSTRAINT "ChamaDeletionRequest_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;
