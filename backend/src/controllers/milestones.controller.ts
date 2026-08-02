import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";

const MILESTONES = [
  { type: "1_month", days: 30, label: "1 mes juntos", emoji: "🌸" },
  { type: "100_days", days: 100, label: "100 días juntos", emoji: "💯" },
  { type: "6_months", days: 180, label: "6 meses juntos", emoji: "💕" },
  { type: "1_year", days: 365, label: "1 año juntos", emoji: "💞" },
  { type: "2_years", days: 730, label: "2 años juntos", emoji: "👑" },
];

export const checkMilestones = async (coupleId: string): Promise<any[]> => {
  const coupleResult = await pool.query(
    "SELECT anniversary_date FROM couples WHERE id = $1",
    [coupleId],
  );
  if (coupleResult.rows.length === 0) return [];

  const anniversary = new Date(coupleResult.rows[0].anniversary_date);
  const now = new Date();
  const daysTogether = Math.floor(
    (now.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24),
  );

  const newMilestones = [];
  for (const milestone of MILESTONES) {
    if (daysTogether >= milestone.days) {
      const existing = await pool.query(
        "SELECT id FROM milestones WHERE couple_id = $1 AND type = $2",
        [coupleId, milestone.type],
      );
      if (existing.rows.length === 0) {
        await pool.query(
          "INSERT INTO milestones (couple_id, type) VALUES ($1, $2)",
          [coupleId, milestone.type],
        );
        newMilestones.push(milestone);
      }
    }
  }
  return newMilestones;
};

export const getMilestones = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const coupleResult = await pool.query(
      "SELECT anniversary_date FROM couples WHERE id = $1",
      [req.coupleId],
    );

    const anniversary = new Date(coupleResult.rows[0].anniversary_date);
    const now = new Date();
    const daysTogether = Math.floor(
      (now.getTime() - anniversary.getTime()) / (1000 * 60 * 60 * 24),
    );

    const reached = await pool.query(
      "SELECT * FROM milestones WHERE couple_id = $1 ORDER BY reached_at ASC",
      [req.coupleId],
    );
    const reachedMap: Record<string, any> = {};
    reached.rows.forEach((r: any) => {
      reachedMap[r.type] = r;
    });

    const allMilestones = MILESTONES.map((m) => ({
      ...m,
      reached: !!reachedMap[m.type],
      progress: Math.min(Math.round((daysTogether / m.days) * 100), 100),
      daysLeft: Math.max(m.days - daysTogether, 0),
      modal_shown: reachedMap[m.type]?.modal_shown || false,
    }));

    // Hitos personalizados
    const customResult = await pool.query(
      "SELECT * FROM custom_milestones WHERE couple_id = $1 ORDER BY created_at DESC",
      [req.coupleId],
    );

    const stats = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM dates WHERE couple_id = $1 AND status = 'done') as dates_done,
        (SELECT COUNT(*) FROM photos WHERE couple_id = $1) as photos,
        (SELECT COUNT(*) FROM places WHERE couple_id = $1) as places`,
      [req.coupleId],
    );

    res.json({
      milestones: allMilestones,
      customMilestones: customResult.rows,
      daysTogether,
      stats: stats.rows[0],
      anniversary: anniversary.toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener hitos" });
  }
};

export const celebrateMilestone = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { type } = req.params;
  try {
    await pool.query(
      "UPDATE milestones SET celebrated = TRUE, modal_shown = TRUE WHERE couple_id = $1 AND type = $2",
      [req.coupleId, type],
    );
    res.json({ message: "Hito celebrado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al celebrar hito" });
  }
};

export const markModalShown = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { type } = req.params;
  try {
    await pool.query(
      "UPDATE milestones SET modal_shown = TRUE WHERE couple_id = $1 AND type = $2",
      [req.coupleId, type],
    );
    res.json({ message: "Modal marcado como mostrado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
};

// Custom milestones
export const createCustomMilestone = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { title, description, target_date } = req.body;
  if (!title) {
    res.status(400).json({ message: "El título es requerido" });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO custom_milestones (couple_id, title, description, target_date, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        req.coupleId,
        title,
        description || null,
        target_date || null,
        req.userId,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear hito" });
  }
};

export const toggleCustomMilestone = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    const current = await pool.query(
      "SELECT reached FROM custom_milestones WHERE id = $1 AND couple_id = $2",
      [id, req.coupleId],
    );
    if (current.rows.length === 0) {
      res.status(404).json({ message: "Hito no encontrado" });
      return;
    }
    const newReached = !current.rows[0].reached;
    const result = await pool.query(
      `UPDATE custom_milestones SET reached = $1, reached_at = $2
       WHERE id = $3 AND couple_id = $4 RETURNING *`,
      [newReached, newReached ? new Date() : null, id, req.coupleId],
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar hito" });
  }
};

export const deleteCustomMilestone = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query(
      "DELETE FROM custom_milestones WHERE id = $1 AND couple_id = $2",
      [id, req.coupleId],
    );
    res.json({ message: "Hito eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar hito" });
  }
};
