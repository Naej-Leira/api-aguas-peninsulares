import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { registrarCaja, listarCaja } from "../controllers/cajaCamion.controller.js";
const router = Router();
router.use(auth);
// SOLO CAMION puede registrar
router.post("/", requireRole("ADMIN", "PLANTA", "CAMION"), registrarCaja);
// CAMION y ADMIN pueden ver
router.get("/", requireRole("ADMIN", "PLANTA", "CAMION"), listarCaja);
export default router;
