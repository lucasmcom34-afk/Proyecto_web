// ==========================================
// CONFIGURACIÓN Y ALMACENAMIENTO
// ==========================================

function obtenerDatos(clave, valorInicial = []) {
    try {
        const datos = localStorage.getItem(clave);

        return datos ? JSON.parse(datos) : valorInicial;

    } catch (error) {
        console.error(`Error al leer ${clave}:`, error);
        return valorInicial;
    }
}

// ==========================================
// NOMBRE DEL USUARIO
// ==========================================

function obtenerNombreUsuario() {

    const claves = [
        "usuarioLogueado",
        "currentUser",
        "user",
        "usuario"
    ];

    for (const almacenamiento of [
        localStorage,
        sessionStorage
    ]) {

        for (const clave of claves) {

            const guardado = almacenamiento.getItem(clave);

            if (!guardado) continue;

            try {

                const usuario = JSON.parse(guardado);

                // Si se guardó directamente un nombre como texto.
                if (typeof usuario === "string") {
                    return usuario;
                }

                const nombre =
                    usuario?.nombre ||
                    usuario?.name ||
                    usuario?.username ||
                    usuario?.usuario?.nombre ||
                    usuario?.user?.name;

                if (nombre) return nombre;

            } catch {

                // Si el dato no es JSON, se interpreta como texto.
                return guardado;
            }
        }
    }

    return "Usuario";
}


function cargarNombreUsuario() {

    const elementoNombre = document.getElementById("nombreUsuario");

    if (elementoNombre) {
        elementoNombre.textContent = obtenerNombreUsuario();
    }
}

 
// ==========================================
// SELECTORES DE MES Y AÑO
// ==========================================

const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
];


function cargarSelectores() {

    const selectorMes = document.getElementById("mesSeleccionado");
    const selectorAnio = document.getElementById("anioSeleccionado");

    const fechaActual = new Date();

    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();

    // Cargar meses

    selectorMes.innerHTML = "";

    meses.forEach((mes, indice) => {

        const opcion = document.createElement("option");

        opcion.value = indice;
        opcion.textContent = mes;

        selectorMes.appendChild(opcion);

    });

    // Cargar años

    selectorAnio.innerHTML = "";

    for (let anio = anioActual - 4; anio <= anioActual; anio++) {

        const opcion = document.createElement("option");

        opcion.value = anio;
        opcion.textContent = anio;

        selectorAnio.appendChild(opcion);

    }

    // Seleccionar mes y año actuales

    selectorMes.value = mesActual;
    selectorAnio.value = anioActual;
}


// ==========================================
// OBTENER VENTAS Y GASTOS
// ==========================================

function obtenerVentas() {

    const dashboard = obtenerDatos("impulso_dashboard", {});

    return obtenerDatos(
        "impulso_ventas",
        dashboard.ventas || []
    );
}


function obtenerGastos() {

    const dashboard = obtenerDatos("impulso_dashboard", {});

    return obtenerDatos(
        "impulso_gastos",
        dashboard.gastos || []
    );
}


// ==========================================
// NORMALIZAR FECHAS E IMPORTES
// ==========================================

function obtenerFecha(movimiento) {

    const fecha = movimiento.fecha
        || movimiento.fechaRegistro
        || movimiento.createdAt;

    if (!fecha) return null;

    // Evita problemas de zona horaria con fechas YYYY-MM-DD.

    const fechaTexto = String(fecha);

    const fechaNormalizada = /^\d{4}-\d{2}-\d{2}$/.test(fechaTexto)
        ? `${fechaTexto}T00:00:00`
        : fechaTexto;

    const resultado = new Date(fechaNormalizada);

    return isNaN(resultado.getTime()) ? null : resultado;
}


function obtenerImporte(movimiento) {

    return Number(
        movimiento.total
        ?? movimiento.monto
        ?? movimiento.importe
        ?? 0
    ) || 0;
}


// ==========================================
// ACTUALIZAR RESUMEN MENSUAL
// ==========================================

