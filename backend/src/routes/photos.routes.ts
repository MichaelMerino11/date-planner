import { Router } from "express";
import {
  getPhotos,
  getPhotosByDate,
  uploadPhoto,
  deletePhoto,
} from "../controllers/photos.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getPhotos);
router.get("/date/:dateId", getPhotosByDate);
router.post("/", uploadPhoto);
router.delete("/:id", deletePhoto);

export default router;
