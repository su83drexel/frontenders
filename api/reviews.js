// api/reviews.js
//
// Reviews API:
//   GET /api/reviews?movieId=123    → list reviews for a movie
//   GET /api/reviews?userId=abc     → list reviews for a user
//   POST /api/reviews               → authenticated creation w/ Supabase + TMDB

import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function parseRequestUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url, `http://${host}`);
}

function parseBearer(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

async function requireAuthUser(req) {
  if (!supabase) {
    return {
      status: 500,
      error:
        "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    };
  }

  const token = parseBearer(req);
  if (!token) {
    return { status: 401, error: "Missing Authorization: Bearer <token>." };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { status: 401, error: "Invalid or expired session." };
  }

  return { user: data.user };
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function normalizeVisibility(value) {
  const upper = (value || "PUBLIC").toString().toUpperCase();
  return upper === "FRIENDS" ? "FRIENDS" : "PUBLIC";
}

async function resolveMovieFromTmdb({ movieId, movieQuery }) {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  const base = TMDB_BASE_URL.replace(/\/$/, "");

  if (Number.isInteger(movieId)) {
    const url = `${base}/movie/${encodeURIComponent(
      movieId
    )}?api_key=${encodeURIComponent(TMDB_API_KEY)}&language=en-US`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `TMDB lookup failed (${res.status})`);
    }
    const data = await res.json();
    return {
      movieId: data.id,
      movieTitle: data.title || data.name || "Untitled",
      moviePosterPath: data.poster_path || null,
    };
  }

  const query = movieQuery?.trim();
  if (!query) {
    throw new Error("Provide a movie id or search query.");
  }

  const searchUrl = new URL(`${base}/search/movie`);
  searchUrl.searchParams.set("api_key", TMDB_API_KEY);
  searchUrl.searchParams.set("language", "en-US");
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("include_adult", "false");
  searchUrl.searchParams.set("page", "1");

  const res = await fetch(searchUrl);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `TMDB search failed (${res.status})`);
  }

  const data = await res.json();
  const first = Array.isArray(data.results) ? data.results[0] : null;
  if (!first) {
    throw new Error("Could not find a matching movie on TMDB.");
  }

  return {
    movieId: first.id,
    movieTitle: first.title || first.name || "Untitled",
    moviePosterPath: first.poster_path || null,
  };
}

async function ensureUserProfile(user) {
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    "User";
  const avatarUrl = user.user_metadata?.avatar_url || null;
  const bio = user.user_metadata?.bio || null;

  return prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      displayName,
      avatarUrl,
      bio,
    },
    create: {
      userId: user.id,
      displayName,
      avatarUrl,
      bio,
    },
  });
}

function serializeReview(review) {
  return {
    ...review,
    userProfile: review.userProfile || null,
  };
}

async function handleGet(req, res) {
  const url = parseRequestUrl(req);
  const movieIdParam = url.searchParams.get("movieId");
  const userId = url.searchParams.get("userId");

  if (!movieIdParam && !userId) {
    return json(res, 400, {
      error: "Missing query parameter. Provide either movieId or userId.",
    });
  }

  let movieId = null;
  if (movieIdParam) {
    movieId = Number(movieIdParam);
    if (!Number.isInteger(movieId)) {
      return json(res, 400, { error: "movieId must be an integer" });
    }
  }

  try {
    const where = movieId ? { movieId, visibility: "PUBLIC" } : { userId };

    const [reviews, agg] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { userProfile: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      movieId
        ? prisma.review.aggregate({
            where,
            _avg: { rating: true },
            _count: { _all: true },
          })
        : null,
    ]);

    const summary = agg
      ? {
          averageRating: agg._avg.rating ?? null,
          ratingCount: agg._count?._all ?? 0,
        }
      : undefined;

    return json(res, 200, {
      reviews: reviews.map(serializeReview),
      summary,
    });
  } catch (err) {
    console.error("Error in GET /api/reviews:", err);
    return json(res, 500, {
      error: "Internal server error while fetching reviews.",
    });
  }
}

async function handlePost(req, res) {
  const auth = await requireAuthUser(req);
  if (auth.error) {
    return json(res, auth.status ?? 500, { error: auth.error });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    return json(res, 400, { error: "Invalid JSON body" });
  }

  const text = (body.text || "").trim();
  const rating = Number(body.rating);
  const visibility = normalizeVisibility(body.visibility);
  const movieIdCandidate =
    body.movieId !== undefined ? Number(body.movieId) : undefined;
  const movieQuery = (body.movieQuery || "").trim();

  if (!text) {
    return json(res, 400, { error: "Review text is required." });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json(res, 400, {
      error: "Rating must be an integer between 1 and 5.",
    });
  }

  try {
    const movie = await resolveMovieFromTmdb({
      movieId: Number.isInteger(movieIdCandidate) ? movieIdCandidate : null,
      movieQuery,
    });

    await ensureUserProfile(auth.user);

    const review = await prisma.review.create({
      data: {
        userId: auth.user.id,
        movieId: movie.movieId,
        movieTitle: movie.movieTitle,
        moviePosterPath: movie.moviePosterPath,
        rating,
        text,
        visibility,
      },
      include: {
        userProfile: true,
      },
    });

    return json(res, 201, { review: serializeReview(review) });
  } catch (err) {
    console.error("Error in POST /api/reviews:", err);
    const message =
      err?.message || "Unable to save review. Please try again later.";
    return json(res, 400, { error: message });
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    await handleGet(req, res);
    return;
  }

  if (req.method === "POST") {
    await handlePost(req, res);
    return;
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST");
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
