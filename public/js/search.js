const IMG_BASE = "https://image.tmdb.org/t/p/w342";

function els() {
  return {
    grid: document.getElementById("search-results"),
    title: document.getElementById("search-title"),
    pager: document.getElementById("pager"),
  };
}

function posterUrl(path) {
  return path ? `${IMG_BASE}${path}` : "/placeholder-poster.png";
}

function showText(container, message) {
  const p = document.createElement("p");
  p.textContent = message;
  container.replaceChildren(p);
}

function createMovieCard(m) {
  const article = document.createElement("article");
  article.className = "card";

  const link = document.createElement("a");
  link.className = "movie-card";
  link.href = `/moviepage.html?id=${encodeURIComponent(m.id)}`;
  link.setAttribute("aria-label", `${m.title ?? "Movie"} details`);

  const img = document.createElement("img");
  img.src = posterUrl(m.poster_path);
  img.alt = `${m.title ?? "Movie"} poster`;
  img.style.width = "100%";
  img.style.borderRadius = "10px";
  img.style.display = "block";
  link.appendChild(img);

  const h3 = document.createElement("h3");
  h3.textContent = m.title ?? "Untitled";

  const p = document.createElement("p");
  const year = (m.release_date || "").slice(0, 4) || "—";
  const score = typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : "—";
  p.textContent = `${year} • ★ ${score}`;

  article.appendChild(link);
  article.appendChild(h3);
  article.appendChild(p);
  return article;
}

function createPager(q, page, totalPages) {
  const wrap = document.createElement("div");

  const makeLink = (label, targetPage) => {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = `/search.html?q=${encodeURIComponent(q)}&page=${targetPage}`;
    a.textContent = label;
    return a;
  };

  const prev = page > 1 ? makeLink("Prev", page - 1) : null;
  const next = page < totalPages ? makeLink("Next", page + 1) : null;

  if (prev) wrap.appendChild(prev);
  if (next) {
    if (prev) wrap.appendChild(document.createTextNode(" "));
    wrap.appendChild(next);
  }
  return wrap;
}

async function run() {
  const params = new URLSearchParams(location.search);
  const q = params.get("q")?.trim();
  const page = parseInt(params.get("page") || "1", 10) || 1;
  const { grid, title, pager } = els();

  if (title) title.textContent = q ? `Results for ${q}` : "Search";

  if (!q) {
    if (pager) pager.replaceChildren();
    return;
  }

  try {
    if (grid) showText(grid, "Loading…");
    if (pager) pager.replaceChildren();

    const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`);
    if (!resp.ok) {
      const text = await resp.text();
      showText(grid, `Search failed: ${text}`);
      return;
    }

    const data = await resp.json();
    const movies = data.results || [];

    if (movies.length === 0) {
      showText(grid, "No results.");
    } else {
      const frag = document.createDocumentFragment();
      movies.forEach((m) => frag.appendChild(createMovieCard(m)));
      grid.replaceChildren(frag);
    }

    const totalPages = Number(data.total_pages || 1);
    const pagerNode = createPager(q, page, totalPages);
    pager.replaceChildren(pagerNode);
  } catch (e) {
    console.error(e);
    showText(grid, "Unexpected error.");
  }
}

document.addEventListener("DOMContentLoaded", run);