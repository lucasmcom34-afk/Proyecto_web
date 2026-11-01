
/* ========================================
   IMPULSO - REPORTES
   Gestión de reportes e indicadores
======================================== */

// ========================================
// 1. CONFIGURACIÓN
// ========================================

const CLAVE_VENTAS = "impulso_ventas";
const CLAVE_GASTOS = "impulso_gastos";
const CLAVE_PRODUCTOS = "impulso_productos";

let ventas = [];
let gastos = [];
let movimientos = [];

const formatoMoneda = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
});


// ========================================
// 2. OBTENER DATOS DE LOCALSTORAGE
// ========================================

function obtenerDatos(clave) {
    try {
        const datos = JSON.parse(localStorage.getItem(clave));
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error("Error al obtener datos:", clave, error);
        return [];
    }
}

function cargarDatos() {
    ventas = obtenerDatos(CLAVE_VENTAS);
    gastos = obtenerDatos(CLAVE_GASTOS);
    movimientos = [];

    ventas.forEach(venta => {
        movimientos.push({
            tipo: "venta",
            fecha: obtenerFecha(venta),
            descripcion: venta.producto || "Venta",
            importe: obtenerImporte(venta)
        });
    });

    gastos.forEach(gasto => {
        movimientos.push({
            tipo: "gasto",
            fecha: obtenerFecha(gasto),
            descripcion: gasto.concepto || "Gasto",
            importe: obtenerImporte(gasto)
        });
    });

    movimientos.sort((a, b) => {
        return obtenerFechaObjeto(b.fecha) - obtenerFechaObjeto(a.fecha);
    });
}


// ========================================
// 3. FUNCIONES AUXILIARES
// ========================================

function obtenerFecha(registro) {
    return registro.fecha ||
           registro.fechaRegistro ||
           registro.createdAt ||
           "";
}

function obtenerImporte(registro) {
    return Number(
        registro.total ??
        registro.monto ??
        registro.importe ??
        0
    ) || 0;
}

function obtenerFechaObjeto(fecha) {
    if (!fecha) return new Date(0);

    // Evita problemas de zona horaria con fechas YYYY-MM-DD.
    const partes = String(fecha).slice(0, 10).split("-");

    if (partes.length === 3) {
        const [anio, mes, dia] = partes.map(Number);

        if (anio && mes && dia) {
            return new Date(anio, mes - 1, dia);
        }
    }

    const fechaConvertida = new Date(fecha);

    return isNaN(fechaConvertida.getTime())
        ? new Date(0)
        : fechaConvertida;
}

function formatearMoneda(importe) {
    return formatoMoneda.format(importe);
}

function formatearFecha(fecha) {
    const fechaObjeto = obtenerFechaObjeto(fecha);

    if (fechaObjeto.getTime() === 0) return "Sin fecha";

    return fechaObjeto.toLocaleDateString("es-AR");
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caracter];
    });
}


// ========================================
// 4. CARGAR SELECTOR DE AÑOS
// ========================================

function cargarAnios() {
    const selector = document.getElementById("anioReporte");

    const anios = new Set([new Date().getFullYear()]);

    [...ventas, ...gastos].forEach(registro => {
        const fecha = obtenerFechaObjeto(obtenerFecha(registro));

        if (fecha.getTime() !== 0) {
            anios.add(fecha.getFullYear());
        }
    });

    const aniosOrdenados = [...anios].sort((a, b) => b - a);

    selector.innerHTML = '<option value="0">Todos los años</option>';

    aniosOrdenados.forEach(anio => {
        const opcion = document.createElement("option");
        opcion.value = anio;
        opcion.textContent = anio;
        selector.appendChild(opcion);
    });
}


// ========================================
// 5. FILTRAR MOVIMIENTOS POR PERÍODO
// ========================================

function obtenerMovimientosFiltrados() {
    const mes = Number(document.getElementById("mesReporte").value);
    const anio = Number(document.getElementById("anioReporte").value);
    const tipo = document.getElementById("tipoMovimiento").value;

    return movimientos.filter(movimiento => {
        const fecha = obtenerFechaObjeto(movimiento.fecha);

        const coincideMes =
            mes === 0 || fecha.getMonth() + 1 === mes;

        const coincideAnio =
            anio === 0 || fecha.getFullYear() === anio;

        const coincideTipo =
            tipo === "todos" || movimiento.tipo === tipo;

        return coincideMes && coincideAnio && coincideTipo;
    });
}

function obtenerRegistrosDelPeriodo(registros) {
    const mes = Number(document.getElementById("mesReporte").value);
    const anio = Number(document.getElementById("anioReporte").value);

    return registros.filter(registro => {
        const fecha = obtenerFechaObjeto(obtenerFecha(registro));

        const coincideMes =
            mes === 0 || fecha.getMonth() + 1 === mes;

        const coincideAnio =
            anio === 0 || fecha.getFullYear() === anio;

        return coincideMes && coincideAnio;
    });
}


// ========================================
// 6. ACTUALIZAR RESUMEN GENERAL
// ========================================

