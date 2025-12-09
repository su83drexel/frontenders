const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const TMDB_FALLBACK =
  "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a7614185931650f8cee23fa137b93812ccb132b9df511df1cfac.svg";

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

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderMovieSummary(summary) {
  const avgEl = document.getElementById("movie-average-rating");
  const countEl = document.getElementById("movie-rating-count");

  if (avgEl) {
    const avg =
      typeof summary?.averageRating === "number"
        ? summary.averageRating.toFixed(1)
        : summary?.averageRating || "—";
    avgEl.textContent = avg;
  }

  if (countEl) {
    countEl.textContent =
      summary && typeof summary.ratingCount === "number"
        ? String(summary.ratingCount)
        : "0";
  }
}

function renderMovieReviews(reviews) {
  const list = document.getElementById("movie-reviews-list");
  if (!list) return;

  list.textContent = "";

  if (!Array.isArray(reviews) || reviews.length === 0) {
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent =
      "No reviews yet. Once someone posts from their profile, you will see it here.";
    list.appendChild(p);
    return;
  }

  reviews.forEach((review) => {
    const item = document.createElement("div");
    item.className = "review-item";

    const header = document.createElement("div");
    header.className = "review-item-header";

    const user = document.createElement("span");
    user.className = "review-item-user";
    user.textContent =
      review?.userProfile?.displayName ||
      review?.userProfile?.userId ||
      "Unknown user";

    const meta = document.createElement("span");
    meta.className = "review-item-meta";
    const created = formatDate(review?.createdAt);
    meta.textContent = `${created || "—"} • ${review?.rating ?? "—"} ★`;

    header.appendChild(user);
    header.appendChild(meta);

    const body = document.createElement("div");
    body.className = "review-item-body";
    body.textContent = review?.text || "No review text provided.";

    item.appendChild(header);
    item.appendChild(body);
    list.appendChild(item);
  });
}

async function loadMovieReviews(movieId) {
  try {
    const res = await fetch(`/api/reviews?movieId=${encodeURIComponent(movieId)}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Request failed with ${res.status}`);
    }
    const data = await res.json();
    renderMovieSummary(data.summary);
    renderMovieReviews(data.reviews || []);
  } catch (err) {
    console.error("Failed to load reviews:", err);
    renderMovieSummary(null);
    renderMovieReviews([]);
  }
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
  const src = m.poster_path
    ? `${IMG_BASE}${m.poster_path}`
    : TMDB_FALLBACK;
  poster.setAttribute("src", src);
  poster.setAttribute("alt", `${esc(m.title)} poster`);
  poster.loading = "eager";
  poster.decoding = "async";
  poster.style.display = "block";
}

    await loadMovieReviews(id);
  } catch (err) {
    console.error(err);
    showText(overview, "Unexpected error.");
  }
}
document.addEventListener("DOMContentLoaded", run);
