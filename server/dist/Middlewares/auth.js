import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
const JWT_SECRET = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET_KEY is not defined");
}
export const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({
                error: "Authentication required",
            });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded !== "object" ||
            decoded === null ||
            !("userId" in decoded)) {
            return res.status(401).json({
                error: "Invalid token",
            });
        }
        const payload = decoded;
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        });
        if (!user) {
            return res.status(401).json({
                error: "User not found",
            });
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Token expired" });
        }
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: "Invalid token" });
        }
        console.error("Authentication Error:", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
};
//# sourceMappingURL=auth.js.map