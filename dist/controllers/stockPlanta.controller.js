import { pool } from "../db/pool.js";
/**
 * ✅ Listar inventario planta
 */
export async function listarStockPlanta(_req, res) {
    try {
        const [rows] = await pool.query(`
      SELECT *
      FROM stock_insumos
      ORDER BY id DESC
      `);
        return res.json(rows);
    }
    catch (e) {
        console.error("listarStockPlanta ERROR =>", e?.message);
        return res.status(500).json({ message: "Error listando inventario planta" });
    }
}
/**
 * ✅ Crear o actualizar insumo
 */
export async function guardarStockPlanta(req, res) {
    try {
        const { insumo, cantidad, unidad, observacion } = req.body;
        if (!insumo || !cantidad || !unidad) {
            return res.status(400).json({ message: "Datos incompletos" });
        }
        // 🔥 Verificar si ya existe el insumo
        const [exist] = await pool.query(`SELECT id FROM stock_insumos WHERE insumo = ? LIMIT 1`, [insumo]);
        if (exist.length > 0) {
            // Si existe, sumamos cantidad
            await pool.query(`
        UPDATE stock_insumos
        SET cantidad = cantidad + ?
        WHERE insumo = ?
        `, [cantidad, insumo]);
            return res.json({ message: "Stock actualizado (sumado)" });
        }
        // Si no existe, insertamos
        await pool.query(`
      INSERT INTO stock_insumos (insumo, cantidad, unidad, observacion)
      VALUES (?, ?, ?, ?)
      `, [insumo, cantidad, unidad, observacion || null]);
        return res.status(201).json({ message: "Insumo agregado" });
    }
    catch (e) {
        console.error("guardarStockPlanta ERROR =>", e?.message);
        return res.status(500).json({ message: "Error guardando inventario" });
    }
}
/**
 * ✅ Eliminar insumo
 */
export async function eliminarStockPlanta(req, res) {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM stock_insumos WHERE id = ?`, [id]);
        return res.json({ message: "Eliminado" });
    }
    catch (e) {
        console.error("eliminarStockPlanta ERROR =>", e?.message);
        return res.status(500).json({ message: "Error eliminando" });
    }
}
