import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types/express.js";

const prisma = new PrismaClient();

// ==================== CREATE ====================

// Request a loan (MEMBER only)
export const requestLoan = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId } = req.params as { chamaId: string };
    const { amount, interestRate, repaymentPeriod, purpose } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check if user is a member of this chama
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      res.status(403).json({ error: "You are not a member of this chama" });
      return;
    }

    // Validate input
    if (!amount || !repaymentPeriod) {
      res
        .status(400)
        .json({ error: "Amount and repayment period are required" });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: "Amount must be greater than 0" });
      return;
    }

    // Check if user has any active loans
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId,
        chamaId,
        status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
      },
    });

    if (activeLoan) {
      res
        .status(400)
        .json({
          error:
            "You have an existing loan request that is still pending or active",
        });
      return;
    }

    // Calculate initial balance (amount + interest)
    const interestAmount = amount * (interestRate / 100);
    const totalAmount = amount + interestAmount;

    // Create loan request
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          userId,
          chamaId,
          amount: parseFloat(amount),
          interestRate: interestRate || 0,
          repaymentPeriod: parseInt(repaymentPeriod),
          balance: totalAmount,
          purpose,
          status: "PENDING",
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
          userId,
          action: "REQUEST_LOAN",
          entity: "Loan",
          entityId: newLoan.id,
          newValues: {
            amount,
            interestRate,
            repaymentPeriod,
            purpose,
          },
        },
      });

      return newLoan;
    });

    res.status(201).json({
      success: true,
      message: "Loan request submitted successfully",
      loan,
    });
  } catch (error) {
    console.error("Request loan error:", error);
    res.status(500).json({ error: "Failed to submit loan request" });
  }
};

// ==================== UPDATE (APPROVE/REJECT) ====================

// Approve loan (TREASURER/OWNER only)
export const approveLoan = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, loanId } = req.params as {
      chamaId: string;
      loanId: string;
    };
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
        .json({ error: "Only treasurer or owner can approve loans" });
      return;
    }

    // Get loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        chamaId,
      },
      include: {
        user: true,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "PENDING") {
      res
        .status(400)
        .json({ error: `Cannot approve loan with status: ${loan.status}` });
      return;
    }

    // Update loan
    const updatedLoan = await prisma.$transaction(async (tx) => {
      const approvedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: "APPROVED",
          approvedBy: userId,
          approvedAt: new Date(),
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
          userId,
          action: "APPROVE_LOAN",
          entity: "Loan",
          entityId: loanId,
          oldValues: { status: loan.status },
          newValues: { status: "APPROVED", approvedBy: userId },
        },
      });

      return approvedLoan;
    });

    res.json({
      success: true,
      message: "Loan approved successfully",
      loan: updatedLoan,
    });
  } catch (error) {
    console.error("Approve loan error:", error);
    res.status(500).json({ error: "Failed to approve loan" });
  }
};

// Reject loan (TREASURER/OWNER only)
export const rejectLoan = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, loanId } = req.params as {
      chamaId: string;
      loanId: string;
    };
    const { rejectionReason } = req.body;
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
        .json({ error: "Only treasurer or owner can reject loans" });
      return;
    }

    // Get loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        chamaId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "PENDING") {
      res
        .status(400)
        .json({ error: `Cannot reject loan with status: ${loan.status}` });
      return;
    }

    // Update loan
    const updatedLoan = await prisma.$transaction(async (tx) => {
      const rejectedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: "REJECTED",
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || "No reason provided",
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
          action: "REJECT_LOAN",
          entity: "Loan",
          entityId: loanId,
          oldValues: { status: loan.status },
          newValues: { status: "REJECTED", rejectionReason },
        },
      });

      return rejectedLoan;
    });

    res.json({
      success: true,
      message: "Loan rejected",
      loan: updatedLoan,
    });
  } catch (error) {
    console.error("Reject loan error:", error);
    res.status(500).json({ error: "Failed to reject loan" });
  }
};

// Mark loan as ACTIVE (after disbursement)
export const activateLoan = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, loanId } = req.params as {
      chamaId: string;
      loanId: string;
    };
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
        .json({ error: "Only treasurer or owner can activate loans" });
      return;
    }

    // Get loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        chamaId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "APPROVED") {
      res
        .status(400)
        .json({ error: `Cannot activate loan with status: ${loan.status}` });
      return;
    }

    // Update loan
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: "ACTIVE",
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

    res.json({
      success: true,
      message: "Loan activated successfully",
      loan: updatedLoan,
    });
  } catch (error) {
    console.error("Activate loan error:", error);
    res.status(500).json({ error: "Failed to activate loan" });
  }
};

// ==================== REPAYMENTS ====================

