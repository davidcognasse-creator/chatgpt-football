// Cloudflare Worker — proxy sécurisé vers Gemini 2.5 Flash Image.
// Garde la clé GEMINI_API_KEY secrète (jamais exposée au navigateur) et habille
// la personne de la photo d'un maillot aux couleurs du pays.
//
// Déploiement : voir SETUP-CARTE-IA.md
//   npm i -g wrangler
//   wrangler secret put GEMINI_API_KEY   (colle ta clé Google AI Studio)
//   wrangler deploy

const MODEL = "gemini-2.5-flash-image";

// Origines autorisées (anti-abus basique côté navigateur). Ajoute les tiennes.
const ALLOWED = ["https://chatgpt.football", "http://localhost", "http://127.0.0.1"];

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allow = ALLOWED.some((o) => origin === o || origin.startsWith(o + ":")) ? origin : ALLOWED[0];
    const cors = {
      "Access-Control-Allow-Origin": allow,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
    if (!env.GEMINI_API_KEY) return json({ error: "GEMINI_API_KEY manquante (wrangler secret put)" }, 500, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON invalide" }, 400, cors); }

    const m = /^data:(image\/[\w+.-]+);base64,(.+)$/s.exec(body.image || "");
    if (!m) return json({ error: "Image attendue (data URL base64)" }, 400, cors);
    const mime = m[1], b64 = m[2];
    const country = String(body.country || "son pays").replace(/[^\p{L}\p{N} .'-]/gu, "").slice(0, 60);
    const colors = String(body.colors || "").replace(/[^\p{L}\p{N} ,#-]/gu, "").slice(0, 80);

    const prompt =
      `Edit this portrait photo to look like a football trading card. ` +
      `1) Dress the person in a realistic football (soccer) jersey in the colours ` +
      `of ${country}${colors ? " (" + colors + ")" : ""}. ` +
      `2) Replace the entire background with a premium collectible trading-card ` +
      `backdrop: a holographic prismatic foil texture combined with a subtle modern ` +
      `city skyline and an upward-trending bar chart with a rising arrow, tinted in ` +
      `the team colours${colors ? " (" + colors + ")" : ""}, like a shiny Panini sticker. ` +
      `Keep the person's face, hairstyle, skin tone and identity EXACTLY the same. ` +
      `Head-and-shoulders framing, natural lighting, realistic fabric and collar. ` +
      `No text, no sponsor, no logo, no watermark.`;

    const gReq = {
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64 } }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
    let gr;
    try {
      gr = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gReq),
      });
    } catch (e) { return json({ error: "Gemini injoignable" }, 502, cors); }

    if (!gr.ok) {
      const txt = await gr.text();
      return json({ error: "Gemini HTTP " + gr.status, detail: txt.slice(0, 300) }, 502, cors);
    }

    const data = await gr.json();
    const cand = (data.candidates || [])[0] || {};
    const parts = (cand.content || {}).parts || [];
    const part = parts.find((p) => p.inlineData || p.inline_data);
    if (!part) {
      // Pas d'image : on remonte la vraie raison (blocage sécurité, texte de refus…)
      const reason = cand.finishReason || (data.promptFeedback || {}).blockReason || "inconnue";
      const txt = parts.map((p) => p.text).filter(Boolean).join(" ").slice(0, 200);
      return json({
        error: "Pas d'image (raison: " + reason + ")" + (txt ? " — " + txt : ""),
      }, 502, cors);
    }
    const inl = part.inlineData || part.inline_data;
    return json({ image: `data:${inl.mimeType || inl.mime_type || "image/png"};base64,${inl.data}` }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
