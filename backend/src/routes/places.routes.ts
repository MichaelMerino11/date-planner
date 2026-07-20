import { Router } from "express";
import {
  getPlaces,
  createPlace,
  deletePlace,
} from "../controllers/places.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getPlaces);
router.post("/", createPlace);
router.delete("/:id", deletePlace);

export default router;
