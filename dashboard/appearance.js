(() => {
    const root = document.documentElement;
    const temaGuardado = localStorage.getItem("tema");
    const tamanosFuente = ["12px", "16px", "20px"];
    const tamanoGuardado = localStorage.getItem("tamanoFuente");
    const tamanoInicial = tamanosFuente.includes(tamanoGuardado) ? tamanoGuardado : "16px";

    if (temaGuardado === "oscuro") {
        root.classList.add("oscuro");
    } else if (temaGuardado === "claro") {
        root.classList.remove("oscuro");
    } else {
        root.classList.toggle(
            "oscuro",
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );
    }

    root.style.fontSize = root.dataset.pagina === "configuracion" ? "16px" : tamanoInicial;
})();
