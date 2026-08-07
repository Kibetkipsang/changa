import { Router } from "express";
import { authenticate } from "../Middlewares/auth.js";
import { scheduleMeeting, getMeetings, getMeetingById, getUpcomingMeetings, updateMeeting, markAttendance, addMinutes, cancelMeeting, deleteMeeting, } from "../Controllers/meetingControllers.js";
const router = Router();
// All routes require authentication
router.use(authenticate);
// Specific routes (before params)
router.get("/upcoming/:chamaId", getUpcomingMeetings);
router.patch("/attendance/:chamaId/:meetingId", markAttendance);
router.patch("/minutes/:chamaId/:meetingId", addMinutes);
router.patch("/cancel/:chamaId/:meetingId", cancelMeeting);
// CRUD operations
router.post("/:chamaId", scheduleMeeting);
router.get("/:chamaId", getMeetings);
router.get("/:chamaId/:meetingId", getMeetingById);
router.put("/:chamaId/:meetingId", updateMeeting);
router.delete("/:chamaId/:meetingId", deleteMeeting);
export default router;
//# sourceMappingURL=meetingRoutes.js.map