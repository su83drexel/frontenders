const IMG_BASE = "https://image.tmdb.org/t/p/w342";

const TMDB_FALLBACK =
  "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-38-picture-grey-c2ebdbb057f2a7614185931650f8cee23fa137b93812ccb132b9df511df1cfac.svg";

function posterUrl(path) {
  return path ? `${IMG_BASE}${path}` : TMDB_FALLBACK;
}

export function createMovieCard(movie) {
  const article = document.createElement("article");
  article.className = "card";

  const link = document.createElement("a");
  link.className = "movie-card";
  link.href = `/moviePage.html?id=${encodeURIComponent(movie.id)}`;
  link.setAttribute("aria-label", `${movie.title ?? "Movie"} details`);

  const wrap = document.createElement("div");
  wrap.className = "poster-wrap";

  const img = document.createElement("img");
  img.src = posterUrl(movie.poster_path);
  img.alt = `${movie.title ?? "Movie"} poster`;
  img.style.width = "100%";
  img.style.borderRadius = "10px";
  img.style.display = "block";
  img.loading = "lazy";
  img.decoding = "async";

  wrap.appendChild(img)
  link.appendChild(wrap);

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

export const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];
//Inmutable Genres list from API
