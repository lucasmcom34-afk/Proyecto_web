/* =========================
   MODO CLARO / OSCURO
========================= */
const themeToggle = document.getElementById("themeToggle");
const raiz = document.documentElement;

function actualizarBotonTema() {
    const oscuro = raiz.classList.contains("oscuro");
    themeToggle.textContent = oscuro ? "☀" : "☾";
    themeToggle.setAttribute("aria-label", oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    themeToggle.setAttribute("title", oscuro ? "Modo claro" : "Modo oscuro");
}

actualizarBotonTema();

themeToggle.addEventListener("click", () => {
    const oscuro = raiz.classList.toggle("oscuro");
    try { localStorage.setItem("tema", oscuro ? "oscuro" : "claro"); } catch (e) {}
    actualizarBotonTema();
});

/* =========================
   MOSTRAR / OCULTAR CONTRASEÑA
========================= */
const password = document.getElementById("password");
const showPassword = document.getElementById("showPassword");

showPassword.addEventListener("click", () => {
    const estaOculta = password.type === "password";
    password.type = estaOculta ? "text" : "password";
    showPassword.textContent = estaOculta ? "Ocultar" : "Ver";
});


/* =========================
   LOGIN
========================= */
const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const formError = document.getElementById("formError");

function mostrarError(mensaje) {
    formError.textContent = mensaje;
    formError.classList.remove("ok");
    formError.hidden = false;
}

function mostrarExito(mensaje) {
    formError.textContent = mensaje;
    formError.classList.add("ok");
    formError.hidden = false;
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formError.hidden = true;

    const email = document.getElementById("email").value.trim();
    const clave = password.value;

    if (!email || !clave) {
        mostrarError("Completá tu correo y tu contraseña.");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Ingresando...";

    try {
        const respuesta = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: clave,
                remember: document.getElementById("remember").checked
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarError(datos.error || "Credenciales inválidas.");
            return;
        }

        localStorage.setItem("nombre", datos.usuario.nombre);
        localStorage.setItem("idUsuario", String(datos.usuario.id));

        setTimeout(() => {
            window.location.href = "../dashboard/dashboard.html";
        }, 600);

    } catch (error) {
        mostrarError("No pudimos conectarnos. Intentá de nuevo en un momento.");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Iniciar sesión";
    }
});


/* =========================
   RESULTADOS EN LA URL (verificación de correo y Google)
========================= */
const params = new URLSearchParams(window.location.search);

if (params.get("verificado") === "ok") {
    mostrarExito("¡Cuenta confirmada! Ya podés iniciar sesión.");
} else if (params.get("verificado") === "error") {
    mostrarError("El link es inválido o venció. Volvé a registrarte.");
}

if (params.get("google") === "error") {
    mostrarError("No pudimos iniciar sesión con Google. Intentá de nuevo.");
}

/* =========================
   SI YA HAY SESIÓN, IR AL DASHBOARD
========================= */
(async () => {
    // No redirigir si venimos de la verificación de correo o de un error de Google
    if (params.get("verificado") || params.get("google")) return;

    try {
        const r = await fetch("/api/auth/me");
        if (r.ok) window.location.replace("../dashboard/dashboard.html");
    } catch (e) {}
})();