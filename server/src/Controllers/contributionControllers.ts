import { Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { AuthRequest } from "../types/express.js";

// Record a new contribution (Treasurer/OWNER only)
export const recordContribution = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId } = req.params as { chamaId: string };
    const { userId, amount, month, paymentMethod, notes } = req.body;
    const recordedBy = req.user?.id;

    if (!recordedBy) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: recordedBy,
          chamaId: chamaId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== "TREASURER" && membership.role !== "OWNER")
    ) {
      res
        .status(403)
        .json({ error: "Only treasurer or owner can record contributions" });
      return;
    }

    // Validate input
    if (!userId || !amount || !month) {
      res
        .status(400)
        .json({ error: "Member ID, amount, and month are required" });
      return;
    }

    // Check if member exists in this chama
    const memberExists = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: userId,
          chamaId: chamaId,
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!memberExists) {
      res.status(404).json({ error: "Member not found in this chama" });
      return;
    }

    // Get chama details
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
    });

    // Parse month (first day of the month)
    const monthDate = new Date(month);
    monthDate.setDate(1);
    monthDate.setHours(0, 0, 0, 0);

    // Check for duplicate
    const existing = await prisma.contribution.findFirst({
      where: {
        userId,
        chamaId,
        month: monthDate,
      },
    });

    if (existing) {
      res
        .status(400)
        .json({ error: "Contribution for this month already exists" });
      return;
    }

    // Determine status
    const expectedAmount = chama?.contributionAmount || amount;
    let status = "PENDING";
    if (amount >= expectedAmount) {
      status = "PAID";
    } else if (amount > 0 && amount < expectedAmount) {
      status = "PARTIAL";
    }

    // Create contribution
    const contribution = await prisma.$transaction(async (tx) => {
      const newContribution = await tx.contribution.create({
        data: {
          userId,
          chamaId,
          amount: parseFloat(amount),
          month: monthDate,
          status,
          paymentMethod: paymentMethod || "CASH",
          notes,
          recordedBy,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId: recordedBy,
          action: "RECORD_CONTRIBUTION",
          entity: "Contribution",
          entityId: newContribution.id,
          newValues: {
            userId,
            amount,
            month: monthDate,
            status,
            paymentMethod,
          },
        },
      });

      return newContribution;
    });

    res.status(201).json({
      success: true,
      message: "Contribution recorded successfully",
      contribution,
    });
  } catch (error) {
    console.error("Record contribution error:", error);
    res.status(500).json({ error: "Failed to record contribution" });
  }
};

// ==================== READ ====================

// Get all contributions for a chama
export const getContributions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId } = req.params as { chamaId: string };
    const { month, userId, status, fromDate, toDate } = req.query;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: currentUserId,
          chamaId: chamaId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Build filters
    const filters: any = { chamaId };

    if (month) {
      const monthDate = new Date(month as string);
      monthDate.setDate(1);
      filters.month = monthDate;
    }

    if (userId && membership.role !== "MEMBER") {
      filters.userId = userId as string;
    } else if (membership.role === "MEMBER") {
      filters.userId = currentUserId;
    }

    if (status) {
      filters.status = status as string;
    }

    if (fromDate || toDate) {
      filters.createdAt = {};
      if (fromDate) filters.createdAt.gte = new Date(fromDate as string);
      if (toDate) filters.createdAt.lte = new Date(toDate as string);
    }

    // Get contributions
    const contributions = await prisma.contribution.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        month: "desc",
      },
    });

    // Summary statistics
    const summary = await prisma.contribution.aggregate({
      where: {
        chamaId,
        ...(membership.role === "MEMBER" ? { userId: currentUserId } : {}),
      },
      _sum: {
        amount: true,
      },
      _count: true,
      _avg: {
        amount: true,
      },
    });

    // Status breakdown
    const statusBreakdown = await prisma.contribution.groupBy({
      by: ["status"],
      where: {
        chamaId,
        ...(membership.role === "MEMBER" ? { userId: currentUserId } : {}),
      },
      _count: {
        status: true,
      },
      _sum: {
        amount: true,
      },
    });

    res.json({
      success: true,
      contributions,
      summary: {
        totalCollected: summary._sum.amount || 0,
        totalContributions: summary._count,
        averageContribution: summary._avg.amount || 0,
      },
      statusBreakdown,
      userRole: membership.role,
    });
  } catch (error) {
    console.error("Get contributions error:", error);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
};

// Get single contribution by ID
export const getContributionById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, contributionId } = req.params as {
      chamaId: string;
      contributionId: string;
    };
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const contribution = await prisma.contribution.findFirst({
      where: {
        id: contributionId,
        chamaId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        chama: {
          select: {
            id: true,
            name: true,
            contributionAmount: true,
          },
        },
      },
    });

    if (!contribution) {
      res.status(404).json({ error: "Contribution not found" });
      return;
    }

    // Members can only see their own
    if (membership.role === "MEMBER" && contribution.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({
      success: true,
      contribution,
    });
  } catch (error) {
    console.error("Get contribution error:", error);
    res.status(500).json({ error: "Failed to fetch contribution" });
  }
};

