import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { registerComplaint, getMyComplaints, getComplaintDetails } from "../controllers/complaintController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/register",
  authenticate,
  upload.fields([{ name: "images" }, { name: "voice" }]),
  registerComplaint
);
router.get("/my-complaints", authenticate, getMyComplaints);
router.get("/:complaintId", authenticate, getComplaintDetails);

export default router;
