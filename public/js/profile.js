// public/js/profile.js

import { getSupabaseClient } from "/js/auth.js";

let currentUser = null;
let currentReviews = [];

function $(id) {
  return document.getElementById(id);
}

function clear(el) {
  if (el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }
}

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
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

function initialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  const initials = `${first}${last}` || first;
  return initials.toUpperCase() || "?";
}

function renderList(container, items, renderItem, emptyText) {
  if (!container) return;
  clear(container);

  if (!Array.isArray(items) || items.length === 0) {
    const empty = document.createElement(
      container.tagName === "UL" ? "li" : "div"
    );
    empty.classList.add("empty-state");
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => container.appendChild(renderItem(item)));
}

function renderInterests(interests) {
  const container = $("profile-interests");
  if (!container) return;
  clear(container);

  if (!Array.isArray(interests) || interests.length === 0) {
    const empty = document.createElement("span");
    empty.classList.add("empty-state");
    empty.textContent = "Add interests to show what you like.";
    container.appendChild(empty);
    return;
  }

  interests.forEach((interest) => {
    const pill = document.createElement("span");
    pill.classList.add("pill");
    pill.textContent = interest;
    container.appendChild(pill);
  });
}

function renderFriends(friends) {
  const list = $("profile-friends");
  renderList(
    list,
    friends,
    (friend) => {
      const row = document.createElement("div");
      row.classList.add("friend");

      const avatar = document.createElement("div");
      avatar.classList.add("avatar");
      avatar.textContent = initialsFromName(friend?.name);

      const textWrap = document.createElement("div");
      const nameEl = document.createElement("strong");
      nameEl.textContent = friend?.name || "Unknown user";
      const context = document.createElement("p");
      context.classList.add("muted");
      context.textContent = friend?.context || "Activity will appear here.";

      textWrap.appendChild(nameEl);
      textWrap.appendChild(context);

      row.appendChild(avatar);
      row.appendChild(textWrap);
      return row;
    },
    "No friends or follows yet."
  );
}

function renderReviews(reviews) {
  const list = $("profile-reviews");
  renderList(
    list,
    reviews,
    (review) => {
      const li = document.createElement("li");

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "baseline";
      header.style.gap = "8px";

      const title = document.createElement("strong");
      title.textContent =
        review?.movieTitle || review?.title || "Untitled review";

      const rating = document.createElement("span");
      rating.classList.add("rating");
      rating.textContent =
        Number.isFinite(Number(review?.rating)) && review?.rating !== null
          ? `${review.rating} ★`
          : "—";

      header.appendChild(title);
      header.appendChild(rating);

      const summary = document.createElement("p");
      summary.classList.add("muted");
      summary.textContent =
        review?.text || review?.excerpt || "Summary not available.";

      const meta = document.createElement("p");
      meta.classList.add("muted");
      const createdAt = formatDate(review?.createdAt);
      meta.textContent = createdAt ? `Posted ${createdAt}` : "";

      li.appendChild(header);
      li.appendChild(summary);
      if (meta.textContent) {
        li.appendChild(meta);
      }
      return li;
    },
    "No reviews yet."
  );
}

function renderActivity(activity) {
  const list = $("profile-activity");
  renderList(
    list,
    activity,
    (item) => {
      const li = document.createElement("li");
      const primary = document.createElement("p");
      const secondary = document.createElement("p");
      secondary.classList.add("muted");

      primary.textContent = item?.text || "Activity incoming soon.";
      secondary.textContent = item?.detail || "";

      li.appendChild(primary);
      if (secondary.textContent) li.appendChild(secondary);
      return li;
    },
    "No recent comments or replies."
  );
}

function renderRecommendations(recommendations) {
  const grid = $("profile-recommendations");
  renderList(
    grid,
    recommendations,
    (rec) => {
      const card = document.createElement("div");
      card.classList.add("recommend-card");

      if (rec?.tag) {
        const badge = document.createElement("p");
        badge.classList.add("pill", "ghost");
        badge.textContent = rec.tag;
        card.appendChild(badge);
      }

      const title = document.createElement("strong");
      title.textContent = rec?.title || "Movie title";
      card.appendChild(title);

      if (rec?.note) {
        const note = document.createElement("p");
        note.classList.add("muted");
        note.textContent = rec.note;
        card.appendChild(note);
      }

      return card;
    },
    "Recommendations will appear once you follow friends or start reviewing."
  );
}

