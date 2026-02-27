import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import {
  listarTransferencias,
  crearTransferencia
} from "../controllers/transferencias.controller.js";

const router = Router();

router.use(auth);

// Solo ADMIN y PLANTA pueden transferir
router.get("/", requireRole("ADMIN", "PLANTA","CAMION"), listarTransferencias);
router.post("/", requireRole("ADMIN", "PLANTA","CAMION"), crearTransferencia);

export default router;