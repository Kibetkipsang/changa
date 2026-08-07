import { Router } from "express";
import { authenticate } from "../Middlewares/auth.js";
import { requestLoan, approveLoan, rejectLoan, activateLoan, recordRepayment, getRepaymentHistory, getLoans, getLoanById, deleteLoan, } from "../Controllers/loanControllers.js";
const router = Router();
// All routes require authentication
router.use(authenticate);
// Repayment routes (specific before params)
router.post("/repayment/:chamaId/:loanId", recordRepayment);
router.get("/repayment/:chamaId/:loanId", getRepaymentHistory);
// Loan management
router.post("/:chamaId", requestLoan);
router.get("/:chamaId", getLoans);
router.get("/:chamaId/:loanId", getLoanById);
router.delete("/:chamaId/:loanId", deleteLoan);
// Loan approval workflow
router.patch("/approve/:chamaId/:loanId", approveLoan);
router.patch("/reject/:chamaId/:loanId", rejectLoan);
router.patch("/activate/:chamaId/:loanId", activateLoan);
export default router;
//# sourceMappingURL=loanRoutes.js.map