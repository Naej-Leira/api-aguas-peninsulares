import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

// ✅ GET /productos
export async function listarProductos(_req: Request, res: Response) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM productos ORDER BY id DESC`
    );
    return res.json(rows);
  } catch (e: any) {
    console.error("listarProductos ERROR =>", e?.message);
    return res.status(500).json({ message: "Error listando productos" });
  }
}

// ✅ GET /productos/:id
export async function obtenerProducto(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [rows]: any = await pool.query(
      `SELECT * FROM productos WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.json(rows[0]);
  } catch (e: any) {
    console.error("obtenerProducto ERROR =>", e?.message);
    return res.status(500).json({ message: "Error obteniendo producto" });
  }
}

// ✅ POST /productos  (solo ADMIN)
// ✅ POST
export async function crearProducto(req: Request, res: Response) {
  try {
    const { nombre, precio, stock } = req.body;

    const [result]: any = await pool.query(
      `INSERT INTO productos (nombre, precio, stock)
       VALUES (?, ?, ?)`,
      [nombre, precio, stock]
    );

    return res.status(201).json({ message: "Producto creado", id: result.insertId });
  } catch (e: any) {
    console.error("crearProducto ERROR =>", e?.message);
    return res.status(500).json({ message: "Error creando producto" });
  }
}

// ✅ PUT /productos/:id  (solo ADMIN)
// ✅ PUT
export async function actualizarProducto(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, precio, stock } = req.body;

    await pool.query(
      `UPDATE productos
       SET nombre = ?, precio = ?, stock = ?
       WHERE id = ?`,
      [nombre, precio, stock, id]
    );

    return res.json({ message: "Producto actualizado" });
  } catch (e: any) {
    console.error("actualizarProducto ERROR =>", e?.message);
    return res.status(500).json({ message: "Error actualizando producto" });
  }
}

// ✅ DELETE /productos/:id  (solo ADMIN)
export async function eliminarProducto(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM productos WHERE id = ?`, [id]);

    return res.json({ message: "Producto eliminado" });
  } catch (e: any) {
    console.error("eliminarProducto ERROR =>", e?.message);
    return res.status(500).json({ message: "Error eliminando producto" });
  }
}