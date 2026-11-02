const formatoMoneda = new Intl.NumberFormat("es-AR", {
	style: "currency",
	currency: "ARS"
});
const formatoFecha = new Intl.DateTimeFormat("es-AR", {
	dateStyle: "medium",
	timeStyle: "short"
});
const ventasPorPagina = 10;
const ventas = JSON.parse(localStorage.getItem("ventas") || "[]");
const gastos = JSON.parse(localStorage.getItem("gastos") || "[]");
const contenedorVentas = document.getElementById("contenedorVentas");
const botonVentas = document.getElementById("botonVentas");
const contenedorGastos = document.getElementById("contenedorGastos");
const botonGastos = document.getElementById("botonGastos");
let ventasMostradas = 0;
let gastosMostrados = 0;

const fechaValida = (venta) => {
	if (/^\d{4}-\d{2}-\d{2}$/.test(venta.fecha)) {
		const [año, mes, dia] = venta.fecha.split("-").map(Number);
		const fecha = new Date(año, mes - 1, dia);
		return fecha.getFullYear() === año && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
			? fecha
			: null;
	}

	const fecha = new Date(venta.fecha);
	return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const ahora = new Date();
const esDelMesActual = (registro) => {
	const fecha = fechaValida(registro);
	return fecha && fecha.getFullYear() === ahora.getFullYear() && fecha.getMonth() === ahora.getMonth();
};
const ventasDelMes = ventas.filter((venta) => {
	return esDelMesActual(venta);
});
const importeTotalMes = ventasDelMes.reduce((total, venta) => total + Number(venta.total), 0);
const unidadesVendidas = ventasDelMes.reduce((total, venta) => total + Number(venta.cantidad), 0);
const gastosDelMes = gastos.filter(esDelMesActual);
const gastoTotalMes = gastosDelMes.reduce((total, gasto) => total + Number(gasto.monto), 0);

document.getElementById("ventasRealizadas").textContent = String(ventasDelMes.length);
document.getElementById("importeTotalMes").textContent = formatoMoneda.format(importeTotalMes);
document.getElementById("unidadesVendidas").textContent = String(unidadesVendidas);
document.getElementById("ticketPromedio").textContent = formatoMoneda.format(
	ventasDelMes.length ? importeTotalMes / ventasDelMes.length : 0
);
document.getElementById("gastosRealizados").textContent = String(gastosDelMes.length);
document.getElementById("gastoTotalMes").textContent = formatoMoneda.format(gastoTotalMes);
document.getElementById("gastoPromedio").textContent = formatoMoneda.format(
	gastosDelMes.length ? gastoTotalMes / gastosDelMes.length : 0
);

function agregarVentas() {
	const siguientesVentas = ventas
		.slice(ventasMostradas, ventasMostradas + ventasPorPagina);

	siguientesVentas.forEach((venta) => {
		const registro = document.createElement("article");
		registro.className = "registro-venta";

		const detalle = document.createElement("div");
		const producto = document.createElement("h3");
		producto.textContent = venta.producto;
		const fecha = document.createElement("p");
		fecha.textContent = formatoFecha.format(fechaValida(venta));
		const datos = document.createElement("p");
		datos.textContent = `${venta.cantidad} ${Number(venta.cantidad) === 1 ? "unidad" : "unidades"} · ${venta.metodoPago}`;
		detalle.append(producto, fecha, datos);

		const total = document.createElement("strong");
		total.className = "total-registro-venta";
		total.textContent = formatoMoneda.format(Number(venta.total));
		const acciones = document.createElement("div");
		acciones.className = "acciones-registro";
		const eliminar = document.createElement("button");
		eliminar.type = "button";
		eliminar.className = "boton-eliminar";
		eliminar.dataset.deleteSale = venta.id;
		eliminar.textContent = "Eliminar";
		eliminar.setAttribute("aria-label", `Eliminar venta de ${venta.producto}`);
		acciones.append(total, eliminar);
		registro.append(detalle, acciones);
		contenedorVentas.append(registro);
	});

	ventasMostradas += siguientesVentas.length;
	botonVentas.hidden = ventasMostradas >= ventas.length;
}

function agregarGastos() {
	const siguientesGastos = gastos.slice(gastosMostrados, gastosMostrados + ventasPorPagina);

	siguientesGastos.forEach((gasto) => {
		const registro = document.createElement("article");
		registro.className = "registro-venta";

		const detalle = document.createElement("div");
		const descripcion = document.createElement("h3");
		descripcion.textContent = gasto.descripcion;
		const fecha = document.createElement("p");
		const fechaGasto = fechaValida(gasto);
		fecha.textContent = fechaGasto ? formatoFecha.format(fechaGasto) : "Fecha no disponible";
		const categoria = document.createElement("p");
		categoria.textContent = gasto.categoria;
		detalle.append(descripcion, fecha, categoria);

		const monto = document.createElement("strong");
		monto.className = "total-registro-venta";
		monto.textContent = formatoMoneda.format(Number(gasto.monto));
		const acciones = document.createElement("div");
		acciones.className = "acciones-registro";
		const eliminar = document.createElement("button");
		eliminar.type = "button";
		eliminar.className = "boton-eliminar";
		eliminar.dataset.deleteExpense = gasto.id;
		eliminar.textContent = "Eliminar";
		eliminar.setAttribute("aria-label", `Eliminar gasto de ${gasto.descripcion}`);
		acciones.append(monto, eliminar);
		registro.append(detalle, acciones);
		contenedorGastos.append(registro);
	});

	gastosMostrados += siguientesGastos.length;
	botonGastos.hidden = gastosMostrados >= gastos.length;
}

if (ventas.length === 0) {
	const vacio = document.createElement("p");
	vacio.className = "sin-actividad";
	vacio.textContent = "Todavía no hay ventas registradas.";
	contenedorVentas.append(vacio);
	botonVentas.hidden = true;
} else {
	ventas.sort((primera, segunda) => fechaValida(segunda) - fechaValida(primera));
	agregarVentas();
	botonVentas.addEventListener("click", agregarVentas);
}

if (gastos.length === 0) {
	const vacio = document.createElement("p");
	vacio.className = "sin-actividad";
	vacio.textContent = "Todavía no hay gastos registrados.";
	contenedorGastos.append(vacio);
	botonGastos.hidden = true;
} else {
	gastos.sort((primero, segundo) => fechaValida(segundo) - fechaValida(primero));
	agregarGastos();
	botonGastos.addEventListener("click", agregarGastos);
}

contenedorVentas.addEventListener("click", (evento) => {
	const boton = evento.target.closest("button[data-delete-sale]");
	if (!boton) return;

	const venta = ventas.find((item) => item.id === boton.dataset.deleteSale);
	if (!venta || !window.confirm("¿Eliminar esta venta? Si el producto sigue registrado, se repondrá el stock.")) return;

	const productos = JSON.parse(localStorage.getItem("productos") || "[]");
	const producto = productos.find((item) => item.id === venta.productoId);
	const cantidad = Number(venta.cantidad);
	const stockActual = Number(producto?.stock);
	if (producto && Number.isFinite(cantidad) && cantidad > 0 && Number.isFinite(stockActual)) {
		producto.stock = stockActual + cantidad;
		localStorage.setItem("productos", JSON.stringify(productos));
	}

	localStorage.setItem(
		"ventas",
		JSON.stringify(ventas.filter((item) => item.id !== venta.id))
	);
	window.location.reload();
});

contenedorGastos.addEventListener("click", (evento) => {
	const boton = evento.target.closest("button[data-delete-expense]");
	if (!boton) return;

	const gasto = gastos.find((item) => item.id === boton.dataset.deleteExpense);
	if (!gasto || !window.confirm("¿Eliminar este gasto?")) return;

	localStorage.setItem(
		"gastos",
		JSON.stringify(gastos.filter((item) => item.id !== gasto.id))
	);
	window.location.reload();
});
