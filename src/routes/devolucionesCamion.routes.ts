import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import {
  listarDevoluciones,
  crearDevolucion
} from "../controllers/devolucionesCamion.controller.js";

const router = Router();

router.use(auth);

// Solo CAMION puede devolver'
router.get("/", requireRole("CAMION","ADMIN","PLANTA"), listarDevoluciones);
router.post("/", requireRole("CAMION","ADMIN","PLANTA"), crearDevolucion);

export default router;