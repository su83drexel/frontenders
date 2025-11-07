const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function els() {
  return {
    title: document.getElementById("movie-title"),
    meta: document.getElementById("movie-meta"),
    overview: document.getElementById("movie-overview"),
    poster: document.getElementById("movie-poster"),
  };
}

function showText(el, text) {
  if (!el) return;
  const p = document.createElement("p");
  p.textContent = text;
  el.replaceChildren(p);
}

async function run() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const { title, meta, overview, poster } = els();

  if (!id) {
    showText(overview, "Missing movie id.");
    return;
  }

  try {
    if (overview) overview.textContent = "Loading…";

    const res = await fetch(`/api/movieInfo/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const txt = await res.text();
      showText(overview, `Failed to load: ${txt}`);
      return;
    }

    const m = await res.json();

    if (title) title.textContent = m.title || "Movie";

    const year = (m.release_date || "").slice(0, 4) || "—";
    const runtime = m.runtime ? `${m.runtime} min` : "—";
    const rating =
      typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : "—";

    if (meta) meta.textContent = `${year} • ${runtime} • ★ ${rating}`;
    if (overview) overview.textContent = m.overview || "No overview.";

    if (poster) {
      if (m.poster_path) {
        poster.setAttribute("src", `${IMG_BASE}${m.poster_path}`);
        poster.setAttribute("alt", `${esc(m.title)} poster`);
        poster.style.display = "block";
      } else {
        poster.removeAttribute("src");
        poster.style.display = "none";
      }
    }
  } catch (err) {
    console.error(err);
    showText(overview, "Unexpected error.");
  }
}
document.addEventListener("DOMContentLoaded", run);