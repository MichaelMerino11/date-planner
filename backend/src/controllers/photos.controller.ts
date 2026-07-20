import { Response } from "express";
import pool from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { uploadImage, deleteImage } from "../services/cloudinary.service";

// GET /api/photos
export const getPhotos = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT ph.*, u.name as uploaded_by_name,
              d.title as date_title
       FROM photos ph
       LEFT JOIN users u ON ph.uploaded_by = u.id
       LEFT JOIN dates d ON ph.date_id = d.id
       WHERE ph.couple_id = $1
       ORDER BY ph.created_at DESC`,
      [req.coupleId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener fotos" });
  }
};

// GET /api/photos/date/:dateId
export const getPhotosByDate = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { dateId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ph.*, u.name as uploaded_by_name
       FROM photos ph
       LEFT JOIN users u ON ph.uploaded_by = u.id
       WHERE ph.date_id = $1 AND ph.couple_id = $2
       ORDER BY ph.created_at DESC`,
      [dateId, req.coupleId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener fotos" });
  }
};

// POST /api/photos
export const uploadPhoto = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { base64, date_id } = req.body;

  if (!base64) {
    res.status(400).json({ message: "Imagen requerida" });
    return;
  }

  try {
    const { url, public_id } = await uploadImage(base64);

    const result = await pool.query(
      `INSERT INTO photos (date_id, couple_id, cloudinary_url, cloudinary_public_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [date_id || null, req.coupleId, url, public_id, req.userId],
    );

    res.status(201).json({ ...result.rows[0], cloudinary_url: url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al subir foto" });
  }
};

// DELETE /api/photos/:id
export const deletePhoto = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM photos WHERE id = $1 AND couple_id = $2",
      [id, req.coupleId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Foto no encontrada" });
      return;
    }

    await deleteImage(result.rows[0].cloudinary_public_id);

    await pool.query("DELETE FROM photos WHERE id = $1", [id]);

    res.json({ message: "Foto eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar foto" });
  }
};
