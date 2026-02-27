import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { listarStockPlanta, guardarStockPlanta, eliminarStockPlanta } from "../controllers/stockPlanta.controller.js";
const router = Router();
router.use(auth);
// ADMIN y PLANTA pueden usarlo
router.get("/", requireRole("ADMIN", "PLANTA", "CAMION"), listarStockPlanta);
router.post("/", requireRole("ADMIN", "PLANTA", "CAMION"), guardarStockPlanta);
router.delete("/:id", requireRole("ADMIN", "PLANTA", "CAMION"), eliminarStockPlanta);
export default router;
