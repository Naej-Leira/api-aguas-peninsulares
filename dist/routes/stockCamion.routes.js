import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { listarStock, guardarStock, eliminarStock } from "../controllers/stockCamion.controller.js";
const router = Router();
router.use(auth);
// Solo CAMION puede usarlo
router.get("/", requireRole("ADMIN", "PLANTA", "CAMION"), listarStock);
router.post("/", requireRole("ADMIN", "PLANTA", "CAMION"), guardarStock);
router.delete("/:id", requireRole("ADMIN", "PLANTA", "CAMION"), eliminarStock);
export default router;
