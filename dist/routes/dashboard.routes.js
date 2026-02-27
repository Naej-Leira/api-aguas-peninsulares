import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";
const router = Router();
router.use(auth);
/**
 * ✅ ADMIN: resumen general
 */
router.get("/admin", requireRole("ADMIN"), async (_req, res) => {
    try {
        const [[clientes]] = await pool.query("SELECT COUNT(*) AS total FROM clientes");
        const [[productos]] = await pool.query("SELECT COUNT(*) AS total FROM productos");
        // Facturas de HOY (no anuladas)
        const [[facturasHoy]] = await pool.query("SELECT COUNT(*) AS total FROM facturas WHERE DATE(fecha) = CURDATE() AND estado <> 'ANULADA'");
        const [[ventasHoy]] = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM facturas WHERE DATE(fecha) = CURDATE() AND estado <> 'ANULADA'");
        // Por cobrar (si estado es null o no PAGADO/CANCELADO)
        const [[porCobrar]] = await pool.query(`
      SELECT COALESCE(SUM(valor),0) AS total
      FROM cuentas_por_cobrar
      WHERE estado IS NULL OR estado NOT IN ('PAGADO','CANCELADO')
      `);
        // Ingresos de HOY
        const [[ingresosHoy]] = await pool.query("SELECT COALESCE(SUM(monto),0) AS total FROM ingresos WHERE DATE(fecha) = CURDATE()");
        // Stock planta (sum stock de inventario_ubicacion en PLANTA)
        const [[stockPlanta]] = await pool.query("SELECT COALESCE(SUM(stock),0) AS total FROM inventario_ubicacion WHERE ubicacion = 'PLANTA'");
        // Stock camiones (sum cantidad de stock_camion)
        const [[stockCamiones]] = await pool.query("SELECT COALESCE(SUM(cantidad),0) AS total FROM stock_camion");
        // Transferencias HOY
        const [[transferenciasHoy]] = await pool.query("SELECT COUNT(*) AS total FROM transferencias WHERE DATE(fecha) = CURDATE()");
        // Devoluciones HOY
        const [[devolucionesHoy]] = await pool.query("SELECT COUNT(*) AS total FROM devoluciones_camion WHERE DATE(fecha) = CURDATE()");
        return res.json({
            clientes_total: Number(clientes.total),
            productos_total: Number(productos.total),
            facturas_hoy: Number(facturasHoy.total),
            ventas_hoy: Number(ventasHoy.total),
            por_cobrar: Number(porCobrar.total),
            ingresos_hoy: Number(ingresosHoy.total),
            stock_planta_total: Number(stockPlanta.total),
            stock_camiones_total: Number(stockCamiones.total),
            transferencias_hoy: Number(transferenciasHoy.total),
            devoluciones_hoy: Number(devolucionesHoy.total),
        });
    }
    catch (err) {
        console.error("❌ Error /dashboard/admin:", err?.message, err);
        return res.status(500).json({ message: "Error en dashboard admin", error: err?.message });
    }
});
/**
 * ✅ CAMION: resumen camión
 * Usa:
 * - req.user.camion_id (lo tienes en usuarios)
 * - req.user.id (tu middleware auth normalmente lo pone)
 */
router.get("/camion", requireRole("CAMION"), async (req, res) => {
    try {
        const camionId = req.user?.camion_id;
        const userId = req.user?.id;
        if (!camionId) {
            return res.status(400).json({ message: "Usuario CAMION sin camion_id" });
        }
        if (!userId) {
            return res.status(400).json({ message: "Token sin userId (req.user.id)" });
        }
        // Inventario (registros) del camión (inventario_camion)
        const [[inventario]] = await pool.query("SELECT COUNT(*) AS items FROM inventario_camion");
        // Stock del camión (sum cantidad)
        const [[stockCamion]] = await pool.query("SELECT COALESCE(SUM(cantidad),0) AS total FROM stock_camion WHERE camion_id = ?", [camionId]);
        // Facturas del día hechas por este usuario (usuario_id en facturas)
        const [[facturasHoy]] = await pool.query("SELECT COUNT(*) AS total FROM facturas WHERE usuario_id = ? AND DATE(fecha) = CURDATE() AND estado <> 'ANULADA'", [userId]);
        const [[ventasHoy]] = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM facturas WHERE usuario_id = ? AND DATE(fecha) = CURDATE() AND estado <> 'ANULADA'", [userId]);
        // Caja del día (caja_camion.fecha es DATE)
        const [[cajaHoy]] = await pool.query("SELECT * FROM caja_camion WHERE usuario_id = ? AND fecha = CURDATE() ORDER BY id DESC LIMIT 1", [userId]);
        return res.json({
            camion_id: camionId,
            user_id: userId,
            inventario_items: Number(inventario.items),
            stock_camion_total: Number(stockCamion.total),
            facturas_hoy: Number(facturasHoy.total),
            ventas_hoy: Number(ventasHoy.total),
            caja_hoy: cajaHoy || null,
        });
    }
    catch (err) {
        console.error("❌ Error /dashboard/camion:", err?.message, err);
        return res.status(500).json({ message: "Error en dashboard camión", error: err?.message });
    }
});
/**
 * ✅ PLANTA: operación planta
 */
router.get("/planta", requireRole("PLANTA"), async (_req, res) => {
    try {
        // Stock planta total
        const [[stockPlanta]] = await pool.query("SELECT COALESCE(SUM(stock),0) AS total FROM inventario_ubicacion WHERE ubicacion = 'PLANTA'");
        // Movimientos hoy
        const [[movsHoy]] = await pool.query("SELECT COUNT(*) AS total FROM movimientos_stock WHERE DATE(fecha) = CURDATE()");
        // Transferencias hoy
        const [[transferenciasHoy]] = await pool.query("SELECT COUNT(*) AS total FROM transferencias WHERE DATE(fecha) = CURDATE()");
        // Devoluciones hoy
        const [[devolucionesHoy]] = await pool.query("SELECT COUNT(*) AS total FROM devoluciones_camion WHERE DATE(fecha) = CURDATE()");
        return res.json({
            stock_planta_total: Number(stockPlanta.total),
            movimientos_hoy: Number(movsHoy.total),
            transferencias_hoy: Number(transferenciasHoy.total),
            devoluciones_hoy: Number(devolucionesHoy.total),
        });
    }
    catch (err) {
        console.error("❌ Error /dashboard/planta:", err?.message, err);
        return res.status(500).json({ message: "Error en dashboard planta", error: err?.message });
    }
});
export default router;
