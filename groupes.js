// Comptes + groupes + classement, via Firebase (Auth + Firestore).
// Fonctionne en mode dégradé tant que firebase-config.js n'est pas rempli.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, updateProfile,
  deleteUser, reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  collection, getDocs, query, where, orderBy, limit, onSnapshot,
  arrayUnion, arrayRemove, deleteField, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const appEl = document.getElementById("app");
const CFG = window.FIREBASE_CONFIG || {};
const configured = CFG.apiKey && !String(CFG.apiKey).startsWith("À_REMPLIR");

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (iso) => new Date(iso).toLocaleDateString("fr-FR",
  { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/* ---------- garde : config absente ---------- */
if (!configured) {
  appEl.innerHTML = `
    <div class="auth-card">
      <h2>⚙️ Configuration requise</h2>
      <p class="muted">La fonctionnalité comptes/groupes a besoin d'un projet Firebase (gratuit).
      Renseigne <code>firebase-config.js</code> avec ta config, puis recharge la page.</p>
      <ol class="setup-steps">
        <li>Crée un projet sur <b>console.firebase.google.com</b></li>
        <li>Active <b>Authentication</b> → fournisseurs <b>E-mail/Mot de passe</b> et <b>Google</b></li>
        <li>Crée une base <b>Firestore</b> (mode production) et colle les règles fournies (<code>firestore.rules</code>)</li>
        <li>Ajoute une app <b>Web</b> et copie la config dans <code>firebase-config.js</code></li>
      </ol>
      <p class="muted">Détails complets dans <code>SETUP-GROUPES.md</code>.</p>
    </div>`;
  throw new Error("Firebase non configuré");
}

/* ---------- init Firebase ---------- */
const app = initializeApp(CFG);
const auth = getAuth(app);
const db = getFirestore(app);

let me = null;          // user courant
let matches = [];       // matchs (data.json)
let history = [];       // résultats (history.json)
let myGroups = [];      // groupes de l'utilisateur
let activeGroupId = null;
let showProfile = false; // affiche l'onglet Profil à la place du contenu groupe
let showCreate = false;  // affiche l'écran de création/ajout de groupe
let forumUnsub = null;   // désabonnement du flux temps réel du forum

/* ---------- données du site ---------- */
async function loadSiteData() {
  const get = async (u, g) => {
    try { const r = await fetch(u, { cache: "no-store" }); if (r.ok) return await r.json(); } catch {}
    return window[g] || null;
  };
  const d = await get("data.json", "WC_DATA");
  const h = await get("history.json", "WC_HISTORY");
  matches = (d && d.matches) || [];
  history = (h && h.entries) || [];
}

/* ---------- scoring ---------- */
function points(pred, actual) {
  if (!pred) return 0;
  if (Number(pred.sh) === actual.home && Number(pred.sa) === actual.away) return 3;
  if (pred.pick === actual.outcome) return 2;
  return 0;
}

/* ================= AUTH ================= */
function renderAuth() {
  appEl.innerHTML = `
    <div class="auth-card">
      <h2 id="authTitle">Connexion</h2>
      <button class="btn-google" id="btnGoogle">
        <svg viewBox="0 0 48 48" width="18" height="18"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.5-8 19.5-20 0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36.9 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
        Continuer avec Google
      </button>
      <div class="auth-sep"><span>ou</span></div>
      <input type="email" id="email" placeholder="E-mail" autocomplete="email" />
      <input type="password" id="password" placeholder="Mot de passe (6+ caractères)" autocomplete="current-password" />
      <input type="text" id="displayName" placeholder="Ton pseudo" style="display:none" />
      <p class="auth-err" id="authErr" hidden></p>
      <button class="btn-primary" id="btnSubmit">Se connecter</button>
      <p class="auth-toggle">
        <span id="toggleText">Pas encore de compte ?</span>
        <a href="#" id="toggleLink">Créer un compte</a>
      </p>
    </div>`;

  let mode = "login";
  const $ = (id) => document.getElementById(id);
  const err = (m) => { const e = $("authErr"); e.hidden = !m; e.textContent = m || ""; };

  $("toggleLink").onclick = (ev) => {
    ev.preventDefault();
    mode = mode === "login" ? "signup" : "login";
    $("authTitle").textContent = mode === "login" ? "Connexion" : "Créer un compte";
    $("btnSubmit").textContent = mode === "login" ? "Se connecter" : "Créer mon compte";
    $("displayName").style.display = mode === "signup" ? "block" : "none";
    $("toggleText").textContent = mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?";
    $("toggleLink").textContent = mode === "login" ? "Créer un compte" : "Se connecter";
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
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found"))
    return "E-mail ou mot de passe incorrect.";
  if (c.includes("email-already-in-use")) return "Cet e-mail a déjà un compte.";
  if (c.includes("weak-password")) return "Mot de passe trop court (6 caractères min).";
  if (c.includes("invalid-email")) return "E-mail invalide.";
  if (c.includes("popup-closed")) return "Fenêtre Google fermée.";
  return "Erreur : " + (e.message || c);
}

/* ================= GROUPES ================= */
async function refreshGroups() {
  const qs = await getDocs(query(collection(db, "groups"), where("memberUids", "array-contains", me.uid)));
  myGroups = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (!activeGroupId || !myGroups.find((g) => g.id === activeGroupId))
    activeGroupId = myGroups[0]?.id || null;
}

async function tryJoinFromUrl() {
  const p = new URLSearchParams(location.search);
  const gid = p.get("g"), token = p.get("t");
  if (!gid || !token) return;
  try {
    const ref = doc(db, "groups", gid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return alert("Groupe introuvable.");
    const g = snap.data();
    if (g.inviteToken !== token) return alert("Lien d'invitation invalide.");
    if (!(g.memberUids || []).includes(me.uid)) {
      await updateDoc(ref, {
        memberUids: arrayUnion(me.uid),
        [`members.${me.uid}`]: { name: myName(), photo: me.photoURL || "" },
      });
    }
    activeGroupId = gid;
  } catch (e) {
    alert("Impossible de rejoindre le groupe : " + (e.message || e));
  } finally {
    window.history.replaceState({}, "", "groupes.html");
  }
}

const myName = () => me.displayName || (me.email ? me.email.split("@")[0] : "Joueur");

// Date de création du groupe (Timestamp Firestore -> Date), défaut = maintenant.
function groupCreatedDate(group) {
  const c = group && group.createdAt;
  if (c && typeof c.toDate === "function") return c.toDate();
  if (c && c.seconds) return new Date(c.seconds * 1000);
  return new Date();
}
const hasStarted = (m) => new Date(m.datetime).getTime() <= Date.now();

// Verrouille une ligne de pronostic : plus aucune modification possible.
function lockRow(row) {
  if (!row) return;
  row.classList.add("locked");
  row.querySelectorAll(".pick, .sc").forEach((c) => { c.disabled = true; });
}

async function createGroup(name) {
  const token = Math.random().toString(36).slice(2, 10);
  const ref = await addDoc(collection(db, "groups"), {
    name,
    ownerUid: me.uid,
    inviteToken: token,
    memberUids: [me.uid],
    members: { [me.uid]: { name: myName(), photo: me.photoURL || "" } },
    createdAt: serverTimestamp(),
  });
  activeGroupId = ref.id;
  showCreate = false;
  await refreshGroups();
  renderApp();
}

/* ================= APP (connecté) ================= */
async function renderApp() {
  if (forumUnsub) { forumUnsub(); forumUnsub = null; } // on coupe l'ancien flux forum
  await refreshGroups();
  let group = myGroups.find((g) => g.id === activeGroupId) || null;

  // Nettoyage : retire les membres dont le compte a été supprimé (côté proprio).
  if (group && !showProfile) {
    try { if (await pruneDeletedMembers(group)) { await refreshGroups(); group = myGroups.find((g) => g.id === activeGroupId) || group; } } catch {}
  }

  // Un membre peut avoir plusieurs groupes : on bascule via le sélecteur,
  // et on en crée d'autres via « ➕ Nouveau groupe ».
  const inGroup = !showProfile && !showCreate && group;

  const groupPicker = (inGroup && myGroups.length > 1)
    ? `<select id="groupSel" class="group-sel">${myGroups.map((g) =>
        `<option value="${g.id}" ${g.id === activeGroupId ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select>`
    : "";

  // Boutons d'action selon la vue
  let actions = groupPicker;
  if (showProfile) {
    actions += `<button class="btn-ghost" id="btnProfile">← Retour</button>`;
  } else if (showCreate) {
    actions += `<button class="btn-ghost" id="btnNew">← Retour</button>`;
  } else {
    if (group) actions += `<button class="btn-soft" id="btnNew">➕ Nouveau groupe</button>`;
    actions += `<button class="btn-ghost" id="btnProfile">⚙️ Profil</button>`;
  }
  actions += `<button class="btn-ghost" id="btnLogout">Déconnexion</button>`;

  const body = showProfile
    ? renderProfile()
    : (showCreate || !group) ? renderNoGroup()
    : renderGroup(group);

  appEl.innerHTML = `
    <div class="userbar">
      <div class="user-id">👤 <b>${esc(myName())}</b></div>
      <div class="userbar-actions">${actions}</div>
    </div>
    ${body}`;

  document.getElementById("btnLogout").onclick = () => signOut(auth);
  const btnProfile = document.getElementById("btnProfile");
  if (btnProfile) btnProfile.onclick = () => { showProfile = !showProfile; showCreate = false; renderApp(); };
  const btnNew = document.getElementById("btnNew");
  if (btnNew) btnNew.onclick = () => { showCreate = !showCreate; renderApp(); };
  const sel = document.getElementById("groupSel");
  if (sel) sel.onchange = () => { activeGroupId = sel.value; renderApp(); };

  if (showProfile) wireProfile();
  else if (showCreate || !group) wireNoGroup();
  else await wireGroup(group);
}

// Retire d'un groupe les membres dont le compte a été supprimé (fiche users/
// absente — l'upsert s'exécute à chaque connexion, donc une fiche manquante
// signifie un compte supprimé). N'agit que pour le propriétaire du groupe.
async function pruneDeletedMembers(group) {
  if (!group || group.ownerUid !== me.uid) return false;
  const updates = {};
  const removed = [];
  for (const uid of Object.keys(group.members || {})) {
    if (uid === group.ownerUid) continue; // jamais le propriétaire
    let exists = true;
    try { exists = (await getDoc(doc(db, "users", uid))).exists(); } catch { exists = true; }
    if (!exists) { updates[`members.${uid}`] = deleteField(); removed.push(uid); }
  }
  if (!removed.length) return false;
  try {
    await updateDoc(doc(db, "groups", group.id), { ...updates, memberUids: arrayRemove(...removed) });
    removed.forEach((u) => { if (group.members) delete group.members[u]; });
    return true;
  } catch { return false; }
}

/* ---------- profil ---------- */
function renderProfile() {
  const provider = (me.providerData && me.providerData[0] && me.providerData[0].providerId) || "";
  const via = provider === "google.com" ? "Google" : "E-mail / mot de passe";
  return `
    <div class="panel profile-panel">
      <h3>⚙️ Mon profil</h3>
      <dl class="profile-info">
        <div><dt>Nom</dt><dd>${esc(myName())}</dd></div>
        <div><dt>E-mail</dt><dd>${esc(me.email || "non renseigné")}</dd></div>
        <div><dt>Connexion</dt><dd>${via}</dd></div>
        <div><dt>Groupes</dt><dd>${myGroups.length}</dd></div>
      </dl>
      <div class="danger-zone">
        <h4>Zone de danger</h4>
        <p class="muted">La suppression de ton compte est <b>définitive</b> : tu es retiré de tous tes groupes et tes pronostics sont effacés.</p>
        <button class="btn-danger" id="btnDeleteAccount">🗑️ Supprimer mon compte</button>
        <span class="del-status" id="delStatus"></span>
      </div>
    </div>`;
}
function wireProfile() {
  const btn = document.getElementById("btnDeleteAccount");
  const status = document.getElementById("delStatus");
  btn.onclick = async () => {
    if (!confirm("Supprimer définitivement ton compte ? Cette action est irréversible.")) return;
    btn.disabled = true;
    status.textContent = "Suppression…";
    try {
      await deleteAccount();
      // onAuthStateChanged renverra vers l'écran de connexion.
    } catch (e) {
      btn.disabled = false;
      status.textContent = "❌ " + (e && e.message ? e.message : e);
    }
  };
}

// Supprime le compte Firebase (avec ré-authentification si nécessaire) après
// avoir nettoyé au mieux les données Firestore (groupes, pronostics, profil).
async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("Aucun utilisateur connecté.");
  try {
    await cleanupUserData(user.uid);
    await deleteUser(user);
  } catch (e) {
    if (e && e.code === "auth/requires-recent-login") {
      await reauthenticate(user);
      await cleanupUserData(user.uid);
      await deleteUser(user);
    } else {
      throw e;
    }
  }
}

async function reauthenticate(user) {
  const provider = (user.providerData && user.providerData[0] && user.providerData[0].providerId) || "";
  if (provider === "google.com") {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  } else {
    const pwd = prompt("Pour confirmer, saisis ton mot de passe :");
    if (!pwd) throw new Error("Mot de passe requis pour la suppression.");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, pwd));
  }
}

// Best-effort : on ne bloque pas la suppression du compte si une étape échoue
// (les règles Firestore peuvent restreindre certaines écritures).
async function cleanupUserData(uid) {
  for (const g of myGroups) {
    try {
      const preds = await getDocs(collection(db, "groups", g.id, "preds"));
      for (const d of preds.docs) {
        if (d.data().uid === uid) { try { await deleteDoc(d.ref); } catch {} }
      }
    } catch {}
    try {
      await updateDoc(doc(db, "groups", g.id), {
        [`members.${uid}`]: deleteField(),
        memberUids: arrayRemove(uid),
      });
    } catch {}
  }
  try { await deleteDoc(doc(db, "users", uid)); } catch {}
}

function renderNoGroup() {
  return `
    <div class="cards-2">
      <div class="panel">
        <h3>➕ Créer un groupe</h3>
        <input type="text" id="newGroupName" placeholder="Nom du groupe (ex. Les potes)" />
        <button class="btn-primary" id="btnCreate">Créer</button>
      </div>
      <div class="panel">
        <h3>🔗 Rejoindre un groupe</h3>
        <p class="muted">Tu as reçu un <b>lien d'invitation</b> ? Ouvre-le simplement, tu seras ajouté automatiquement.</p>
      </div>
    </div>`;
}
function wireNoGroup() {
  const btn = document.getElementById("btnCreate");
  btn.onclick = async () => {
    const name = document.getElementById("newGroupName").value.trim();
    if (!name) return;
    btn.disabled = true;
    try { await createGroup(name); } catch (e) { alert("Erreur : " + (e.message || e)); btn.disabled = false; }
  };
}

function renderGroup(group) {
  return `
    <div class="group-head">
      <div>
        <div class="group-name">${esc(group.name)}</div>
        <div class="group-meta">${Object.keys(group.members || {}).length} membre(s)</div>
      </div>
      <div class="invite-actions">
        <button class="btn-soft" id="btnInvite">🔗 Copier le lien d'invitation</button>
        <a class="btn-soft" id="btnEmail">✉️ Inviter par e-mail</a>
      </div>
    </div>
    <div class="tabs">
      <button class="tab active" data-tab="pred">⚽ Mes pronostics</button>
      <button class="tab" data-tab="rank">🏆 Classement</button>
      <button class="tab" data-tab="forum">💬 Forum</button>
    </div>
    <div id="tabPred"></div>
    <div id="tabRank" hidden></div>
    <div id="tabForum" hidden></div>`;
}

async function wireGroup(group) {
  // lien d'invitation
  const inviteLink = `${location.origin}/groupes.html?g=${group.id}&t=${group.inviteToken}`;
  document.getElementById("btnInvite").onclick = async () => {
    try { await navigator.clipboard.writeText(inviteLink); } catch {}
    const b = document.getElementById("btnInvite");
    b.textContent = "✅ Lien copié !";
    setTimeout(() => (b.textContent = "🔗 Copier le lien d'invitation"), 2000);
  };

  // invitation par e-mail (ouvre le client mail avec un message pré-rempli)
  const subject = `Invitation au groupe de pronostics « ${group.name} »`;
  const body =
    `Salut !\n\nJe t'invite à rejoindre mon groupe de pronostics « ${group.name} » ` +
    `sur Chat Game Prediction Technology ⚽\n\nClique sur ce lien pour participer :\n${inviteLink}\n\n` +
    `À toi de jouer 🏆`;
  document.getElementById("btnEmail").href =
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // tabs
  appEl.querySelectorAll(".tab").forEach((t) => {
    t.onclick = () => {
      appEl.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
      document.getElementById("tabPred").hidden = t.dataset.tab !== "pred";
      document.getElementById("tabRank").hidden = t.dataset.tab !== "rank";
      document.getElementById("tabForum").hidden = t.dataset.tab !== "forum";
    };
  });

  await renderPredictions(group);
  await renderLeaderboard(group);
  renderForum(group);
}

/* ---------- forum du groupe ---------- */
function renderForum(group) {
  const el = document.getElementById("tabForum");
  el.innerHTML = `
    <div class="forum">
      <div class="forum-list" id="forumList"><p class="empty-state">Chargement…</p></div>
      <form class="forum-form" id="forumForm">
        <input type="text" id="forumInput" maxlength="500" autocomplete="off"
          placeholder="Écris un message au groupe…" />
        <button type="submit" class="btn-primary forum-send">Envoyer</button>
      </form>
    </div>`;

  const listEl = document.getElementById("forumList");
  const form = document.getElementById("forumForm");
  const input = document.getElementById("forumInput");

  // envoi d'un message
  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    try {
      await addDoc(collection(db, "groups", group.id, "messages"), {
        uid: me.uid, name: myName(), text, ts: serverTimestamp(),
      });
    } catch (err) {
      input.value = text;
      alert("Message non envoyé : " + (err.message || err));
    }
  };

  // flux temps réel des messages (les 200 derniers, ordre chronologique)
  if (forumUnsub) { forumUnsub(); forumUnsub = null; }
  const qy = query(collection(db, "groups", group.id, "messages"), orderBy("ts", "asc"), limit(200));
  forumUnsub = onSnapshot(qy,
    (snap) => {
      if (snap.empty) {
        listEl.innerHTML = `<p class="empty-state">Aucun message. Lance la discussion ! 💬</p>`;
        return;
      }
      const atBottom = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 80;
      listEl.innerHTML = snap.docs.map((d) => {
        const m = d.data();
        const mine = m.uid === me.uid;
        const time = m.ts && m.ts.toDate
          ? m.ts.toDate().toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
          : "…";
        const canDel = mine || (group.ownerUid === me.uid);
        return `
          <div class="msg ${mine ? "mine" : ""}" data-id="${d.id}">
            <div class="msg-meta">
              <span class="msg-author">${esc(m.name || "Joueur")}</span>
              <span class="msg-time">${time}</span>
              ${canDel ? `<button class="msg-del" data-id="${d.id}" title="Supprimer">✕</button>` : ""}
            </div>
            <div class="msg-text">${esc(m.text)}</div>
          </div>`;
      }).join("");
      listEl.querySelectorAll(".msg-del").forEach((b) => {
        b.onclick = async () => {
          try { await deleteDoc(doc(db, "groups", group.id, "messages", b.dataset.id)); } catch {}
        };
      });
      if (atBottom) listEl.scrollTop = listEl.scrollHeight;
    },
    () => { listEl.innerHTML = `<p class="empty-state">Forum indisponible.</p>`; }
  );
}

/* ---------- pronostics ---------- */
async function renderPredictions(group) {
  const el = document.getElementById("tabPred");
  const now = Date.now();
  const upcoming = matches
    .filter((m) => new Date(m.datetime).getTime() > now)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  // mes pronostics existants
  const mineSnap = await getDocs(collection(db, "groups", group.id, "preds"));
  const mine = {};
  mineSnap.forEach((d) => { const v = d.data(); if (v.uid === me.uid) mine[v.matchId] = v; });

  if (!upcoming.length) {
    el.innerHTML = `<p class="empty-state">Aucun match à venir pour le moment.</p>`;
    return;
  }

  el.innerHTML = upcoming.map((m) => {
    const p = mine[m.id] || {};
    const btn = (k, lbl) => `<button class="pick ${p.pick === k ? "on" : ""}" data-m="${m.id}" data-k="${k}">${lbl}</button>`;
    return `
      <div class="pred-row" data-m="${m.id}">
        <div class="pred-head">
          <div class="pteam"><span class="pflag">${window.flagHTML(m.home, 34)}</span><span class="pname">${esc(m.home.name)}</span></div>
          <span class="pvs">VS</span>
          <div class="pteam"><span class="pflag">${window.flagHTML(m.away, 34)}</span><span class="pname">${esc(m.away.name)}</span></div>
        </div>
        <div class="pdate">🕐 ${fmtDate(m.datetime)}</div>
        <div class="pred-controls">
          <div class="picks" role="group" aria-label="Résultat">${btn("home", "1")}${btn("draw", "N")}${btn("away", "2")}</div>
          <div class="score-in">
            <span class="score-lbl">Score</span>
            <input type="number" min="0" max="20" class="sc" data-m="${m.id}" data-s="sh" value="${p.sh ?? ""}" placeholder="–" />
            <span class="dash">–</span>
            <input type="number" min="0" max="20" class="sc" data-m="${m.id}" data-s="sa" value="${p.sa ?? ""}" placeholder="–" />
          </div>
          <span class="pred-saved" data-m="${m.id}"></span>
        </div>
      </div>`;
  }).join("");

  const savePred = async (matchId) => {
    const row = el.querySelector(`.pred-row[data-m="${matchId}"]`);
    const tag = row.querySelector(".pred-saved");
    // Verrouillage : plus de modification après le coup d'envoi.
    const m = matches.find((x) => x.id === matchId);
    if (m && hasStarted(m)) {
      lockRow(row);
      tag.textContent = "🔒 match commencé, pronostic verrouillé";
      return;
    }
    const pickEl = row.querySelector(".pick.on");
    const sh = row.querySelector('.sc[data-s="sh"]').value;
    const sa = row.querySelector('.sc[data-s="sa"]').value;
    const pick = pickEl ? pickEl.dataset.k : null;
    if (!pick && sh === "" && sa === "") return;
    tag.textContent = "…";
    try {
      await setDoc(doc(db, "groups", group.id, "preds", `${me.uid}__${matchId}`), {
        uid: me.uid, matchId,
        pick: pick || null,
        sh: sh === "" ? null : Number(sh),
        sa: sa === "" ? null : Number(sa),
        ts: serverTimestamp(),
      });
      tag.textContent = "✅ enregistré";
      setTimeout(() => (tag.textContent = ""), 1500);
    } catch (e) { tag.textContent = "❌"; }
  };

  el.querySelectorAll(".pick").forEach((b) => {
    b.onclick = () => {
      const m = b.dataset.m;
      el.querySelectorAll(`.pick[data-m="${m}"]`).forEach((x) => x.classList.toggle("on", x === b));
      savePred(m);
    };
  });
  el.querySelectorAll(".sc").forEach((i) => { i.onchange = () => savePred(i.dataset.m); });
}

/* ---------- classement ---------- */
async function renderLeaderboard(group) {
  const el = document.getElementById("tabRank");
  const isOwner = group.ownerUid === me.uid;

  // Équité : on ne compte que les matchs dont le coup d'envoi est APRÈS la
  // création du groupe → le bot démarre en même temps que les membres.
  const created = groupCreatedDate(group);
  const settled = history.filter((e) => e.actual && new Date(e.datetime) >= created);

  // toutes les prédictions du groupe
  const snap = await getDocs(collection(db, "groups", group.id, "preds"));
  const predsByUid = {};
  snap.forEach((d) => {
    const v = d.data();
    (predsByUid[v.uid] = predsByUid[v.uid] || {})[v.matchId] = v;
  });

  const rows = [];
  // membres
  for (const [uid, info] of Object.entries(group.members || {})) {
    let pts = 0, exact = 0, played = 0;
    for (const e of settled) {
      const pr = predsByUid[uid]?.[e.id];
      if (!pr) continue;
      played++;
      const p = points(pr, e.actual);
      pts += p; if (p === 3) exact++;
    }
    rows.push({ uid, name: info.name || "Joueur", pts, exact, played, bot: false });
  }
  // bot — sur les MÊMES matchs (depuis la création du groupe)
  let bpts = 0, bexact = 0;
  for (const e of settled) {
    const botPred = { pick: e.predicted.favored, sh: e.predicted.score.home, sa: e.predicted.score.away };
    const p = points(botPred, e.actual);
    bpts += p; if (p === 3) bexact++;
  }
  rows.push({ name: "Bot du site", pts: bpts, exact: bexact, played: settled.length, bot: true });

  rows.sort((a, b) => b.pts - a.pts || b.exact - a.exact);

  el.innerHTML = `
    <div class="rules-card">
      <b>📜 Règles</b>
      <ul>
        <li>🎯 <b>Score exact</b> = <b>3 pts</b> · ✅ <b>bon résultat</b> (1N2) = <b>2 pts</b> · ❌ raté = 0</li>
        <li>⏱️ Seuls comptent les matchs <b>à partir de la création du groupe</b>.</li>
        <li>🔒 Un pronostic se verrouille au <b>coup d'envoi</b> du match.</li>
      </ul>
    </div>
    <div class="lb-note">${settled.length} match(s) comptabilisé(s) depuis la création du groupe</div>
    <div class="lb">
      <div class="lb-h"><span>#</span><span>Joueur</span><span>Joués</span><span>Exacts</span><span>Points</span></div>
      ${rows.map((r, i) => {
        const canRemove = isOwner && !r.bot && r.uid !== me.uid;
        return `
        <div class="lb-row ${r.bot ? "is-bot" : ""}">
          <span class="lb-rank">${i + 1}</span>
          <span class="lb-name">${r.bot ? "🤖 " : ""}${esc(r.name)}${canRemove ? `<button class="lb-del" data-uid="${r.uid}" title="Retirer ${esc(r.name)} du groupe">✕</button>` : ""}</span>
          <span class="lb-num">${r.played}</span>
          <span class="lb-num">${r.exact}</span>
          <span class="lb-pts">${r.pts}</span>
        </div>`; }).join("")}
    </div>`;

  // retrait d'un membre (propriétaire uniquement)
  el.querySelectorAll(".lb-del").forEach((b) => {
    b.onclick = async () => {
      const uid = b.dataset.uid;
      if (!confirm("Retirer ce membre du groupe ?")) return;
      try {
        await updateDoc(doc(db, "groups", group.id), {
          [`members.${uid}`]: deleteField(),
          memberUids: arrayRemove(uid),
        });
        if (group.members) delete group.members[uid];
        await renderLeaderboard(group);
      } catch (e) { alert("Retrait impossible : " + (e.message || e)); }
    };
  });
}

/* ================= bootstrap ================= */
(async function init() {
  await loadSiteData();
  onAuthStateChanged(auth, async (user) => {
    me = user;
    showProfile = false;
    showCreate = false;
    if (!user) return renderAuth();
    // upsert profil
    try {
      await setDoc(doc(db, "users", user.uid),
        { name: myName(), email: user.email || "", photoURL: user.photoURL || "" }, { merge: true });
    } catch {}
    await tryJoinFromUrl();
    await renderApp();
  });
})();
