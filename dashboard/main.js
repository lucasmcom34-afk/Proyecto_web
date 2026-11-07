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
<<<<<<< HEAD
const formatoFecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const obtenerFechaLocal = () => {
	const hoy = new Date();
	const anio = hoy.getFullYear();
	const mes = String(hoy.getMonth() + 1).padStart(2, "0");
	const dia = String(hoy.getDate()).padStart(2, "0");
	return `${anio}-${mes}-${dia}`;
};
const transaccionesPrueba = [
	{ fecha: "2026-11-06", tipo: "Venta", detalle: "Café molido · 2 un.", monto: 8400 },
	{ fecha: "2026-11-05", tipo: "Gasto", detalle: "Compra de insumos", monto: 3200 },
	{ fecha: "2026-11-04", tipo: "Venta", detalle: "Taza térmica · 1 un.", monto: 6500 },
	{ fecha: "2026-11-03", tipo: "Gasto", detalle: "Servicio de internet", monto: 1800 },
	{ fecha: "2026-11-02", tipo: "Venta", detalle: "Té en hebras · 3 un.", monto: 5700 }
];
=======
>>>>>>> 6603583a51910777590603452c8306ebcdbafa68
const dialogos = {
	venta: document.getElementById("modalVenta"),
	producto: document.getElementById("modalProducto"),
	gasto: document.getElementById("modalGasto")
};

<<<<<<< HEAD
function inicializarGraficoRendimiento() {
	const canvas = document.getElementById("graficoRendimiento");
	if (!canvas) return;
	if (typeof Chart === "undefined") {
		console.error("No se pudo cargar Chart.js para mostrar el gráfico de rendimiento.");
		return;
	}

	const ahora = new Date();
	const etiquetasMeses = [2, 1, 0].map((mesesAtras) => {
		const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - mesesAtras, 1);
		return new Intl.DateTimeFormat("es-AR", { month: "short" })
			.format(fecha)
			.replace(".", "");
	});

	new Chart(canvas, {
		type: "bar",
		data: {
			labels: etiquetasMeses,
			datasets: [
				{
					label: "Ingresos",
					data: [120000, 148000, 135000],
					backgroundColor: "rgba(34, 197, 94, 0.75)",
					borderColor: "#16A34A",
					borderWidth: 1
				},
				{
					label: "Gastos",
					data: [68000, 72000, 81000],
					backgroundColor: "rgba(244, 63, 94, 0.75)",
					borderColor: "#E11D48",
					borderWidth: 1
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						callback: (valor) => formatoMoneda.format(valor)
					}
				}
			},
			plugins: {
				tooltip: {
					callbacks: {
						label: (contexto) => `${contexto.dataset.label}: ${formatoMoneda.format(contexto.parsed.y)}`
					}
				}
			}
		}
	});
}

function actualizarResumen() {
	const ahora = new Date();
	const periodoActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
	const fechaMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
	const periodoAnterior = `${fechaMesAnterior.getFullYear()}-${String(fechaMesAnterior.getMonth() + 1).padStart(2, "0")}`;
	const tituloPeriodo = document.getElementById("periodoActual");
	const textoPeriodo = new Intl.DateTimeFormat("es-AR", {
		month: "long",
		year: "numeric"
	}).format(ahora);
	tituloPeriodo.textContent = textoPeriodo.charAt(0).toLocaleUpperCase("es-AR") + textoPeriodo.slice(1);

	const ventas = obtenerRegistros(claves.ventas);
	const gastos = obtenerRegistros(claves.gastos);
	const sumarMes = (registros, periodo, propiedad) => registros
		.filter((registro) => String(registro.fecha || "").slice(0, 7) === periodo)
		.reduce((total, registro) => total + (Number(registro[propiedad]) || 0), 0);
	const ingresos = sumarMes(ventas, periodoActual, "total");
	const totalGastos = sumarMes(gastos, periodoActual, "monto");
	const ingresosAnteriores = sumarMes(ventas, periodoAnterior, "total");
	const gastosAnteriores = sumarMes(gastos, periodoAnterior, "monto");

	document.getElementById("ingresosMes").textContent = formatoMoneda.format(ingresos);
	document.getElementById("gastosMes").textContent = formatoMoneda.format(totalGastos);
	document.getElementById("rendimientoNeto").textContent = formatoMoneda.format(ingresos - totalGastos);

	const resumenAnterior = document.getElementById("resumenMesAnterior");
	resumenAnterior.replaceChildren();
	[
		["Ingresos", ingresosAnteriores],
		["Gastos", gastosAnteriores],
		["Neto", ingresosAnteriores - gastosAnteriores]
	].forEach(([etiqueta, monto]) => {
		const linea = document.createElement("span");
		const valor = document.createElement("strong");
		linea.textContent = `${etiqueta}: `;
		valor.textContent = formatoMoneda.format(monto);
		linea.append(valor);
		resumenAnterior.append(linea);
	});

	actualizarActividadReciente(ventas, gastos);
}

