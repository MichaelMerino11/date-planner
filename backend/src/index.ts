import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import placesRoutes from "./routes/places.routes";
import datesRoutes from "./routes/dates.routes";
import photosRoutes from "./routes/photos.routes";
import connectionRoutes from "./routes/connection.routes";
import { startCronJobs } from "./services/cron.service";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/dates", datesRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/connection", connectionRoutes);

app.get("/health", (_, res) => {
  res.json({ status: "ok", message: "Date Planner API running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCronJobs();
});

export default app;
