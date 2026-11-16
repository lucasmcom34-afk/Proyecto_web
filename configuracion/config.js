const toggleModoOscuro = document.getElementById("toggleModoOscuro");
const selectorTamanoFuente = document.getElementById("selectorTamanoFuente");
const tamanosFuente = ["12px", "16px", "20px"];
const tamanoGuardado = localStorage.getItem("tamanoFuente");
const tamanoInicial = tamanosFuente.includes(tamanoGuardado) ? tamanoGuardado : "16px";
const nombreBase = (localStorage.getItem("nombre") || "invitado").trim() || "invitado";
const idUsuario = localStorage.getItem("idUsuario") || nombreBase;
const claveNombrePreferido = `nombrePreferido:${idUsuario}`;
const claveUltimoCambioNombre = `ultimoCambioNombre:${idUsuario}`;
const formCambioNombre = document.getElementById("formCambioNombre");
const inputCambioNombre = document.getElementById("inputCambioNombre");
const botonCambioNombre = formCambioNombre.querySelector("button");
const mensajeCambioNombre = document.getElementById("mensajeCambioNombre");
const duracionBloqueoNombre = 3 * 24 * 60 * 60 * 1000;

toggleModoOscuro.checked = document.documentElement.classList.contains("oscuro");
selectorTamanoFuente.value = tamanoInicial;
inputCambioNombre.value = localStorage.getItem(claveNombrePreferido) || nombreBase;

function actualizarEstadoCambioNombre() {
    const ultimoCambioGuardado = localStorage.getItem(claveUltimoCambioNombre);
    const ultimoCambio = Number(ultimoCambioGuardado);
    const proximoCambio = ultimoCambio + duracionBloqueoNombre;
    const bloqueado = ultimoCambioGuardado !== null
        && Number.isFinite(ultimoCambio)
        && Date.now() < proximoCambio;

    inputCambioNombre.disabled = bloqueado;
    botonCambioNombre.disabled = bloqueado;

    if (bloqueado) {
        const fechaDisponible = new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(proximoCambio));
        mensajeCambioNombre.textContent = `Podrás cambiarlo nuevamente el ${fechaDisponible}.`;
    } else {
        mensajeCambioNombre.textContent = "Podés cambiarlo una vez cada 3 días.";
    }
}

toggleModoOscuro.addEventListener("change", () => {
    const oscuro = toggleModoOscuro.checked;
    document.documentElement.classList.toggle("oscuro", oscuro);
    localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
});

selectorTamanoFuente.addEventListener("change", () => {
    const tamanoFuente = selectorTamanoFuente.value;
    if (!tamanosFuente.includes(tamanoFuente)) {
        throw new RangeError("El tamaño de fuente seleccionado no es válido.");
    }

    localStorage.setItem("tamanoFuente", tamanoFuente);
});

formCambioNombre.addEventListener("submit", (evento) => {
    evento.preventDefault();
    actualizarEstadoCambioNombre();
    if (inputCambioNombre.disabled) return;

    const nombreElegido = inputCambioNombre.value.trim();
    if (!nombreElegido) {
        inputCambioNombre.setCustomValidity("Ingresá el nombre que querés usar.");
        inputCambioNombre.reportValidity();
        return;
    }

    inputCambioNombre.setCustomValidity("");
    localStorage.setItem(claveNombrePreferido, nombreElegido);
    localStorage.setItem(claveUltimoCambioNombre, String(Date.now()));

    const nombreUsuarioPanel = document.getElementById("nombreUsuarioPanel");
    if (nombreUsuarioPanel) nombreUsuarioPanel.textContent = nombreElegido;

    const avatarUsuario = document.getElementById("avatarUsuario");
    if (avatarUsuario) avatarUsuario.textContent = Array.from(nombreElegido)[0].toLocaleUpperCase("es");

    actualizarEstadoCambioNombre();
});

inputCambioNombre.addEventListener("input", () => inputCambioNombre.setCustomValidity(""));
actualizarEstadoCambioNombre();
