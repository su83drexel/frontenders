const IMG_BASE = "https://image.tmdb.org/t/p/w500";

function esc(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

function els() {
  return {
    title: document.getElementById("movie-title"),
    meta: document.getElementById("movie-meta"),
    overview: document.getElementById("movie-overview"),
    poster: document.getElementById("movie-poster"),
  };
}

async function run() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const { title, meta, overview, poster } = els();

  if (!id) {
    if (overview) overview.textContent = "Missing movie id.";
    return;
  }

  try {
    if (overview) overview.textContent = "Loading…";
    const resp = await fetch(`/api/movieInfo/${encodeURIComponent(id)}`);
    if (!resp.ok) {
      overview.textContent = `Failed to load: ${await resp.text()}`;
      return;
    }
    const m = await resp.json();

    if (title) title.textContent = m.title || "Movie";
    const year = (m.release_date || "").slice(0,4) || "—";
    const runtime = m.runtime ? `${m.runtime} min` : "—";
    const rating = typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : "—";

    if (meta) meta.textContent = `${year} • ${runtime} • ★ ${rating}`;
    if (overview) overview.textContent = m.overview || "No overview.";
    if (poster && m.poster_path) {
      poster.setAttribute("src", `${IMG_BASE}${m.poster_path}`);
      poster.setAttribute("alt", `${esc(m.title)} poster`);
      poster.style.display = "block";
    }
  } catch (e) {
    console.error(e);
    if (overview) overview.textContent = "Unexpected error.";
  }
}

document.addEventListener("DOMContentLoaded", run);