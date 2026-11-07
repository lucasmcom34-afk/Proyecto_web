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
   MENSAJES DE BIENVENIDA
========================= */
const heroMessage = document.getElementById("heroMessage");
const heroMessageText = document.getElementById("heroMessageText");
const mensajesBienvenida = [
    { texto: "¡Bienvenido!" },
    {
        titulo: "¿Sabías que...?",
        texto: "En Argentina, los pequeños emprendimientos representan más del 99% del tejido empresarial y generan más de la mitad del empleo formal. ¡Haz que el tuyo despegue con Impulso!"
    },
    {
        titulo: "¿Sabías que...?",
        texto: "Un emprendedor pasa en promedio más de 5 horas a la semana alternando entre diferentes aplicaciones. Con Impulso, tienes todas tus herramientas centralizadas en un solo lugar."
    },
    {
        titulo: "¿Sabías que...?",
        texto: "El crecimiento de un negocio no depende solo de una gran idea, sino de la constancia y el orden operativo diario. ¡Pongamos manos a la obra!"
    },
];
let mensajeActual = 0;

function actualizarMensajeBienvenida(mensaje, animar = true) {
    heroMessageText.replaceChildren();

    if (mensaje.titulo) {
        heroMessageText.classList.add("hero-message-fact");
        const titulo = document.createElement("strong");
        const texto = document.createElement("span");
        titulo.textContent = mensaje.titulo;
        texto.textContent = mensaje.texto;
        heroMessageText.append(titulo, texto);
    } else {
        heroMessageText.classList.remove("hero-message-fact");
        heroMessageText.textContent = mensaje.texto;
    }

    heroMessage.setAttribute("aria-label", [mensaje.titulo, mensaje.texto].filter(Boolean).join(" "));
    if (animar) {
        heroMessageText.style.animation = "none";
        void heroMessageText.offsetWidth;
        heroMessageText.style.animation = "";
    }
}

function mostrarSiguienteMensaje(animar = true) {
    mensajeActual = (mensajeActual + 1) % mensajesBienvenida.length;
    actualizarMensajeBienvenida(mensajesBienvenida[mensajeActual], animar);
    heroMessage.classList.remove("saliendo");
}

setInterval(() => {
    const siguienteEsDato = (mensajeActual + 1) % mensajesBienvenida.length !== 0;
    if (mensajeActual !== 0 && siguienteEsDato) {
        mostrarSiguienteMensaje(false);
        return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        mostrarSiguienteMensaje();
        return;
    }

    heroMessage.classList.add("saliendo");
}, 15000);

heroMessage.addEventListener("animationend", (event) => {
    if (event.target !== heroMessage || !heroMessage.classList.contains("saliendo")) return;

    mostrarSiguienteMensaje(mensajeActual === mensajesBienvenida.length - 1);
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