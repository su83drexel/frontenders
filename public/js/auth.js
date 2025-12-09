import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


let supabaseClient = null;
let supabaseClientPromise = null;
let envCache = null;

/* ---------- Utilities ---------- */
function $(id) {
  return document.getElementById(id);
}
function show(el, visible) {
  if (!el) return;
  el.style.display = visible ? "" : "none";
}

function setCachedAuthState(isLoggedIn) {
  try {
    localStorage.setItem("ff-auth-state", isLoggedIn ? "in" : "out");
  } catch (_) {
    /* ignore storage errors */
  }
}

function getCachedAuthState() {
  try {
    return localStorage.getItem("ff-auth-state");
  } catch (_) {
    return null;
  }
}

function renderHeader(isLoggedIn) {
  const btnSignIn = $("signin");
  const linkProfile = $("profile-link");
  const btnLogout = $("logout");
  const authWrap = document.querySelector(".auth-buttons");

  show(btnSignIn, !isLoggedIn);
  show(btnLogout, isLoggedIn);

  if (linkProfile) {
    show(linkProfile, isLoggedIn);
    if (isLoggedIn) {
      linkProfile.textContent = "My Profile";
      linkProfile.setAttribute("href", "/profile.html");
      linkProfile.setAttribute("aria-label", "Go to your profile");
    }
  }

  authWrap?.classList.add("ready");
}

/* ---------- Env + Supabase init ---------- */
async function getEnv() {
  if (envCache) return envCache;
  const res = await fetch("/api/env", { cache: "no-store" });
  if (!res.ok) {
    console.error("Failed to load /api/env:", res.status);
    return { SUPABASE_URL: "", SUPABASE_ANON_KEY: "" };
  }
  envCache = await res.json();
  return envCache;
}

async function getSupabase() {
  if (supabaseClient) return supabaseClient;

  if (supabaseClientPromise) return supabaseClientPromise;

  supabaseClientPromise = (async () => {
    const env = await getEnv();
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error(
        "Supabase env missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel and .env.local."
      );
      supabaseClient = null;
      return null;
    }

    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    supabaseClient = client;
    return client;
  })();

  return supabaseClientPromise;
}

/* ---------- Header state handling ---------- */
async function applyHeaderState() {
  const client = await getSupabase();

  if (!client) {
    // If Supabase is not configured, keep sign-in visible and hide the rest
    renderHeader(false);
    setCachedAuthState(false);
    return;
  }

  const { data: { session } } = await client.auth.getSession();
  const isLoggedIn = !!session?.user;

  renderHeader(isLoggedIn);
  setCachedAuthState(isLoggedIn);
}

function wireHeaderActions() {
  const btnSignIn = $("signin");
  const btnLogout = $("logout");

  if (btnSignIn) {
    btnSignIn.addEventListener("click", (e) => {
      e.preventDefault();
      location.href = "/login.html";
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async (e) => {
      e.preventDefault();
      const client = await getSupabase();
      if (!client) return;
      await client.auth.signOut();
      // After sign-out, refresh header state
      applyHeaderState();
      location.href = "/index.html";
    });
  }
}

async function subscribeAuthChanges() {
  const client = await getSupabase();
  if (!client) return;
  client.auth.onAuthStateChange(() => {
    applyHeaderState();
  });
}

/* ---------- Boot ---------- */
let wired = false;
function initAuthUI() {
  const hasHeaderControls = $("signin") || $("logout") || $("profile-link");
  if (!hasHeaderControls) return;

  const cached = getCachedAuthState();
  if (cached === "in" || cached === "out") {
    renderHeader(cached === "in");
  }

  if (!wired) {
    wireHeaderActions();
    subscribeAuthChanges();
    wired = true;
  }
  applyHeaderState();
}

function requestInit() {
  initAuthUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", requestInit);
} else {
  requestInit();
}

window.addEventListener("ff:header-ready", requestInit);

export async function getSupabaseClient() {
  return getSupabase();
}
