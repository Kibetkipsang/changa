import { Router } from "express";
import { createChama, joinChama, getChamaById, getMyChamas } from "../Controllers/ChamaControllers.js";

const router = Router();

router.post("/", createChama);
router.post("/join", joinChama);
router.get("/", getMyChamas);
router.get("/:id", getChamaById)

export default router;