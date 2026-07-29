import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  adminLogin,
  addSarpanch,
  changeUserStatus,
  getAnalytics,
  getAllComplaints,
  getSachivs,
  getVillages,
  addVillage,
} from "../controllers/adminController";

const router = Router();

// Public Admin Login
router.post("/login", adminLogin);

// Protected Admin Routes
router.get("/analytics", authenticate, authorize(["ADMIN"]), getAnalytics);
router.get("/complaints", authenticate, authorize(["ADMIN"]), getAllComplaints);
router.get("/sachivs", authenticate, authorize(["ADMIN"]), getSachivs);
router.post("/add-sarpanch", authenticate, authorize(["ADMIN"]), addSarpanch);
router.put("/users/:userId/status", authenticate, authorize(["ADMIN"]), changeUserStatus);
router.get("/villages", authenticate, authorize(["ADMIN"]), getVillages);
router.post("/villages", authenticate, authorize(["ADMIN"]), addVillage);

export default router;
