export default async function handler(req, res) {
  try {
    const q = (req.query.q || "").toString().trim();
    const page = parseInt(req.query.page || "1", 10) || 1;

    if (!q) return res.status(400).json({ error: "q is required" });

    const apiKey = process.env.TMDB_API_KEY;
    const baseUrl = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

    const url = new URL(`${baseUrl}/search/movie`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "en-US");
    url.searchParams.set("query", q);
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("page", String(page));

    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text || "TMDB search error" });
    }
    const data = await resp.json();
    const results = (data.results || []).map((m) => ({
      id: m.id,
      title: m.title,
      release_date: m.release_date,
      overview: m.overview,
      poster_path: m.poster_path,
      vote_average: m.vote_average,
    }));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
      page: data.page,
      total_pages: data.total_pages,
      total_results: data.total_results,
      results,
    });
  } catch (err) {
    console.error("search error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}