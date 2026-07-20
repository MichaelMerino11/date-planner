import { sendPushToCouple } from '../services/notifications.service'
import { Router } from "express";
import {
  getDates,
  createDate,
  createRandomDate,
  updateDateStatus,
  deleteDate,
} from "../controllers/dates.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getDates);
router.post("/", createDate);
router.post("/random", createRandomDate);
router.patch("/:id/status", updateDateStatus);
router.delete("/:id", deleteDate);

export default router;
