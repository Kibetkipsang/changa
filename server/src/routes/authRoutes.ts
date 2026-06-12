import { Router } from "express";
import { authenticate } from "../Middlewares/auth.ts";
import {
  register,
  login,
  getCurrentUser,
  updateUser,
  logout,
} from "../Controllers/authControllers.ts";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.put("/update", authenticate, updateUser);
router.get("/me", authenticate, getCurrentUser);
router.post("/logout", authenticate, logout);

export default router;
