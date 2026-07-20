import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import placesRoutes from "./routes/places.routes";
import datesRoutes from "./routes/dates.routes";
import { startCronJobs } from "./services/cron.service";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/dates", datesRoutes);

app.get("/health", (_, res) => {
  res.json({ status: "ok", message: "Date Planner API running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCronJobs();
});

export default app;