// Get member's contribution history
export const getMemberContributions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, memberId } = req.params as {
      chamaId: string;
      memberId: string;
    };
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: currentUserId,
          chamaId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Determine which member to show
    let targetUserId = memberId;
    if (membership.role === "MEMBER") {
      targetUserId = currentUserId;
    }

    if (!targetUserId) {
      res.status(400).json({ error: "Member ID required" });
      return;
    }

    // Get member details
    const member = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    // Get contributions
    const contributions = await prisma.contribution.findMany({
      where: {
        userId: targetUserId,
        chamaId,
      },
      orderBy: {
        month: "desc",
      },
    });

    // Get chama settings
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      select: { contributionAmount: true, frequency: true },
    });

    const totalPaid = contributions.reduce((sum, c) => sum + c.amount, 0);
    const expectedPerMonth = chama?.contributionAmount || 0;
    const expectedTotal = contributions.length * expectedPerMonth;
    const missedCount = contributions.filter(
      (c) => c.status === "PENDING",
    ).length;
    const partialCount = contributions.filter(
      (c) => c.status === "PARTIAL",
    ).length;

    res.json({
      success: true,
      member,
      summary: {
        totalPaid,
        expectedTotal,
        balance: expectedTotal - totalPaid,
        contributionCount: contributions.length,
        missedMonths: missedCount,
        partialMonths: partialCount,
        complianceRate:
          contributions.length > 0
            ? (
                ((contributions.length - missedCount - partialCount) /
                  contributions.length) *
                100
              ).toFixed(2)
            : 100,
      },
      contributions,
      chamaSettings: {
        expectedAmount: expectedPerMonth,
        frequency: chama?.frequency,
      },
    });
  } catch (error) {
    console.error("Get member contributions error:", error);
    res.status(500).json({ error: "Failed to fetch member contributions" });
  }
};

// ==================== UPDATE ====================

// Update contribution (Treasurer/OWNER only)
export const updateContribution = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, contributionId } = req.params as {
      chamaId: string;
      contributionId: string;
    };
    const { amount, status, paymentMethod, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check permission
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (
      !membership ||
      (membership.role !== "TREASURER" && membership.role !== "OWNER")
    ) {
      res
        .status(403)
        .json({ error: "Only treasurer or owner can update contributions" });
      return;
    }

    // Get old values
    const oldContribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
    });

    if (!oldContribution || oldContribution.chamaId !== chamaId) {
      res.status(404).json({ error: "Contribution not found" });
      return;
    }

    // Update
    const updated = await prisma.$transaction(async (tx) => {
      const updatedContribution = await tx.contribution.update({
        where: { id: contributionId },
        data: {
          amount: amount !== undefined ? parseFloat(amount) : undefined,
          status: status || undefined,
          paymentMethod: paymentMethod || undefined,
          notes: notes !== undefined ? notes : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: "UPDATE_CONTRIBUTION",
          entity: "Contribution",
          entityId: contributionId,
          oldValues: {
            amount: oldContribution.amount,
            status: oldContribution.status,
            paymentMethod: oldContribution.paymentMethod,
          },
          newValues: {
            amount: updatedContribution.amount,
            status: updatedContribution.status,
            paymentMethod: updatedContribution.paymentMethod,
          },
        },
      });

      return updatedContribution;
    });

    res.json({
      success: true,
      message: "Contribution updated successfully",
      contribution: updated,
    });
  } catch (error) {
    console.error("Update contribution error:", error);
    res.status(500).json({ error: "Failed to update contribution" });
  }
};

// ==================== DELETE ====================

// Delete contribution (OWNER only)
export const deleteContribution = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, contributionId } = req.params as {
      chamaId: string;
      contributionId: string;
    };
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check if user is OWNER
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      res
        .status(403)
        .json({ error: "Only chama owner can delete contributions" });
      return;
    }

    // Get contribution before deletion
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution || contribution.chamaId !== chamaId) {
      res.status(404).json({ error: "Contribution not found" });
      return;
    }

    // Delete
    await prisma.$transaction(async (tx) => {
      await tx.contribution.delete({
        where: { id: contributionId },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: "DELETE_CONTRIBUTION",
          entity: "Contribution",
          entityId: contributionId,
          oldValues: {
            userId: contribution.userId,
            amount: contribution.amount,
            month: contribution.month,
            status: contribution.status,
          },
        },
      });
    });

    res.json({
      success: true,
      message: "Contribution deleted successfully",
    });
  } catch (error) {
    console.error("Delete contribution error:", error);
    res.status(500).json({ error: "Failed to delete contribution" });
  }
};

// ==================== DASHBOARD STATS ====================

// Get contribution dashboard statistics
export const getContributionStats = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId } = req.params as { chamaId: string };
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check membership
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Get chama info
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
      include: {
        memberships: {
          select: { userId: true, role: true },
        },
      },
    });

    if (!chama) {
      res.status(404).json({ error: "Chama not found" });
      return;
    }

    const totalMembers = chama.memberships.length;
    const expectedPerMember = chama.contributionAmount || 0;

    // Get current month's contributions
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthContributions = await prisma.contribution.aggregate({
      where: {
        chamaId,
        month: currentMonth,
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get year to date total
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const ytdTotal = await prisma.contribution.aggregate({
      where: {
        chamaId,
        createdAt: {
          gte: yearStart,
        },
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    });

    // Get members who haven't paid this month
    const paidMembers = await prisma.contribution.findMany({
      where: {
        chamaId,
        month: currentMonth,
        status: "PAID",
      },
      select: { userId: true },
    });

    const paidMemberIds = paidMembers.map((p) => p.userId);
    const pendingMembers = chama.memberships.filter(
      (m) => !paidMemberIds.includes(m.userId),
    );

    res.json({
      success: true,
      stats: {
        totalMembers,
        expectedMonthlyTotal: totalMembers * expectedPerMember,
        currentMonthCollected: currentMonthContributions._sum.amount || 0,
        currentMonthCompliance:
          totalMembers > 0
            ? ((currentMonthContributions._count / totalMembers) * 100).toFixed(
                1,
              )
            : 0,
        ytdTotal: ytdTotal._sum.amount || 0,
        pendingCount: pendingMembers.length,
        pendingMembers: pendingMembers.map((m) => m.userId),
      },
      userRole: membership.role,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};
