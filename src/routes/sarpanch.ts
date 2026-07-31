import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { addVillager, getVillageComplaints, updateComplaintStatus } from "../controllers/sarpanchController.js";

const router = Router();

router.post("/villagers", authenticate, authorize(["SARPANCH"]), addVillager);
router.get("/complaints", authenticate, authorize(["SARPANCH"]), getVillageComplaints);
router.put("/complaints/:complaintId/status", authenticate, authorize(["SARPANCH"]), updateComplaintStatus);

export default router;
