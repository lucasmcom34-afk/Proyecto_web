(function () {
// ================= MODO CLARO / OSCURO =================

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const raiz = document.documentElement;

// Actualiza el icono y la descripción del botón
function actualizarBotonTema() {
    const oscuro = raiz.classList.contains("oscuro");

    if (themeIcon) {
        themeIcon.textContent = oscuro ? "☀" : "☾";
    }

    if (themeToggle) {
        themeToggle.setAttribute(
            "aria-label",
            oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
        );

        themeToggle.setAttribute(
            "title",
            oscuro ? "Modo oscuro" : "Modo claro"
        );
    }
}

// Actualiza el botón al cargar la página
actualizarBotonTema();

// Cambia el tema al hacer clic
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const oscuro = raiz.classList.toggle("oscuro");

        localStorage.setItem("tema", oscuro ? "oscuro" : "claro");

        actualizarBotonTema();
    });
}


const spanUsername = document.getElementById("username");
if (spanUsername) spanUsername.textContent = localStorage.getItem("nombre") || "invitado";

const claves = {
	productos: "productos",
	ventas: "ventas",
	gastos: "gastos"
};

const obtenerRegistros = (clave) => JSON.parse(localStorage.getItem(clave) || "[]");
const guardarRegistros = (clave, registros) => localStorage.setItem(clave, JSON.stringify(registros));
const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const dialogos = {
	venta: document.getElementById("modalVenta"),
	producto: document.getElementById("modalProducto"),
	gasto: document.getElementById("modalGasto")
};

document.querySelectorAll(".opcion[data-action]").forEach((opcion) => {
	opcion.addEventListener("click", (evento) => {
		evento.preventDefault();
		if (opcion.dataset.action === "venta") actualizarProductosVenta();
		if (opcion.dataset.action === "producto") actualizarListaStock();
		dialogos[opcion.dataset.action].showModal();
	});
});

document.querySelectorAll("[data-close]").forEach((boton) => {
	boton.addEventListener("click", () => boton.closest("dialog").close());
});

Object.values(dialogos).forEach((dialogo) => {
	dialogo.addEventListener("click", (evento) => {
		if (evento.target === dialogo) dialogo.close();
	});
});

const productoVenta = document.getElementById("productoVenta");
const cantidadVenta = document.getElementById("cantidadVenta");
const totalVenta = document.getElementById("totalVenta");
const listaStock = document.getElementById("listaStock");

function actualizarListaStock() {
	listaStock.replaceChildren();
	const productos = obtenerRegistros(claves.productos);

	if (productos.length === 0) {
		const vacio = document.createElement("p");
		vacio.className = "sin-actividad";
		vacio.textContent = "Todavía no hay productos para ajustar.";
		listaStock.append(vacio);
		return;
	}

	productos.forEach((producto) => {
		const fila = document.createElement("div");
		fila.className = "stock-producto";
		const datos = document.createElement("div");
		datos.className = "stock-datos";
		const nombre = document.createElement("strong");
		nombre.textContent = producto.nombre;
		const cantidadActual = document.createElement("span");
		cantidadActual.textContent = `Stock: ${producto.stock}`;
		datos.append(nombre, cantidadActual);

		const controles = document.createElement("div");
		controles.className = "stock-controles";
		const cantidad = document.createElement("input");
		cantidad.type = "number";
		cantidad.min = "1";
		cantidad.step = "1";
		cantidad.value = "1";
		cantidad.setAttribute("aria-label", `Cantidad a ajustar de ${producto.nombre}`);
		const sumar = document.createElement("button");
		sumar.type = "button";
		sumar.dataset.stockAction = "sumar";
		sumar.dataset.productId = producto.id;
		sumar.title = `Sumar stock de ${producto.nombre}`;
		sumar.setAttribute("aria-label", `Sumar stock de ${producto.nombre}`);
		sumar.textContent = "+";
		const descontar = document.createElement("button");
		descontar.type = "button";
		descontar.dataset.stockAction = "descontar";
		descontar.dataset.productId = producto.id;
		descontar.title = `Descontar stock de ${producto.nombre}`;
		descontar.setAttribute("aria-label", `Descontar stock de ${producto.nombre}`);
		descontar.textContent = "−";
		descontar.disabled = producto.stock === 0;
		controles.append(cantidad, sumar, descontar);
		fila.append(datos, controles);
		listaStock.append(fila);
	});
}

