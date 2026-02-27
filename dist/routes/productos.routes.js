import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { listarProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto, } from "../controllers/productos.controller.js";
const router = Router();
router.use(auth);
// 🔓 TODOS pueden ver
router.get("/", requireRole("ADMIN", "CAMION", "PLANTA"), listarProductos);
router.get("/:id", requireRole("ADMIN", "CAMION", "PLANTA"), obtenerProducto);
// 🔒 SOLO ADMIN edita
router.post("/", requireRole("ADMIN"), crearProducto);
router.put("/:id", requireRole("ADMIN"), actualizarProducto);
router.delete("/:id", requireRole("ADMIN"), eliminarProducto);
export default router;
