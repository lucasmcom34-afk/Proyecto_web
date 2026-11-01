
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

function guardarDatos(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}

// ==========================================
// VARIABLES
// ==========================================

let ventas = [];
let gastos = [];
let productos = [];

const formatoMoneda = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    ventas = obtenerDatos("impulso_ventas");
    gastos = obtenerDatos("impulso_gastos");
    productos = obtenerDatos("impulso_productos");

    configurarFechas();
    cargarProductos();
    configurarBotones();
    configurarFormularios();

    actualizarResumenCaja();
    cargarMovimientos();

    // Abrir formulario desde el Dashboard
    const parametros = new URLSearchParams(window.location.search);
    const accion = parametros.get("accion");

    if (accion === "venta") {
        mostrarFormulario("venta");
    } else if (accion === "gasto") {
        mostrarFormulario("gasto");
    } else {
        mostrarFormulario("venta");
    }
});

// ==========================================
// FECHAS
// ==========================================

function configurarFechas() {
    const hoy = new Date();
    const fecha = hoy.getFullYear() + "-" +
        String(hoy.getMonth() + 1).padStart(2, "0") + "-" +
        String(hoy.getDate()).padStart(2, "0");

    document.getElementById("fechaVenta").value = fecha;
    document.getElementById("fechaGasto").value = fecha;
}

// ==========================================
// PRODUCTOS
// ==========================================

function cargarProductos() {
    const selector = document.getElementById("producto");

    selector.innerHTML = '<option value="">Seleccionar producto</option>';

    productos.forEach((producto, indice) => {
        const opcion = document.createElement("option");

        opcion.value = indice;
        opcion.textContent = producto.nombre;

        selector.appendChild(opcion);
    });
}

// ==========================================
// BOTONES Y FORMULARIOS
// ==========================================

function configurarBotones() {
    document.getElementById("btnMostrarVenta")
        .addEventListener("click", () => mostrarFormulario("venta"));

    document.getElementById("btnMostrarGasto")
        .addEventListener("click", () => mostrarFormulario("gasto"));
}

function mostrarFormulario(tipo) {
    const seccionVenta = document.getElementById("seccionVenta");
    const seccionGasto = document.getElementById("seccionGasto");

    seccionVenta.style.display = tipo === "venta" ? "block" : "none";
    seccionGasto.style.display = tipo === "gasto" ? "block" : "none";
}

function configurarFormularios() {
    document.getElementById("formVenta")
        .addEventListener("submit", registrarVenta);

    document.getElementById("formGasto")
        .addEventListener("submit", registrarGasto);

    document.getElementById("producto")
        .addEventListener("change", actualizarPrecio);

    document.getElementById("cantidad")
        .addEventListener("input", calcularTotalVenta);

    document.getElementById("precio")
        .addEventListener("input", calcularTotalVenta);
}

// ==========================================
// PRECIO Y TOTAL DE VENTA
// ==========================================

function actualizarPrecio() {
    const indice = document.getElementById("producto").value;

    if (indice === "") {
        document.getElementById("precio").value = "";
        calcularTotalVenta();
        return;
    }

    const producto = productos[Number(indice)];

    document.getElementById("precio").value =
        producto.precio ?? producto.precioVenta ?? 0;

    calcularTotalVenta();
}

function calcularTotalVenta() {
    const cantidad = Number(document.getElementById("cantidad").value) || 0;
    const precio = Number(document.getElementById("precio").value) || 0;

    const total = cantidad * precio;

    document.getElementById("totalVenta").textContent =
        formatoMoneda.format(total);
}

// ==========================================
// REGISTRAR VENTA
// ==========================================

function registrarVenta(evento) {
    evento.preventDefault();

    const cliente = document.getElementById("cliente").value.trim();
    const fecha = document.getElementById("fechaVenta").value;
    const indice = document.getElementById("producto").value;
    const cantidad = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precio").value);

    if (indice === "") {
        alert("Seleccioná un producto.");
        return;
    }

    const producto = productos[Number(indice)];

    if (!producto) {
        alert("El producto seleccionado no existe.");
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0 || precio <= 0) {
        alert("Ingresá una cantidad y un precio válidos.");
        return;
    }

    const stock = Number(producto.stock ?? producto.stockDisponible);

    if (!Number.isFinite(stock) || stock < cantidad) {
        alert("No hay stock suficiente para realizar esta venta.");
        return;
    }

    const total = cantidad * precio;

    const nuevaVenta = {
        cliente: cliente,
        fecha: fecha,
        producto: producto.nombre,
        cantidad: cantidad,
        precio: precio,
        total: total
    };

    ventas.push(nuevaVenta);
    guardarDatos("impulso_ventas", ventas);

    // Actualizar stock del producto
    if (producto.stock !== undefined) {
        producto.stock = stock - cantidad;
    } else {
        producto.stockDisponible = stock - cantidad;
    }

    guardarDatos("impulso_productos", productos);

    actualizarResumenCaja();
    cargarMovimientos();

    document.getElementById("formVenta").reset();
    document.getElementById("fechaVenta").value =
        new Date().toISOString().slice(0, 10);

    document.getElementById("totalVenta").textContent =
        formatoMoneda.format(0);

    alert("Venta registrada correctamente.");
    cargarProductos();
}