listaStock.addEventListener("click", (evento) => {
	const boton = evento.target.closest("button[data-stock-action]");
	if (!boton) return;

	const fila = boton.closest(".stock-producto");
	const cantidad = Number(fila.querySelector("input").value);
	const productos = obtenerRegistros(claves.productos);
	const producto = productos.find((item) => item.id === boton.dataset.productId);
	const mensaje = document.getElementById("mensajeStock");

	if (!producto || !Number.isInteger(cantidad) || cantidad < 1) {
		mensaje.textContent = "Ingresá una cantidad entera mayor que cero.";
		return;
	}
	if (boton.dataset.stockAction === "descontar" && cantidad > producto.stock) {
		mensaje.textContent = "No se puede descontar más unidades que las disponibles.";
		return;
	}

	producto.stock += boton.dataset.stockAction === "sumar" ? cantidad : -cantidad;
	guardarRegistros(claves.productos, productos);
	document.getElementById("mensajeStock").textContent = "Stock actualizado.";
	actualizarListaStock();
});

function actualizarProductosVenta() {
	const productos = obtenerRegistros(claves.productos);
	productoVenta.replaceChildren(new Option("Seleccionar producto", ""));
	productos.filter((producto) => producto.stock > 0).forEach((producto) => {
		productoVenta.add(new Option(`${producto.nombre} · ${formatoMoneda.format(producto.precio)} (stock: ${producto.stock})`, producto.id));
	});
	actualizarTotalVenta();
}

function actualizarTotalVenta() {
	const producto = obtenerRegistros(claves.productos).find((item) => item.id === productoVenta.value);
	const cantidad = Number(cantidadVenta.value);
	totalVenta.value = formatoMoneda.format(producto && cantidad > 0 ? producto.precio * cantidad : 0);
	cantidadVenta.max = producto ? String(producto.stock) : "";
}

productoVenta.addEventListener("change", actualizarTotalVenta);
cantidadVenta.addEventListener("input", actualizarTotalVenta);

document.getElementById("formProducto").addEventListener("submit", (evento) => {
	evento.preventDefault();
	const formulario = evento.currentTarget;
	const datos = new FormData(formulario);
	const productos = obtenerRegistros(claves.productos);
	productos.push({
		id: crypto.randomUUID(),
		nombre: datos.get("nombre").trim(),
		precio: Number(datos.get("precio")),
		stock: Number(datos.get("stock"))
	});
	guardarRegistros(claves.productos, productos);
	formulario.reset();
	document.getElementById("mensajeProducto").textContent = "Producto agregado al inventario.";
	document.getElementById("mensajeStock").textContent = "";
	actualizarListaStock();
	if (!spanUsername) window.location.reload();
});

document.getElementById("formVenta").addEventListener("submit", (evento) => {
	evento.preventDefault();
	const formulario = evento.currentTarget;
	const datos = new FormData(formulario);
	const productos = obtenerRegistros(claves.productos);
	const producto = productos.find((item) => item.id === datos.get("producto"));
	const cantidad = Number(datos.get("cantidad"));
	const mensaje = document.getElementById("mensajeVenta");

	if (!producto || cantidad < 1 || cantidad > producto.stock) {
		mensaje.textContent = "Seleccioná un producto con stock suficiente.";
		return;
	}

	producto.stock -= cantidad;
	guardarRegistros(claves.productos, productos);
	const ventas = obtenerRegistros(claves.ventas);
	ventas.push({
		id: crypto.randomUUID(),
		productoId: producto.id,
		producto: producto.nombre,
		cantidad,
		metodoPago: datos.get("pago"),
		total: producto.precio * cantidad,
		fecha: new Date().toISOString()
	});
	guardarRegistros(claves.ventas, ventas);
	formulario.reset();
	cantidadVenta.value = "1";
	totalVenta.value = formatoMoneda.format(0);
	mensaje.textContent = "";
	dialogos.venta.close();
	if (!spanUsername) window.location.reload();
});

document.getElementById("formGasto").addEventListener("submit", (evento) => {
	evento.preventDefault();
	const formulario = evento.currentTarget;
	const datos = new FormData(formulario);
	const gastos = obtenerRegistros(claves.gastos);
	gastos.push({
		id: crypto.randomUUID(),
		descripcion: datos.get("descripcion").trim(),
		categoria: datos.get("categoria"),
		monto: Number(datos.get("monto")),
		fecha: datos.get("fecha")
	});
	guardarRegistros(claves.gastos, gastos);
	formulario.reset();
	dialogos.gasto.close();
	if (!spanUsername) window.location.reload();
});

document.getElementById("fechaGasto").value = new Date().toISOString().slice(0, 10);
})();