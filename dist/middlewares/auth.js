import jwt from "jsonwebtoken";
import "dotenv/config";
const JWT_SECRET = process.env.JWT_SECRET;
function getBearerToken(req) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return null;
    return header.substring(7).trim();
}
export function auth(req, res, next) {
    const token = getBearerToken(req);
    if (!token) {
        return res.status(401).json({ message: "Token requerido" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: Number(decoded.id),
            rol: decoded.rol,
            camion_id: decoded.camion_id ?? null,
        };
        next();
    }
    catch {
        return res.status(401).json({ message: "Token inválido" });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: "No autenticado" });
        if (!roles.includes(req.user.rol))
            return res.status(403).json({ message: "Sin permisos" });
        next();
    };
}
