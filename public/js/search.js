const IMG_BASE = "https://image.tmdb.org/t/p/w342";

function getEls() {
  return {
    grid: document.getElementById("search-results"),
    title: document.getElementById("search-title"),
    pager: document.getElementById("pager"),
  };
}

function posterUrl(path) {
  return path ? `${IMG_BASE}${path}` : "/images/placeholder.png";
}

function clear(el) {
  if (!el) return;
  el.replaceChildren();
}

function showMessage(el, text) {
  if (!el) return;
  const p = document.createElement("p");
  p.textContent = text;
  el.replaceChildren(p);
}

function createMovieCard(movie) {
  const article = document.createElement("article");
  article.className = "card";

  const link = document.createElement("a");
  link.className = "movie-card";
  link.href = `/moviepage.html?id=${encodeURIComponent(movie.id)}`;
  link.setAttribute("aria-label", `${movie.title ?? "Movie"} details`);

  const img = document.createElement("img");
  img.src = posterUrl(movie.poster_path);
  img.alt = `${movie.title ?? "Movie"} poster`;
  img.style.width = "100%";
  img.style.borderRadius = "10px";
  img.style.display = "block";

  link.appendChild(img);

  const h3 = document.createElement("h3");
  h3.textContent = movie.title ?? "Untitled";

  const p = document.createElement("p");
  const year = (movie.release_date || "").slice(0, 4) || "—";
  const score =
    typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : "—";
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

  if (page > 1) {
    wrap.appendChild(makeLink("Prev", page - 1));
  }
  if (page < totalPages) {
    if (wrap.childNodes.length) wrap.appendChild(document.createTextNode(" "));
    wrap.appendChild(makeLink("Next", page + 1));
  }
  return wrap;
}

async function run() {
  const params = new URLSearchParams(location.search);
  const q = params.get("q")?.trim() || "";
  const page = parseInt(params.get("page") || "1", 10) || 1;

  const { grid, title, pager } = getEls();

  if (title) title.textContent = q ? `Results for ${q}` : "Search";

  if (!q) {
    showMessage(grid, "Type a query above.");
    clear(pager);
    return;
  }

  try {
    showMessage(grid, "Loading…");
    clear(pager);

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`);
    if (!res.ok) {
      const txt = await res.text();
      showMessage(grid, `Search failed: ${txt}`);
      return;
    }

    const data = await res.json();
    const movies = Array.isArray(data.results) ? data.results : [];

    if (movies.length === 0) {
      showMessage(grid, "No results.");
    } else {
      const frag = document.createDocumentFragment();
      for (const m of movies) {
        frag.appendChild(createMovieCard(m));
      }
      grid.replaceChildren(frag);
    }

    const totalPages = Number(data.total_pages || 1);
    const pagerNode = createPager(q, page, totalPages);
    pager.replaceChildren(pagerNode);
  } catch (err) {
    console.error(err);
    showMessage(grid, "Unexpected error.");
  }
}

document.addEventListener("DOMContentLoaded", run);