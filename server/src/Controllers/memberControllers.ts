import { Request, Response } from "express";
import { AuthRequest } from "../types/express.js";
import { prisma } from "../lib/prisma.js";

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Ensure chamaId and memberId are strings
    if (Array.isArray(chamaId) || Array.isArray(memberId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Check if the current user is an admin (Owner or Treasurer)
    const currentUserMembership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!currentUserMembership) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (currentUserMembership.role !== "OWNER" && currentUserMembership.role !== "TREASURER") {
      return res.status(403).json({ error: "Only Owner or Treasurer can update member roles" });
    }

    // Check if the member exists in the chama
    const member = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: memberId,
          chamaId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found in this chama" });
    }

    // Cannot change owner's role
    if (member.role === "OWNER") {
      return res.status(403).json({ error: "Cannot change the role of the Owner" });
    }

    // Update the role
    const updatedMember = await prisma.membership.update({
      where: {
        userId_chamaId: {
          userId: memberId,
          chamaId,
        },
      },
      data: {
        role,
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

    res.json({
      message: "Member role updated successfully",
      member: updatedMember,
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    res.status(500).json({ error: "Failed to update member role" });
  }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { chamaId, memberId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Ensure chamaId and memberId are strings
    if (Array.isArray(chamaId) || Array.isArray(memberId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Check if the current user is an admin (Owner or Treasurer)
    const currentUserMembership = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId,
          chamaId,
        },
      },
    });

    if (!currentUserMembership) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (currentUserMembership.role !== "OWNER" && currentUserMembership.role !== "TREASURER") {
      return res.status(403).json({ error: "Only Owner or Treasurer can remove members" });
    }

    // Check if the member exists in the chama
    const member = await prisma.membership.findUnique({
      where: {
        userId_chamaId: {
          userId: memberId,
          chamaId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found in this chama" });
    }

    // Cannot remove the owner
    if (member.role === "OWNER") {
      return res.status(403).json({ error: "Cannot remove the Owner of the chama" });
    }

    // Get member details for logging
    const memberUser = await prisma.user.findUnique({
      where: { id: memberId },
      select: { name: true, email: true },
    });

    // Remove the member
    await prisma.membership.delete({
      where: {
        userId_chamaId: {
          userId: memberId,
          chamaId,
        },
      },
    });

    res.json({
      message: "Member removed successfully",
      member: {
        id: memberId,
        name: memberUser?.name,
        email: memberUser?.email,
        role: member.role,
      },
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
};