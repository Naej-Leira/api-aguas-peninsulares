import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { registrarUbicacion, listarUbicaciones } from "../controllers/ubicacion.controller.js";
const router = Router();
router.use(auth);
// SOLO CAMION puede registrar
router.post("/", requireRole("ADMIN", "PLANTA", "CAMION"), registrarUbicacion);
// ADMIN y CAMION pueden ver
router.get("/", requireRole("ADMIN", "PLANTA", "CAMION"), listarUbicaciones);
export default router;
