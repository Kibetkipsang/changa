import { Request, Response } from "express";
import { AuthRequest } from "../types/express.js";
import {prisma} from '../lib/prisma.ts'
import crypto from 'crypto';



function generateInviteCodes(): string {
    return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export const createChama = async (req: AuthRequest, res: Response) => {
    try{
        const {name, description, contributionAmount, frequency, penaltyAmount} = req.body;
        const userId = req.user?.id;

        if (!name){
            return res.status(400).json({
                message: "Chama name is required!"
            })
        }

        const inviteCode = generateInviteCodes();

        const chama = await prisma.$transaction(async(tx: any) => {
            const newChama = await tx.chama.create({
                data: {
                    name,
                    description,
                    contributionAmount: contributionAmount ? parseFloat(contributionAmount) : null,
                    frequency: frequency || "monthly",
                    penaltyAmount: penaltyAmount ? parseFloat(penaltyAmount) : null,
                    inviteCode,
                    createdBy: userId,
                },
            });

            await tx.membership.create({
                data: {
                    userId,
                    chamaId: newChama.id,
                    role: "OWNER"
                },
            });
            return newChama;
        })

        res.status(200).json({
            message: "Chama created successfully.",
            chama: {
                id: chama.id,
                name: chama.name,
                inviteCode: chama.inviteCode
            },
        });
    }catch(error){
        console.error(error);
        res.status(500).json({
            error: "Failed to create chama."
        })
    }
}

export const joinChama = async(req: AuthRequest, res: Response) => {
    try{
        const {inviteCode} = req.body;
        
        if (!req.user?.id) {
  return res.status(401).json({ error: "Unauthorized" });
}

const userId = req.user.id;

        if(!inviteCode){
            return res.status(200).json({
                message: "Invite code is required."
            })
        }

        // find chama by invite code
        const chama = await prisma.chama.findUnique({
            where: {
                inviteCode: inviteCode.toUpperCase()
            },
        })

        if(!chama){
            return res.status(404).json({
                message: "Invalid invite code."
            })
        }

        // check if an existing member
        
        const existingMembership = await prisma.membership.findUnique({
            where: {
                userId_chamaId : {
                    userId,
                    chamaId: chama.id,
                },
            },
        });

        if(existingMembership){
            return res.status(400).json({
                message: "You are already a member of this chama."
            })
        }

        //add member with role member

        const newMember = await prisma.membership.create({
            data: {
                userId,
                chamaId: chama.id,
                role: "MEMBER",
            }
        })

        res.json({
            message: `Joined ${chama.name} successfully.`,
            chama: {
                id: chama.id,
                name: chama.name,
            },
        });
    }catch(error){
        console.log(error)
        res.status(500).json({
            error: "Failed to join chama."
        })
    }
}

 export const getMyChamas = async(req: AuthRequest, res: Response) => {
    try{
        const userId = req.user?.id

        const memberships = await prisma.membership.findMany({
  where: {
    userId: userId!,
  },
  include: {
    chama: {
      select: {
        id: true,
        name: true,
        description: true,
        inviteCode: true,
        contributionAmount: true,
        frequency: true,
      },
    },
  },
  orderBy: {
    joinedAt: "desc",
  },
});
        const chamas = memberships.map((m:any) => ({
      id: m.chama.id,
      name: m.chama.name,
      description: m.chama.description,
      role: m.role,
      inviteCode: m.chama.inviteCode,
      contributionAmount: m.chama.contributionAmount,
      frequency: m.chama.frequency,
    }));

     res.json({chamas})

    }catch(error){
        console.log(error);
        res.status(500).json({
            error: "Failed to get your Chamas."
        });
    }
}

export const getChamaById = async(req: AuthRequest, res: Response) => {
    try{
        const {id} = req.params;
        if (Array.isArray(id)) {
  return res.status(400).json({ error: "Invalid ID format" });
}
        if (!req.user?.id) {
  return res.status(401).json({ error: "Unauthorized" });
}

const userId = req.user.id;
        
        // check if user has acces to this chama
        const membership = await prisma.membership.findUnique({
            where: {userId_chamaId : {
                userId,
                chamaId: id
            }},
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
                                        phone: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if(!membership){
            return res.status(403).json({
                error: "Access Denied."
            })
        }

        const chama = membership.chama;
    const members = chama.memberships.map((m:any) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

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
    }catch(error){
        console.log(error);
        res.status(500).json({
            error: "Failed to fetch Chama."
        })
    }
}