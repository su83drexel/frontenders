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

const authModulePromise = import("/js/auth.js").catch((err) => {
    console.error("Failed to load auth UI", err);
    return null;
});

(async function bootLayout() {
    const headerPromise = include("#site-header", "/partials/header.html");
    const footerPromise = include("#site-footer", "/partials/footer.html");

    await Promise.all([headerPromise, footerPromise]);
    await authModulePromise;
    window.dispatchEvent(new Event("ff:header-ready"));

    const footer = document.getElementById("site-footer");
    const yearEl = footer ? footer.querySelector(".year") : null;
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