// Record loan repayment
export const recordRepayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, loanId } = req.params as {
      chamaId: string;
      loanId: string;
    };
    const { amount, notes } = req.body;
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
        .json({ error: "Only treasurer or owner can record repayments" });
      return;
    }

    // Get loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        chamaId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "ACTIVE") {
      res
        .status(400)
        .json({
          error: `Cannot record repayment for loan with status: ${loan.status}`,
        });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Valid amount is required" });
      return;
    }

    if (amount > loan.balance) {
      res
        .status(400)
        .json({ error: `Amount exceeds remaining balance of ${loan.balance}` });
      return;
    }

    // Record repayment and update balance
    const result = await prisma.$transaction(async (tx) => {
      // Create repayment record
      const repayment = await tx.loanRepayment.create({
        data: {
          loanId,
          amount: parseFloat(amount),
          recordedBy: userId,
          notes,
        },
      });

      // Update loan balance
      const newBalance = loan.balance - amount;
      const newStatus = newBalance === 0 ? "COMPLETED" : "ACTIVE";

      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          balance: newBalance,
          status: newStatus,
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
          action: "RECORD_REPAYMENT",
          entity: "LoanRepayment",
          entityId: repayment.id,
          newValues: {
            loanId,
            amount,
            newBalance,
          },
        },
      });

      return { repayment, loan: updatedLoan };
    });

    res.json({
      success: true,
      message:
        result.loan.status === "COMPLETED"
          ? "Loan fully repaid! 🎉"
          : "Repayment recorded successfully",
      repayment: result.repayment,
      loan: result.loan,
    });
  } catch (error) {
    console.error("Record repayment error:", error);
    res.status(500).json({ error: "Failed to record repayment" });
  }
};

// Get loan repayment history
export const getRepaymentHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, loanId } = req.params as {
      chamaId: string;
      loanId: string;
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

    // Get loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        chamaId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        repayments: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    // Members can only see their own loans
    if (membership.role === "MEMBER" && loan.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const remainingBalance = loan.balance;

    res.json({
      success: true,
      loan: {
        id: loan.id,
        amount: loan.amount,
        interestRate: loan.interestRate,
        totalPayable: loan.amount + (loan.amount * loan.interestRate) / 100,
        repaymentPeriod: loan.repaymentPeriod,
        status: loan.status,
        purpose: loan.purpose,
        approvedAt: loan.approvedAt,
        createdAt: loan.createdAt,
      },
      borrower: loan.user,
      repayments: loan.repayments,
      summary: {
        totalRepaid,
        remainingBalance,
        progressPercent: (
          (totalRepaid /
            (loan.amount + (loan.amount * loan.interestRate) / 100)) *
          100
        ).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Get repayment history error:", error);
    res.status(500).json({ error: "Failed to fetch repayment history" });
  }
};

// ==================== READ ====================

// Get all loans for a chama
export const getLoans = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId } = req.params as { chamaId: string };
    const { status, userId } = req.query;
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

    // Build filters
    const filters: any = { chamaId };

    if (status) {
      filters.status = status as string;
    }

    if (userId && membership.role !== "MEMBER") {
      filters.userId = userId as string;
    } else if (membership.role === "MEMBER") {
      filters.userId = currentUserId;
    }

    // Get loans
    const loans = await prisma.loan.findMany({
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
        repayments: {
          orderBy: { date: "desc" },
          take: 5, // Last 5 repayments
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Summary statistics
    const stats = await prisma.loan.aggregate({
      where: {
        chamaId,
        ...(membership.role === "MEMBER" ? { userId: currentUserId } : {}),
      },
      _sum: {
        amount: true,
        balance: true,
      },
      _count: true,
    });

    const activeLoans = loans.filter((l) => l.status === "ACTIVE");
    const completedLoans = loans.filter((l) => l.status === "COMPLETED");
    const pendingLoans = loans.filter((l) => l.status === "PENDING");

    res.json({
      success: true,
      loans,
      summary: {
        totalLoanAmount: stats._sum.amount || 0,
        totalOutstandingBalance: stats._sum.balance || 0,
        totalLoans: stats._count,
        activeCount: activeLoans.length,
        completedCount: completedLoans.length,
        pendingCount: pendingLoans.length,
      },
      userRole: membership.role,
    });
  } catch (error) {
    console.error("Get loans error:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

// Get single loan by ID
export const getLoanById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, loanId } = req.params as {
      chamaId: string;
      loanId: string;
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

    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
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
        repayments: {
          orderBy: {
            date: "desc",
          },
        },
        chama: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    // Members can only see their own
    if (membership.role === "MEMBER" && loan.userId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const totalRepaid = loan.repayments.reduce((sum, r) => sum + r.amount, 0);
    const totalPayable = loan.amount + (loan.amount * loan.interestRate) / 100;

    res.json({
      success: true,
      loan: {
        ...loan,
        totalRepaid,
        totalPayable,
        remainingBalance: loan.balance,
        progressPercent: ((totalRepaid / totalPayable) * 100).toFixed(2),
      },
    });
  } catch (error) {
    console.error("Get loan error:", error);
    res.status(500).json({ error: "Failed to fetch loan" });
  }
};

// ==================== DELETE ====================

// Delete loan (OWNER only, only if PENDING)
export const deleteLoan = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { chamaId, loanId } = req.params as {
      chamaId: string;
      loanId: string;
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
      res.status(403).json({ error: "Only chama owner can delete loans" });
      return;
    }

    // Get loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        chamaId,
      },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    if (loan.status !== "PENDING") {
      res
        .status(400)
        .json({ error: `Cannot delete loan with status: ${loan.status}` });
      return;
    }

    // Delete loan
    await prisma.$transaction(async (tx) => {
      // Delete repayments first
      await tx.loanRepayment.deleteMany({
        where: { loanId },
      });

      // Delete loan
      await tx.loan.delete({
        where: { id: loanId },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          chamaId,
          userId,
          action: "DELETE_LOAN",
          entity: "Loan",
          entityId: loanId,
          oldValues: {
            userId: loan.userId,
            amount: loan.amount,
            status: loan.status,
          },
        },
      });
    });

    res.json({
      success: true,
      message: "Loan deleted successfully",
    });
  } catch (error) {
    console.error("Delete loan error:", error);
    res.status(500).json({ error: "Failed to delete loan" });
  }
};
