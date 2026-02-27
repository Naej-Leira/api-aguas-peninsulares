import multer from "multer";
import path from "path";
import fs from "fs";
const uploadDir = path.join(process.cwd(), "uploads", "facturas");
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
        const facturaId = req.params.id || "unknown";
        cb(null, `factura_${facturaId}_${Date.now()}${ext}`);
    },
});
function fileFilter(_req, file, cb) {
    const isPdf = file.mimetype === "application/pdf" ||
        path.extname(file.originalname).toLowerCase() === ".pdf";
    if (!isPdf)
        return cb(new Error("Solo se permite PDF"), false);
    cb(null, true);
}
export const uploadPdf = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
