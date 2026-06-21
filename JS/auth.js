/**
 * auth.js — GoldWise Authentication Utility
 * Handles JWT token management, user session, and route protection.
 */

const AUTH_API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5500/api/auth"
  : "https://goldwise-jewelry-backend.onrender.com/api/auth";

/** Save token + user to localStorage after login/register */
function saveSession(token, user) {
  localStorage.setItem("gw_token", token);
  localStorage.setItem("gw_user", JSON.stringify(user));
}

/** Get the raw JWT token */
function getToken() {
  return localStorage.getItem("gw_token");
}

/** Get the decoded user object (stored at login) */
function getUser() {
  const raw = localStorage.getItem("gw_user");
  return raw ? JSON.parse(raw) : null;
}

/** Returns true if a token exists (user is considered logged in) */
function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  // Basic expiry check via JWT payload (base64 decode)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/**
 * Protect a page — call at the top of protected pages.
 * Redirects to login.html if user is not authenticated.
 */
function requireAuth() {
  if (!isLoggedIn()) {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `login.html?redirect=${returnUrl}`;
  }
}

/** Logout: clear session and redirect to login */
function logout() {
  localStorage.removeItem("gw_token");
  localStorage.removeItem("gw_user");
  window.location.href = "login.html";
}

/** Make an authenticated fetch request */
async function authFetch(url, options = {}) {
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {})
    }
  });
}

/**
 * Update header UI based on auth state.
 * Call this after the header is injected into the DOM.
 */
function updateHeaderAuthUI() {
  const user = getUser();
  const profileLink = document.getElementById("profile-link");
  const authDropdown = document.getElementById("auth-dropdown");
  const userDisplayName = document.getElementById("user-display-name");
  const logoutBtn = document.getElementById("logout-btn");

  if (!profileLink) return;

  if (isLoggedIn() && user) {
    profileLink.title = user.fullName || user.username;
    if (userDisplayName) userDisplayName.textContent = user.fullName || user.username;
    if (authDropdown) authDropdown.classList.add("logged-in");
  } else {
    if (authDropdown) authDropdown.classList.remove("logged-in");
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Toggle dropdown on profile icon click
  if (profileLink) {
    profileLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (authDropdown) authDropdown.classList.toggle("open");
    });
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!profileLink.contains(e.target) && authDropdown && !authDropdown.contains(e.target)) {
        authDropdown.classList.remove("open");
      }
    });
  }
}

// Auto-run header UI update once DOM is ready (if header is already in DOM)
document.addEventListener("DOMContentLoaded", () => {
  // Wait briefly for dynamically loaded header
  setTimeout(updateHeaderAuthUI, 300);
});
