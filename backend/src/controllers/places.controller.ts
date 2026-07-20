import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";

// GET /api/places
export const getPlaces = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as added_by_name
       FROM places p
       LEFT JOIN users u ON p.added_by = u.id
       WHERE p.couple_id = $1
       ORDER BY p.created_at DESC`,
      [req.coupleId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener lugares" });
  }
};

// POST /api/places
export const createPlace = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { name, address, lat, lng, google_place_id, category } = req.body;

  if (!name) {
    res.status(400).json({ message: "El nombre es requerido" });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO places (couple_id, name, address, lat, lng, google_place_id, category, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.coupleId,
        name,
        address,
        lat,
        lng,
        google_place_id,
        category || "otro",
        req.userId,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear lugar" });
  }
};

// DELETE /api/places/:id
export const deletePlace = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM places WHERE id = $1 AND couple_id = $2 RETURNING id",
      [id, req.coupleId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Lugar no encontrado" });
      return;
    }

    res.json({ message: "Lugar eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar lugar" });
  }
};
