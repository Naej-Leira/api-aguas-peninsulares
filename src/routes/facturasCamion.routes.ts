import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import {
  listarFacturasCamion,
  obtenerFacturaCamion
} from "../controllers/facturascamion.controller.js";

const router = Router();

router.use(auth);

// ADMIN y CAMION pueden ver
router.get("/", requireRole("ADMIN", "PLANTA", "CAMION"), listarFacturasCamion);
router.get("/:id", requireRole("ADMIN", "PLANTA", "CAMION"), obtenerFacturaCamion);

export default router;