function actualizarResumen() {
    const ventasPeriodo = obtenerRegistrosDelPeriodo(ventas);
    const gastosPeriodo = obtenerRegistrosDelPeriodo(gastos);

    const totalVentas = ventasPeriodo.reduce(
        (acumulado, venta) => acumulado + obtenerImporte(venta), 0
    );

    const totalGastos = gastosPeriodo.reduce(
        (acumulado, gasto) => acumulado + obtenerImporte(gasto), 0
    );

    const balance = totalVentas - totalGastos;

    document.getElementById("totalVentasReporte").textContent =
        formatearMoneda(totalVentas);

    document.getElementById("totalGastosReporte").textContent =
        formatearMoneda(totalGastos);

    const elementoBalance = document.getElementById("balanceReporte");

    elementoBalance.textContent = formatearMoneda(balance);

    elementoBalance.classList.toggle("positivo", balance >= 0);
    elementoBalance.classList.toggle("negativo", balance < 0);
}


// ========================================
// 7. ACTUALIZAR INDICADORES
// ========================================

function actualizarIndicadores() {
    const ventasPeriodo = obtenerRegistrosDelPeriodo(ventas);

    const cantidadVentas = ventasPeriodo.length;

    const totalVentas = ventasPeriodo.reduce(
        (acumulado, venta) => acumulado + obtenerImporte(venta), 0
    );

    const cantidadProductos = ventasPeriodo.reduce(
        (acumulado, venta) => acumulado + (Number(venta.cantidad) || 0), 0
    );

    const promedio = cantidadVentas > 0
        ? totalVentas / cantidadVentas
        : 0;

    document.getElementById("cantidadVentas").textContent =
        cantidadVentas;

    document.getElementById("cantidadProductosVendidos").textContent =
        cantidadProductos;

    document.getElementById("promedioVenta").textContent =
        formatearMoneda(promedio);
}


// ========================================
// 8. PRODUCTOS MÁS VENDIDOS
// ========================================

function actualizarProductosMasVendidos() {
    const ventasPeriodo = obtenerRegistrosDelPeriodo(ventas);

    const productos = {};

    ventasPeriodo.forEach(venta => {
        const nombre = venta.producto || "Producto sin nombre";
        const cantidad = Number(venta.cantidad) || 0;
        const importe = obtenerImporte(venta);

        if (!productos[nombre]) {
            productos[nombre] = {
                nombre: nombre,
                cantidad: 0,
                total: 0
            };
        }

        productos[nombre].cantidad += cantidad;
        productos[nombre].total += importe;
    });

    const lista = Object.values(productos).sort(
        (a, b) => b.cantidad - a.cantidad
    );

    const tabla = document.getElementById("tablaProductosVendidos");
    const cuerpo = document.getElementById("listaProductosVendidos");
    const mensaje = document.getElementById("sinProductosVendidos");

    cuerpo.innerHTML = "";

    if (lista.length === 0) {
        tabla.hidden = true;
        mensaje.hidden = false;
        return;
    }

    mensaje.hidden = true;
    tabla.hidden = false;

    lista.forEach(producto => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${escaparHTML(producto.nombre)}</td>
            <td>${producto.cantidad}</td>
            <td>${formatearMoneda(producto.total)}</td>
        `;

        cuerpo.appendChild(fila);
    });
}


// ========================================
// 9. HISTORIAL DE MOVIMIENTOS
// ========================================

function actualizarMovimientos() {
    const lista = obtenerMovimientosFiltrados();

    const tabla = document.getElementById("tablaMovimientosReporte");
    const cuerpo = document.getElementById("listaMovimientosReporte");
    const mensaje = document.getElementById("sinMovimientosReporte");

    cuerpo.innerHTML = "";

    if (lista.length === 0) {
        tabla.hidden = true;
        mensaje.hidden = false;
        return;
    }

    mensaje.hidden = true;
    tabla.hidden = false;

    lista.forEach(movimiento => {
        const fila = document.createElement("tr");

        const tipoTexto = movimiento.tipo === "venta"
            ? "Venta"
            : "Gasto";

        const clase = movimiento.tipo === "venta"
            ? "positivo"
            : "negativo";

        const signo = movimiento.tipo === "venta" ? "+" : "-";

        fila.innerHTML = `
            <td>${formatearFecha(movimiento.fecha)}</td>
            <td>${tipoTexto}</td>
            <td>${escaparHTML(movimiento.descripcion)}</td>
            <td class="${clase}">
                ${signo}${formatearMoneda(movimiento.importe)}
            </td>
        `;

        cuerpo.appendChild(fila);
    });
}


// ========================================
// 10. ACTUALIZAR TODOS LOS REPORTES
// ========================================

function actualizarReportes() {
    cargarDatos();

    actualizarResumen();
    actualizarIndicadores();
    actualizarProductosMasVendidos();
    actualizarMovimientos();
}


// ========================================
// 11. INICIALIZACIÓN
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    cargarDatos();
    cargarAnios();

    actualizarReportes();

    // Aplicar filtros de período.
    document.getElementById("btnFiltrarReportes")
        .addEventListener("click", actualizarReportes);

    // Filtrar movimientos por tipo.
    document.getElementById("tipoMovimiento")
        .addEventListener("change", actualizarMovimientos);

});
