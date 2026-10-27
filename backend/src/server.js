import authRoutes from "./routes/auth.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(__dirname, "../..");

app.use("/img", express.static(path.join(raiz, "img")));
app.use("/landing_page", express.static(path.join(raiz, "landing_page")));
app.use("/inicio_sesion", express.static(path.join(raiz, "inicio_sesion")));
app.use("/registro", express.static(path.join(raiz, "registro")));

app.get("/api/health", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW() AS hora");
    res.json({ ok: true, hora_db: rows[0].hora });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "No se pudo conectar a la base de datos" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));