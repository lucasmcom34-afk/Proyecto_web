import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { enviarVerificacion, enviarReset } from "../mailer.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const SALT_ROUNDS = 10;
const LOGIN_PAGE = "/inicio_sesion/login.html";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días, igual que JWT_EXPIRES
};

const limiteRegistro = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos. Probá más tarde." },
});

const limiteForgot = rateLimit({
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

// LOGIN: valida credenciales y entrega el JWT en una cookie httpOnly
router.post("/login", async (req, res) => {
  const { email, password, remember } = req.body;

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

    const recordar = remember === true;

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: recordar ? "7d" : "1d",
    });

    const { maxAge, ...opcionesBase } = COOKIE_OPTS;
    res.cookie(
      "token",
      token,
      recordar ? { ...opcionesBase, maxAge: 7 * 24 * 60 * 60 * 1000 } : opcionesBase
    );

    res.json({
      mensaje: "Login correcto",
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
});


// ME: devuelve el usuario de la sesión actual
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email FROM usuarios WHERE id = $1",
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: "No autenticado" });
    }
    res.json({ usuario: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// LOGOUT: borra la cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTS);
  res.json({ mensaje: "Sesión cerrada" });
});

// OLVIDÉ MI CONTRASEÑA: manda el mail (misma respuesta exista o no el email)
router.post("/forgot", limiteForgot, async (req, res) => {
  const { email } = req.body;
  const respuesta = { mensaje: "Si el correo está registrado, te enviamos un link para cambiar tu contraseña." };

  if (!email) return res.status(400).json({ error: "Faltan datos" });

  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email FROM usuarios WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    const usuario = rows[0];

    if (usuario) {
      const token = crypto.randomBytes(32).toString("hex");
      await pool.query(
        `INSERT INTO reset_tokens (usuario_id, token_hash, expira_en)
         VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
         ON CONFLICT (usuario_id) DO UPDATE
         SET token_hash = $2, expira_en = NOW() + INTERVAL '30 minutes'`,
        [usuario.id, hashToken(token)]
      );
      const link = `${process.env.BASE_URL}/recuperar/nueva.html?token=${token}`;
      await enviarReset(usuario.email, usuario.nombre, link);
    }

    res.json(respuesta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo procesar la solicitud" });
  }
});

// RESET: cambia la contraseña con el token del mail
router.post("/reset", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) return res.status(400).json({ error: "Faltan datos" });
  if (password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT usuario_id FROM reset_tokens
       WHERE token_hash = $1 AND expira_en > NOW()
       FOR UPDATE`,
      [hashToken(String(token))]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El link es inválido o venció" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await client.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [passwordHash, rows[0].usuario_id]);
    await client.query("DELETE FROM reset_tokens WHERE usuario_id = $1", [rows[0].usuario_id]);

    await client.query("COMMIT");
    res.json({ mensaje: "Contraseña actualizada" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  } finally {
    client.release();
  }
});

export default router;