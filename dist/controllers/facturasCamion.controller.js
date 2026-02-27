import { pool } from "../db/pool.js";
/**
 * ✅ Listar solo facturas con productos en CAMION
 */
export async function listarFacturasCamion(_req, res) {
    try {
        const [rows] = await pool.query(`
      SELECT DISTINCT f.*
      FROM facturas f
      WHERE EXISTS (
        SELECT 1
        FROM detalle_factura d
        WHERE d.factura_id = f.id
        AND d.ubicacion = 'CAMION'
      )
      ORDER BY f.id DESC
      `);
        return res.json(rows);
    }
    catch (e) {
        console.error("listarFacturasCamion ERROR =>", e?.message);
        return res.status(500).json({ message: "Error listando facturas camion" });
    }
}
/**
 * ✅ Ver detalle de factura
 */
export async function obtenerFacturaCamion(req, res) {
    try {
        const { id } = req.params;
        const [fRows] = await pool.query(`SELECT * FROM facturas WHERE id = ?`, [id]);
        if (!fRows.length) {
            return res.status(404).json({ message: "Factura no encontrada" });
        }
        const [dRows] = await pool.query(`
      SELECT *
      FROM detalle_factura
      WHERE factura_id = ?
      AND ubicacion = 'CAMION'
      `, [id]);
        return res.json({
            ...fRows[0],
            items: dRows
        });
    }
    catch (e) {
        console.error("obtenerFacturaCamion ERROR =>", e?.message);
        return res.status(500).json({ message: "Error obteniendo factura" });
    }
}
