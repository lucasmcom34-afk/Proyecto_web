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

const OJO_ABIERTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const OJO_TACHADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-6.5 0-10-7-10-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';

document.querySelectorAll(".ojo").forEach((boton) => {
    boton.innerHTML = OJO_ABIERTO;
    boton.addEventListener("click", () => {
        const input = document.getElementById(boton.dataset.target);
        const oculta = input.type === "password";
        input.type = oculta ? "text" : "password";
        boton.innerHTML = oculta ? OJO_TACHADO : OJO_ABIERTO;
        boton.setAttribute("aria-label", oculta ? "Ocultar contraseña" : "Mostrar contraseña");
    });
});