import { Router } from "express";
import { createChama, joinChama, getChamaById, getMyChamas } from "../Controllers/ChamaControllers.js";
import { authenticate } from "../Middlewares/auth.ts";

const router = Router();

router.post("/", authenticate, createChama);
router.post("/join", authenticate, joinChama);
router.get("/", authenticate, getMyChamas);
router.get("/:id", authenticate, getChamaById)

export default router;