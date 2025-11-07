async function include(selector, url) {
    const host = document.querySelector(selector);
    if (!host) return;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;

    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const frag = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach((n) => frag.appendChild(n));

    host.replaceChildren(frag);
}

(async function bootLayout() {
    await include("#site-header", "/partials/header.html");
    await include("#site-footer", "/partials/footer.html");

    const footer = document.getElementById("site-footer");
    const yearEl = footer ? footer.querySelector(".year") : null;
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();