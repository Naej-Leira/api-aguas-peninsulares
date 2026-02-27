import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

/**
 * ✅ Registrar cierre del día
 */
export async function registrarCaja(req: Request, res: Response) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const usuario_id = req.user.id;

    const {
      total_ventas = 0,
      efectivo = 0,
      transferencia = 0,
      credito = 0,
      devoluciones = 0,
      fecha
    } = req.body ?? {};

    const fechaFinal = fecha || new Date().toISOString().split("T")[0];

    const total_entregar =
      Number(efectivo) +
      Number(transferencia) -
      Number(devoluciones);

    const [result]: any = await pool.query(
      `
      INSERT INTO caja_camion
      (usuario_id, fecha, total_ventas, efectivo, transferencia, credito, devoluciones, total_entregar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        usuario_id,
        fechaFinal,
        total_ventas,
        efectivo,
        transferencia,
        credito,
        devoluciones,
        total_entregar
      ]
    );

    return res.status(201).json({
      message: "Caja registrada",
      id: result.insertId
    });

  } catch (e: any) {
    console.error("registrarCaja ERROR =>", e?.message);
    return res.status(500).json({ message: "Error registrando caja" });
  }
}

/**
 * ✅ Listar solo cajas del usuario logueado
 */
export async function listarCaja(req: Request, res: Response) {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const usuario_id = req.user.id;

    const [rows] = await pool.query(
      `
      SELECT *
      FROM caja_camion
      WHERE usuario_id = ?
      ORDER BY id DESC
      `,
      [usuario_id]
    );

    return res.json(rows);

  } catch (e: any) {
    console.error("listarCaja ERROR =>", e?.message);
    return res.status(500).json({ message: "Error listando caja" });
  }
}