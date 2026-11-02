const contenedorProductos = document.getElementById("contenedor");
const resumenStock = document.getElementById("resumenStock");
const formatoMoneda = new Intl.NumberFormat("es-AR", {
	style: "currency",
	currency: "ARS"
});

function obtenerProductos() {
	try {
		const productos = JSON.parse(localStorage.getItem("productos") || "[]");
		return Array.isArray(productos) ? productos : [];
	} catch {
		return [];
	}
}

function crearDato(etiqueta, valor, clase = "") {
	const dato = document.createElement("div");
	dato.className = "producto-dato";
	const titulo = document.createElement("span");
	titulo.textContent = etiqueta;
	const contenido = document.createElement("strong");
	contenido.className = clase;
	contenido.textContent = valor;
	dato.append(titulo, contenido);
	return dato;
}

function renderizarProductos() {
	const productos = obtenerProductos();
	contenedorProductos.replaceChildren();
	resumenStock.textContent = `${productos.length} ${productos.length === 1 ? "producto" : "productos"} registrados`;

	if (productos.length === 0) {
		const estadoVacio = document.createElement("p");
		estadoVacio.className = "estado-vacio";
		estadoVacio.textContent = "Todavía no hay productos en el inventario.";
		contenedorProductos.append(estadoVacio);
		return;
	}

	productos.forEach((producto) => {
		const tarjeta = document.createElement("article");
		tarjeta.className = "producto-card";
		const etiqueta = document.createElement("p");
		etiqueta.className = "producto-etiqueta";
		etiqueta.textContent = "PRODUCTO";
		const nombre = document.createElement("h3");
		nombre.textContent = producto.nombre || "Producto sin nombre";
		const detalles = document.createElement("div");
		detalles.className = "producto-detalles";
		const precio = Number(producto.precio) || 0;
		const stock = Number(producto.stock) || 0;
		detalles.append(
			crearDato("Precio", formatoMoneda.format(precio)),
			crearDato("Disponible", `${stock} ${stock === 1 ? "unidad" : "unidades"}`, stock === 0 ? "stock-agotado" : "")
		);
		const eliminar = document.createElement("button");
		eliminar.type = "button";
		eliminar.className = "boton-eliminar";
		eliminar.dataset.deleteProduct = producto.id;
		eliminar.textContent = "Eliminar producto";
		eliminar.setAttribute("aria-label", `Eliminar ${producto.nombre || "producto"}`);
		tarjeta.append(etiqueta, nombre, detalles, eliminar);
		contenedorProductos.append(tarjeta);
	});
}

contenedorProductos.addEventListener("click", (evento) => {
	const boton = evento.target.closest("button[data-delete-product]");
	if (!boton) return;

	const producto = obtenerProductos().find((item) => item.id === boton.dataset.deleteProduct);
	if (!producto || !window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;

	const productosActualizados = obtenerProductos()
		.filter((item) => item.id !== boton.dataset.deleteProduct);
	localStorage.setItem("productos", JSON.stringify(productosActualizados));
	renderizarProductos();
});

renderizarProductos();
window.addEventListener("storage", (evento) => {
	if (evento.key === "productos") renderizarProductos();
});