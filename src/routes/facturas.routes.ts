import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import {
  listarFacturas,
  obtenerFactura,
  actualizarFactura,
  actualizarItemsFactura,
  subirPdfFactura,
} from "../controllers/facturas.controller.js";
import { uploadPdf } from "../middlewares/uploadPdf.js";

const router = Router();

router.use(auth);

// ✅ ver/listar: todos
router.get("/", requireRole("ADMIN", "CAMION", "PLANTA"), listarFacturas);
router.get("/:id", requireRole("ADMIN", "CAMION", "PLANTA"), obtenerFactura);

// ✅ editar: ADMIN
router.put("/:id", requireRole("ADMIN"), actualizarFactura);
router.put("/:id/items", requireRole("ADMIN"), actualizarItemsFactura);

// ✅ subir PDF: ADMIN (si quieres permitir CAMION/PLANTA agrégalos aquí)
router.post("/:id/pdf", requireRole("ADMIN"), uploadPdf.single("pdf"), subirPdfFactura);

export default router;