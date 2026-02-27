import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { listarKardex } from "../controllers/kardex.controller.js";
const router = Router();
router.use(auth);
// ADMIN y PLANTA pueden ver kardex
router.get("/", requireRole("ADMIN", "PLANTA", "CAMION"), listarKardex);
export default router;
