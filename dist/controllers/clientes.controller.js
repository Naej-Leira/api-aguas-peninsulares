import { pool } from "../db/pool.js";
export async function listarClientes(_req, res) {
    try {
        const [rows] = await pool.query(`SELECT 
        id_cliente AS id,
        nombre,
        cedula_ruc,
        telefono,
        direccion,
        email,
        estado
      FROM clientes
      ORDER BY nombre ASC`);
        return res.json(rows);
    }
    catch (e) {
        console.error("listarClientes ERROR =>", e?.message, e);
        return res.status(500).json({ message: "Error listando clientes", error: e?.message });
    }
}
