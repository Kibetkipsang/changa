import { Request, Response } from "express";
import { AuthRequest } from "../types/express.js";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

function generateInviteCodes(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export const createChama = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, contributionAmount, frequency, penaltyAmount } =
      req.body;
    const userId = req.user?.id;
    console.log("📝 CREATE CHAMA - User from request:", req.user);
    console.log("📝 CREATE CHAMA - Body:", req.body);

    if (!userId) {
      console.log("❌ CREATE CHAMA - No userId found");
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!name) {
      console.log("❌ CREATE CHAMA - No name provided");
      return res.status(400).json({
        message: "Chama name is required!",
      });
    }

    const inviteCode = generateInviteCodes();
    console.log("🔑 CREATE CHAMA - Generated invite code:", inviteCode);

    const chama = await prisma.$transaction(async (tx: any) => {
      const newChama = await tx.chama.create({
        data: {
          name,
          description,
          contributionAmount: contributionAmount
            ? parseFloat(contributionAmount)
            : null,
          frequency: frequency || "monthly",
          penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : null,
          inviteCode,
          createdBy: userId,
        },
      });
      console.log(
        "✅ CREATE CHAMA - Created chama:",
        newChama.id,
        newChama.name,
      );

      await tx.membership.create({
        data: {
          userId,
          chamaId: newChama.id,
          role: "OWNER",
        },
      });
      console.log("✅ CREATE CHAMA - Added owner membership for user:", userId);
      return newChama;
    });

    res.status(200).json({
      message: "Chama created successfully.",
      chama: {
        id: chama.id,
        name: chama.name,
        inviteCode: chama.inviteCode,
      },
    });
  } catch (error) {
    console.error("❌ CREATE CHAMA - Error:", error);
    res.status(500).json({
      error: "Failed to create chama.",
    });
  }
};

export const joinChama = async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    console.log("🔗 JOIN CHAMA - Request body:", req.body);

    if (!req.user?.id) {
      console.log("❌ JOIN CHAMA - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    console.log("👤 JOIN CHAMA - UserId:", userId);

    if (!inviteCode) {
      console.log("❌ JOIN CHAMA - No invite code provided");
      return res.status(400).json({
        message: "Invite code is required.",
      });
    }

    const chama = await prisma.chama.findUnique({
      where: {
        inviteCode: inviteCode.toUpperCase(),
      },
    });
    console.log("🔍 JOIN CHAMA - Found chama:", chama?.id, chama?.name);

    if (!chama) {
      console.log("❌ JOIN CHAMA - Invalid invite code:", inviteCode);
      return res.status(404).json({
        message: "Invalid invite code.",
      });
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId: chama.id,
        },
      },
    });
    console.log(
      "🔍 JOIN CHAMA - Existing membership:",
      existingMembership ? "Yes" : "No",
    );

    if (existingMembership) {
      console.log("❌ JOIN CHAMA - User already a member");
      return res.status(400).json({
        message: "You are already a member of this chama.",
      });
    }

    const newMember = await prisma.membership.create({
      data: {
        userId,
        chamaId: chama.id,
        role: "MEMBER",
      },
    });
    console.log("✅ JOIN CHAMA - Added new member:", newMember.id);

    res.json({
      message: `Joined ${chama.name} successfully.`,
      chama: {
        id: chama.id,
        name: chama.name,
      },
    });
  } catch (error) {
    console.error("❌ JOIN CHAMA - Error:", error);
    res.status(500).json({
      error: "Failed to join chama.",
    });
  }
};

