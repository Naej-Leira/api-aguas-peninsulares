import bcrypt from "bcryptjs";
import "dotenv/config";
import { pool } from "../db/pool.js";
function isBcryptHash(value) {
    return /^\$2[aby]\$/.test(value);
}
async function main() {
    const [users] = await pool.query("SELECT id, password_hash FROM usuarios");
    for (const u of users) {
        const current = String(u.password_hash ?? "");
        if (!current)
            continue;
        if (isBcryptHash(current)) {
            console.log(`↪ Usuario ${u.id} ya hasheado`);
            continue;
        }
        const hashed = await bcrypt.hash(current, 10);
        await pool.query("UPDATE usuarios SET password_hash = ? WHERE id = ?", [hashed, u.id]);
        console.log(`✅ Usuario ${u.id} actualizado`);
    }
    await pool.end();
    console.log("🎉 Listo, contraseñas hasheadas");
}
main().catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
});
