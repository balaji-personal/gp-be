import { Router } from "express";
import { getDistricts, getMandals, getGramPanchayats } from "../controllers/locationController";

const router = Router();

router.get("/districts", getDistricts);
router.get("/mandals", getMandals);
router.get("/gps", getGramPanchayats);

export default router;
