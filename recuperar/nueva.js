const token = new URLSearchParams(location.search).get("token");
const form = document.getElementById("resetForm");
const msg = document.getElementById("msg");
const btn = document.getElementById("btn");

function mostrar(texto, ok) {
    msg.textContent = texto;
    msg.classList.toggle("ok", ok);
    msg.hidden = false;
}

if (!token) {
    form.hidden = true;
    mostrar("El link es inválido.", false);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.hidden = true;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (password.length < 8) return mostrar("La contraseña debe tener al menos 8 caracteres.", false);
    if (password !== confirm) return mostrar("Las contraseñas no coinciden.", false);

    btn.disabled = true;
    try {
        const r = await fetch("/api/auth/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password })
        });
        const d = await r.json();
        if (!r.ok) {
            mostrar(d.error || "Ocurrió un error.", false);
            btn.disabled = false;
            return;
        }
        mostrar("Contraseña actualizada. Te llevamos al inicio de sesión…", true);
        setTimeout(() => location.replace("../inicio_sesion/login.html"), 1500);
    } catch {
        mostrar("No pudimos conectarnos. Intentá de nuevo.", false);
        btn.disabled = false;
    }
});