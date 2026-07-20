import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getConnection = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    let result = await pool.query(
      "SELECT * FROM connection_points WHERE couple_id = $1",
      [req.coupleId],
    );

    if (result.rows.length === 0) {
      await pool.query(
        "INSERT INTO connection_points (couple_id, points) VALUES ($1, 0)",
        [req.coupleId],
      );
      result = await pool.query(
        "SELECT * FROM connection_points WHERE couple_id = $1",
        [req.coupleId],
      );
    }

    const cp = result.rows[0];
    const points = cp.points;
    let level = "";
    let levelEmoji = "";
    let nextLevel = 0;

    if (points < 100) {
      level = "Recién comenzando";
      levelEmoji = "🌱";
      nextLevel = 100;
    } else if (points < 300) {
      level = "Construyendo lazos";
      levelEmoji = "🌸";
      nextLevel = 300;
    } else if (points < 600) {
      level = "Conexión creciente";
      levelEmoji = "💕";
      nextLevel = 600;
    } else if (points < 1000) {
      level = "Muy conectados";
      levelEmoji = "💖";
      nextLevel = 1000;
    } else {
      level = "Almas gemelas";
      levelEmoji = "💞";
      nextLevel = points + 100;
    }

    const percentage = Math.min(Math.round((points / nextLevel) * 100), 100);

    res.json({ ...cp, level, levelEmoji, percentage, nextLevel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener conexión" });
  }
};

export const addPoints = async (
  coupleId: string,
  action:
    | "date_done"
    | "photo_uploaded"
    | "place_added"
    | "date_created"
    | "random_used",
): Promise<void> => {
  const POINTS: Record<string, number> = {
    date_done: 30,
    photo_uploaded: 10,
    place_added: 5,
    date_created: 10,
    random_used: 15,
  };

  const points = POINTS[action] || 0;

  const extraFields: Record<string, string> = {
    date_done:
      ", total_dates_done = total_dates_done + 1, last_date_done = NOW()",
    photo_uploaded: ", total_photos = total_photos + 1",
    place_added: ", total_places = total_places + 1",
  };

  const extra = extraFields[action] || "";

  await pool.query(
    `UPDATE connection_points
     SET points = points + $1, updated_at = NOW() ${extra}
     WHERE couple_id = $2`,
    [points, coupleId],
  );
};
