import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../db";
import { AuthRequest } from '../middlewares/auth.middleware'

const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const generateToken = (userId: string, coupleId: string | null): string => {
  return jwt.sign({ userId, coupleId }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res
      .status(400)
      .json({ message: "Nombre, email y contraseña son requeridos" });
    return;
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      res.status(400).json({ message: "El email ya está registrado" });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const invite_code = generateInviteCode();

    // Crear la pareja primero (sin user2 aún)
    const coupleResult = await pool.query(
      "INSERT INTO couples (invite_code) VALUES ($1) RETURNING id",
      [invite_code],
    );
    const coupleId = coupleResult.rows[0].id;

    // Crear el usuario ligado a esa pareja
    const userResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, couple_id)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, couple_id`,
      [name, email, password_hash, coupleId],
    );

    // Actualizar la pareja con user1
    await pool.query("UPDATE couples SET user1_id = $1 WHERE id = $2", [
      userResult.rows[0].id,
      coupleId,
    ]);

    const user = userResult.rows[0];
    const token = generateToken(user.id, coupleId);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      invite_code,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email y contraseña son requeridos" });
    return;
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, couple_id FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: "Credenciales inválidas" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ message: "Credenciales inválidas" });
      return;
    }

    const token = generateToken(user.id, user.couple_id);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      couple_id: user.couple_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};

// POST /api/auth/link-couple
export const linkCouple = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email, password, invite_code } = req.body;

  if (!email || !password || !invite_code) {
    res
      .status(400)
      .json({ message: "Email, contraseña y código son requeridos" });
    return;
  }

  try {
    // Verificar credenciales
    const userResult = await pool.query(
      "SELECT id, name, email, password_hash, couple_id FROM users WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ message: "Credenciales inválidas" });
      return;
    }

    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ message: "Credenciales inválidas" });
      return;
    }

    // Buscar la pareja por invite_code
    const coupleResult = await pool.query(
      "SELECT id, user1_id, user2_id FROM couples WHERE invite_code = $1",
      [invite_code.toUpperCase()],
    );

    if (coupleResult.rows.length === 0) {
      res.status(404).json({ message: "Código de invitación inválido" });
      return;
    }

    const couple = coupleResult.rows[0];

    if (couple.user2_id) {
      res.status(400).json({ message: "Este código ya fue usado" });
      return;
    }

    if (couple.user1_id === user.id) {
      res.status(400).json({ message: "No puedes vincularte contigo mismo" });
      return;
    }

    // Vincular user2 a la pareja
    await pool.query("UPDATE couples SET user2_id = $1 WHERE id = $2", [
      user.id,
      couple.id,
    ]);

    // Actualizar couple_id del user2
    await pool.query("UPDATE users SET couple_id = $1 WHERE id = $2", [
      couple.id,
      user.id,
    ]);

    const token = generateToken(user.id, couple.id);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      couple_id: couple.id,
      message: "¡Pareja vinculada exitosamente!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al vincular pareja" });
  }
};

// POST /api/auth/push-token
export const savePushToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ message: "Token requerido" });
    return;
  }

  try {
    await pool.query("UPDATE users SET expo_push_token = $1 WHERE id = $2", [
      token,
      req.userId,
    ]);
    res.json({ message: "Token guardado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al guardar token" });
  }
};
