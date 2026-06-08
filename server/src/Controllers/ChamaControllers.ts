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
        console.log("📝 CREATE CHAMA - User from request:", req.user);
        console.log("📝 CREATE CHAMA - Body:", req.body);

        if (!userId) {
            console.log("❌ CREATE CHAMA - No userId found");
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        if (!name){
            console.log("❌ CREATE CHAMA - No name provided");
            return res.status(400).json({
                message: "Chama name is required!"
            })
        }

        const inviteCode = generateInviteCodes();
        console.log("🔑 CREATE CHAMA - Generated invite code:", inviteCode);

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
            console.log("✅ CREATE CHAMA - Created chama:", newChama.id, newChama.name);

            await tx.membership.create({
                data: {
                    userId,
                    chamaId: newChama.id,
                    role: "OWNER"
                },
            });
            console.log("✅ CREATE CHAMA - Added owner membership for user:", userId);
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
        console.error("❌ CREATE CHAMA - Error:", error);
        res.status(500).json({
            error: "Failed to create chama."
        })
    }
}

export const joinChama = async(req: AuthRequest, res: Response) => {
    try{
        const {inviteCode} = req.body;
        console.log("🔗 JOIN CHAMA - Request body:", req.body);
        
        if (!req.user?.id) {
            console.log("❌ JOIN CHAMA - No userId found");
            return res.status(401).json({ error: "Unauthorized" });
        }

        const userId = req.user.id;
        console.log("👤 JOIN CHAMA - UserId:", userId);

        if(!inviteCode){
            console.log("❌ JOIN CHAMA - No invite code provided");
            return res.status(400).json({
                message: "Invite code is required."
            })
        }

        // find chama by invite code
        const chama = await prisma.chama.findUnique({
            where: {
                inviteCode: inviteCode.toUpperCase()
            },
        })
        console.log("🔍 JOIN CHAMA - Found chama:", chama?.id, chama?.name);

        if(!chama){
            console.log("❌ JOIN CHAMA - Invalid invite code:", inviteCode);
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
        console.log("🔍 JOIN CHAMA - Existing membership:", existingMembership ? "Yes" : "No");

        if(existingMembership){
            console.log("❌ JOIN CHAMA - User already a member");
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
        console.log("✅ JOIN CHAMA - Added new member:", newMember.id);

        res.json({
            message: `Joined ${chama.name} successfully.`,
            chama: {
                id: chama.id,
                name: chama.name,
            },
        });
    }catch(error){
        console.error("❌ JOIN CHAMA - Error:", error);
        res.status(500).json({
            error: "Failed to join chama."
        })
    }
}

export const getMyChamas = async(req: AuthRequest, res: Response) => {
    try{
        const userId = req.user?.id
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
                            select: { id: true } // Minimal selection for counting
                        }
                    }
                }
            },
            orderBy: {
                joinedAt: "desc"
            }
        });  

        console.log("📊 GET MY CHAMAS - Found", memberships.length, "memberships");
        
        const chamas = memberships.map((membership) => {
            const memberCount = membership.chama.memberships.length;
            console.log(`📊 GET MY CHAMAS - Chama: ${membership.chama.name}, Member Count: ${memberCount}, Role: ${membership.role}`);
            
            return {
                id: membership.chama.id,
                name: membership.chama.name,
                description: membership.chama.description,
                role: membership.role,
                inviteCode: membership.role === "OWNER" ? membership.chama.inviteCode : null,
                contributionAmount: membership.chama.contributionAmount,
                frequency: membership.chama.frequency,
                memberCount: memberCount,
            };
        });

        console.log("✅ GET MY CHAMAS - Sending response with", chamas.length, "chamas");
        console.log("📤 GET MY CHAMAS - Response data:", JSON.stringify({ chamas }, null, 2));
        
        res.json({ chamas });

    } catch(error) {
        console.error("❌ GET MY CHAMAS - Error:", error);
        res.status(500).json({
            error: "Failed to get your Chamas."
        });
    }
}

export const getChamaById = async(req: AuthRequest, res: Response) => {
    try{
        const {id} = req.params;
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
        
        // check if user has access to this chama
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
            console.log("❌ GET CHAMA BY ID - Access denied for user:", userId, "to chama:", id);
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

        console.log(`✅ GET CHAMA BY ID - Sending chama: ${chama.name} with ${members.length} members`);

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
    } catch(error){
        console.error("❌ GET CHAMA BY ID - Error:", error);
        res.status(500).json({
            error: "Failed to fetch Chama."
        })
    }
}