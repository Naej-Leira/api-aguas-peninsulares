import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

/**
 * ✅ Listar stock del camión logueado
 */
export async function listarStock(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const camion_id = req.user.camion_id;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM stock_camion
      WHERE camion_id = ?
      ORDER BY id DESC
      `,
      [camion_id]
    );

    return res.json(rows);

  } catch (e: any) {
    console.error("listarStock ERROR =>", e?.message);
    return res.status(500).json({ message: "Error listando stock" });
  }
}

/**
 * ✅ Agregar o actualizar stock
 */
export async function guardarStock(req: Request, res: Response) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const camion_id = req.user.camion_id;
    const { producto_id, cantidad } = req.body;

    if (!producto_id || !cantidad) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // 🔥 Verificar si ya existe ese producto en el camión
    const [exist]: any = await pool.query(
      `
      SELECT id, cantidad
      FROM stock_camion
      WHERE camion_id = ? AND producto_id = ?
      LIMIT 1
      `,
      [camion_id, producto_id]
    );

    if (exist.length > 0) {
      // 🔥 Si existe, sumamos
      await pool.query(
        `
        UPDATE stock_camion
        SET cantidad = cantidad + ?
        WHERE camion_id = ? AND producto_id = ?
        `,
        [cantidad, camion_id, producto_id]
      );

      return res.json({ message: "Stock actualizado (sumado)" });
    }

    // 🔥 Si no existe, insertamos
    await pool.query(
      `
      INSERT INTO stock_camion (camion_id, producto_id, cantidad)
      VALUES (?, ?, ?)
      `,
      [camion_id, producto_id, cantidad]
    );

    return res.status(201).json({ message: "Stock agregado" });

  } catch (e: any) {
    console.error("guardarStock ERROR =>", e?.message);
    return res.status(500).json({ message: "Error guardando stock" });
  }
}

/**
 * ✅ Eliminar registro
 */
export async function eliminarStock(req: Request, res: Response) {
  try {

    const { id } = req.params;

    await pool.query(
      `DELETE FROM stock_camion WHERE id = ?`,
      [id]
    );

    return res.json({ message: "Eliminado" });

  } catch (e: any) {
    console.error("eliminarStock ERROR =>", e?.message);
    return res.status(500).json({ message: "Error eliminando" });
  }
}