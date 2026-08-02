import { Router } from "express";
import {
  register,
  login,
  linkCouple,
  savePushToken,
  getMe,
  updateName,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/link-couple", linkCouple);
router.post("/push-token", authMiddleware, savePushToken);
router.get("/me", authMiddleware, getMe);
router.patch("/update-name", authMiddleware, updateName);

export default router;
