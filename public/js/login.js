import { getSupabaseClient } from "./auth.js";

function $(id) { return document.getElementById(id); }
function setText(el, text) { if (el) el.textContent = text; }
function show(el, visible) { if (el) el.style.display = visible ? "" : "none"; }

function getModeFromURL() {
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode");
  return mode === "register" ? "register" : "signin";
}

function setMode(mode) {
  const btnSignIn = $("btn-mode-signin");
  const btnRegister = $("btn-mode-register");
  const title = $("auth-title");
  const password = $("password");
  const hint = document.querySelector(".form-hint");

  if (mode === "register") {
    btnSignIn.setAttribute("aria-selected", "false");
    btnRegister.setAttribute("aria-selected", "true");
    setText(title, "Create an account");
    if (password) password.setAttribute("autocomplete", "new-password");
    show(hint, true);
  } else {
    btnSignIn.setAttribute("aria-selected", "true");
    btnRegister.setAttribute("aria-selected", "false");
    setText(title, "Sign in");
    if (password) password.setAttribute("autocomplete", "current-password");
    show(hint, true);
  }

  const url = new URL(location.href);
  url.searchParams.set("mode", mode);
  history.replaceState({}, "", url);
}

function bindModeSwitch() {
  $("btn-mode-signin")?.addEventListener("click", (e) => {
    e.preventDefault();
    setMode("signin");
  });
  $("btn-mode-register")?.addEventListener("click", (e) => {
    e.preventDefault();
    setMode("register");
  });
}

function showError(msg) {
  const err = $("auth-error");
  if (!err) return;
  setText(err, msg || "");
  err.classList.toggle("visible", !!msg);
}

async function handleSubmit(e) {
  e.preventDefault();
  showError("");

  const client = await getSupabaseClient();
  if (!client) {
    showError("Auth is not configured. Please try again later.");
    return;
  }

  const mode = getModeFromURL();
  const userEmail = $("email")?.value.trim() || "";
  const userPassword = $("password")?.value || "";

  if (!email || !password) {
    showError("Please fill in both email and password.");
    return;
  }

  try {
    if (mode === "register") {
      const { error } = await client.auth.signUp({ email: userEmail, password: userPassword });
      if (error) {
        showError(error.message);
        return;
      }
    } else {
      const { error } = await client.auth.signInWithPassword({ email: userEmail, password: userPassword });
      if (error) {
        showError(error.message);
        return;
      }
    }

    const redirect = document.referrer && new URL(document.referrer).origin === location.origin
      ? document.referrer
      : "/index.html";
    location.href = redirect;
  } catch (err) {
    console.error(err);
    showError("Unexpected error. Please try again.");
  }
}

function bindForm() {
  $("auth-form")?.addEventListener("submit", handleSubmit);
}

function boot() {
  const initialMode = getModeFromURL();
  setMode(initialMode);
  bindModeSwitch();
  bindForm();
}

document.addEventListener("DOMContentLoaded", boot);

document.getElementById("signInButton");