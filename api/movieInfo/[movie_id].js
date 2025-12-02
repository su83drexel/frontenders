export default async function handler(req, res) {
  try {
    const { movie_id } = req.query;
    if (!movie_id) {
      return res.status(400).json({ error: "movie_id is required" });
    }

    const apiKey = "be7c6ab1f7793583e50284e9c7a38816";
    const baseUrl = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

    const url = `${baseUrl}/movie/${encodeURIComponent(
      movie_id
    )}?api_key=${encodeURIComponent(apiKey)}&language=en-US`;

    const tmdbRes = await fetch(url);
    if (!tmdbRes.ok) {
      const text = await tmdbRes.text();
      return res.status(tmdbRes.status).json({ error: text || "TMDB error" });
    }

    const data = await tmdbRes.json();
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json(data);
  } catch (err) {
    console.error("movieInfo error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
