import { Router } from "express";
import { authenticate } from "../Middlewares/auth.js";
import { getAnalytics } from "../Controllers/analyticsController.js";
const router = Router();
router.get("/:chamaId", authenticate, getAnalytics);
export default router;
//# sourceMappingURL=analyticsRoutes.js.map