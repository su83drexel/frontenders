import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

let supabaseClient = null;
let envCache = null;

/* ---------- Utilities ---------- */
function $(id) {
  return document.getElementById(id);
}
function show(el, visible) {
  if (!el) return;
  el.style.display = visible ? "" : "none";
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
  const env = await getEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    console.error("Supabase env missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel and .env.local.");
    // Create a no op client to avoid runtime errors if someone clicks buttons
    return null;
  }
  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return supabaseClient;
}

/* ---------- Header state handling ---------- */
async function applyHeaderState() {
  const client = await getSupabase();
  const btnSignIn = $("signin");
  const btnRegister = $("register");
  const linkProfile = $("profile-link");

  if (!client) {
    // If Supabase is not configured, keep sign-in/register visible and hide profile
    show(btnSignIn, true);
    show(btnRegister, true);
    show(linkProfile, false);
    return;
  }

  const { data: { session } } = await client.auth.getSession();
  const isLoggedIn = !!session?.user;

  show(btnSignIn, !isLoggedIn);
  show(btnRegister, !isLoggedIn);

  if (linkProfile) {
    show(linkProfile, isLoggedIn);
    if (isLoggedIn) {
      linkProfile.textContent = "Profile";
      linkProfile.setAttribute("href", "/profile.html");
      linkProfile.setAttribute("aria-label", "Go to your profile");
    }
  }
}

function wireHeaderActions() {
  const btnSignIn = $("signin");
  const btnRegister = $("register");
  const btnLogout = $("logout");

  if (btnSignIn) {
    btnSignIn.addEventListener("click", (e) => {
      e.preventDefault();
      // Navigate to a auth page
      // query param selects mode
      location.href = "/login.html";
    });
  }

  if (btnRegister) {
    btnRegister.addEventListener("click", (e) => {
      e.preventDefault();
      location.href = "/login.html?mode=register";
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
document.addEventListener("DOMContentLoaded", () => {
  wireHeaderActions();
  applyHeaderState();
  subscribeAuthChanges();
});

export async function getSupabaseClient() {
  return getSupabase();
}