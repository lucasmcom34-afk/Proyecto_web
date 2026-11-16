(() => {
    const sidebar = document.getElementById("aRapidas");

    const nombre = (localStorage.getItem("nombre") || "invitado").trim() || "invitado";
    const panel = document.createElement("aside");
    panel.className = "panel-usuario";
    panel.setAttribute("aria-label", "Cuenta de usuario");
    panel.innerHTML = `
        <span class="avatar-usuario" id="avatarUsuario" aria-hidden="true"></span>
        <span class="nombre-usuario" id="nombreUsuarioPanel"></span>
        <a class="accion-usuario" href="../configuracion/config.html" aria-label="Configuración" title="Configuración">
            <img class="icono-accion-usuario" src="../img/config.webp" alt="">
        </a>
        <button class="accion-usuario" id="logoutBtn" type="button" aria-label="Cerrar sesión" title="Cerrar sesión">
            <svg class="icono-cerrar-sesion" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"></path>
                <path d="M10 12h11"></path>
                <path d="m17 8 4 4-4 4"></path>
            </svg>
        </button>
    `;

    panel.querySelector("#avatarUsuario").textContent = Array.from(nombre)[0].toLocaleUpperCase("es");
    panel.querySelector("#nombreUsuarioPanel").textContent = nombre;
    if (sidebar) {
        sidebar.append(panel);
    } else {
        panel.classList.add("panel-usuario-flotante");
        document.body.append(panel);
    }

    panel.querySelector("#logoutBtn").addEventListener("click", async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("No se pudo cerrar la sesión en el servidor.", error);
        }
        localStorage.removeItem("nombre");
        window.location.replace("../inicio_sesion/login.html");
    });
})();
