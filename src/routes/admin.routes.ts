import { Router } from "express";
import { auth, requireRole } from "../middlewares/auth.js";
import {
  adminListTables,
  adminList,
  adminGetOne,
  adminCreate,
  adminUpdate,
  adminDelete,
} from "../controllers/admin.controller.js";

const router = Router();

// 🔒 SOLO ADMIN
router.use(auth);
router.use(requireRole("ADMIN"));

router.get("/tables", adminListTables);

router.get("/:table", adminList);
router.get("/:table/:id", adminGetOne);

router.post("/:table", adminCreate);
router.put("/:table/:id", adminUpdate);
router.delete("/:table/:id", adminDelete);

export default router;