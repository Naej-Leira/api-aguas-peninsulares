import type { Request, Response } from "express";
import { pool } from "../db/pool.js";

/**
 * ✅ Listar transferencias
 */
export async function listarTransferencias(_req: Request, res: Response) {
  try {

    const [rows] = await pool.query(
      `
      SELECT *
      FROM transferencias
      ORDER BY id DESC
      `
    );

    return res.json(rows);

  } catch (e: any) {
    console.error("listarTransferencias ERROR =>", e?.message);
    return res.status(500).json({ message: "Error listando transferencias" });
  }
}

/**
 * ✅ Crear transferencia (PLANTA → CAMION)
 */
export async function crearTransferencia(req: Request, res: Response) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const { producto_id, cantidad } = req.body;

    if (!producto_id || !cantidad) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const fecha = new Date();
    const origen = "PLANTA";
    const destino = "CAMION";

    // 🔥 1️⃣ Verificar stock en planta
    const [planta]: any = await conn.query(
      `SELECT id, cantidad FROM stock_insumos WHERE id = ? LIMIT 1`,
      [producto_id]
    );

    if (!planta.length || planta[0].cantidad < cantidad) {
      await conn.rollback();
      return res.status(400).json({ message: "Stock insuficiente en planta" });
    }

    // 🔥 2️⃣ Restar en planta
    await conn.query(
      `
      UPDATE stock_insumos
      SET cantidad = cantidad - ?
      WHERE id = ?
      `,
      [cantidad, producto_id]
    );

    // 🔥 3️⃣ Sumar en stock_camion
    const camion_id = 1; // puedes luego hacerlo dinámico

    const [exist]: any = await conn.query(
      `
      SELECT id FROM stock_camion
      WHERE camion_id = ? AND producto_id = ?
      LIMIT 1
      `,
      [camion_id, producto_id]
    );

    if (exist.length > 0) {
      await conn.query(
        `
        UPDATE stock_camion
        SET cantidad = cantidad + ?
        WHERE camion_id = ? AND producto_id = ?
        `,
        [cantidad, camion_id, producto_id]
      );
    } else {
      await conn.query(
        `
        INSERT INTO stock_camion (camion_id, producto_id, cantidad)
        VALUES (?, ?, ?)
        `,
        [camion_id, producto_id, cantidad]
      );
    }

    // 🔥 4️⃣ Registrar transferencia
    await conn.query(
      `
      INSERT INTO transferencias
      (producto_id, cantidad, fecha, origen, destino)
      VALUES (?, ?, ?, ?, ?)
      `,
      [producto_id, cantidad, fecha, origen, destino]
    );

    await conn.commit();

    return res.status(201).json({ message: "Transferencia realizada" });

  } catch (e: any) {
    await conn.rollback();
    console.error("crearTransferencia ERROR =>", e?.message);
    return res.status(500).json({ message: "Error creando transferencia" });
  } finally {
    conn.release();
  }
}