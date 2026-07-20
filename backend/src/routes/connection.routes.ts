import { Router } from "express";
import { getConnection } from "../controllers/connection.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getConnection);

export default router;
