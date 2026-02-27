import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

export async function listarKardex(req: Request, res: Response) {
  try {

    const producto_id = Number(req.query.producto_id);

    if (!producto_id || isNaN(producto_id)) {
      return res.status(400).json({ message: "producto_id inválido" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        'TRANSFERENCIA' as tipo,
        t.producto_id,
        t.cantidad,
        t.fecha,
        t.origen,
        t.destino
      FROM transferencias t
      WHERE t.producto_id = ?

      UNION ALL

      SELECT
        'DEVOLUCION' as tipo,
        d.producto_id,
        d.cantidad,
        d.fecha,
        'CAMION' as origen,
        'PLANTA' as destino
      FROM devoluciones_camion d
      WHERE d.producto_id = ?

      ORDER BY fecha DESC
      `,
      [producto_id, producto_id]
    );

    return res.json(rows);

  } catch (e: any) {
    console.error("listarKardex ERROR =>", e?.message);
    return res.status(500).json({ message: "Error listando kardex" });
  }
}