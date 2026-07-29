import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { addVillager, getVillageComplaints, updateComplaintStatus } from "../controllers/sarpanchController";

const router = Router();

router.post("/villagers", authenticate, authorize(["SARPANCH"]), addVillager);
router.get("/complaints", authenticate, authorize(["SARPANCH"]), getVillageComplaints);
router.put("/complaints/:complaintId/status", authenticate, authorize(["SARPANCH"]), updateComplaintStatus);

export default router;
