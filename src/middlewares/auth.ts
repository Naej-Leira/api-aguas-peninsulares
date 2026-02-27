import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import "dotenv/config";

export type Role = "ADMIN" | "CAMION" | "PLANTA";

export type JwtUser = {
  id: number;
  rol: Role;
  camion_id?: number | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

function getBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.substring(7).trim();
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & JwtUser;

    req.user = {
      id: Number(decoded.id),
      rol: decoded.rol,
      camion_id: decoded.camion_id ?? null,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "No autenticado" });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ message: "Sin permisos" });
    next();
  };
}