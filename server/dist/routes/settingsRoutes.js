// server/src/routes/settingsRoutes.ts
import { Router } from "express";
import { authenticate } from "../Middlewares/auth.js";
import { getSettings, saveSettings, getEffectiveSettings, validateLoanRequest, getContributionRules, } from "../Controllers/settingsControllers.js";
const router = Router();
router.get("/:chamaId", authenticate, getSettings);
router.post("/:chamaId", authenticate, saveSettings);
router.get("/effective/:chamaId", authenticate, getEffectiveSettings);
router.post("/validate-loan/:chamaId", authenticate, validateLoanRequest);
router.get("/contribution-rules/:chamaId", authenticate, getContributionRules);
export default router;
//# sourceMappingURL=settingsRoutes.js.map