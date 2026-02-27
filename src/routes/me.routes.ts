import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/me", auth, async (req, res) => {
  const userId = req.user!.id;

  const [rows] = await pool.query<any[]>(
    "SELECT id, nombre, usuario, rol, activo, camion_id FROM usuarios WHERE id = ? LIMIT 1",
    [userId]
  );

  if (!rows.length) return res.status(404).json({ message: "Usuario no encontrado" });

  const u = rows[0];
  return res.json({
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    rol: u.rol,
    activo: u.activo,
    camion_id: u.camion_id ?? null,
  });
});

export default router;