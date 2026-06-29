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

  // Stats par défaut (modifiables) — clin d'œil aux cartes de foot.
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
    return labels.map((l, i) => [l.value || "—", Math.max(0, Math.min(99, +vals[i].value || 0))]);
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

  ["cName", "cRole", "cCompany"].forEach((id) => $(id).addEventListener("input", render));
  $("cJersey").addEventListener("change", render);

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

  function render() {
    ctx.clearRect(0, 0, W, H);

    // fond carte + cadre
    rr(0, 0, W, H, 46); ctx.fillStyle = "#0a1326"; ctx.fill();
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#11213f"); bg.addColorStop(0.5, "#0d1830"); bg.addColorStop(1, "#1a1640");
    rr(24, 24, W - 48, H - 48, 36); ctx.fillStyle = bg; ctx.fill();
    // reflets holo
    for (let i = -2; i < 8; i++) {
      const g = ctx.createLinearGradient(i * 180, 0, i * 180 + 220, H);
      g.addColorStop(0, "rgba(120,160,255,0)");
      g.addColorStop(0.5, "rgba(150,180,255,0.05)");
      g.addColorStop(1, "rgba(180,140,255,0)");
      ctx.save(); rr(24, 24, W - 48, H - 48, 36); ctx.clip();
      ctx.fillStyle = g; ctx.fillRect(i * 180, 24, 120, H); ctx.restore();
    }
    rr(24, 24, W - 48, H - 48, 36);
    ctx.lineWidth = 8; ctx.strokeStyle = "rgba(232,238,255,0.85)"; ctx.stroke();

    // photo
    const pr = { x: 70, y: 150, w: W - 140, h: 760 };
    ctx.save(); rr(pr.x, pr.y, pr.w, pr.h, 20); ctx.clip();
    const glow = ctx.createRadialGradient(W / 2, pr.y + 280, 80, W / 2, pr.y + 280, 600);
    glow.addColorStop(0, "rgba(91,140,255,0.35)"); glow.addColorStop(1, "rgba(10,19,38,0.9)");
    ctx.fillStyle = glow; ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
    if (photoImg) {
      const ar = photoImg.width / photoImg.height, tr = pr.w / pr.h;
      let dw, dh; if (ar > tr) { dh = pr.h; dw = dh * ar; } else { dw = pr.w; dh = dw / ar; }
      ctx.drawImage(photoImg, pr.x + (pr.w - dw) / 2, pr.y + (pr.h - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "600 34px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(t("card_photo_ph"), W / 2, pr.y + pr.h / 2);
      ctx.font = "120px serif"; ctx.fillText("👤", W / 2, pr.y + pr.h / 2 - 60);
    }
    ctx.restore();

    // maillot aux couleurs du pays (par-dessus la photo)
    if (photoImg && $("cJersey") && $("cJersey").checked) drawJersey(pr);

    // badge chatgpt.football (haut gauche) — promotion du site
    ctx.textAlign = "left";
    rr(70, 60, 360, 64, 14); ctx.fillStyle = "rgba(10,19,38,0.78)"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(120,150,220,0.5)"; ctx.stroke();
    ctx.font = "800 30px Sora, sans-serif"; ctx.fillStyle = "#7ea0ff";
    ctx.fillText("chatgpt.football", 90, 102);

    // drapeau + code (haut gauche, sous le badge dans la photo)
    if (flagImg) {
      ctx.save(); rr(80, 175, 92, 66, 8); ctx.clip();
      ctx.drawImage(flagImg, 80, 175, 92, 66); ctx.restore();
      rr(80, 175, 92, 66, 8); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
    }
    rr(80, 248, 92, 40, 8); ctx.fillStyle = "rgba(10,19,38,0.8)"; ctx.fill();
    ctx.font = "800 26px Sora, sans-serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.fillText(state.country[2], 126, 277);

    // bandeau nom
    const name = ($("cName").value || "").toUpperCase();
    rr(70, 930, W - 140, 86, 14); ctx.fillStyle = "#eef0ec"; ctx.fill();
    ctx.fillStyle = "#0a1326"; ctx.textAlign = "center";
    ctx.font = `800 ${fitFont(name, W - 220, 62, 800)}px Sora, sans-serif`;
    ctx.fillText(name, W / 2, 992);

    // rôle + entreprise
    const role = ($("cRole").value || "").toUpperCase();
    const comp = ($("cCompany").value || "").toUpperCase();
    rr(70, 1028, W - 140, 58, 12); ctx.fillStyle = "#15315f"; ctx.fill();
    ctx.fillStyle = "#dce6ff"; ctx.font = `700 ${fitFont(role, W - 200, 30, 700)}px Sora, sans-serif`;
    ctx.fillText(role, W / 2, 1066);
    rr(70, 1094, W - 140, 58, 12); ctx.fillStyle = "#0f2547"; ctx.fill();
    ctx.fillStyle = "#aebbe0"; ctx.font = `700 ${fitFont(comp, W - 200, 28, 700)}px Sora, sans-serif`;
    ctx.fillText(comp, W / 2, 1132);

    // bloc stats
    const stats = getStats();
    const bx = 70, by = 1176, bw = W - 140, bh = 250;
    rr(bx, by, bw, bh, 16); ctx.fillStyle = "#eceee9"; ctx.fill();
    ctx.textAlign = "left";
    const rowH = bh / stats.length;
    stats.forEach((s, i) => {
      const cy = by + rowH * i + rowH / 2;
      ctx.fillStyle = "#0a1326"; ctx.font = "800 27px Sora, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(s[0].toUpperCase(), bx + 28, cy + 9);
      ctx.font = "800 27px Sora, sans-serif"; ctx.textAlign = "right";
      ctx.fillText(String(s[1]), bx + 470, cy + 9);
      const filled = Math.round(s[1] / 20);
      for (let k = 0; k < 5; k++) star(bx + 540 + k * 56, cy, 22, k < filled);
    });

    // badge note + étoile
    const avg = Math.round(stats.reduce((a, s) => a + s[1], 0) / stats.length / 10);
    rr(bx - 0, by - 70, 90, 60, 12); ctx.fillStyle = "#13294e"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "rgba(120,150,220,0.5)"; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "800 32px Sora, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(String(avg), bx + 45, by - 28);

    // pied
    ctx.fillStyle = "#7ea0ff"; ctx.font = "700 26px Sora, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("chatgpt.football", W / 2, H - 50);
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
        $("cJersey").checked = false; // l'IA a déjà mis le maillot
        render();
        setStatus("");
        btn.disabled = false;
      };
      img.onerror = () => { setStatus(t("card_ai_error")); btn.disabled = false; };
      img.src = data.image;
    } catch (e) {
      setStatus(t("card_ai_error") + " — " + (e.message || e));
      btn.disabled = false;
    }
  };

  /* ---------- init ---------- */
  fillCountries();
  buildStats();
  loadFlag();
  render();
  document.addEventListener("i18n:changed", render);
})();
