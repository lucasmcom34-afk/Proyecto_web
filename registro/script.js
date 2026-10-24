const registerForm = document.getElementById("registerForm");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");


// =====================================================
// MODO CLARO / OSCURO
// =====================================================

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


// =====================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// =====================================================

document.querySelectorAll(".password-toggle").forEach((boton) => {
    boton.addEventListener("click", () => {
        const input = document.getElementById(boton.dataset.target);
        const estaOculta = input.type === "password";
        input.type = estaOculta ? "text" : "password";
        boton.textContent = estaOculta ? "Ocultar" : "Mostrar";
    });
});


// =====================================================
// MENSAJES
// =====================================================

function mostrarMensaje(mensaje, tipo = "error") {
    formMessage.textContent = mensaje;
    formMessage.classList.toggle("ok", tipo === "ok");
    formMessage.hidden = false;
}


// =====================================================
// REGISTRO
// =====================================================

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.hidden = true;

    const nombre = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        mostrarMensaje("Las contraseñas no coinciden.");
        return;
    }

    if (password.length < 8) {
        mostrarMensaje("La contraseña debe tener al menos 8 caracteres.");
        return;
    }

    submitButton.disabled = true;

    try {
        const respuesta = await fetch("/registro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: nombre, email: email, password: password })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarMensaje(datos.mensaje || "Ocurrió un error.");
            submitButton.disabled = false;
            return;
        }

        mostrarMensaje("Cuenta creada correctamente. Te llevamos al inicio de sesión…", "ok");

        setTimeout(() => {
            window.location.href = "/login/login.html";
        }, 1500);

    } catch (error) {
        mostrarMensaje("No se pudo conectar con el servidor. Intentá de nuevo en un momento.");
        submitButton.disabled = false;
    }
});