import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { validateBody } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(1),
  fathersName: z.string().min(1),
  mothersName: z.string().min(1),
  phone: z.string().min(10).max(10),
  pin: z.string().min(4).max(4),
  districtId: z.number(),
  mandalId: z.number(),
  gramPanchayatId: z.number(),
});

const loginSchema = z.object({
  phone: z.string().min(10).max(10),
  pin: z.string().min(4).max(4),
});

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

export default router;
