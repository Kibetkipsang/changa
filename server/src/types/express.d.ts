import { Request } from "express";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}
export interface AuthRequest extends Request {
  user?: AuthUser;
}
