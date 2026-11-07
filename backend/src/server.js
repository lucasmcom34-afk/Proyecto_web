import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";
import { requirePage } from "./middleware/auth.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, "../..");

app.use("/recuperar", express.static(path.join(raiz, "recuperar")));
app.use("/img", express.static(path.join(raiz, "img")));
app.use("/landing_page", express.static(path.join(raiz, "landing_page")));
app.use("/inicio_sesion", express.static(path.join(raiz, "inicio_sesion")));
app.use("/registro", express.static(path.join(raiz, "registro")));
app.use("/inventario", express.static(path.join(raiz, "inventario")));
app.use("/historialRegistros", express.static(path.join(raiz, "historialRegistros")));
app.use("/rendimiento", express.static(path.join(raiz, "rendimiento")));


// Dashboard protegido: sin cookie válida redirige al login
app.use("/dashboard", requirePage, express.static(path.join(raiz, "dashboard")));

app.get("/api/health", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS hora");
    res.json({ ok: true, hora_db: rows[0].hora });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "No se pudo conectar a la base de datos" });
  }
});

// Limpieza de registros pendientes vencidos (cada hora)
setInterval(() => {
  pool.query("DELETE FROM reset_tokens WHERE expira_en < NOW()").catch(console.error);
  pool.query("DELETE FROM registros_pendientes WHERE expira_en < NOW()").catch(console.error);
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));