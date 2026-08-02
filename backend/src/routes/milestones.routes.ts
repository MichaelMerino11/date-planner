import { Router } from "express";
import {
  getMilestones,
  celebrateMilestone,
} from "../controllers/milestones.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getMilestones);
router.patch("/:type/celebrate", celebrateMilestone);

export default router;
