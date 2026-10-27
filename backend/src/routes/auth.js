import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { pool } from "../db.js";
import { enviarVerificacion } from "../mailer.js";

const router = Router();
const SALT_ROUNDS = 10;

// Cambiá este valor si tu archivo de login se llama distinto
const LOGIN_PAGE = "/inicio_sesion/login.html";

const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Demasiados intentos. Probá más tarde." },
});

const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

// REGISTRO: crea un registro pendiente y manda el mail
router.post("/register", limiteRegistro, async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  const emailNorm = email.trim().toLowerCase();

  try {
    const existe = await pool.query("SELECT 1 FROM usuarios WHERE email = $1", [emailNorm]);
    if (existe.rowCount > 0) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO registros_pendientes (nombre, email, password_hash, token_hash, expira_en)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 hour')
       ON CONFLICT (email) DO UPDATE
       SET nombre = $1, password_hash = $3, token_hash = $4,
           expira_en = NOW() + INTERVAL '1 hour'`,
      [nombre, emailNorm, passwordHash, hashToken(token)]
    );

    const link = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;
    await enviarVerificacion(emailNorm, nombre, link);

    res.json({ mensaje: "Te enviamos un correo para confirmar tu cuenta." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo completar el registro" });
  }
});

// VERIFICACIÓN: crea el usuario real
router.get("/verify", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect(`${LOGIN_PAGE}?verificado=error`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT * FROM registros_pendientes
       WHERE token_hash = $1 AND expira_en > NOW()
       FOR UPDATE`,
      [hashToken(String(token))]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.redirect(`${LOGIN_PAGE}?verificado=error`);
    }

    const p = rows[0];
    await client.query(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3)",
      [p.nombre, p.email, p.password_hash]
    );
    await client.query("DELETE FROM registros_pendientes WHERE id = $1", [p.id]);

    await client.query("COMMIT");
    res.redirect(`${LOGIN_PAGE}?verificado=ok`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.redirect(`${LOGIN_PAGE}?verificado=error`);
  } finally {
    client.release();
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email, password_hash FROM usuarios WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    const usuario = rows[0];
    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json({
      mensaje: "Login correcto",
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

export default router;