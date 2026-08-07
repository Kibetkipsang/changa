import { prisma } from "../lib/prisma.js";
export const getAnalytics = async (req, res) => {
    try {
        const { chamaId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Check if user is a member of this chama
        const membership = await prisma.membership.findUnique({
            where: {
                userId_chamaId: {
                    userId,
                    chamaId,
                },
            },
        });
        if (!membership) {
            return res.status(403).json({ error: "Access denied" });
        }
        // Get all members
        const members = await prisma.membership.findMany({
            where: { chamaId },
            include: {
                user: true,
            },
        });
        const totalMembers = members.length;
        const activeMembers = members.filter((m) => m.role !== "MEMBER" || m.joinedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
        // New members this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newMembersThisMonth = members.filter((m) => m.joinedAt >= startOfMonth).length;
        // Get all contributions
        const contributions = await prisma.contribution.findMany({
            where: { chamaId },
        });
        const paidContributions = contributions.filter((c) => c.status === "PAID");
        const totalContributions = paidContributions.reduce((sum, c) => sum + c.amount, 0);
        const averageContribution = paidContributions.length > 0
            ? totalContributions / paidContributions.length
            : 0;
        // This month's contributions
        const thisMonthContributions = paidContributions.filter((c) => c.month >= startOfMonth);
        const monthlyContributionTotal = thisMonthContributions.reduce((sum, c) => sum + c.amount, 0);
        // Contribution compliance (members who have paid this month)
        const membersWhoPaid = new Set(thisMonthContributions.map((c) => c.userId));
        const contributionCompliance = totalMembers > 0
            ? (membersWhoPaid.size / totalMembers) * 100
            : 0;
        // Get loans
        const loans = await prisma.loan.findMany({
            where: { chamaId },
            include: {
                repayments: true,
            },
        });
        const activeLoans = loans.filter((l) => l.status === "ACTIVE");
        const totalLoansDisbursed = loans
            .filter((l) => l.status === "ACTIVE" || l.status === "COMPLETED")
            .reduce((sum, l) => sum + l.amount, 0);
        const totalRepayments = loans.reduce((sum, l) => sum + l.repayments.reduce((s, r) => s + r.amount, 0), 0);
        const defaultedLoans = loans.filter((l) => l.status === "DEFAULTED");
        const defaultRate = loans.length > 0
            ? (defaultedLoans.length / loans.length) * 100
            : 0;
        const averageLoanAmount = loans.length > 0
            ? loans.reduce((sum, l) => sum + l.amount, 0) / loans.length
            : 0;
        // Get meetings
        const meetings = await prisma.meeting.findMany({
            where: { chamaId },
        });
        const totalMeetings = meetings.length;
        const completedMeetings = meetings.filter((m) => m.status === "COMPLETED");
        // Calculate average attendance from completed meetings
        let averageAttendance = 0;
        if (completedMeetings.length > 0) {
            const totalAttendance = completedMeetings.reduce((sum, m) => {
                const attendees = m.attendanceList ? JSON.parse(m.attendanceList).length : 0;
                return sum + attendees;
            }, 0);
            averageAttendance = (totalAttendance / (completedMeetings.length * totalMembers)) * 100;
        }
        // Financial summary (simplified - you can expand based on your needs)
        const totalBalance = totalContributions - totalLoansDisbursed + totalRepayments;
        const totalIncome = totalContributions + totalRepayments;
        const totalExpenses = totalLoansDisbursed;
        const monthlyRevenue = monthlyContributionTotal;
        // Growth metrics (compare with previous month)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        lastMonth.setHours(0, 0, 0, 0);
        const previousMonthMembers = await prisma.membership.count({
            where: {
                chamaId,
                joinedAt: {
                    lt: startOfMonth,
                },
            },
        });
        const previousMonthContributions = await prisma.contribution.aggregate({
            where: {
                chamaId,
                status: "PAID",
                month: {
                    gte: lastMonth,
                    lt: startOfMonth,
                },
            },
            _sum: {
                amount: true,
            },
        });
        const previousLoans = await prisma.loan.count({
            where: {
                chamaId,
                createdAt: {
                    gte: lastMonth,
                    lt: startOfMonth,
                },
            },
        });
        const memberGrowthRate = previousMonthMembers > 0
            ? ((totalMembers - previousMonthMembers) / previousMonthMembers) * 100
            : 0;
        const contributionGrowth = previousMonthContributions._sum.amount && previousMonthContributions._sum.amount > 0
            ? ((totalContributions - previousMonthContributions._sum.amount) / previousMonthContributions._sum.amount) * 100
            : 0;
        const currentLoans = await prisma.loan.count({
            where: {
                chamaId,
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });
        const loanGrowthRate = previousLoans > 0
            ? ((currentLoans - previousLoans) / previousLoans) * 100
            : 0;
        // Update or create analytics record
        const analytics = await prisma.chamaAnalytics.upsert({
            where: { chamaId },
            update: {
                totalMembers,
                activeMembers,
                newMembersThisMonth,
                totalContributions,
                averageContribution,
                monthlyContributionTotal,
                contributionCompliance,
                totalLoansDisbursed,
                activeLoans: activeLoans.length,
                totalRepayments,
                defaultRate,
                averageLoanAmount,
                totalMeetings,
                averageAttendance,
                totalBalance,
                totalIncome,
                totalExpenses,
                monthlyRevenue,
                memberGrowthRate,
                contributionGrowth,
                loanGrowthRate,
                lastUpdated: new Date(),
            },
            create: {
                chamaId,
                totalMembers,
                activeMembers,
                newMembersThisMonth,
                totalContributions,
                averageContribution,
                monthlyContributionTotal,
                contributionCompliance,
                totalLoansDisbursed,
                activeLoans: activeLoans.length,
                totalRepayments,
                defaultRate,
                averageLoanAmount,
                totalMeetings,
                averageAttendance,
                totalBalance,
                totalIncome,
                totalExpenses,
                monthlyRevenue,
                memberGrowthRate,
                contributionGrowth,
                loanGrowthRate,
                lastUpdated: new Date(),
            },
        });
        res.json({ analytics });
    }
    catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};
//# sourceMappingURL=analyticsController.js.map