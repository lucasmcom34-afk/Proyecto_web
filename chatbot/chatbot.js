(() => {
    const conversacion = document.getElementById("conversacionChat");
    const formularioChat = document.getElementById("formularioChat");
    const campoMensaje = document.getElementById("mensajeChat");
    const botonEnviar = formularioChat.querySelector("button[type='submit']");
    const opcionesMenu = [
        { label: "1. ¿Qué es Impulso?", action: "que-es" },
        { label: "2. Funcionamiento de la página", action: "funcionamiento" },
        { label: "3. Datos y seguridad", action: "seguridad" }
    ];
    const opcionesFuncionamiento = [
        { label: "1) Cómo registrar una venta", action: "registrar-venta" },
        { label: "2) Cómo registrar un gasto", action: "registrar-gasto" },
        { label: "3) Cómo añado un producto", action: "anadir-producto" },
        { label: "4) Cómo elimino una operación", action: "eliminar-operacion" },
        { label: "5) Volver al menú", action: "menu" }
    ];
    let esperandoRespuesta = true;

    function desplazarAlFinal() {
        conversacion.scrollTop = conversacion.scrollHeight;
    }

    function crearFilaBot() {
        const fila = document.createElement("div");
        fila.className = "fila-mensaje fila-mensaje-bot";

        const avatar = document.createElement("img");
        avatar.className = "avatar-mensaje";
        avatar.src = "../img/bot.webp";
        avatar.alt = "";

        const burbuja = document.createElement("div");
        burbuja.className = "burbuja-chat burbuja-bot";

        fila.append(avatar, burbuja);
        conversacion.append(fila);
        return burbuja;
    }

    function crearIndicadorEscritura() {
        const fila = document.createElement("div");
        fila.className = "fila-mensaje fila-mensaje-bot";

        const avatar = document.createElement("img");
        avatar.className = "avatar-mensaje";
        avatar.src = "../img/bot.webp";
        avatar.alt = "";

        const burbuja = document.createElement("div");
        burbuja.className = "burbuja-escribiendo";
        burbuja.setAttribute("role", "status");
        burbuja.setAttribute("aria-label", "Impulbot está respondiendo");

        const puntos = document.createElement("span");
        puntos.className = "puntos-escribiendo";
        puntos.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 3; i += 1) {
            puntos.append(document.createElement("span"));
            puntos.lastElementChild.textContent = ".";
        }

        burbuja.append(puntos);
        fila.append(avatar, burbuja);
        conversacion.append(fila);
        desplazarAlFinal();
        return fila;
    }

    function agregarParrafo(burbuja, texto) {
        const parrafo = document.createElement("p");
        parrafo.textContent = texto;
        burbuja.append(parrafo);
        return parrafo;
    }

    function agregarMensajeUsuario(texto) {
        const fila = document.createElement("div");
        fila.className = "fila-mensaje fila-mensaje-usuario";

        const burbuja = document.createElement("div");
        burbuja.className = "burbuja-chat burbuja-usuario";
        burbuja.textContent = texto;
        fila.append(burbuja);
        conversacion.append(fila);
        desplazarAlFinal();
    }

    function desactivarOpciones() {
        conversacion.querySelectorAll(".opcion-chat").forEach((opcion) => {
            opcion.disabled = true;
        });
    }

    function agregarOpciones(burbuja, opciones) {
        const lista = document.createElement("div");
        lista.className = "opciones-chat";

        opciones.forEach((opcion) => {
            const boton = document.createElement("button");
            boton.className = "opcion-chat";
            boton.type = "button";
            boton.textContent = opcion.label;
            boton.addEventListener("click", () => seleccionarOpcion(opcion));
            lista.append(boton);
        });

        burbuja.append(lista);
    }

    function agregarVolverAlMenu(burbuja) {
        agregarOpciones(burbuja, [
            { label: "Volver al menú", action: "menu" }
        ]);
    }

    function mostrarMenu(burbuja, esInicial) {
        if (esInicial) {
            const saludo = document.createElement("p");
            saludo.append("¡Hola! 👋 Soy el asistente virtual de ");
            const marca = document.createElement("strong");
            marca.textContent = "Impulso";
            saludo.append(marca, " 🤖");
            burbuja.append(saludo);
            agregarParrafo(burbuja, "Respondo con información predeterminada, así que elegí una de estas opciones:");
        } else {
            agregarParrafo(burbuja, "¡Perfecto! Te devuelvo al menu inicial...");
        }
        agregarOpciones(burbuja, opcionesMenu);
    }

    function mostrarRespuesta(action, burbuja) {
        switch (action) {
            case "menu":
                mostrarMenu(burbuja, false);
                break;
            case "que-es": {
                const parrafo = document.createElement("p");
                parrafo.append("🚀 ");
                const destacado = document.createElement("strong");
                destacado.textContent = "Impulso es el empujoncito que tu emprendimiento necesitaba.";
                parrafo.append(destacado);
                burbuja.append(parrafo);
                agregarParrafo(
                    burbuja,
                    "Somos una plataforma pensada para darles una mano a los emprendedores chicos, juntando todas las herramientas que necesitás en un solo lugar. Se terminó eso de andar saltando de una app a otra: acá ordenás, gestionás y hacés crecer tu negocio de manera más fácil y eficiente."
                );
                agregarParrafo(burbuja, "Menos quilombo, más tiempo para lo que te gusta 💪");
                agregarVolverAlMenu(burbuja);
                break;
            }
            case "funcionamiento":
                agregarParrafo(burbuja, "¿Qué querés aprender?");
                agregarOpciones(burbuja, opcionesFuncionamiento);
                break;
            case "registrar-venta":
                agregarParrafo(
                    burbuja,
                    "Desde la barra lateral, elegí “+ Registrar Venta”. Seleccioná el producto, indica la cantidad y el medio de pago, revisá el total y pulsa “Agregar venta”. El stock se descuenta automáticamente."
                );
                agregarVolverAlMenu(burbuja);
                break;
            case "registrar-gasto":
                agregarParrafo(
                    burbuja,
                    "Elegí “+ Registrar Gasto” en la barra lateral. Completá la descripción, cantidad, categoría, monto y fecha; luego pulsa “Agregar gasto”."
                );
                agregarVolverAlMenu(burbuja);
                break;
            case "anadir-producto":
                agregarParrafo(
                    burbuja,
                    "Elegí “+ Añadir Producto” en la barra lateral. Indicá el nombre, precio y stock inicial, y pulsa “Agregar producto”."
                );
                agregarVolverAlMenu(burbuja);
                break;
            case "eliminar-operacion":
                agregarParrafo(
                    burbuja,
                    "Abrí “Registros”, buscá la venta o el gasto y pulsa “Eliminar”. Confirmá la acción. Al borrar una venta, el stock se repone si el producto todavía existe."
                );
                agregarVolverAlMenu(burbuja);
                break;
            case "seguridad":
                agregarParrafo(
                    burbuja,
                    "Para cambiar tu contraseña, elegí la opción de abajo para solicitar un enlace de recuperación en el correo de tu cuenta."
                );
                agregarOpciones(burbuja, [
                    { label: "Cambiar contraseña", action: "recuperar-contrasena" }
                ]);
                agregarVolverAlMenu(burbuja);
                break;
            default:
                agregarParrafo(burbuja, "No encontré esa opción. Volvé al menú para elegir otra.");
                agregarVolverAlMenu(burbuja);
        }
        desplazarAlFinal();
    }

    function responderConEspera(action) {
        if (action === "recuperar-contrasena") {
            const mensaje = crearFilaBot();
            agregarParrafo(mensaje, "Redirigiendo...");
            desplazarAlFinal();
            window.setTimeout(() => {
                window.location.href = "../recuperar/olvido.html?desde=impulbot";
            }, 1300);
            return;
        }

        const indicador = crearIndicadorEscritura();
        window.setTimeout(() => {
            indicador.remove();
            mostrarRespuesta(action, crearFilaBot());
            esperandoRespuesta = false;
        }, 1000);
    }

    function seleccionarOpcion(opcion) {
        if (esperandoRespuesta) return;
        esperandoRespuesta = true;
        desactivarOpciones();
        agregarMensajeUsuario(opcion.label);
        responderConEspera(opcion.action);
    }

    formularioChat.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const mensaje = campoMensaje.value.trim();
        if (!mensaje || esperandoRespuesta) return;

        esperandoRespuesta = true;
        desactivarOpciones();
        agregarMensajeUsuario(mensaje);
        campoMensaje.value = "";
        campoMensaje.disabled = true;
        botonEnviar.disabled = true;

        const indicador = crearIndicadorEscritura();
        window.setTimeout(() => {
            indicador.remove();
            mostrarMenu(crearFilaBot(), true);
            esperandoRespuesta = false;
            campoMensaje.disabled = false;
            botonEnviar.disabled = false;
            campoMensaje.focus();
        }, 1000);
    });

    window.addEventListener("pageshow", (evento) => {
        if (!evento.persisted) return;
        esperandoRespuesta = false;
        campoMensaje.disabled = false;
        botonEnviar.disabled = false;
        campoMensaje.focus();
    });

    const indicadorInicial = crearIndicadorEscritura();
    window.setTimeout(() => {
        indicadorInicial.remove();
        mostrarMenu(crearFilaBot(), true);
        esperandoRespuesta = false;
        campoMensaje.disabled = false;
        botonEnviar.disabled = false;
        desplazarAlFinal();
    }, 1000);
})();
