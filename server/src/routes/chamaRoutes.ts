import { Router } from "express";
import {
  createChama,
  joinChama,
  getChamaById,
  getMyChamas,
  exitChama,
  requestChamaDeletion,
  approveChamaDeletion,
  rejectChamaDeletion,
  confirmChamaDeletion,
  getDeletionRequestStatus,
} from "../Controllers/ChamaControllers.js";
import { authenticate } from "../Middlewares/auth.ts";

const router = Router();

router.post("/", authenticate, createChama);
router.post("/join", authenticate, joinChama);
router.get("/", authenticate, getMyChamas);
router.get("/:id", authenticate, getChamaById);
router.delete("/:chamaId/exit", authenticate, exitChama);

// Delete chama with dual approval (Owner + Secretary)
router.post("/:chamaId/delete/request", authenticate, requestChamaDeletion);
router.patch("/:chamaId/delete/approve", authenticate, approveChamaDeletion);
router.patch("/:chamaId/delete/reject", authenticate, rejectChamaDeletion);
router.delete("/:chamaId/delete/confirm", authenticate, confirmChamaDeletion);
router.get("/:chamaId/delete/status", authenticate, getDeletionRequestStatus);

export default router;
