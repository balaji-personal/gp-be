import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { getUsers } from "../controllers/userController.js";

const router = Router();

router.get("/", authenticate, authorize(["ADMIN"]), getUsers);

export default router;
