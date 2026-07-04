(function () {
  "use strict";

  const t = (k, v) => (window.t ? window.t(k, v) : k);

  const canvas = document.getElementById("cCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  // Nations (drapeau via flagcdn, code FIFA pour la carte).
  const COUNTRIES = [
    ["France", "fr", "FRA"], ["Belgique", "be", "BEL"], ["Suisse", "ch", "SUI"],
    ["Espagne", "es", "ESP"], ["Portugal", "pt", "POR"], ["Italie", "it", "ITA"],
    ["Allemagne", "de", "GER"], ["Angleterre", "gb-eng", "ENG"], ["Pays-Bas", "nl", "NED"],
    ["Brésil", "br", "BRA"], ["Argentine", "ar", "ARG"], ["États-Unis", "us", "USA"],
    ["Canada", "ca", "CAN"], ["Mexique", "mx", "MEX"], ["Maroc", "ma", "MAR"],
    ["Sénégal", "sn", "SEN"], ["Algérie", "dz", "ALG"], ["Tunisie", "tn", "TUN"],
    ["Côte d'Ivoire", "ci", "CIV"], ["Ghana", "gh", "GHA"], ["Nigéria", "ng", "NGA"],
    ["Japon", "jp", "JPN"], ["Corée du Sud", "kr", "KOR"], ["Australie", "au", "AUS"],
    ["Croatie", "hr", "CRO"], ["Pologne", "pl", "POL"], ["Danemark", "dk", "DEN"],
    ["Suède", "se", "SWE"], ["Norvège", "no", "NOR"], ["Turquie", "tr", "TUR"],
    ["Égypte", "eg", "EGY"], ["Arabie Saoudite", "sa", "KSA"], ["Qatar", "qa", "QAT"],
    ["Colombie", "co", "COL"], ["Uruguay", "uy", "URU"], ["Chili", "cl", "CHI"],
  ];

  // Stats par défaut (modifiables) · clin d'œil aux cartes de foot.
  const DEFAULT_STATS = [
    ["Vision", 95], ["Réseau", 92], ["Mental", 90],
    ["Sang-froid", 88], ["Influence", 91], ["Leadership", 93],
  ];

  // Couleurs de maillot par pays (corps, liseré).
  const COLORS = {
    fr: ["#14225e", "#ffffff"], be: ["#b71234", "#f0c419"], ch: ["#d52b1e", "#ffffff"],
    es: ["#c60b1e", "#f9d616"], pt: ["#7a1f2b", "#1c8a3a"], it: ["#1a52a0", "#ffffff"],
    de: ["#ededed", "#161616"], "gb-eng": ["#ededed", "#1b2a64"], nl: ["#ff6a13", "#ffffff"],
    br: ["#ffd000", "#1c8a3a"], ar: ["#75aadb", "#ffffff"], us: ["#1b2a64", "#c8102e"],
    ca: ["#c8102e", "#ffffff"], mx: ["#0a6b3b", "#ffffff"], ma: ["#c1272d", "#1c8a3a"],
    sn: ["#1e8a4c", "#e8b300"], dz: ["#1a7a45", "#ffffff"], tn: ["#d21a2a", "#ffffff"],
    ci: ["#f08a1d", "#1e8a4c"], gh: ["#ededed", "#d21a2a"], ng: ["#1e8a4c", "#ffffff"],
    jp: ["#1a2b6b", "#ffffff"], kr: ["#d21a2a", "#1a2b6b"], au: ["#f9d616", "#1e8a4c"],
    hr: ["#d21a2a", "#ffffff"], pl: ["#ededed", "#d21a2a"], dk: ["#c60c30", "#ffffff"],
    se: ["#1a52a0", "#f9d616"], no: ["#c8102e", "#1a2b6b"], tr: ["#d21a2a", "#ffffff"],
    eg: ["#d21a2a", "#ffffff"], sa: ["#1e8a4c", "#ffffff"], qa: ["#7a1230", "#ffffff"],
    co: ["#f9d616", "#1a2b6b"], uy: ["#4aa3df", "#161616"], cl: ["#c8102e", "#1a52a0"],
  };
  const jerseyColors = () => COLORS[state.country[1]] || ["#14225e", "#ffffff"];

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  const $ = (id) => document.getElementById(id);
  let photoImg = null;
  let photoDataUrl = null; // photo d'origine (envoyée à l'IA)
  let flagImg = null;
  let paniniImg = null; // logo officiel optionnel (panini-logo.png à la racine)
  let paniniCrop = null; // zone visible (recadrage des marges transparentes)
  const state = { country: COUNTRIES[0] };

  /* ---------- formulaire ---------- */
  function fillCountries() {
    const sel = $("cCountry");
    sel.innerHTML = COUNTRIES.map((c, i) => `<option value="${i}">${c[0]}</option>`).join("");
    sel.onchange = () => { state.country = COUNTRIES[sel.value]; loadFlag(); };
  }

  function buildStats() {
    const grid = $("cStats");
    grid.innerHTML = DEFAULT_STATS.map((s, i) => `
      <div class="stat-input">
        <input type="text" class="st-label" data-i="${i}" maxlength="14" value="${s[0]}" />
        <input type="number" class="st-val" data-i="${i}" min="0" max="99" value="${s[1]}" />
      </div>`).join("");
    grid.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", render));
  }

  function getStats() {
    const labels = [...document.querySelectorAll(".st-label")];
    const vals = [...document.querySelectorAll(".st-val")];
    return labels.map((l, i) => [l.value || "·", Math.max(0, Math.min(99, +vals[i].value || 0))]);
  }

  function loadFlag() {
    flagImg = null;
    const iso = state.country[1];
    const img = new Image();
    img.crossOrigin = "anonymous"; // flagcdn renvoie CORS → canvas exportable
    img.onload = () => { flagImg = img; render(); };
    img.onerror = () => { flagImg = null; render(); };
    img.src = `https://flagcdn.com/w160/${iso}.png`;
  }

  // Logo PANINI officiel optionnel (panini-logo.png à la racine du site).
  function loadPanini() {
    const img = new Image();
    img.onload = () => { paniniImg = img; paniniCrop = opaqueBounds(img); render(); };
    img.onerror = () => { paniniImg = null; };
    img.src = "panini-logo.png";
  }

  // Boîte englobante du logo : pixels « colorés » (saturés) ou « sombres »,
  // de façon à ignorer un fond gris/blanc ou un damier de transparence incrusté.
  function opaqueBounds(img) {
    try {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const cx = c.getContext("2d");
      cx.drawImage(img, 0, 0);
      const d = cx.getImageData(0, 0, c.width, c.height).data;
      let minX = c.width, minY = c.height, maxX = 0, maxY = 0, found = false;
      for (let y = 0; y < c.height; y += 2) {
        for (let x = 0; x < c.width; x += 2) {
          const i = (y * c.width + x) * 4;
          if (d[i + 3] < 16) continue; // vrai transparent
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
          const colored = mx - mn > 45;     // couleur vive (jaune, rouge, bleu…)
          const dark = mx < 70;             // bordure noire
          if (!colored && !dark) continue;  // gris / blanc / damier → ignoré
          found = true;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (!found) return null;
      return { sx: minX, sy: minY, sw: maxX - minX, sh: maxY - minY };
    } catch (e) { return null; }
  }

  $("cPhoto").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      photoDataUrl = reader.result; // conservée pour l'envoi à l'IA
      const img = new Image();
      img.onload = () => { photoImg = img; render(); };
      img.src = reader.result; // data URL local → pas de taint, export OK
    };
    reader.readAsDataURL(file);
  });

  ["cName", "cRole", "cCompany", "cNumber"].forEach((id) => $(id).addEventListener("input", render));

  /* ---------- dessin ---------- */
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitFont(text, maxW, size, weight) {
    let s = size;
    do {
      ctx.font = `${weight} ${s}px Sora, sans-serif`;
      if (ctx.measureText(text).width <= maxW) break;
      s -= 2;
    } while (s > 14);
    return s;
  }

  function star(cx, cy, r, fill) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.45;
      ctx[i ? "lineTo" : "moveTo"](cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = fill ? "#e7b53b" : "rgba(60,70,95,0.45)";
    ctx.fill();
  }

  // Dessine un maillot façon col en V aux couleurs du pays, par-dessus la photo.
  function drawJersey(r) {
    const [body, trim] = jerseyColors();
    const cx = r.x + r.w / 2;
    const top = r.y + r.h * 0.58;   // ligne d'épaules
    const neck = top + 70;          // ouverture du col
    const vpt = top + 210;          // pointe du V
    const bottom = r.y + r.h + 30;

    ctx.save();
    rr(r.x, r.y, r.w, r.h, 20); ctx.clip();

    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, shade(body, 1.12)); g.addColorStop(1, shade(body, 0.82));

    ctx.beginPath();
    ctx.moveTo(r.x - 30, bottom);
    ctx.lineTo(r.x - 30, top + 64);
    ctx.quadraticCurveTo(r.x + r.w * 0.20, top - 30, cx - 112, neck);
    ctx.lineTo(cx, vpt);
    ctx.lineTo(cx + 112, neck);
    ctx.quadraticCurveTo(r.x + r.w * 0.80, top - 30, r.x + r.w + 30, top + 64);
    ctx.lineTo(r.x + r.w + 30, bottom);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();

    // ombre douce du col
    ctx.save(); ctx.clip();
    const sh = ctx.createLinearGradient(0, top, 0, top + 120);
    sh.addColorStop(0, "rgba(0,0,0,0.22)"); sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh; ctx.fillRect(r.x - 30, top - 30, r.w + 60, 150);
    ctx.restore();

    // liseré col en V
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.lineWidth = 20; ctx.strokeStyle = trim;
    ctx.beginPath();
    ctx.moveTo(cx - 112, neck); ctx.lineTo(cx, vpt); ctx.lineTo(cx + 112, neck);
    ctx.stroke();

    // liserés d'épaules (style maillot)
    ctx.lineWidth = 12; ctx.strokeStyle = trim;
    ctx.beginPath();
    ctx.moveTo(r.x + r.w * 0.07, top + 70);
    ctx.quadraticCurveTo(r.x + r.w * 0.22, top - 4, cx - 120, neck - 4);
    ctx.moveTo(r.x + r.w * 0.93, top + 70);
    ctx.quadraticCurveTo(r.x + r.w * 0.78, top - 4, cx + 120, neck - 4);
    ctx.stroke();

    // petit écusson (drapeau) sur le torse
    if (flagImg) {
      const fx = cx + 150, fy = vpt + 10, fw = 70, fh = 50;
      ctx.save(); rr(fx, fy, fw, fh, 6); ctx.clip();
      ctx.drawImage(flagImg, fx, fy, fw, fh); ctx.restore();
      rr(fx, fy, fw, fh, 6); ctx.lineWidth = 3; ctx.strokeStyle = trim; ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------- éléments carte premium (style Panini) ---------- */
  // PRNG déterministe → fond holographique stable (pas de scintillement).
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Fond holographique : éclats prismatiques dans un rectangle arrondi.
  function drawFoil(x, y, w, h, r) {
    ctx.save();
    rr(x, y, w, h, r); ctx.clip();
    const base = ctx.createLinearGradient(x, y, x + w, y + h);
    base.addColorStop(0, "#cdd4e6"); base.addColorStop(0.5, "#eef1f7"); base.addColorStop(1, "#d4d8e6");
    ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
    const cols = ["#ff6d9a", "#ffd24d", "#5fe3ff", "#9a8cff", "#74ffb0", "#ffa45f"];
    const rnd = mulberry32(20260629);
    for (let i = 0; i < 110; i++) {
      const px = x + rnd() * w, py = y + rnd() * h, s = 50 + rnd() * 150;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + s * (rnd() - 0.5), py + s * (0.3 + rnd() * 0.7));
      ctx.lineTo(px + s * (0.3 + rnd() * 0.7), py + s * (rnd() - 0.5));
      ctx.closePath();
      ctx.globalAlpha = 0.08 + rnd() * 0.12;
      ctx.fillStyle = cols[i % cols.length];
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Logo PANINI : utilise panini-logo.png s'il existe, sinon version dessinée.
  function paniniBadge(x, y) {
    if (paniniImg) {
      const cr = paniniCrop || { sx: 0, sy: 0, sw: paniniImg.width, sh: paniniImg.height };
      const maxH = 70, maxW = 300;
      let h = maxH, w = h * (cr.sw / cr.sh);
      if (w > maxW) { w = maxW; h = w * (cr.sh / cr.sw); }
      ctx.save();
      rr(x, y, w, h, 11); ctx.clip(); // masque les coins (damier résiduel)
      ctx.drawImage(paniniImg, cr.sx, cr.sy, cr.sw, cr.sh, x, y, w, h);
      ctx.restore();
      return;
    }
    const w = 204, h = 58;
    rr(x, y, w, h, 10); ctx.fillStyle = "#ffd400"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#1a1a1a"; ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "800 38px Georgia, 'Times New Roman', serif";
    ctx.lineJoin = "round"; ctx.lineWidth = 7; ctx.strokeStyle = "#0c2a6b";
    ctx.strokeText("PANINI", x + w / 2, y + h / 2 + 1);
    ctx.fillStyle = "#d6122b"; ctx.fillText("PANINI", x + w / 2, y + h / 2 + 1);
    ctx.beginPath(); ctx.moveTo(x + 14, y + h - 11); ctx.lineTo(x + w - 14, y + h - 11);
    ctx.lineWidth = 2; ctx.strokeStyle = "#1a1a1a"; ctx.stroke();
    ctx.textBaseline = "alphabetic";
  }

  // Encart « logo entreprise » (haut droite) : nom mis en page comme un logo.
  function companyBox(x, y, w, h, text) {
    rr(x, y, w, h, 14); ctx.fillStyle = "#f4f2ea"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(12,42,107,0.55)"; ctx.stroke();
    const words = (text || "").split(/\s+/).filter(Boolean);
    if (!words.length) return;
    ctx.fillStyle = "#0c2a6b"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.font = `800 ${fitFont(words[0], w - 28, 44, 800)}px Sora, sans-serif`;
    ctx.fillText(words[0].toUpperCase(), x + w / 2, y + 70);
    const rest = words.slice(1).join(" ").toUpperCase();
    if (rest) {
      ctx.fillStyle = "#13315f"; ctx.font = `700 ${fitFont(rest, w - 24, 17, 700)}px Sora, sans-serif`;
      ctx.fillText(rest, x + w / 2, y + h - 16);
    }
  }

  // Écusson étoile (à droite du nom).
  function shieldStar(cx, topY) {
    const w = 104, h = 104, x = cx - w / 2, y = topY;
    ctx.beginPath();
    ctx.moveTo(x + 14, y);
    ctx.lineTo(x + w - 14, y);
    ctx.arcTo(x + w, y, x + w, y + 14, 12);
    ctx.lineTo(x + w, y + h * 0.55);
    ctx.quadraticCurveTo(x + w, y + h * 0.82, cx, y + h);
    ctx.quadraticCurveTo(x, y + h * 0.82, x, y + h * 0.55);
    ctx.lineTo(x, y + 14);
    ctx.arcTo(x, y, x + 14, y, 12);
    ctx.closePath();
    ctx.fillStyle = "#13315f"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#e7e3d6"; ctx.stroke();
    star(cx, y + h * 0.46, 28, true);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    const name = ($("cName").value || "").toUpperCase();
    const role = ($("cRole").value || "").toUpperCase();
    const comp = ($("cCompany").value || "");
    const num = ($("cNumber") && $("cNumber").value || "").trim();
    const stats = getStats();
    const [body] = jerseyColors();

    // bord crème + fond holographique
    rr(0, 0, W, H, 46); ctx.fillStyle = "#e7e3d6"; ctx.fill();
    drawFoil(14, 14, W - 28, H - 28, 38);

    // ---- panneau photo ----
    const pr = { x: 42, y: 42, w: W - 84, h: 946 };
    ctx.save(); rr(pr.x, pr.y, pr.w, pr.h, 24); ctx.clip();
    const glow = ctx.createRadialGradient(W / 2, pr.y + 360, 120, W / 2, pr.y + 360, 780);
    glow.addColorStop(0, shade(body, 0.9)); glow.addColorStop(1, "#0a1326");
    ctx.fillStyle = glow; ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    if (photoImg) {
      const ar = photoImg.width / photoImg.height, tr = pr.w / pr.h;
      let dw, dh; if (ar > tr) { dh = pr.h; dw = dh * ar; } else { dw = pr.w; dh = dw / ar; }
      ctx.drawImage(photoImg, pr.x + (pr.w - dw) / 2, pr.y + (pr.h - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "600 34px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(t("card_photo_ph"), W / 2, pr.y + pr.h / 2 + 70);
      ctx.font = "150px serif"; ctx.fillText("👤", W / 2, pr.y + pr.h / 2 - 10);
    }
    ctx.restore();
    rr(pr.x, pr.y, pr.w, pr.h, 24); ctx.lineWidth = 7; ctx.strokeStyle = "#13315f"; ctx.stroke();

    // ---- drapeau pays (haut gauche) ----
    rr(56, 150, 96, 88, 14); ctx.fillStyle = "rgba(9,19,42,0.62)"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "rgba(120,150,220,0.4)"; ctx.stroke();
    if (flagImg) {
      ctx.save(); rr(68, 166, 72, 54, 7); ctx.clip();
      ctx.drawImage(flagImg, 68, 166, 72, 54); ctx.restore();
      rr(68, 166, 72, 54, 7); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
    } else {
      ctx.fillStyle = "#fff"; ctx.font = "800 22px Sora, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(state.country[2], 104, 201);
    }

    // ---- badges du haut ----
    paniniBadge(64, 60);
    companyBox(W - 296, 58, 232, 120, comp);

    // ---- filigrane du site ----
    rr(W - 352, 922, 288, 46, 12); ctx.fillStyle = "rgba(9,19,42,0.72)"; ctx.fill();
    ctx.font = "800 24px Sora, sans-serif"; ctx.fillStyle = "#7ea0ff"; ctx.textAlign = "center";
    ctx.fillText("Chatgpt.football", W - 208, 952);

    // ---- bandeau nom + écusson étoile ----
    rr(42, 998, W - 84, 92, 16); ctx.fillStyle = "#f1efe6"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#13315f"; ctx.stroke();
    ctx.fillStyle = "#0a1326"; ctx.textAlign = "center";
    ctx.font = `800 ${fitFont(name, W - 300, 64, 800)}px Sora, sans-serif`;
    ctx.fillText(name, (W - 120) / 2, 1062);
    shieldStar(W - 108, 984);

    // ---- rôle + entreprise ----
    rr(42, 1098, W - 84, 56, 12); ctx.fillStyle = "#13315f"; ctx.fill();
    ctx.fillStyle = "#dce6ff"; ctx.textAlign = "center";
    ctx.font = `700 ${fitFont(role, W - 160, 32, 700)}px Sora, sans-serif`;
    ctx.fillText(role, W / 2, 1136);
    rr(42, 1160, W - 84, 56, 12); ctx.fillStyle = "#0e2444"; ctx.fill();
    ctx.fillStyle = "#aebbe0";
    ctx.font = `700 ${fitFont(comp.toUpperCase(), W - 160, 30, 700)}px Sora, sans-serif`;
    ctx.fillText(comp.toUpperCase(), W / 2, 1198);

    // ---- numéro joueur + bloc stats ----
    rr(50, 1240, 90, 90, 14); ctx.fillStyle = "#13315f"; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = "#e7e3d6"; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.font = `800 ${fitFont(num || "·", 70, 46, 800)}px Sora, sans-serif`;
    ctx.fillText(num || "·", 95, 1302);

    const bx = 156, by = 1228, bw = W - 156 - 42, bh = 230;
    rr(bx, by, bw, bh, 16); ctx.fillStyle = "#eceae0"; ctx.fill();
    const rowH = bh / stats.length;
    stats.forEach((s, i) => {
      const cy = by + rowH * i + rowH / 2;
      ctx.fillStyle = "#0a1326"; ctx.font = "800 26px Sora, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(s[0].toUpperCase(), bx + 26, cy + 9);
      ctx.textAlign = "right";
      ctx.fillText(String(s[1]), bx + 500, cy + 9);
      const filled = Math.round(s[1] / 20);
      for (let k = 0; k < 5; k++) star(bx + 540 + k * 52, cy, 19, k < filled);
    });
  }

  /* ---------- télécharger / partager ---------- */
  function fileName() {
    return "carte-" + (($("cName").value || "panini").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")) + ".png";
  }

  $("cDownload").onclick = () => {
    const a = document.createElement("a");
    a.download = fileName();
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const shareUrl = "https://chatgpt.football/carte.html";
  function shareText() { return t("card_share_text"); }

  $("cShare").onclick = async () => {
    const links = $("cShareLinks");
    // Partage natif avec l'image (mobile surtout)
    if (navigator.canShare) {
      try {
        const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        const file = new File([blob], fileName(), { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text: shareText(), url: shareUrl });
          return;
        }
      } catch (e) { /* annulé ou non supporté → repli */ }
    }
    // Repli : on télécharge l'image et on montre les liens réseaux
    $("cDownload").click();
    links.hidden = false;
  };

  $("cLinkedin").href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  $("cX").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(shareUrl)}`;

  /* ---------- version IA (maillot réaliste via Gemini, proxifié) ---------- */
  const WORKER = (window.CARTE_CONFIG && window.CARTE_CONFIG.geminiWorkerUrl) || "";
  const aiStatus = $("cAIStatus");
  const setStatus = (msg) => { aiStatus.hidden = !msg; aiStatus.textContent = msg || ""; };

  $("cAI").onclick = async () => {
    if (!WORKER) { setStatus(t("card_ai_unconfigured")); return; }
    if (!photoDataUrl) { setStatus(t("card_ai_need_photo")); return; }
    const btn = $("cAI");
    btn.disabled = true;
    setStatus(t("card_ai_loading"));
    try {
      const res = await fetch(WORKER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: photoDataUrl,
          country: state.country[0],
          colors: jerseyColors().join(" / "),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.image) throw new Error(data.error || ("HTTP " + res.status));
      const img = new Image();
      img.onload = () => {
        photoImg = img;
        render();
        setStatus("");
        btn.disabled = false;
      };
      img.onerror = () => { setStatus(t("card_ai_error")); btn.disabled = false; };
      img.src = data.image;
    } catch (e) {
      setStatus(t("card_ai_error") + " · " + (e.message || e));
      btn.disabled = false;
    }
  };

  /* ---------- init ---------- */
  fillCountries();
  buildStats();
  loadFlag();
  loadPanini();
  render();
  document.addEventListener("i18n:changed", render);
})();