// ==========================================
// REGISTRAR GASTO
// ==========================================

function registrarGasto(evento) {
    evento.preventDefault();

    const concepto = document.getElementById("concepto").value.trim();
    const categoria = document.getElementById("categoria").value;
    const fecha = document.getElementById("fechaGasto").value;
    const importe = Number(document.getElementById("importe").value);

    if (!concepto || !categoria || !fecha || importe <= 0) {
        alert("Completá todos los campos correctamente.");
        return;
    }

    const nuevoGasto = {
        concepto: concepto,
        categoria: categoria,
        fecha: fecha,
        importe: importe
    };

    gastos.push(nuevoGasto);
    guardarDatos("impulso_gastos", gastos);

    actualizarResumenCaja();
    cargarMovimientos();

    document.getElementById("formGasto").reset();
    document.getElementById("fechaGasto").value =
        new Date().toISOString().slice(0, 10);

    alert("Gasto registrado correctamente.");
}

// ==========================================
// RESUMEN DE CAJA
// ==========================================

function actualizarResumenCaja() {
    const totalVentas = ventas.reduce(
        (acumulado, venta) =>
            acumulado + Number(venta.total ?? venta.monto ?? venta.importe ?? 0),
        0
    );

    const totalGastos = gastos.reduce(
        (acumulado, gasto) =>
            acumulado + Number(gasto.importe ?? gasto.total ?? gasto.monto ?? 0),
        0
    );

    const balance = totalVentas - totalGastos;

    document.getElementById("totalVentas").textContent =
        formatoMoneda.format(totalVentas);

    document.getElementById("totalGastos").textContent =
        formatoMoneda.format(totalGastos);

    document.getElementById("balanceCaja").textContent =
        formatoMoneda.format(balance);
}

// ==========================================
// MOVIMIENTOS REGISTRADOS
// ==========================================

function cargarMovimientos() {
    const contenedor = document.getElementById("contenedorMovimientos");

    contenedor.innerHTML = "";

    const movimientos = [
        ...ventas.map(venta => ({
            tipo: "Venta",
            descripcion: venta.cliente || venta.producto || "Venta",
            fecha: venta.fecha || venta.fechaRegistro,
            importe: Number(venta.total ?? venta.monto ?? venta.importe ?? 0)
        })),

        ...gastos.map(gasto => ({
            tipo: "Gasto",
            descripcion: gasto.concepto || gasto.categoria || "Gasto",
            fecha: gasto.fecha || gasto.fechaRegistro,
            importe: Number(gasto.importe ?? gasto.total ?? gasto.monto ?? 0)
        }))
    ];

    movimientos.sort((a, b) =>
        new Date(b.fecha) - new Date(a.fecha)
    );

    if (movimientos.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "Todavía no hay movimientos registrados.";
        contenedor.appendChild(mensaje);
        return;
    }

    movimientos.forEach(movimiento => {
        const elemento = document.createElement("div");
        elemento.classList.add("movimiento");

        const informacion = document.createElement("div");

        const titulo = document.createElement("h4");
        titulo.textContent =
            `${movimiento.tipo} - ${movimiento.descripcion}`;

        const fecha = document.createElement("p");
        fecha.textContent = movimiento.fecha
            ? new Date(movimiento.fecha + "T00:00:00").toLocaleDateString("es-AR")
            : "Fecha no disponible";

        const importe = document.createElement("p");
        importe.textContent = formatoMoneda.format(movimiento.importe);

        informacion.appendChild(titulo);
        informacion.appendChild(fecha);

        elemento.appendChild(informacion);
        elemento.appendChild(importe);

        contenedor.appendChild(elemento);
    });
}