export function renderProfile(profile = {}) {
  const name = profile.name || "Profile";
  const handle = profile.handle ? `@${profile.handle}` : null;
  const joined = profile.joined ? `Joined ${profile.joined}` : "Joined —";
  const role = profile.role || "Member";
  const bio =
    profile.bio || "Tell people about yourself and your taste in movies.";

  setText($("profile-name"), name);
  setText($("profile-role"), role);
  setText($("profile-meta"), handle ? `${joined} • ${handle}` : joined);
  setText($("profile-bio"), bio);

  const avatar = $("profile-avatar");
  if (avatar) {
    setText(avatar, initialsFromName(name));
  }

  setText($("stat-reviews"), profile.stats?.reviews ?? "—");
  setText($("stat-comments"), profile.stats?.comments ?? "—");
  setText($("stat-friends"), profile.stats?.friends ?? "—");
  setText($("stat-rating"), profile.stats?.averageRating ?? "—");

  renderInterests(profile.interests);
  renderFriends(profile.friends);
  renderReviews(profile.reviews);
  renderActivity(profile.activity);
  renderRecommendations(profile.recommendations);
}

async function fetchUserReviews(userId) {
  if (!userId) return [];
  const res = await fetch(`/api/reviews?userId=${encodeURIComponent(userId)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load reviews");
  }

  const data = await res.json();
  return Array.isArray(data.reviews) ? data.reviews : [];
}

function calculateAverageRating(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) return "—";
  const sum = reviews.reduce(
    (acc, review) => acc + (Number(review.rating) || 0),
    0
  );
  return (sum / reviews.length).toFixed(1);
}

function buildProfileView(user, reviews = []) {
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Profile";
  const handle =
    user?.user_metadata?.user_name ||
    (user?.email ? user.email.split("@")[0] : null);
  const joined = user?.created_at ? formatDate(user.created_at) : "—";

  return {
    name: displayName,
    handle,
    joined,
    role: "Member",
    bio:
      user?.user_metadata?.bio ||
      "Tell people about yourself and your taste in movies.",
    stats: {
      reviews: reviews.length,
      comments: 0,
      friends: 0,
      averageRating: calculateAverageRating(reviews),
    },
    interests: [],
    friends: [],
    activity: [],
    recommendations: [],
    reviews,
  };
}

async function hydrateProfile(user) {
  try {
    const reviews = await fetchUserReviews(user?.id);
    currentReviews = reviews;
    renderProfile(buildProfileView(user, currentReviews));
  } catch (err) {
    console.error("Failed to load profile data:", err);
    currentReviews = [];
    renderProfile(buildProfileView(user, currentReviews));
  }
}

/* ---------- Init ---------- */

async function initProfilePage() {
  try {
    const client = await getSupabaseClient();

    if (!client) {
      console.error(
        "Supabase client not available. Rendering placeholder profile."
      );
      // We still show a generic profile shell; no sensitive data here
      renderProfile();
      document.body.classList.add("profile-authenticated");
      return;
    }

    const { data } = await client.auth.getSession();
    const session = data?.session;

    if (!session || !session.user) {
      // Not logged in: leave body as profile-protected (loader visible), then redirect
      const params = new URLSearchParams();
      params.set("mode", "signin");
      params.set("redirect", "/profile.html");
      const target = `/login.html?${params.toString()}`;
      window.location.href = target;
      return;
    }

    currentUser = session.user;

    // Render immediately with basic info, then hydrate with reviews from API
    renderProfile(buildProfileView(currentUser, []));
    hydrateProfile(currentUser);

    // Logged in: mark as authenticated so CSS reveals content
    document.body.classList.add("profile-authenticated");
  } catch (err) {
    console.error("Failed to initialize profile page:", err);
    // Fallback: generic shell, then mark authenticated so the page is usable
    renderProfile();
    document.body.classList.add("profile-authenticated");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfilePage);
} else {
  initProfilePage();
}

function initProfileReviewComposer() {
  const form = document.getElementById("profile-review-form");
  if (!form) return;

  const movieInput = document.getElementById("profile-review-movie");
  const ratingSelect = document.getElementById("profile-review-rating");
  const visibilitySelect = document.getElementById("profile-review-visibility");
  const textArea = document.getElementById("profile-review-text");
  const messageEl = document.getElementById("profile-review-message");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Autocomplete state
  let selectedMovie = null;
  let suggestTimer = null;
  let suggestionList = null;

  // Build suggestion dropdown
  if (movieInput && movieInput.parentElement) {
    movieInput.parentElement.style.position = "relative";
    suggestionList = document.createElement("div");
    suggestionList.className = "autocomplete-options card";
    Object.assign(suggestionList.style, {
      position: "absolute",
      left: "0",
      right: "0",
      top: "100%",
      marginTop: "4px",
      display: "none",
      maxHeight: "220px",
      overflowY: "auto",
      boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
      border: "1px solid #e4e4e7",
      background: "#fff",
      zIndex: "20",
    });
    movieInput.parentElement.appendChild(suggestionList);
  }

  function clearSuggestions() {
    if (!suggestionList) return;
    suggestionList.innerHTML = "";
    suggestionList.style.display = "none";
  }

  function renderSuggestions(results) {
    if (!suggestionList) return;
    suggestionList.innerHTML = "";
    if (!Array.isArray(results) || results.length === 0) {
      clearSuggestions();
      return;
    }

    results.forEach((movie) => {
      const btn = document.createElement("button");
      btn.type = "button";
      Object.assign(btn.style, {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        padding: "8px 10px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
      });

      const title = document.createElement("span");
      const year = (movie.release_date || "").slice(0, 4) || "—";
      title.textContent = `${movie.title || "Untitled"} (${year})`;
      const score = document.createElement("span");
      score.className = "muted";
      score.textContent =
        typeof movie.vote_average === "number"
          ? movie.vote_average.toFixed(1)
          : "—";

      btn.appendChild(title);
      btn.appendChild(score);

      btn.addEventListener("click", () => {
        movieInput.value = movie.title || "";
        selectedMovie = {
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        };
        clearSuggestions();
      });

      suggestionList.appendChild(btn);
    });

    suggestionList.style.display = "block";
  }

  async function searchMovies(query) {
    if (!query || query.length < 2) {
      clearSuggestions();
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=1`, {
        cache: "no-store",
      });
      if (!res.ok) {
        clearSuggestions();
        return;
      }
      const data = await res.json();
      renderSuggestions((data.results || []).slice(0, 6));
    } catch (err) {
      console.error("autocomplete error", err);
      clearSuggestions();
    }
  }

  if (movieInput) {
    movieInput.addEventListener("input", (e) => {
      selectedMovie = null;
      const q = e.target.value.trim();
      clearTimeout(suggestTimer);
      suggestTimer = setTimeout(() => searchMovies(q), 250);
    });

    movieInput.addEventListener("blur", () => {
      setTimeout(clearSuggestions, 150);
    });
  }

  // On profile page we assume user is already authenticated.
  // So we can enable the button immediately.
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.removeAttribute("aria-disabled");
  }

  function setMessage(msg) {
    if (!messageEl) return;
    messageEl.textContent = msg;
  }

  function addLocalReview(review, user) {
    const fallbackProfile = {
      displayName:
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        user?.email ||
        "You",
    };
    const hydrated = {
      ...review,
      userProfile: review.userProfile || fallbackProfile,
      createdAt: review.createdAt || new Date().toISOString(),
    };
    currentReviews = [hydrated, ...currentReviews];
    renderProfile(buildProfileView(currentUser || user, currentReviews));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const movieQuery = movieInput?.value.trim() || "";
    const ratingValue = ratingSelect?.value || "";
    const visibility = visibilitySelect?.value || "public";
    const text = textArea?.value.trim() || "";

    // Basic validation
    if (!movieQuery || !ratingValue || !text) {
      setMessage("Please fill out movie, rating, and review text before posting.");
      return;
    }

    const rating = Number(ratingValue);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      setMessage("Rating must be between 1 and 5 stars.");
      return;
    }

    const payload = {
      movieQuery,
      movieId: selectedMovie?.id ?? undefined,
      rating,
      text,
      visibility,
    };

    try {
      setMessage("Posting review…");

      const client = await getSupabaseClient();
      if (!client) {
        setMessage("Auth is not configured on this project.");
        addLocalReview(
          {
            movieTitle: movieQuery,
            rating,
            text,
            visibility,
          },
          null
        );
        return;
      }

      const { data: sessionData } = await client.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setMessage("You must be signed in to post a review.");
        return;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorText = "";
        try {
          const body = await res.json();
          errorText = body?.error || "";
        } catch (_) {
          errorText = await res.text().catch(() => "");
        }
        throw new Error(errorText || `Failed with status ${res.status}`);
      }

      const data = await res.json().catch(() => ({}));
      const saved = data.review || {
        movieTitle: movieQuery,
        rating,
        text,
        visibility,
        userProfile: { displayName: "You" },
        createdAt: new Date().toISOString(),
      };

      setMessage("Review posted. It will appear on your profile and on the movie page.");

      // Clear form but do not touch visibility preference
      if (movieInput) movieInput.value = "";
      if (ratingSelect) ratingSelect.value = "";
      if (textArea) textArea.value = "";

      addLocalReview(saved, sessionData?.session?.user);
    } catch (err) {
      console.error("Failed to post review:", err);
      setMessage(
        err?.message ||
          "Could not post review yet. Showing it locally until the server is ready."
      );
      addLocalReview(
        {
          movieTitle: movieQuery,
          rating,
          text,
          visibility,
        },
        currentUser
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initProfileReviewComposer();
});
