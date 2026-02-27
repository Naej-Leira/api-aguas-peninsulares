import { pool } from "../db/pool.js";
/**
 * ✅ Registrar ubicación manual (cuando conductor presiona botón)
 */
export async function registrarUbicacion(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "No autenticado" });
        }
        const { latitud, longitud } = req.body;
        if (!latitud || !longitud) {
            return res.status(400).json({ message: "Latitud y longitud requeridas" });
        }
        const usuario_id = req.user.id;
        const camion_id = req.user.camion_id ?? null;
        const [result] = await pool.query(`
      INSERT INTO ubicacion_camion
      (usuario_id, camion_id, latitud, longitud, fecha)
      VALUES (?, ?, ?, ?, NOW())
      `, [usuario_id, camion_id, latitud, longitud]);
        return res.status(201).json({
            message: "Ubicación registrada",
            id: result.insertId
        });
    }
    catch (e) {
        console.error("registrarUbicacion ERROR =>", e?.message);
        return res.status(500).json({ message: "Error registrando ubicación" });
    }
}
/**
 * ✅ Listar ubicaciones del camión logueado
 */
export async function listarUbicaciones(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "No autenticado" });
        }
        const camion_id = req.user.camion_id;
        const [rows] = await pool.query(`
      SELECT *
      FROM ubicacion_camion
      WHERE camion_id = ?
      ORDER BY id DESC
      `, [camion_id]);
        return res.json(rows);
    }
    catch (e) {
        console.error("listarUbicaciones ERROR =>", e?.message);
        return res.status(500).json({ message: "Error listando ubicaciones" });
    }
}
