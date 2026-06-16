-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "Chama" ADD COLUMN     "loanInterestRate" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "approvedByOwner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedByTreasurer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT;

-- CreateTable
CREATE TABLE "ChamaSettings" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "allowMemberInvites" BOOLEAN NOT NULL DEFAULT true,
    "requireApprovalForJoin" BOOLEAN NOT NULL DEFAULT false,
    "contributionDay" INTEGER,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 3,
    "allowPartialPayment" BOOLEAN NOT NULL DEFAULT false,
    "maxLoanAmount" DOUBLE PRECISION,
    "minLoanAmount" DOUBLE PRECISION,
    "defaultLoanPeriod" INTEGER NOT NULL DEFAULT 6,
    "maxLoanPeriod" INTEGER NOT NULL DEFAULT 12,
    "requireCollateral" BOOLEAN NOT NULL DEFAULT false,
    "loanApprovalThreshold" DOUBLE PRECISION,
    "meetingFrequency" TEXT,
    "defaultMeetingDay" TEXT,
    "requireAttendance" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnContribution" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnLoanRequest" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnMeeting" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnPayment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChamaSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChamaAnalytics" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "totalMembers" INTEGER NOT NULL DEFAULT 0,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "newMembersThisMonth" INTEGER NOT NULL DEFAULT 0,
    "totalContributions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageContribution" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyContributionTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionCompliance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLoansDisbursed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeLoans" INTEGER NOT NULL DEFAULT 0,
    "totalRepayments" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageLoanAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalMeetings" INTEGER NOT NULL DEFAULT 0,
    "averageAttendance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memberGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contributionGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loanGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChamaAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chamaId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChamaSettings_chamaId_key" ON "ChamaSettings"("chamaId");

-- CreateIndex
CREATE UNIQUE INDEX "ChamaAnalytics_chamaId_key" ON "ChamaAnalytics"("chamaId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_code_key" ON "InviteToken"("code");

-- CreateIndex
CREATE INDEX "AuditLog_chamaId_idx" ON "AuditLog"("chamaId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ChamaSettings" ADD CONSTRAINT "ChamaSettings_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamaAnalytics" ADD CONSTRAINT "ChamaAnalytics_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "Chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;
