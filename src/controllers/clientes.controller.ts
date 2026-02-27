import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

export async function listarClientes(_req: Request, res: Response) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id_cliente AS id,
        nombre,
        cedula_ruc,
        telefono,
        direccion,
        email,
        estado
      FROM clientes
      ORDER BY nombre ASC`
    );
    return res.json(rows);
  } catch (e: any) {
    console.error("listarClientes ERROR =>", e?.message, e);
    return res.status(500).json({ message: "Error listando clientes", error: e?.message });
  }
}