import cron from "node-cron";
import pool from "../db";
import { sendPushToCouple } from "./notifications.service";

export function startCronJobs() {
  // Corre cada 30 minutos
  cron.schedule("*/30 * * * *", async () => {
    console.log("Revisando recordatorios...");

    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);
      const in30min = new Date(now.getTime() + 30 * 60 * 1000);

      // Recordatorio 24 horas antes
      const dates24h = await pool.query(
        `SELECT d.*, p.name as place_name
         FROM dates d
         LEFT JOIN places p ON d.place_id = p.id
         WHERE d.status IN ('pending', 'confirmed')
         AND d.scheduled_at BETWEEN $1 AND $2`,
        [
          in24h.toISOString(),
          new Date(in24h.getTime() + 30 * 60 * 1000).toISOString(),
        ],
      );

      for (const date of dates24h.rows) {
        await sendPushToCouple(
          date.couple_id,
          "system",
          "⏰ Mañana es su salida",
          `Recuerda: ${date.title}${date.place_name ? ` en ${date.place_name}` : ""}`,
        );
      }

      // Recordatorio 1 hora antes
      const dates1h = await pool.query(
        `SELECT d.*, p.name as place_name
         FROM dates d
         LEFT JOIN places p ON d.place_id = p.id
         WHERE d.status IN ('pending', 'confirmed')
         AND d.scheduled_at BETWEEN $1 AND $2`,
        [
          in1h.toISOString(),
          new Date(in1h.getTime() + 30 * 60 * 1000).toISOString(),
        ],
      );

      for (const date of dates1h.rows) {
        await sendPushToCouple(
          date.couple_id,
          "system",
          "🎉 ¡En 1 hora es su salida!",
          `${date.title}${date.place_name ? ` en ${date.place_name}` : ""}`,
        );
      }
    } catch (error) {
      console.error("Error en cron:", error);
    }
  });

  console.log("Cron jobs iniciados");
}
