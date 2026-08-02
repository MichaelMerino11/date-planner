import { Router } from "express";
import {
  getMilestones,
  celebrateMilestone,
  markModalShown,
  createCustomMilestone,
  toggleCustomMilestone,
  deleteCustomMilestone,
} from "../controllers/milestones.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getMilestones);
router.patch("/:type/celebrate", celebrateMilestone);
router.patch("/:type/modal-shown", markModalShown);
router.post("/custom", createCustomMilestone);
router.patch("/custom/:id/toggle", toggleCustomMilestone);
router.delete("/custom/:id", deleteCustomMilestone);

export default router;