export const getMyChamas = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log("📋 GET MY CHAMAS - UserId:", userId);
    console.log("📋 GET MY CHAMAS - Full user:", req.user);

    if (!userId) {
      console.log("❌ GET MY CHAMAS - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("🔍 GET MY CHAMAS - Fetching memberships for user:", userId);
    const memberships = await prisma.membership.findMany({
      where: { userId: userId },
      include: {
        chama: {
          include: {
            memberships: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    console.log("📊 GET MY CHAMAS - Found", memberships.length, "memberships");

    const chamas = memberships.map((membership) => {
      const memberCount = membership.chama.memberships.length;
      console.log(
        `📊 GET MY CHAMAS - Chama: ${membership.chama.name}, Member Count: ${memberCount}, Role: ${membership.role}`,
      );

      return {
        id: membership.chama.id,
        name: membership.chama.name,
        description: membership.chama.description,
        role: membership.role,
        inviteCode:
          membership.role === "OWNER" ? membership.chama.inviteCode : null,
        contributionAmount: membership.chama.contributionAmount,
        frequency: membership.chama.frequency,
        memberCount: memberCount,
      };
    });

    console.log(
      "✅ GET MY CHAMAS - Sending response with",
      chamas.length,
      "chamas",
    );
    console.log(
      "📤 GET MY CHAMAS - Response data:",
      JSON.stringify({ chamas }, null, 2),
    );

    res.json({ chamas });
  } catch (error) {
    console.error("❌ GET MY CHAMAS - Error:", error);
    res.status(500).json({
      error: "Failed to get your Chamas.",
    });
  }
};

export const getChamaById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log("🔍 GET CHAMA BY ID - ChamaId:", id);

    if (Array.isArray(id)) {
      console.log("❌ GET CHAMA BY ID - Invalid ID format");
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.user?.id) {
      console.log("❌ GET CHAMA BY ID - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    console.log("👤 GET CHAMA BY ID - UserId:", userId);

    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId: id,
        },
      },
      include: {
        chama: {
          include: {
            memberships: {
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
            },
          },
        },
      },
    });

    if (!membership) {
      console.log(
        "❌ GET CHAMA BY ID - Access denied for user:",
        userId,
        "to chama:",
        id,
      );
      return res.status(403).json({
        error: "Access Denied.",
      });
    }

    const chama = membership.chama;
    const members = chama.memberships.map((m: any) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    console.log(
      `✅ GET CHAMA BY ID - Sending chama: ${chama.name} with ${members.length} members`,
    );

    res.json({
      id: chama.id,
      name: chama.name,
      description: chama.description,
      inviteCode: chama.inviteCode,
      contributionAmount: chama.contributionAmount,
      frequency: chama.frequency,
      penaltyAmount: chama.penaltyAmount,
      createdBy: chama.createdBy,
      members,
      userRole: membership.role,
    });
  } catch (error) {
    console.error("❌ GET CHAMA BY ID - Error:", error);
    res.status(500).json({
      error: "Failed to fetch Chama.",
    });
  }
};

// ============================================
// EXIT CHAMA - Member leaves the chama
// ============================================
export const exitChama = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user?.id;

    console.log("🚪 EXIT CHAMA - ChamaId:", chamaId, "UserId:", userId);

    if (!userId) {
      console.log("❌ EXIT CHAMA - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (Array.isArray(chamaId)) {
      return res.status(400).json({ error: "Invalid chama ID format" });
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
      console.log("❌ EXIT CHAMA - User is not a member of this chama");
      return res.status(404).json({ error: "You are not a member of this chama" });
    }

    // Check if user is the owner - owner cannot exit
    if (membership.role === "OWNER") {
      console.log("❌ EXIT CHAMA - Owner cannot exit");
      return res.status(403).json({ 
        error: "The owner cannot exit the chama. You must delete the chama or transfer ownership first." 
      });
    }

    // Remove the member
    await prisma.membership.delete({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    console.log("✅ EXIT CHAMA - User left the chama successfully");

    // Log the action
    await prisma.auditLog.create({
      data: {
        chamaId,
        userId,
        action: "EXIT",
        entity: "MEMBER",
        entityId: userId,
        createdAt: new Date(),
      },
    });

    res.json({
      message: "You have left the chama successfully",
    });
  } catch (error) {
    console.error("❌ EXIT CHAMA - Error:", error);
    res.status(500).json({ error: "Failed to exit chama" });
  }
};

// ============================================
// REQUEST CHAMA DELETION - Owner requests deletion
// ============================================
export const requestChamaDeletion = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user?.id;

    console.log("🗑️ REQUEST CHAMA DELETION - ChamaId:", chamaId, "UserId:", userId);

    if (!userId) {
      console.log("❌ REQUEST CHAMA DELETION - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (Array.isArray(chamaId)) {
      return res.status(400).json({ error: "Invalid chama ID format" });
    }

    // Check if user is the owner
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      console.log("❌ REQUEST CHAMA DELETION - User is not a member");
      return res.status(404).json({ error: "You are not a member of this chama" });
    }

    if (membership.role !== "OWNER") {
      console.log("❌ REQUEST CHAMA DELETION - User is not the owner");
      return res.status(403).json({ error: "Only the owner can request chama deletion" });
    }

    // Check if chama exists
    const chama = await prisma.chama.findUnique({
      where: { id: chamaId },
    });

    if (!chama) {
      console.log("❌ REQUEST CHAMA DELETION - Chama not found");
      return res.status(404).json({ error: "Chama not found" });
    }

    // Check if a deletion request already exists
    const existingRequest = await prisma.chamaDeletionRequest.findUnique({
      where: { chamaId },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return res.status(400).json({ 
          error: "A deletion request is already pending. Waiting for Secretary approval." 
        });
      }
      if (existingRequest.status === "APPROVED") {
        return res.status(400).json({ 
          error: "This chama has already been approved for deletion. Please confirm deletion." 
        });
      }
      if (existingRequest.status === "REJECTED") {
        // ✅ ALLOW NEW REQUEST AFTER REJECTION - Delete the old rejected request
        console.log("🔄 REQUEST CHAMA DELETION - Previous request was rejected. Deleting and creating new request.");
        await prisma.chamaDeletionRequest.delete({
          where: { chamaId },
        });
        // Continue to create a new request below
      }
    }

    // Create deletion request
    const deletionRequest = await prisma.chamaDeletionRequest.create({
      data: {
        chamaId,
        requestedBy: userId,
        requestedAt: new Date(),
        status: "PENDING",
        ownerApproved: true,
        ownerApprovedAt: new Date(),
      },
    });

    console.log("✅ REQUEST CHAMA DELETION - Deletion request created:", deletionRequest.id);

    // Find secretary for notification
    const secretary = await prisma.membership.findFirst({
      where: {
        chamaId,
        role: "SECRETARY",
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

    // Log the action
    try {
      await prisma.auditLog.create({
        data: {
          chamaId,
          userId,
          action: "REQUEST_DELETE",
          entity: "CHAMA",
          entityId: chamaId,
          newValues: { status: "PENDING", requestedBy: userId },
          createdAt: new Date(),
        },
      });
    } catch (logError) {
      console.log("⚠️ Could not create audit log:", logError);
    }

    res.json({
      message: "Deletion request submitted. Waiting for Secretary approval.",
      request: deletionRequest,
      secretary: secretary || null,
    });
  } catch (error) {
    console.error("❌ REQUEST CHAMA DELETION - Error:", error);
    res.status(500).json({ error: "Failed to request chama deletion" });
  }
};

// ============================================
// APPROVE CHAMA DELETION - Secretary approves
// ============================================
export const approveChamaDeletion = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user?.id;

    console.log("✅ APPROVE CHAMA DELETION - ChamaId:", chamaId, "UserId:", userId);

    if (!userId) {
      console.log("❌ APPROVE CHAMA DELETION - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (Array.isArray(chamaId)) {
      return res.status(400).json({ error: "Invalid chama ID format" });
    }

    // Check if user is the secretary
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      console.log("❌ APPROVE CHAMA DELETION - User is not a member");
      return res.status(404).json({ error: "You are not a member of this chama" });
    }

    if (membership.role !== "SECRETARY") {
      console.log("❌ APPROVE CHAMA DELETION - User is not the secretary");
      return res.status(403).json({ error: "Only the secretary can approve chama deletion" });
    }

    // Check if deletion request exists
    const deletionRequest = await prisma.chamaDeletionRequest.findUnique({
      where: { chamaId },
    });

    if (!deletionRequest) {
      console.log("❌ APPROVE CHAMA DELETION - No deletion request found");
      return res.status(404).json({ error: "No deletion request found for this chama" });
    }

    if (deletionRequest.status !== "PENDING") {
      return res.status(400).json({ 
        error: `This request is already ${deletionRequest.status.toLowerCase()}` 
      });
    }

    // Update deletion request
    const updatedRequest = await prisma.chamaDeletionRequest.update({
      where: { chamaId },
      data: {
        status: "APPROVED",
        secretaryApproved: true,
        secretaryApprovedAt: new Date(),
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    console.log("✅ APPROVE CHAMA DELETION - Deletion approved:", updatedRequest.id);

    // Log the action
    await prisma.auditLog.create({
      data: {
        chamaId,
        userId,
        action: "APPROVE_DELETE",
        entity: "CHAMA",
        entityId: chamaId,
        newValues: { status: "APPROVED", approvedBy: userId },
        createdAt: new Date(),
      },
    });

    res.json({
      message: "Chama deletion approved. The chama is ready for deletion.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("❌ APPROVE CHAMA DELETION - Error:", error);
    res.status(500).json({ error: "Failed to approve chama deletion" });
  }
};

// ============================================
// REJECT CHAMA DELETION - Secretary rejects
// ============================================
export const rejectChamaDeletion = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    console.log("❌ REJECT CHAMA DELETION - ChamaId:", chamaId, "UserId:", userId);

    if (!userId) {
      console.log("❌ REJECT CHAMA DELETION - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (Array.isArray(chamaId)) {
      return res.status(400).json({ error: "Invalid chama ID format" });
    }

    // Check if user is the secretary
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      console.log("❌ REJECT CHAMA DELETION - User is not a member");
      return res.status(404).json({ error: "You are not a member of this chama" });
    }

    if (membership.role !== "SECRETARY") {
      console.log("❌ REJECT CHAMA DELETION - User is not the secretary");
      return res.status(403).json({ error: "Only the secretary can reject chama deletion" });
    }

    // Check if deletion request exists
    const deletionRequest = await prisma.chamaDeletionRequest.findUnique({
      where: { chamaId },
    });

    if (!deletionRequest) {
      console.log("❌ REJECT CHAMA DELETION - No deletion request found");
      return res.status(404).json({ error: "No deletion request found for this chama" });
    }

    if (deletionRequest.status !== "PENDING") {
      return res.status(400).json({ 
        error: `This request is already ${deletionRequest.status.toLowerCase()}` 
      });
    }

    // Update deletion request
    const updatedRequest = await prisma.chamaDeletionRequest.update({
      where: { chamaId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason || "No reason provided",
      },
    });

    console.log("❌ REJECT CHAMA DELETION - Deletion rejected:", updatedRequest.id);

    // Log the action
    await prisma.auditLog.create({
      data: {
        chamaId,
        userId,
        action: "REJECT_DELETE",
        entity: "CHAMA",
        entityId: chamaId,
        newValues: { status: "REJECTED", rejectedBy: userId, reason: reason || "No reason provided" },
        createdAt: new Date(),
      },
    });

    res.json({
      message: "Chama deletion rejected",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("❌ REJECT CHAMA DELETION - Error:", error);
    res.status(500).json({ error: "Failed to reject chama deletion" });
  }
};

// ============================================
// CONFIRM CHAMA DELETION - Execute deletion after both approvals
// ============================================
export const confirmChamaDeletion = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user?.id;

    console.log("🗑️ CONFIRM CHAMA DELETION - ChamaId:", chamaId, "UserId:", userId);

    if (!userId) {
      console.log("❌ CONFIRM CHAMA DELETION - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (Array.isArray(chamaId)) {
      return res.status(400).json({ error: "Invalid chama ID format" });
    }

    // Check if user is the owner or secretary
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      console.log("❌ CONFIRM CHAMA DELETION - User is not a member");
      return res.status(404).json({ error: "You are not a member of this chama" });
    }

    if (membership.role !== "OWNER" && membership.role !== "SECRETARY") {
      console.log("❌ CONFIRM CHAMA DELETION - User is not owner or secretary");
      return res.status(403).json({ error: "Only owner or secretary can confirm chama deletion" });
    }

    // Check if deletion request exists and is approved
    const deletionRequest = await prisma.chamaDeletionRequest.findUnique({
      where: { chamaId },
    });

    if (!deletionRequest) {
      console.log("❌ CONFIRM CHAMA DELETION - No deletion request found");
      return res.status(404).json({ error: "No deletion request found for this chama" });
    }

    if (deletionRequest.status !== "APPROVED") {
      return res.status(400).json({ 
        error: "Chama deletion has not been approved yet. Both owner and secretary must approve." 
      });
    }

    // Delete all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all memberships
      await tx.membership.deleteMany({
        where: { chamaId },
      });

      // Delete all contributions
      await tx.contribution.deleteMany({
        where: { chamaId },
      });

      // Delete all loans and their repayments
      const loans = await tx.loan.findMany({
        where: { chamaId },
        select: { id: true },
      });
      
      for (const loan of loans) {
        await tx.loanRepayment.deleteMany({
          where: { loanId: loan.id },
        });
      }
      
      await tx.loan.deleteMany({
        where: { chamaId },
      });

      // Delete all meetings
      await tx.meeting.deleteMany({
        where: { chamaId },
      });

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { chamaId },
      });

      // Delete deletion request
      await tx.chamaDeletionRequest.delete({
        where: { chamaId },
      });

      // Finally, delete the chama
      await tx.chama.delete({
        where: { id: chamaId },
      });
    });

    console.log("✅ CONFIRM CHAMA DELETION - Chama deleted successfully");

    res.json({
      message: "Chama deleted successfully",
    });
  } catch (error) {
    console.error("❌ CONFIRM CHAMA DELETION - Error:", error);
    res.status(500).json({ error: "Failed to delete chama" });
  }
};

// ============================================
// GET DELETION REQUEST STATUS
// ============================================
export const getDeletionRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId } = req.params;
    const userId = req.user?.id;

    console.log("📋 GET DELETION REQUEST STATUS - ChamaId:", chamaId);

    if (!userId) {
      console.log("❌ GET DELETION REQUEST STATUS - No userId found");
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (Array.isArray(chamaId)) {
      return res.status(400).json({ error: "Invalid chama ID format" });
    }

    // Check if user is a member
    const membership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!membership) {
      console.log("❌ GET DELETION REQUEST STATUS - User is not a member");
      return res.status(404).json({ error: "You are not a member of this chama" });
    }

    const deletionRequest = await prisma.chamaDeletionRequest.findUnique({
      where: { chamaId },
    });

    if (!deletionRequest) {
      return res.json({ 
        exists: false,
        message: "No deletion request found for this chama" 
      });
    }

    res.json({
      exists: true,
      request: deletionRequest,
    });
  } catch (error) {
    console.error("❌ GET DELETION REQUEST STATUS - Error:", error);
    res.status(500).json({ error: "Failed to get deletion request status" });
  }
};