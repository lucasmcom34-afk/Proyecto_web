const formatoMoneda = new Intl.NumberFormat("es-AR", {
	style: "currency",
	currency: "ARS"
});
const formatoMes = new Intl.DateTimeFormat("es-AR", {
	month: "long",
	year: "numeric"
});
const obtenerRegistros = (clave) => JSON.parse(localStorage.getItem(clave) || "[]");
const ventas = obtenerRegistros("ventas");
const gastos = obtenerRegistros("gastos");
const hoy = new Date();

function obtenerFecha(registro) {
	if (!registro.fecha) return null;

	if (/^\d{4}-\d{2}-\d{2}$/.test(registro.fecha)) {
		const [año, mes, dia] = registro.fecha.split("-").map(Number);
		const fecha = new Date(año, mes - 1, dia);
		return fecha.getFullYear() === año && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
			? fecha
			: null;
	}

	const fecha = new Date(registro.fecha);
	return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function claveMes(fecha) {
	return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function crearResumen(fecha) {
	const clave = claveMes(fecha);
	const ventasDelMes = ventas.filter((venta) => {
		const fechaVenta = obtenerFecha(venta);
		return fechaVenta && claveMes(fechaVenta) === clave;
	});
	const gastosDelMes = gastos.filter((gasto) => {
		const fechaGasto = obtenerFecha(gasto);
		return fechaGasto && claveMes(fechaGasto) === clave;
	});
	const ingresos = ventasDelMes.reduce((total, venta) => total + Number(venta.total || 0), 0);
	const egresos = gastosDelMes.reduce((total, gasto) => total + Number(gasto.monto || 0), 0);

	return { fecha, ingresos, egresos, ganancia: ingresos - egresos, ventasDelMes };
}

function mostrarEvolucion(resumenes) {
	const grafico = document.getElementById("evolucionMensual");
	const valorMaximo = Math.max(0, ...resumenes.flatMap(({ ingresos, egresos }) => [ingresos, egresos]));

	resumenes.forEach(({ fecha, ingresos, egresos }) => {
		const mes = document.createElement("div");
		mes.className = "columna-mes";
		mes.setAttribute("role", "listitem");

		const barras = document.createElement("div");
		barras.className = "barras-mes";
		[
			{ nombre: "Ventas", valor: ingresos, clase: "barra-ventas" },
			{ nombre: "Gastos", valor: egresos, clase: "barra-gastos" }
		].forEach(({ nombre, valor, clase }) => {
			const barra = document.createElement("div");
			barra.className = `barra ${clase}`;
			barra.style.height = `${valorMaximo ? (valor / valorMaximo) * 100 : 0}%`;
			barra.setAttribute("aria-label", `${nombre}: ${formatoMoneda.format(valor)}`);
			barra.title = `${nombre}: ${formatoMoneda.format(valor)}`;
			barras.append(barra);
		});

		const etiqueta = document.createElement("span");
		etiqueta.className = "etiqueta-mes";
		etiqueta.textContent = new Intl.DateTimeFormat("es-AR", { month: "short" }).format(fecha);
		const detalle = document.createElement("span");
		detalle.className = "detalle-mes";
		detalle.textContent = `${formatoMoneda.format(ingresos)} · ${formatoMoneda.format(egresos)}`;
		mes.append(barras, etiqueta, detalle);
		grafico.append(mes);
	});
}

function mostrarResumen(resumen, resumenAnterior) {
	const mes = formatoMes.format(resumen.fecha);
	document.getElementById("mesSeleccionado").textContent = `Resumen de ${mes}`;
	document.getElementById("ingresosMes").textContent = `Ingresos por ventas: ${formatoMoneda.format(resumen.ingresos)}`;
	document.getElementById("gastosMes").textContent = `Gastos: ${formatoMoneda.format(resumen.egresos)}`;
	document.getElementById("gananciaMes").textContent = `Ganancia del mes: ${formatoMoneda.format(resumen.ganancia)}`;
	document.getElementById("porcentajeGanancia").textContent = `Porcentaje de ganancia sobre ventas: ${
		resumen.ingresos ? `${((resumen.ganancia / resumen.ingresos) * 100).toFixed(1)}%` : "Sin ventas"
	}`;

	let variacion;
	if (resumenAnterior.ganancia === 0) {
		variacion = resumen.ganancia === 0 ? "0%" : "Sin base de comparación";
	} else {
		const porcentaje = ((resumen.ganancia - resumenAnterior.ganancia) / Math.abs(resumenAnterior.ganancia)) * 100;
		variacion = `${porcentaje > 0 ? "+" : ""}${porcentaje.toFixed(1)}%`;
	}
	document.getElementById("variacionGanancia").textContent =
		`Variación de la ganancia respecto al mes anterior: ${variacion}`;
}

function mostrarHistorial(resumenes) {
	const historial = document.getElementById("historialMensual");
	const primerMesVisible = resumenes[0].fecha;
	const mesesAnteriores = new Map();
	[...ventas, ...gastos].forEach((registro) => {
		const fecha = obtenerFecha(registro);
		if (!fecha || fecha >= primerMesVisible) return;
		const mes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
		mesesAnteriores.set(claveMes(mes), mes);
	});

	const resumenesAnteriores = [...mesesAnteriores.values()]
		.sort((primero, segundo) => primero - segundo)
		.map(crearResumen);
	if (resumenesAnteriores.length === 0) {
		document.getElementById("botonHistorial").hidden = true;
		return;
	}

	resumenesAnteriores.reverse().forEach((resumen) => {
		const detalle = document.createElement("p");
		detalle.textContent = `${formatoMes.format(resumen.fecha)}: ventas ${formatoMoneda.format(resumen.ingresos)} · gastos ${formatoMoneda.format(resumen.egresos)} · ganancia ${formatoMoneda.format(resumen.ganancia)}`;
		historial.append(detalle);
	});
}

function mostrarProductosMasVendidos(resumen) {
	const contenedor = document.getElementById("productosMasVendidos");
	const cantidades = new Map();
	resumen.ventasDelMes.forEach((venta) => {
		const producto = String(venta.producto || "Producto sin nombre");
		cantidades.set(producto, (cantidades.get(producto) || 0) + Number(venta.cantidad || 0));
	});

	document.getElementById("tituloProductos").textContent = `Productos más vendidos en ${formatoMes.format(resumen.fecha)}`;
	const productos = [...cantidades.entries()]
		.sort((primero, segundo) => segundo[1] - primero[1] || primero[0].localeCompare(segundo[0], "es"))
		.slice(0, 3);

	if (productos.length === 0) {
		const vacio = document.createElement("p");
		vacio.textContent = "Todavía no hay ventas registradas este mes.";
		contenedor.append(vacio);
		return;
	}

	productos.forEach(([nombre, cantidad], indice) => {
		const producto = document.createElement("p");
		producto.textContent = `${indice + 1}. ${nombre}: ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"}`;
		contenedor.append(producto);
	});
}

const resumenes = Array.from({ length: 6 }, (_, indice) => {
	const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + indice, 1);
	return crearResumen(fecha);
});
const resumenActual = resumenes[resumenes.length - 1];
const resumenAnterior = crearResumen(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));

mostrarEvolucion(resumenes);
mostrarResumen(resumenActual, resumenAnterior);
mostrarHistorial(resumenes);
mostrarProductosMasVendidos(resumenActual);

document.getElementById("botonHistorial").addEventListener("click", (evento) => {
	const boton = evento.currentTarget;
	const historial = document.getElementById("historialMensual");
	historial.hidden = !historial.hidden;
	boton.setAttribute("aria-expanded", String(!historial.hidden));
	boton.textContent = historial.hidden ? "Ver más meses" : "Ocultar meses";
});
