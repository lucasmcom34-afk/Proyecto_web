
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

let productos = [];
let indiceEdicion = null;

const STOCK_MINIMO = 5;

const formatoMoneda = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    productos = obtenerDatos("impulso_productos");

    configurarFormulario();
    configurarBuscador();
    configurarFiltros();

    mostrarProductos();
    actualizarResumen();
    actualizarAlertas();

});

// ==========================================
// FORMULARIO DE PRODUCTOS
// ==========================================

function configurarFormulario() {

    document.getElementById("formProducto")
        .addEventListener("submit", registrarProducto);

}

// ==========================================
// REGISTRAR PRODUCTO
// ==========================================

function registrarProducto(evento) {

    evento.preventDefault();

    const nombre = document.getElementById("nombreProducto")
        .value.trim();

    const categoria = document.getElementById("categoriaProducto")
        .value;

    const precio = Number(
        document.getElementById("precioProducto").value
    );

    const costo = Number(
        document.getElementById("costoProducto").value
    );

    const stock = Number(
        document.getElementById("stockProducto").value
    );

    if (!nombre || !categoria ||
        !Number.isFinite(precio) || precio <= 0 ||
        !Number.isFinite(costo) || costo < 0 ||
        !Number.isInteger(stock) || stock < 0) {

        alert("Completá todos los campos con valores válidos.");
        return;
    }

    const producto = {
        nombre: nombre,
        categoria: categoria,
        precio: precio,
        costo: costo,
        stock: stock
    };

    if (indiceEdicion === null) {

        productos.push(producto);

        alert("Producto registrado correctamente.");

    } else {

        // Mantener el stock actualizado si se edita el producto.
        producto.stock = productos[indiceEdicion].stock;
        productos[indiceEdicion] = producto;

        indiceEdicion = null;

        document.getElementById("btnGuardarProducto")
            .textContent = "Guardar producto";

        alert("Producto actualizado correctamente.");

    }

    guardarDatos("impulso_productos", productos);

    document.getElementById("formProducto").reset();

    mostrarProductos();
    actualizarResumen();
    actualizarAlertas();

}

// ==========================================
// MOSTRAR PRODUCTOS
// ==========================================

function mostrarProductos() {

    const contenedor = document.getElementById("listaProductos");

    contenedor.innerHTML = "";

    const busqueda = document.getElementById("buscarProducto")
        .value.trim().toLowerCase();

    const categoriaSeleccionada =
        document.getElementById("filtrarCategoria").value;

    const productosFiltrados = productos
        .map((producto, indice) => ({
            ...producto,
            indiceOriginal: indice
        }))
        .filter(producto => {

            const coincideNombre =
                producto.nombre.toLowerCase().includes(busqueda);

            const coincideCategoria =
                !categoriaSeleccionada ||
                producto.categoria === categoriaSeleccionada;

            return coincideNombre && coincideCategoria;

        });

    if (productosFiltrados.length === 0) {

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 6;

        celda.textContent = productos.length === 0
            ? "Todavía no hay productos registrados."
            : "No se encontraron productos.";

        fila.appendChild(celda);
        contenedor.appendChild(fila);

        return;
    }

    productosFiltrados.forEach(producto => {

        const fila = document.createElement("tr");

        agregarCelda(fila, producto.nombre);
        agregarCelda(fila, producto.categoria);

        agregarCelda(
            fila,
            formatoMoneda.format(Number(producto.precio) || 0)
        );

        agregarCelda(
            fila,
            formatoMoneda.format(Number(producto.costo) || 0)
        );

        agregarCelda(fila, producto.stock);

        // Acciones
        const celdaAcciones = document.createElement("td");

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.textContent = "Editar";

        botonEditar.addEventListener("click", () => {
            editarProducto(producto.indiceOriginal);
        });

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", () => {
            eliminarProducto(producto.indiceOriginal);
        });

        celdaAcciones.appendChild(botonEditar);
        celdaAcciones.appendChild(botonEliminar);

        fila.appendChild(celdaAcciones);

        contenedor.appendChild(fila);

    });

}

// ==========================================
// AGREGAR CELDAS A LA TABLA
// ==========================================

function agregarCelda(fila, contenido) {

    const celda = document.createElement("td");

    celda.textContent = contenido;

    fila.appendChild(celda);

}

// ==========================================
// EDITAR PRODUCTO
// ==========================================

function editarProducto(indice) {

    const producto = productos[indice];

    if (!producto) return;

    indiceEdicion = indice;

    document.getElementById("nombreProducto").value =
        producto.nombre;

    document.getElementById("categoriaProducto").value =
        producto.categoria;

    document.getElementById("precioProducto").value =
        producto.precio;

    document.getElementById("costoProducto").value =
        producto.costo;

    document.getElementById("stockProducto").value =
        producto.stock;

    document.getElementById("btnGuardarProducto")
        .textContent = "Guardar cambios";

    document.getElementById("seccionProducto")
        .scrollIntoView({ behavior: "smooth" });

}

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

function eliminarProducto(indice) {

    const producto = productos[indice];

    if (!producto) return;

    const confirmar = confirm(
        `¿Estás seguro de eliminar el producto "${producto.nombre}"?`
    );

    if (!confirmar) return;

    productos.splice(indice, 1);

    guardarDatos("impulso_productos", productos);

    // Si se estaba editando el producto eliminado,
    // cancelar la edición.
    if (indiceEdicion === indice) {

        indiceEdicion = null;

        document.getElementById("formProducto").reset();

        document.getElementById("btnGuardarProducto")
            .textContent = "Guardar producto";

    } else if (indiceEdicion !== null && indiceEdicion > indice) {

        indiceEdicion--;

    }

    mostrarProductos();
    actualizarResumen();
    actualizarAlertas();

}

// ==========================================
// BUSCADOR
// ==========================================

function configurarBuscador() {

    document.getElementById("buscarProducto")
        .addEventListener("input", mostrarProductos);

}

// ==========================================
// FILTRO POR CATEGORÍA
// ==========================================

function configurarFiltros() {

    document.getElementById("filtrarCategoria")
        .addEventListener("change", mostrarProductos);

}

// ==========================================
// RESUMEN DEL INVENTARIO
// ==========================================

function actualizarResumen() {

    const totalProductos = productos.length;

    const totalUnidades = productos.reduce(
        (acumulado, producto) =>
            acumulado + (Number(producto.stock) || 0),
        0
    );

    const productosBajoStock = productos.filter(
        producto => Number(producto.stock) <= STOCK_MINIMO
    ).length;

    document.getElementById("totalProductos").textContent =
        totalProductos;

    document.getElementById("totalUnidades").textContent =
        totalUnidades;

    document.getElementById("productosBajoStock").textContent =
        productosBajoStock;

}

// ==========================================
// ALERTAS DE STOCK
// ==========================================

function actualizarAlertas() {

    const contenedor = document.getElementById("contenedorAlertas");

    contenedor.innerHTML = "";

    const productosAlerta = productos.filter(
        producto => Number(producto.stock) <= STOCK_MINIMO
    );

    if (productosAlerta.length === 0) {

        const mensaje = document.createElement("p");

        mensaje.textContent = "No hay alertas de stock.";

        contenedor.appendChild(mensaje);

        return;
    }

    productosAlerta.forEach(producto => {

        const alerta = document.createElement("div");

        alerta.classList.add("movimiento");

        const mensaje = document.createElement("p");

        mensaje.textContent =
            `${producto.nombre}: quedan ${producto.stock} unidades.`;

        alerta.appendChild(mensaje);

        contenedor.appendChild(alerta);

    });

}
