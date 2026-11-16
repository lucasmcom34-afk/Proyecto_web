const toggleModoOscuro = document.getElementById("toggleModoOscuro");
const selectorTamanoFuente = document.getElementById("selectorTamanoFuente");
const tamanosFuente = ["12px", "16px", "20px"];
const tamanoGuardado = localStorage.getItem("tamanoFuente");
const tamanoInicial = tamanosFuente.includes(tamanoGuardado) ? tamanoGuardado : "16px";

toggleModoOscuro.checked = document.documentElement.classList.contains("oscuro");
selectorTamanoFuente.value = tamanoInicial;

toggleModoOscuro.addEventListener("change", () => {
    const oscuro = toggleModoOscuro.checked;
    document.documentElement.classList.toggle("oscuro", oscuro);
    localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
});

selectorTamanoFuente.addEventListener("change", () => {
    const tamanoFuente = selectorTamanoFuente.value;
    if (!tamanosFuente.includes(tamanoFuente)) {
        throw new RangeError("El tamaño de fuente seleccionado no es válido.");
    }

    localStorage.setItem("tamanoFuente", tamanoFuente);
});
