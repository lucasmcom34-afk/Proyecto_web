import jwt from "jsonwebtoken";

function leerUsuario(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null; // firma inválida o token vencido
  }
}

// Para rutas de API: responde 401 si no hay sesión
export function requireAuth(req, res, next) {
  const payload = leerUsuario(req);
  if (!payload) return res.status(401).json({ error: "No autenticado" });
  req.user = { id: payload.id };
  next();
}

// Para páginas (HTML): redirige al login si no hay sesión
export function requirePage(req, res, next) {
  const payload = leerUsuario(req);
  if (!payload) return res.redirect("/inicio_sesion/login.html");
  req.user = { id: payload.id };
  next();
}