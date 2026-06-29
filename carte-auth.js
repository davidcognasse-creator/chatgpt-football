// Gate d'authentification de la page « Ma Carte Panini ».
// Tant que l'utilisateur n'est pas connecté, on affiche l'écran de connexion ;
// une fois connecté, on révèle le générateur de carte (#carteApp).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const t = (k, v) => (window.t ? window.t(k, v) : k);
const gate = document.getElementById("authGate");
const appEl = document.getElementById("carteApp");
const userbar = document.getElementById("carteUserbar");
const CFG = window.FIREBASE_CONFIG || {};
const configured = CFG.apiKey && !String(CFG.apiKey).startsWith("À_REMPLIR");

// Sans config Firebase : accès libre (mode dégradé) pour ne pas bloquer la page.
if (!configured) {
  gate.hidden = true;
  appEl.hidden = false;
} else {
  const auth = getAuth(initializeApp(CFG));
  let me = null;

  onAuthStateChanged(auth, (user) => {
    me = user;
    if (user) {
      gate.hidden = true; gate.innerHTML = "";
      appEl.hidden = false;
      renderUserbar(auth, user);
      prefillCard(user);
    } else {
      appEl.hidden = true;
      userbar.innerHTML = "";
      renderAuth(auth);
    }
  });

  document.addEventListener("i18n:changed", () => {
    if (!me) renderAuth(auth); else renderUserbar(auth, me);
  });
}

function myName(user) {
  return user.displayName || (user.email ? user.email.split("@")[0] : "Joueur");
}

// Pré-remplit le nom de la carte avec celui du compte (sans écraser une saisie).
function prefillCard(user) {
  const n = document.getElementById("cName");
  if (n && !n.value) {
    n.value = myName(user);
    n.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function renderUserbar(auth, user) {
  userbar.innerHTML = `
    <div class="userbar">
      <div class="user-id">👤 <b>${esc(myName(user))}</b></div>
      <div class="userbar-actions"><button class="btn-ghost" id="cLogout">${t("g_logout")}</button></div>
    </div>`;
  document.getElementById("cLogout").onclick = () => signOut(auth);
}

function renderAuth(auth) {
  gate.innerHTML = `
    <div class="auth-card">
      <h2 id="authTitle">${t("g_auth_title_login")}</h2>
      <button class="btn-google" id="btnGoogle">
        <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.5-8 19.5-20 0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36.9 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
        ${t("g_google")}
      </button>
      <div class="auth-sep"><span>${t("g_or")}</span></div>
      <input type="email" id="email" placeholder="${t("g_email")}" autocomplete="email" />
      <input type="password" id="password" placeholder="${t("g_pwd_ph")}" autocomplete="current-password" />
      <input type="text" id="displayName" placeholder="${t("g_name")}" style="display:none" />
      <p class="auth-err" id="authErr" hidden></p>
      <button class="btn-primary" id="btnSubmit">${t("g_signin")}</button>
      <p class="auth-toggle">
        <span id="toggleText">${t("g_auth_no_account")}</span>
        <a href="#" id="toggleLink">${t("g_signup")}</a>
      </p>
    </div>`;

  let mode = "login";
  const $ = (id) => document.getElementById(id);
  const err = (m) => { const e = $("authErr"); e.hidden = !m; e.textContent = m || ""; };

  $("toggleLink").onclick = (ev) => {
    ev.preventDefault();
    mode = mode === "login" ? "signup" : "login";
    $("authTitle").textContent = mode === "login" ? t("g_auth_title_login") : t("g_signup");
    $("btnSubmit").textContent = mode === "login" ? t("g_signin") : t("g_signup_do");
    $("displayName").style.display = mode === "signup" ? "block" : "none";
    $("toggleText").textContent = mode === "login" ? t("g_auth_no_account") : t("g_auth_have_account");
    $("toggleLink").textContent = mode === "login" ? t("g_signup") : t("g_signin");
    err("");
  };

  $("btnGoogle").onclick = async () => {
    err("");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { err(humanizeAuthError(e)); }
  };

  $("btnSubmit").onclick = async () => {
    err("");
    const email = $("email").value.trim();
    const pwd = $("password").value;
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, pwd);
        const name = $("displayName").value.trim() || email.split("@")[0];
        await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, pwd);
      }
    } catch (e) { err(humanizeAuthError(e)); }
  };
}

function humanizeAuthError(e) {
  const c = e.code || "";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return t("g_err_badcred");
  if (c.includes("email-already-in-use")) return t("g_err_inuse");
  if (c.includes("weak-password")) return t("g_err_weak");
  if (c.includes("invalid-email")) return t("g_err_email");
  if (c.includes("popup-closed")) return t("g_err_popup");
  return "Error: " + (e.message || c);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