function actualizarResumenMensual() {

    const selectorMes = document.getElementById("mesSeleccionado");
    const selectorAnio = document.getElementById("anioSeleccionado");

    const mes = Number(selectorMes.value);
    const anio = Number(selectorAnio.value);

    const resumen = document.getElementById("resumenMensual");

    resumen.textContent = `Resumen de ${meses[mes]} ${anio}`;

    const ventas = obtenerVentas();
    const gastos = obtenerGastos();

    let totalVentas = 0;
    let totalGastos = 0;

    // Calcular ventas del período seleccionado

    ventas.forEach(venta => {

        const fecha = obtenerFecha(venta);

        if (
            fecha &&
            fecha.getMonth() === mes &&
            fecha.getFullYear() === anio
        ) {
            totalVentas += obtenerImporte(venta);
        }

    });

    // Calcular gastos del período seleccionado

    gastos.forEach(gasto => {

        const fecha = obtenerFecha(gasto);

        if (
            fecha &&
            fecha.getMonth() === mes &&
            fecha.getFullYear() === anio
        ) {
            totalGastos += obtenerImporte(gasto);
        }

    });

    const balance = totalVentas - totalGastos;

    // Mostrar resultados

    document.getElementById("ventasMes").textContent =
        formatearMoneda(totalVentas);

    document.getElementById("gastosMes").textContent =
        formatearMoneda(totalGastos);

    document.getElementById("balanceMes").textContent =
        formatearMoneda(balance);
}


// ==========================================
// FORMATO DE MONEDA
// ==========================================

function formatearMoneda(importe) {

    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2
    }).format(importe);
}


// ==========================================
// ACTIVIDAD RECIENTE
// ==========================================

function cargarActividadReciente() {

    const ventas = obtenerVentas();
    const gastos = obtenerGastos();

    const movimientos = [

        ...ventas.map(venta => ({
            ...venta,
            tipo: "Venta",
            importe: obtenerImporte(venta),
            fechaMovimiento: obtenerFecha(venta)
        })),

        ...gastos.map(gasto => ({
            ...gasto,
            tipo: "Gasto",
            importe: obtenerImporte(gasto),
            fechaMovimiento: obtenerFecha(gasto)
        }))

    ];

    // Ordenar por fecha, del más reciente al más antiguo

    movimientos.sort((a, b) => {

        return (b.fechaMovimiento?.getTime() || 0)
            - (a.fechaMovimiento?.getTime() || 0);

    });

    const contenedor = document.getElementById("contenedorRecientes");

    contenedor.innerHTML = "";

    const recientes = movimientos.slice(0, 5);

    if (recientes.length === 0) {

        const mensaje = document.createElement("p");

        mensaje.id = "sinMovimientos";
        mensaje.textContent = "Todavía no hay movimientos registrados.";

        contenedor.appendChild(mensaje);

        return;
    }

    recientes.forEach(movimiento => {

        const elemento = document.createElement("div");

        elemento.classList.add("movimiento");

        const informacion = document.createElement("div");

        const titulo = document.createElement("h4");

        titulo.textContent =
            movimiento.tipo === "Venta"
                ? `Venta - ${movimiento.cliente || "Cliente"}`
                : `Gasto - ${movimiento.concepto || movimiento.categoria || "Gasto"}`;

        const fecha = document.createElement("p");

        fecha.textContent = movimiento.fechaMovimiento
            ? movimiento.fechaMovimiento.toLocaleDateString("es-AR")
            : "Fecha no disponible";

        const importe = document.createElement("p");

        importe.textContent = formatearMoneda(movimiento.importe);

        informacion.appendChild(titulo);
        informacion.appendChild(fecha);

        elemento.appendChild(informacion);
        elemento.appendChild(importe);

        contenedor.appendChild(elemento);

    });
}


// ==========================================
// INICIALIZAR DASHBOARD
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    cargarNombreUsuario();

    cargarSelectores();

    actualizarResumenMensual();

    cargarActividadReciente();

    // Actualizar al cambiar el mes o el año

    document.getElementById("mesSeleccionado")
        .addEventListener("change", actualizarResumenMensual);

    document.getElementById("anioSeleccionado")
        .addEventListener("change", actualizarResumenMensual);

});