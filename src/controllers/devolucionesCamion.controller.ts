import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

/**
 * ✅ Listar devoluciones del usuario logueado
 */
export async function listarDevoluciones(_req: Request, res: Response) {
  try {

    const [rows] = await pool.query(
      `
      SELECT *
      FROM devoluciones_camion
      ORDER BY id DESC
      `
    );

    return res.json(rows);

  } catch (e: any) {
    console.error("listarDevoluciones ERROR =>", e?.message);
    return res.status(500).json({ message: "Error listando devoluciones" });
  }
}

/**
 * ✅ Registrar devolución
 */
export async function crearDevolucion(req: Request, res: Response) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const usuario_id = req.user.id;
    const camion_id = req.user.camion_id;

    const { producto_id, cantidad } = req.body;

    if (!producto_id || !cantidad) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // 🔥 1️⃣ Verificar stock en camión
    const [stock]: any = await conn.query(
      `
      SELECT id, cantidad
      FROM stock_camion
      WHERE camion_id = ? AND producto_id = ?
      LIMIT 1
      `,
      [camion_id, producto_id]
    );

    if (!stock.length || stock[0].cantidad < cantidad) {
      await conn.rollback();
      return res.status(400).json({ message: "Stock insuficiente en camión" });
    }

    // 🔥 2️⃣ Restar en camión
    await conn.query(
      `
      UPDATE stock_camion
      SET cantidad = cantidad - ?
      WHERE camion_id = ? AND producto_id = ?
      `,
      [cantidad, camion_id, producto_id]
    );

    // 🔥 3️⃣ (Opcional) Sumar a planta
    await conn.query(
      `
      UPDATE stock_insumos
      SET cantidad = cantidad + ?
      WHERE id = ?
      `,
      [cantidad, producto_id]
    );

    // 🔥 4️⃣ Registrar devolución
    await conn.query(
      `
      INSERT INTO devoluciones_camion
      (producto_id, cantidad, fecha, usuario_id)
      VALUES (?, ?, NOW(), ?)
      `,
      [producto_id, cantidad, usuario_id]
    );

    await conn.commit();

    return res.status(201).json({ message: "Devolución registrada" });

  } catch (e: any) {
    await conn.rollback();
    console.error("crearDevolucion ERROR =>", e?.message);
    return res.status(500).json({ message: "Error registrando devolución" });
  } finally {
    conn.release();
  }
}