import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendPushToCouple } from "../services/notifications.service";

// GET /api/dates
export const getDates = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT d.*, p.name as place_name, p.address as place_address,
              p.category as place_category, u.name as created_by_name
       FROM dates d
       LEFT JOIN places p ON d.place_id = p.id
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.couple_id = $1
       ORDER BY d.scheduled_at ASC NULLS LAST, d.created_at DESC`,
      [req.coupleId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener salidas" });
  }
};

// POST /api/dates
export const createDate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { place_id, title, notes, scheduled_at } = req.body;

  if (!title) {
    res.status(400).json({ message: "El título es requerido" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO dates (couple_id, place_id, title, notes, scheduled_at, created_by, is_random)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [
        req.coupleId,
        place_id || null,
        title,
        notes || null,
        scheduled_at || null,
        req.userId,
      ],
    );

    const full = await pool.query(
      `SELECT d.*, p.name as place_name, p.address as place_address,
              p.category as place_category, u.name as created_by_name
       FROM dates d
       LEFT JOIN places p ON d.place_id = p.id
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.id = $1`,
      [result.rows[0].id],
    );
    await sendPushToCouple(
      req.coupleId!,
      req.userId!,
      "🗓️ Nueva salida planeada",
      `${full.rows[0].created_by_name} creó: ${title}`,
    );
    res.status(201).json(full.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear salida" });
  }
};

// POST /api/dates/random
export const createRandomDate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { scheduled_at } = req.body;

  try {
    const placesResult = await pool.query(
      "SELECT * FROM places WHERE couple_id = $1 ORDER BY RANDOM() LIMIT 1",
      [req.coupleId],
    );

    if (placesResult.rows.length === 0) {
      res.status(400).json({
        message: "No hay lugares en tu lista. Agrega algunos primero.",
      });
      return;
    }

    const place = placesResult.rows[0];

    const result = await pool.query(
      `INSERT INTO dates (couple_id, place_id, title, scheduled_at, created_by, is_random)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [
        req.coupleId,
        place.id,
        `Salida a ${place.name}`,
        scheduled_at || null,
        req.userId,
      ],
    );

    const full = await pool.query(
      `SELECT d.*, p.name as place_name, p.address as place_address,
              p.category as place_category, u.name as created_by_name
       FROM dates d
       LEFT JOIN places p ON d.place_id = p.id
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.id = $1`,
      [result.rows[0].id],
    );
    await sendPushToCouple(
      req.coupleId!,
      req.userId!,
      "🎲 ¡Salida sorteada!",
      `${full.rows[0].created_by_name} sorteó: ${full.rows[0].place_name}`,
    );
    res.status(201).json(full.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al sortear salida" });
  }
};

// PATCH /api/dates/:id/status
export const updateDateStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "done", "cancelled"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: "Estado inválido" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE dates SET status = $1
       WHERE id = $2 AND couple_id = $3
       RETURNING *`,
      [status, id, req.coupleId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salida no encontrada" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar estado" });
  }
};

// DELETE /api/dates/:id
export const deleteDate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM dates WHERE id = $1 AND couple_id = $2 RETURNING id",
      [id, req.coupleId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Salida no encontrada" });
      return;
    }

    res.json({ message: "Salida eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar salida" });
  }
};
