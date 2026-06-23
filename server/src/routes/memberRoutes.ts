import { Router } from "express";
import { authenticate } from "../Middlewares/auth.js";
import {
  updateMemberRole,
  removeMember,
} from "../Controllers/memberControllers.js";

const router = Router();

// Update member role
router.patch("/:chamaId/members/:memberId", authenticate, updateMemberRole);

// Remove member
router.delete("/:chamaId/members/:memberId", authenticate, removeMember);

export default router;