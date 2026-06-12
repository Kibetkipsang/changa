import { Router } from "express";
import { authenticate } from "../Middlewares/auth.ts";
import {
  recordContribution,
  getContributions,
  getContributionById,
  getMemberContributions,
  updateContribution,
  deleteContribution,
  getContributionStats,
} from "../Controllers/contributionControllers.ts";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Stats (before params routes)
router.get("/stats/:chamaId", getContributionStats);

// Member contributions (specific route before generic)
router.get("/member/:chamaId/:memberId", getMemberContributions);

// CRUD operations
router.post("/:chamaId", recordContribution);
router.get("/:chamaId", getContributions);
router.get("/:chamaId/:contributionId", getContributionById);
router.put("/:chamaId/:contributionId", updateContribution);
router.delete("/:chamaId/:contributionId", deleteContribution);

export default router;
