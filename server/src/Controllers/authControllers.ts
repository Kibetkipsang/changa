import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../types/express.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET_KEY
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET_KEY is not defined");
}

export const register = async (req: AuthRequest, res: Response) => {
    try{
        const {name, email, password, phone} = req.body;
        // validate inputs
        if(!name || !email || !password){
            return res.status(400).json({
                error: "Missing required fields..",
                required: ["name", "email", "password"]
            })
        }

        if(password.length < 6){
            return res.status(400).json({
                error: "Password must be at least 6 characters."
            })
        }

        // check if user exists
        const existingUser = await prisma.user.findUnique({
            where: {email}
        })

        if (existingUser){
            return res.status(409).json({
                error: "Email already in use."
            })
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email, 
                passwordHash: hashedPassword,
                phone,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true
            }
        })

        // generate jwt token
        const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' })
        res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
        res.status(201).json({
            success: true,
            message: "User created succesfully.",
            newUser,
        })
    }catch(error){
        console.error('Registration error:', error);
        res.status(500).json({
            error: "Internal server error."
        })
    }
}

export const login = async (req: AuthRequest, res: Response) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                error: "All fields are required."
            })
        }

        // check user
        const user = await prisma.user.findUnique({
            where: {email}
        })

        if(!user){
            return res.status(401).json({
                error: "Invalid credentials."
            })
        }

        // check password
        const isvalidPassword = await bcrypt.compare(password, user.passwordHash)
        if (!isvalidPassword){
            return res.sendStatus(401).json({
                error: "Invalid credentials."
            })
        }

        // generate token
        const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        res.status(200).json({
            success: true,
            message: "Login SUccessful.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
            }
        })
    }catch(error){
        console.log(error)
        res.status(500).json({
            error: "Internal server error."
        })
    }
}

export const getCurrentUser = async(req: AuthRequest, res: Response) => {
    try{
        res.json({
            success: true,
            user: req.user,
        })
    }catch(error){
        console.log(error)
        res.status(500).json({
            error: "Internal server error."
        })
    }
}

export const updateUser = async(req: AuthRequest, res: Response) => {
    try{
        const {name, phone} = req.body;
        const userId = req.user?.id

        if(!userId){
            return res.status(401).json({
                error: "Unauthorised."
            })
        }

        const updatedUser = await prisma.user.update({
            where: {id: userId}, 
            data: {
                name: name || undefined,
                phone: phone || undefined
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            }
        })

        res.status(200).json({
            success: true,
            message: "Profile updated succesfully.",
            user: updatedUser,
        })
    }catch(error){
        console.log(error)
        res.status(500).json({
            error: "Internal server error."
        })
    }
}

export const logout = async(req:AuthRequest, res: Response) => {
    try{
        res.clearCookie("token");
        res.status(200).json({
            message: "Logged out succesfully."
        })
    }catch(error){
        console.log(error)
        res.status(500).json({
            message: "Internal server error."
        })
    }
}