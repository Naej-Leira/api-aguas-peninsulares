import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { listarClientes } from "../controllers/clientes.controller.js";

const router = Router();

router.use(auth);
router.get("/", requireRole("ADMIN", "CAMION", "PLANTA"), listarClientes);

export default router;