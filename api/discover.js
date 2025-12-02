export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = "be7c6ab1f7793583e50284e9c7a38816";
    const baseUrl =
      process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

    console.log(baseUrl, apiKey, process.env.TMDB_BASE_URL);

    const { with_genres, year, vote_average_lte, page = 1 } = req.query;

    const params = new URLSearchParams({
      api_key: apiKey,
      language: "en-US",
      sort_by: "popularity.desc",
      page,
      include_adult: "false",
    });

    if (with_genres) params.append("with_genres", with_genres);
    if (year) params.append("primary_release_year", year);
    if (vote_average_lte) params.append("vote_average.lte", vote_average_lte);

    const url = `${baseUrl}/discover/movie?${params.toString()}`;
    const tmdbRes = await fetch(url);

    if (!tmdbRes.ok) {
      const text = await tmdbRes.text();
      return res.status(tmdbRes.status).json({ error: text || "TMDB error" });
    }

    const data = await tmdbRes.json();

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600");

    return res.status(200).json(data);
  } catch (err) {
    console.error("discover error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