function actualizarActividadReciente(ventas, gastos) {
	const filasRecientes = document.getElementById("filasRecientes");
	const movimientos = [
		...ventas.map((venta) => ({
			fecha: venta.fecha,
			tipo: "Venta",
			detalle: `${venta.producto} · ${venta.cantidad} un.`,
			monto: Number(venta.total) || 0
		})),
		...gastos.map((gasto) => ({
			fecha: gasto.fecha,
			tipo: "Gasto",
			detalle: `${gasto.descripcion} · ${gasto.categoria}`,
			monto: Number(gasto.monto) || 0
		}))
	].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
	const movimientosAMostrar = movimientos.length > 0 ? movimientos : transaccionesPrueba;

	filasRecientes.replaceChildren();

	movimientosAMostrar.slice(0, 10).forEach((movimiento) => {
		const fila = document.createElement("tr");
		const fecha = document.createElement("td");
		const tipo = document.createElement("td");
		const detalle = document.createElement("td");
		const monto = document.createElement("td");
		const fechaMovimiento = new Date(
			String(movimiento.fecha).includes("T")
				? movimiento.fecha
				: `${movimiento.fecha}T00:00:00`
		);

		fecha.textContent = formatoFecha.format(fechaMovimiento);
		tipo.textContent = movimiento.tipo;
		detalle.textContent = movimiento.detalle;
		monto.textContent = formatoMoneda.format(movimiento.monto);
		monto.className = movimiento.tipo === "Venta" ? "monto-venta" : "monto-gasto";
		fila.append(fecha, tipo, detalle, monto);
		filasRecientes.append(fila);
	});
}

=======
>>>>>>> 6603583a51910777590603452c8306ebcdbafa68
document.querySelectorAll(".opcion[data-action]").forEach((opcion) => {
	opcion.addEventListener("click", (evento) => {
		evento.preventDefault();
		if (opcion.dataset.action === "venta") actualizarProductosVenta();
		if (opcion.dataset.action === "producto") actualizarListaStock();
<<<<<<< HEAD
		if (opcion.dataset.action === "venta") document.getElementById("fecha-operacion").value = obtenerFechaLocal();
		if (opcion.dataset.action === "gasto") document.getElementById("fecha-operacion-gasto").value = obtenerFechaLocal();
=======
>>>>>>> 6603583a51910777590603452c8306ebcdbafa68
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
<<<<<<< HEAD
		fecha: datos.get("fecha")
	});
	guardarRegistros(claves.ventas, ventas);
	actualizarResumen();
=======
		fecha: new Date().toISOString()
	});
	guardarRegistros(claves.ventas, ventas);
>>>>>>> 6603583a51910777590603452c8306ebcdbafa68
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
<<<<<<< HEAD
	actualizarResumen();
=======
>>>>>>> 6603583a51910777590603452c8306ebcdbafa68
	formulario.reset();
	dialogos.gasto.close();
	if (!spanUsername) window.location.reload();
});

<<<<<<< HEAD
document.getElementById("fecha-operacion").value = obtenerFechaLocal();
document.getElementById("fecha-operacion-gasto").value = obtenerFechaLocal();
inicializarGraficoRendimiento();
actualizarResumen();
=======
document.getElementById("fechaGasto").value = new Date().toISOString().slice(0, 10);
>>>>>>> 6603583a51910777590603452c8306ebcdbafa68
})();