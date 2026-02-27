import { Router } from "express";
import { pool } from "../db/pool.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import "dotenv/config";
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const router = Router();
function isBcryptHash(value) {
    // bcrypt normalmente empieza con: $2a$, $2b$, $2y$
    return /^\$2[aby]\$/.test(value);
}
router.post("/login", async (req, res) => {
    const schema = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Datos inválidos" });
    }
    const { username, password } = parsed.data;
    // 👇 Ajustado a tu tabla: usuario / password_hash
    const [rows] = await pool.query("SELECT id, nombre, usuario, password_hash, rol, activo, camion_id FROM usuarios WHERE usuario = ? LIMIT 1", [username]);
    if (!rows.length) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
    }
    const user = rows[0];
    if (user.activo === 0) {
        return res.status(403).json({ message: "Usuario inactivo" });
    }
    const stored = String(user.password_hash ?? "");
    let ok = false;
    if (isBcryptHash(stored)) {
        // ✅ Caso 1: Guardada como bcrypt hash
        ok = await bcrypt.compare(password, stored);
    }
    else {
        // ⚠️ Caso 2: Guardada como texto plano
        ok = password === stored;
        // ✅ Si hizo match, migramos a bcrypt hash automáticamente
        if (ok) {
            const newHash = await bcrypt.hash(password, 10);
            await pool.query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [
                newHash,
                user.id,
            ]);
        }
    }
    if (!ok) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
    }
    const options = { expiresIn: JWT_EXPIRES_IN };
    const token = jwt.sign({
        id: user.id,
        rol: user.rol,
        camion_id: user.camion_id ?? null,
    }, JWT_SECRET, options);
    return res.json({
        token,
        user: {
            id: user.id,
            nombre: user.nombre,
            username: user.usuario,
            rol: user.rol,
            camion_id: user.camion_id ?? null,
        },
    });
});
export default router;
