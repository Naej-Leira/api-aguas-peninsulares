import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

function n(v: any, def = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : def;
}

// ✅ GET /facturas
export async function listarFacturas(_req: Request, res: Response) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id,
        numero_factura,
        usuario_id,
        id_cliente,
        tipo_pago,
        total,
        estado,
        fecha,
        pdf_url
       FROM facturas
       ORDER BY id DESC
       LIMIT 200`
    );
    return res.json(rows);
  } catch (e: any) {
    console.error("listarFacturas ERROR =>", e?.message, e);
    return res.status(500).json({ message: "Error listando facturas", error: e?.message });
  }
}

// ✅ GET /facturas/:id  (devuelve cabecera + items)
export async function obtenerFactura(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [fRows]: any = await pool.query(`SELECT * FROM facturas WHERE id = ?`, [id]);
    if (!fRows.length) return res.status(404).json({ message: "Factura no encontrada" });

    const [dRows] = await pool.query(
      `SELECT * 
       FROM detalle_factura 
       WHERE factura_id = ?
       ORDER BY id ASC`,
      [id]
    );

    return res.json({ ...fRows[0], items: dRows });
  } catch (e: any) {
    console.error("obtenerFactura ERROR =>", e?.message, e);
    return res.status(500).json({ message: "Error obteniendo factura", error: e?.message });
  }
}

// ✅ PUT /facturas/:id  (editar cabecera)
export async function actualizarFactura(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { estado, tipo_pago, id_cliente, fecha, total, numero_factura, usuario_id } = req.body ?? {};

    await pool.query(
      `UPDATE facturas
       SET 
         estado = COALESCE(?, estado),
         tipo_pago = COALESCE(?, tipo_pago),
         id_cliente = COALESCE(?, id_cliente),
         fecha = COALESCE(?, fecha),
         total = COALESCE(?, total),
         numero_factura = COALESCE(?, numero_factura),
         usuario_id = COALESCE(?, usuario_id)
       WHERE id = ?`,
      [
        estado ?? null,
        tipo_pago ?? null,
        id_cliente ?? null,
        fecha ?? null,
        total ?? null,
        numero_factura ?? null,
        usuario_id ?? null,
        id,
      ]
    );

    return res.json({ message: "ok" });
  } catch (e: any) {
    console.error("actualizarFactura ERROR =>", e?.message, e);
    return res.status(500).json({ message: "Error actualizando factura", error: e?.message });
  }
}

// ✅ PUT /facturas/:id/items  (reemplaza items y recalcula total)
export async function actualizarItemsFactura(req: Request, res: Response) {
  const { id } = req.params;
  const { items } = req.body ?? {};

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "items debe ser un array" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`DELETE FROM detalle_factura WHERE factura_id = ?`, [id]);

    let total = 0;

    for (const it of items) {
      const producto_id = n(it.producto_id);
      const cantidad = n(it.cantidad);
      const precio = n(it.precio);
      const subtotal = cantidad * precio;
      const ubicacion = it.ubicacion ?? "CAMION";

      total += subtotal;

      await conn.query(
        `INSERT INTO detalle_factura (factura_id, producto_id, cantidad, precio, subtotal, ubicacion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, producto_id, cantidad, precio, subtotal, ubicacion]
      );
    }

    await conn.query(`UPDATE facturas SET total = ? WHERE id = ?`, [total, id]);

    await conn.commit();
    return res.json({ message: "ok", total });
  } catch (e: any) {
    await conn.rollback();
    console.error("actualizarItemsFactura ERROR =>", e?.message, e);
    return res.status(500).json({ message: "Error actualizando items", error: e?.message });
  } finally {
    conn.release();
  }
}

// ✅ POST /facturas/:id/pdf  (sube PDF y guarda pdf_url)
export async function subirPdfFactura(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Falta el archivo PDF (campo: pdf)" });
    }

    // Verifica factura existe
    const [fRows]: any = await pool.query(`SELECT id FROM facturas WHERE id = ?`, [id]);
    if (!fRows.length) return res.status(404).json({ message: "Factura no encontrada" });

    // URL pública (porque servimos /uploads)
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const pdf_url = `${baseUrl}/uploads/facturas/${req.file.filename}`;

    await pool.query(`UPDATE facturas SET pdf_url = ? WHERE id = ?`, [pdf_url, id]);

    return res.json({ message: "PDF subido OK", pdf_url });
  } catch (e: any) {
    console.error("subirPdfFactura ERROR =>", e?.message, e);
    return res.status(500).json({ message: "Error subiendo PDF", error: e?.message });
  }
}