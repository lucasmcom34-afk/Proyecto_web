const form = document.getElementById("forgotForm");
const msg = document.getElementById("msg");
const btn = document.getElementById("btn");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.hidden = true;
    const email = document.getElementById("email").value.trim();
    if (!email) return;

    btn.disabled = true;
    try {
        const r = await fetch("/api/auth/forgot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const d = await r.json();
        msg.textContent = d.mensaje || d.error;
        msg.classList.toggle("ok", r.ok);
        msg.hidden = false;
        if (!r.ok) btn.disabled = false;
    } catch {
        msg.textContent = "No pudimos conectarnos. Intentá de nuevo.";
        msg.classList.remove("ok");
        msg.hidden = false;
        btn.disabled = false;
    }
});