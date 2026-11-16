(function () {
const spanUsername = document.getElementById("username");
const promptNombrePreferido = document.getElementById("promptNombrePreferido");
const formNombrePreferido = document.getElementById("formNombrePreferido");

async function obtenerIdentificadorUsuario() {
	const idGuardado = localStorage.getItem("idUsuario");
	if (idGuardado) return idGuardado;

	try {
		const respuesta = await fetch("/api/auth/me");
		if (respuesta.ok) {
			const datos = await respuesta.json();
			if (!datos.usuario || datos.usuario.id === undefined || datos.usuario.id === null) {
				throw new TypeError("La respuesta de sesión no incluye el identificador del usuario.");
			}

			const idUsuario = String(datos.usuario.id);
			localStorage.setItem("idUsuario", idUsuario);
			if (datos.usuario.nombre && !localStorage.getItem("nombre")) {
				localStorage.setItem("nombre", datos.usuario.nombre);
			}
			return idUsuario;
		}

		if (respuesta.status !== 401) {
			console.error(`No se pudo obtener el usuario actual (HTTP ${respuesta.status}).`);
		}
	} catch (error) {
		console.error("No se pudo identificar al usuario actual.", error);
	}

	return (localStorage.getItem("nombre") || "invitado").trim() || "invitado";
}

function actualizarNombrePanel(nombre) {
	const nombreUsuarioPanel = document.getElementById("nombreUsuarioPanel");
	if (nombreUsuarioPanel) nombreUsuarioPanel.textContent = nombre;

	const avatarUsuario = document.getElementById("avatarUsuario");
	if (avatarUsuario) avatarUsuario.textContent = Array.from(nombre)[0].toLocaleUpperCase("es");
}

async function inicializarNombrePreferido() {
	const idUsuario = await obtenerIdentificadorUsuario();
	const claveNombrePreferido = `nombrePreferido:${idUsuario}`;
	const nombrePreferido = localStorage.getItem(claveNombrePreferido);

	if (spanUsername) spanUsername.textContent = nombrePreferido ? `, ${nombrePreferido}` : "";
	if (nombrePreferido) actualizarNombrePanel(nombrePreferido);
	if (!promptNombrePreferido || nombrePreferido) return;

	promptNombrePreferido.addEventListener("cancel", (evento) => evento.preventDefault());
	promptNombrePreferido.showModal();

	const inputNombre = document.getElementById("nombrePreferido");
	inputNombre.addEventListener("input", () => inputNombre.setCustomValidity(""));
	formNombrePreferido.addEventListener("submit", (evento) => {
		evento.preventDefault();
		const nombreElegido = inputNombre.value.trim();

		if (!nombreElegido) {
			inputNombre.setCustomValidity("Escribí cómo te gustaría que te llamemos.");
			inputNombre.reportValidity();
			return;
		}

		inputNombre.setCustomValidity("");
		localStorage.setItem(claveNombrePreferido, nombreElegido);
		localStorage.setItem(`ultimoCambioNombre:${idUsuario}`, String(Date.now()));
		if (spanUsername) spanUsername.textContent = `, ${nombreElegido}`;
		actualizarNombrePanel(nombreElegido);
		promptNombrePreferido.close();
	});
}

if (promptNombrePreferido) inicializarNombrePreferido();

const claves = {
	productos: "productos",
	ventas: "ventas",
	gastos: "gastos"
};

const obtenerRegistros = (clave) => {
	const registros = JSON.parse(localStorage.getItem(clave) || "[]");
	if (!Array.isArray(registros)) {
		throw new TypeError(`Los datos de ${clave} deben ser una lista.`);
	}
	return registros;
};
const guardarRegistros = (clave, registros) => localStorage.setItem(clave, JSON.stringify(registros));
const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const formatoFecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const obtenerFechaLocal = () => {
	const hoy = new Date();
	const anio = hoy.getFullYear();
	const mes = String(hoy.getMonth() + 1).padStart(2, "0");
	const dia = String(hoy.getDate()).padStart(2, "0");
	return `${anio}-${mes}-${dia}`;
};
const obtenerPeriodo = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
function obtenerPeriodoRegistro(registro) {
	const valorFecha = String(registro.fecha || "");
	const fechaIso = valorFecha.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
	let fecha;

	if (fechaIso) {
		const [, anioTexto, mesTexto, diaTexto] = fechaIso;
		const anio = Number(anioTexto);
		const mes = Number(mesTexto);
		const dia = Number(diaTexto);
		fecha = new Date(anio, mes - 1, dia);
		if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
			return null;
		}
	} else {
		fecha = new Date(valorFecha);
		if (Number.isNaN(fecha.getTime())) return null;
	}

	return obtenerPeriodo(fecha);
}
const sumarEnPeriodo = (registros, periodo, propiedad) => registros
	.filter((registro) => obtenerPeriodoRegistro(registro) === periodo)
	.reduce((total, registro) => {
		const monto = Number(registro[propiedad]);
		return total + (Number.isFinite(monto) ? monto : 0);
	}, 0);
const transaccionesPrueba = [
	{ fecha: "2026-11-06", tipo: "Venta", detalle: "Café molido · 2 un.", monto: 8400 },
	{ fecha: "2026-11-05", tipo: "Gasto", detalle: "Compra de insumos", monto: 3200 },
	{ fecha: "2026-11-04", tipo: "Venta", detalle: "Taza térmica · 1 un.", monto: 6500 },
	{ fecha: "2026-11-03", tipo: "Gasto", detalle: "Servicio de internet", monto: 1800 },
	{ fecha: "2026-11-02", tipo: "Venta", detalle: "Té en hebras · 3 un.", monto: 5700 }
];
const dialogos = {
	venta: document.getElementById("modalVenta"),
	producto: document.getElementById("modalProducto"),
	gasto: document.getElementById("modalGasto")
};

let graficoRendimiento = null;
let graficosTorta = [];

function renderizarGraficoRendimiento(ventas, gastos, fechaReferencia = new Date()) {
	const canvas = document.getElementById("graficoRendimiento");
	if (!canvas) return;
	if (typeof Chart === "undefined") {
		console.error("No se pudo cargar Chart.js para mostrar el gráfico de rendimiento.");
		return;
	}

	const periodos = [2, 1, 0].map((mesesAtras) => new Date(
		fechaReferencia.getFullYear(),
		fechaReferencia.getMonth() - mesesAtras,
		1
	));
	const periodosConEtiqueta = periodos.map((fecha) => ({
		periodo: obtenerPeriodo(fecha),
		etiqueta: new Intl.DateTimeFormat("es-AR", { month: "short" })
			.format(fecha)
			.replace(".", ""),
		titulo: new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" })
			.format(fecha)
	}));
	const ingresosPorMes = periodosConEtiqueta.map(({ periodo }) => sumarEnPeriodo(ventas, periodo, "total"));
	const gastosPorMes = periodosConEtiqueta.map(({ periodo }) => sumarEnPeriodo(gastos, periodo, "monto"));
	const tipoGuardado = localStorage.getItem("tipoGrafico");
	const tiposPermitidos = ["bar", "pie"];
	const tipoGrafico = tipoGuardado && tiposPermitidos.includes(tipoGuardado) ? tipoGuardado : "bar";

	if (tipoGuardado && !tiposPermitidos.includes(tipoGuardado)) {
		console.error(`El tipo de gráfico guardado "${tipoGuardado}" no es válido. Se mostrarán barras.`);
	}

	const estadoGrafico = document.getElementById("estadoGrafico");
	const graficosTortaContenedor = document.getElementById("graficosTorta");
	const contenedorGrafico = document.getElementById("contenedorGraficoRendimiento");
	const hayDatos = ingresosPorMes.some((monto) => monto !== 0)
		|| gastosPorMes.some((monto) => monto !== 0);
	canvas.hidden = !hayDatos || tipoGrafico === "pie";
	if (estadoGrafico) {
		estadoGrafico.hidden = hayDatos;
	}
	if (!graficosTortaContenedor || !contenedorGrafico) {
		console.error("Faltan contenedores necesarios para mostrar el gráfico de rendimiento.");
		return;
	}
	graficosTortaContenedor.hidden = !hayDatos || tipoGrafico !== "pie";
	graficosTortaContenedor.replaceChildren();
	contenedorGrafico.classList.toggle("torta-activa", tipoGrafico === "pie" && hayDatos);

	if (graficoRendimiento) {
		graficoRendimiento.destroy();
		graficoRendimiento = null;
	}
	graficosTorta.forEach((grafico) => grafico.destroy());
	graficosTorta = [];
	if (!hayDatos) return;

	const colores = {
		ingresos: { fondo: "rgba(22, 163, 106, 0.82)", borde: "#16A36A" },
		gastos: { fondo: "rgba(244, 63, 94, 0.82)", borde: "#F43F5E" }
	};
	const etiquetasMeses = periodosConEtiqueta.map(({ etiqueta }) => etiqueta);
	const contextoEstilos = getComputedStyle(document.documentElement);
	const colorTexto = contextoEstilos.getPropertyValue("--texto").trim();

	if (tipoGrafico === "pie") {
		periodosConEtiqueta.forEach(({ titulo }, indice) => {
			const tarjeta = document.createElement("article");
			tarjeta.className = "tarjeta-grafico-mes";
			const encabezado = document.createElement("h3");
			encabezado.textContent = titulo.charAt(0).toLocaleUpperCase("es-AR") + titulo.slice(1);
			tarjeta.append(encabezado);

			const valoresDelMes = [ingresosPorMes[indice], gastosPorMes[indice]];
			if (valoresDelMes.every((monto) => monto === 0)) {
				const mensaje = document.createElement("p");
				mensaje.className = "mes-sin-movimientos";
				mensaje.textContent = "Sin movimientos";
				tarjeta.append(mensaje);
			} else {
				const lienzo = document.createElement("canvas");
				lienzo.setAttribute("role", "img");
				lienzo.setAttribute("aria-label", `Ingresos y gastos de ${titulo}`);
				tarjeta.append(lienzo);

				const totalMes = valoresDelMes.reduce((total, monto) => total + monto, 0);
				const grafico = new Chart(lienzo, {
					type: "pie",
					data: {
						labels: ["Ingresos", "Gastos"],
						datasets: [{
							data: valoresDelMes,
							backgroundColor: [colores.ingresos.fondo, colores.gastos.fondo],
							borderColor: contextoEstilos.getPropertyValue("--superficie").trim(),
							borderWidth: 3,
							hoverOffset: 8
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						animation: { duration: 450 },
						plugins: {
							legend: {
								position: "bottom",
								labels: {
									color: colorTexto,
									usePointStyle: true,
									pointStyle: "circle",
									padding: 12,
									font: { family: "Plus Jakarta Sans", size: 11, weight: "600" }
								}
							},
							tooltip: {
								callbacks: {
									label: (contexto) => {
										const monto = Number(contexto.parsed) || 0;
										const porcentaje = totalMes > 0 ? (monto / totalMes) * 100 : 0;
										return `${contexto.label}: ${formatoMoneda.format(monto)} (${porcentaje.toFixed(1)}%)`;
									}
								}
							}
						}
					}
				});
				graficosTorta.push(grafico);
			}

			graficosTortaContenedor.append(tarjeta);
		});
		return;
	}

	const colorBorde = contextoEstilos.getPropertyValue("--borde").trim();
	const formatoEje = new Intl.NumberFormat("es-AR", {
		style: "currency",
		currency: "ARS",
		notation: "compact",
		maximumFractionDigits: 1
	});

	const opciones = {
		responsive: true,
		maintainAspectRatio: false,
		animation: { duration: 450 },
		plugins: {
			legend: {
				position: "top",
				labels: {
					color: colorTexto,
					usePointStyle: true,
					pointStyle: "circle",
					padding: 20,
					font: { family: "Plus Jakarta Sans", size: 12, weight: "600" }
				}
			},
			tooltip: {
				callbacks: {
					label: (contexto) => `${contexto.dataset.label}: ${formatoMoneda.format(Number(contexto.parsed.y) || 0)}`
				}
			}
		}
	};

	const datos = {
		labels: etiquetasMeses,
		datasets: [
			{
				label: "Ingresos",
				data: ingresosPorMes,
				backgroundColor: colores.ingresos.fondo,
				borderColor: colores.ingresos.borde,
				borderWidth: 1,
				borderRadius: 7,
				borderSkipped: false,
				maxBarThickness: 46
			},
			{
				label: "Gastos",
				data: gastosPorMes,
				backgroundColor: colores.gastos.fondo,
				borderColor: colores.gastos.borde,
				borderWidth: 1,
				borderRadius: 7,
				borderSkipped: false,
				maxBarThickness: 46
			}
		]
	};

	opciones.scales = {
		x: {
			grid: { display: false },
			ticks: { color: colorTexto, font: { family: "Plus Jakarta Sans" } },
			border: { display: false }
		},
		y: {
			beginAtZero: true,
			grid: { color: colorBorde, drawBorder: false },
			ticks: {
				color: colorTexto,
				callback: (valor) => formatoEje.format(valor),
				font: { family: "Plus Jakarta Sans" }
			},
			border: { display: false }
		}
	};

	canvas.setAttribute("aria-label", "Comparación de ingresos y gastos por mes durante los últimos tres meses");
	graficoRendimiento = new Chart(canvas, { type: "bar", data: datos, options: opciones });
}

function actualizarResumen() {
	if (!document.getElementById("periodoActual")) return;

	const ahora = new Date();
	const periodoActual = obtenerPeriodo(ahora);
	const fechaMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
	const periodoAnterior = obtenerPeriodo(fechaMesAnterior);
	const tituloPeriodo = document.getElementById("periodoActual");
	const textoPeriodo = new Intl.DateTimeFormat("es-AR", {
		month: "long",
		year: "numeric"
	}).format(ahora);
	tituloPeriodo.textContent = textoPeriodo.charAt(0).toLocaleUpperCase("es-AR") + textoPeriodo.slice(1);

	const ventas = obtenerRegistros(claves.ventas);
	const gastos = obtenerRegistros(claves.gastos);
	const ingresos = sumarEnPeriodo(ventas, periodoActual, "total");
	const totalGastos = sumarEnPeriodo(gastos, periodoActual, "monto");
	const ingresosAnteriores = sumarEnPeriodo(ventas, periodoAnterior, "total");
	const gastosAnteriores = sumarEnPeriodo(gastos, periodoAnterior, "monto");

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
	renderizarGraficoRendimiento(ventas, gastos, ahora);
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

document.querySelectorAll(".opcion[data-action]").forEach((opcion) => {
	opcion.addEventListener("click", (evento) => {
		evento.preventDefault();
		if (opcion.dataset.action === "venta") actualizarProductosVenta();
		if (opcion.dataset.action === "producto") actualizarListaStock();
		if (opcion.dataset.action === "venta" || opcion.dataset.action === "gasto") {
			dialogos[opcion.dataset.action]
				.querySelectorAll('input[type="date"][name="fecha"]')
				.forEach((fecha) => {
					fecha.value = obtenerFechaLocal();
				});
		}
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
		fecha: datos.get("fecha") || obtenerFechaLocal()
	});
	guardarRegistros(claves.ventas, ventas);
	actualizarResumen();
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
		fecha: datos.get("fecha") || obtenerFechaLocal()
	});
	guardarRegistros(claves.gastos, gastos);
	actualizarResumen();
	formulario.reset();
	dialogos.gasto.close();
	if (!spanUsername) window.location.reload();
});

document.querySelectorAll('input[type="date"][name="fecha"]').forEach((fecha) => {
	fecha.value = obtenerFechaLocal();
});
if (document.getElementById("periodoActual")) {
	actualizarResumen();
}
})();
