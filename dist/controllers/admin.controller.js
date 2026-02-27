import { pool } from "../db/pool.js";
/**
 * ✅ Convierte params/query a string seguro (evita string|string[])
 */
function p(v) {
    return Array.isArray(v) ? String(v[0]) : String(v);
}
function q(v, def) {
    const s = p(v);
    return s === "undefined" || s === "null" || s === "" ? def : s;
}
function n(v, def) {
    const x = Number(v);
    return Number.isFinite(x) ? x : def;
}
/**
 * ✅ Lista BLANCA de tablas permitidas
 * (pon aquí las tablas reales de tu BD)
 */
const ALLOWED_TABLES = [
    "abonos_cliente",
    "caja_camion",
    "camiones",
    "clientes",
    "consumo_combustible",
    "cuentas_por_cobrar",
    "detalle_factura",
    "devoluciones_camion",
    "facturas",
    "ingresos",
    "inventario_botellones",
    "inventario_botellones_movimientos",
    "inventario_camion",
    "inventario_ubicacion",
    "kardex",
    "movimientos_stock",
    "productos",
    "stock_camion",
    "stock_insumos",
    "transferencias",
    "ubicacion_camion",
    "usuarios",
];
function isAllowedTable(t) {
    return ALLOWED_TABLES.includes(t);
}
async function getPrimaryKeyColumn(table) {
    const [rows] = await pool.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = 'PRIMARY'
    LIMIT 1
    `, [table]);
    if (!rows?.length)
        return "id"; // fallback
    return rows[0].COLUMN_NAME;
}
async function getTableColumns(table) {
    const [rows] = await pool.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `, [table]);
    return (rows || []).map((r) => r.COLUMN_NAME);
}
// ✅ GET /admin/tables
export async function adminListTables(_req, res) {
    return res.json({ tables: ALLOWED_TABLES });
}
// ✅ GET /admin/:table?limit=200&offset=0&order=desc
export async function adminList(req, res) {
    try {
        const table = p(req.params.table);
        if (!isAllowedTable(table)) {
            return res.status(400).json({ message: "Tabla no permitida" });
        }
        const limit = Math.min(n(q(req.query.limit, "200"), 200), 500);
        const offset = Math.max(n(q(req.query.offset, "0"), 0), 0);
        const orderRaw = q(req.query.order, "desc").toLowerCase();
        const order = orderRaw === "asc" ? "ASC" : "DESC";
        const pk = await getPrimaryKeyColumn(table);
        const [rows] = await pool.query(`SELECT * FROM \`${table}\` ORDER BY \`${pk}\` ${order} LIMIT ? OFFSET ?`, [limit, offset]);
        return res.json(rows);
    }
    catch (e) {
        console.error("adminList ERROR =>", e?.message, e);
        return res.status(500).json({ message: "Error listando", error: e?.message });
    }
}
// ✅ GET /admin/:table/:id
export async function adminGetOne(req, res) {
    try {
        const table = p(req.params.table);
        const id = p(req.params.id);
        if (!isAllowedTable(table)) {
            return res.status(400).json({ message: "Tabla no permitida" });
        }
        const pk = await getPrimaryKeyColumn(table);
        const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE \`${pk}\` = ? LIMIT 1`, [id]);
        if (!rows?.length)
            return res.status(404).json({ message: "No encontrado" });
        return res.json(rows[0]);
    }
    catch (e) {
        console.error("adminGetOne ERROR =>", e?.message, e);
        return res.status(500).json({ message: "Error obteniendo", error: e?.message });
    }
}
// ✅ POST /admin/:table  body: { col: value, ... }
export async function adminCreate(req, res) {
    try {
        const table = p(req.params.table);
        if (!isAllowedTable(table)) {
            return res.status(400).json({ message: "Tabla no permitida" });
        }
        const body = req.body ?? {};
        if (typeof body !== "object" || Array.isArray(body) || body === null) {
            return res.status(400).json({ message: "Body inválido (debe ser objeto JSON)" });
        }
        const cols = await getTableColumns(table);
        const pk = await getPrimaryKeyColumn(table);
        // solo columnas válidas, y evitamos meter PK
        const keys = Object.keys(body).filter((k) => cols.includes(k) && k !== pk);
        if (!keys.length) {
            return res.status(400).json({ message: "No hay campos válidos para insertar" });
        }
        const placeholders = keys.map(() => "?").join(", ");
        const colNames = keys.map((k) => `\`${k}\``).join(", ");
        const values = keys.map((k) => body[k]);
        const [result] = await pool.query(`INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`, values);
        return res.status(201).json({ message: "creado", insertId: result?.insertId ?? null });
    }
    catch (e) {
        console.error("adminCreate ERROR =>", e?.message, e);
        return res.status(500).json({ message: "Error creando", error: e?.message });
    }
}
// ✅ PUT /admin/:table/:id  body: { col: value, ... }
export async function adminUpdate(req, res) {
    try {
        const table = p(req.params.table);
        const id = p(req.params.id);
        if (!isAllowedTable(table)) {
            return res.status(400).json({ message: "Tabla no permitida" });
        }
        const body = req.body ?? {};
        if (typeof body !== "object" || Array.isArray(body) || body === null) {
            return res.status(400).json({ message: "Body inválido (debe ser objeto JSON)" });
        }
        const cols = await getTableColumns(table);
        const pk = await getPrimaryKeyColumn(table);
        // solo columnas válidas, no se actualiza PK
        const keys = Object.keys(body).filter((k) => cols.includes(k) && k !== pk);
        if (!keys.length) {
            return res.status(400).json({ message: "No hay campos válidos para actualizar" });
        }
        const sets = keys.map((k) => `\`${k}\` = ?`).join(", ");
        const values = keys.map((k) => body[k]);
        const [result] = await pool.query(`UPDATE \`${table}\` SET ${sets} WHERE \`${pk}\` = ?`, [...values, id]);
        if (result?.affectedRows === 0)
            return res.status(404).json({ message: "No encontrado" });
        return res.json({ message: "actualizado" });
    }
    catch (e) {
        console.error("adminUpdate ERROR =>", e?.message, e);
        return res.status(500).json({ message: "Error actualizando", error: e?.message });
    }
}
// ✅ DELETE /admin/:table/:id
export async function adminDelete(req, res) {
    try {
        const table = p(req.params.table);
        const id = p(req.params.id);
        if (!isAllowedTable(table)) {
            return res.status(400).json({ message: "Tabla no permitida" });
        }
        const pk = await getPrimaryKeyColumn(table);
        const [result] = await pool.query(`DELETE FROM \`${table}\` WHERE \`${pk}\` = ?`, [id]);
        if (result?.affectedRows === 0)
            return res.status(404).json({ message: "No encontrado" });
        return res.json({ message: "eliminado" });
    }
    catch (e) {
        console.error("adminDelete ERROR =>", e?.message, e);
        return res.status(500).json({ message: "Error eliminando", error: e?.message });
    }
}
