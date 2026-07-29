import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getUsers } from "../controllers/userController";

const router = Router();

router.get("/", authenticate, authorize(["ADMIN"]), getUsers);

export default router;
