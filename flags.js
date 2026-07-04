// Drapeaux en VRAIES images (flagcdn.com) au lieu d'emojis.
// Raison : Windows n'affiche pas les emojis drapeaux (🇫🇷 devient « FR »).
// window.flagHTML(team, hauteurPx) → <img> du drapeau, repli emoji si pays non mappé.
(function () {
  "use strict";

  // nom de pays (FR ou EN, accents tolérés) → code flagcdn (ISO 3166-1 alpha-2,
  // + sous-divisions gb-eng / gb-sct / gb-wls / gb-nir).
  const MAP = {
    algeria: "dz", algerie: "dz",
    argentina: "ar", argentine: "ar",
    australia: "au", australie: "au",
    austria: "at", autriche: "at",
    belgium: "be", belgique: "be",
    "bosnia & herzegovina": "ba", "bosnia and herzegovina": "ba", "bosnie-herzegovine": "ba",
    brazil: "br", bresil: "br",
    canada: "ca",
    "cape verde": "cv", "cap-vert": "cv", "cabo verde": "cv",
    cameroon: "cm", cameroun: "cm",
    chile: "cl", chili: "cl",
    colombia: "co", colombie: "co",
    "costa rica": "cr",
    croatia: "hr", croatie: "hr",
    curacao: "cw",
    denmark: "dk", danemark: "dk",
    "dr congo": "cd", "congo dr": "cd", "rd congo": "cd",
    ecuador: "ec", equateur: "ec",
    egypt: "eg", egypte: "eg",
    "el salvador": "sv",
    england: "gb-eng", angleterre: "gb-eng",
    france: "fr",
    germany: "de", allemagne: "de",
    ghana: "gh",
    greece: "gr", grece: "gr",
    guatemala: "gt",
    haiti: "ht",
    honduras: "hn",
    iran: "ir",
    iraq: "iq", irak: "iq",
    ireland: "ie", "republic of ireland": "ie", irlande: "ie",
    "ivory coast": "ci", "cote d'ivoire": "ci",
    italy: "it", italie: "it",
    jamaica: "jm", jamaique: "jm",
    japan: "jp", japon: "jp",
    jordan: "jo", jordanie: "jo",
    mali: "ml",
    mexico: "mx", mexique: "mx",
    morocco: "ma", maroc: "ma",
    netherlands: "nl", "pays-bas": "nl",
    "new zealand": "nz", "nouvelle-zelande": "nz",
    nigeria: "ng",
    "northern ireland": "gb-nir",
    norway: "no", norvege: "no",
    oman: "om",
    panama: "pa",
    paraguay: "py",
    peru: "pe", perou: "pe",
    poland: "pl", pologne: "pl",
    portugal: "pt",
    qatar: "qa",
    "saudi arabia": "sa", "arabie saoudite": "sa",
    scotland: "gb-sct", ecosse: "gb-sct",
    senegal: "sn",
    serbia: "rs", serbie: "rs",
    "south africa": "za", "afrique du sud": "za",
    "south korea": "kr", "korea republic": "kr", "coree du sud": "kr",
    spain: "es", espagne: "es",
    suriname: "sr",
    sweden: "se", suede: "se",
    switzerland: "ch", suisse: "ch",
    tunisia: "tn", tunisie: "tn",
    turkey: "tr", turkiye: "tr", turquie: "tr",
    ukraine: "ua",
    "united arab emirates": "ae", "emirats arabes unis": "ae",
    "united states": "us", usa: "us", "etats-unis": "us",
    uruguay: "uy",
    uzbekistan: "uz", ouzbekistan: "uz",
    venezuela: "ve",
    wales: "gb-wls", "pays de galles": "gb-wls",
  };

  // Noms de pays localis\u00e9s, key\u00e9s par le code drapeau (fr + en canonique).
  // Sert \u00e0 afficher les \u00e9quipes en fran\u00e7ais quand le site est en fran\u00e7ais
  // (les donn\u00e9es du robot sont en anglais/mixte).
  const NAMES = {
    dz: { fr: "Alg\u00e9rie", en: "Algeria" }, ar: { fr: "Argentine", en: "Argentina" },
    au: { fr: "Australie", en: "Australia" }, at: { fr: "Autriche", en: "Austria" },
    be: { fr: "Belgique", en: "Belgium" }, ba: { fr: "Bosnie-Herz\u00e9govine", en: "Bosnia & Herzegovina" },
    br: { fr: "Br\u00e9sil", en: "Brazil" }, ca: { fr: "Canada", en: "Canada" },
    cv: { fr: "Cap-Vert", en: "Cape Verde" }, cm: { fr: "Cameroun", en: "Cameroon" },
    cl: { fr: "Chili", en: "Chile" }, co: { fr: "Colombie", en: "Colombia" },
    cr: { fr: "Costa Rica", en: "Costa Rica" }, hr: { fr: "Croatie", en: "Croatia" },
    cw: { fr: "Cura\u00e7ao", en: "Cura\u00e7ao" }, dk: { fr: "Danemark", en: "Denmark" },
    cd: { fr: "RD Congo", en: "DR Congo" }, ec: { fr: "\u00c9quateur", en: "Ecuador" },
    eg: { fr: "\u00c9gypte", en: "Egypt" }, sv: { fr: "Salvador", en: "El Salvador" },
    "gb-eng": { fr: "Angleterre", en: "England" }, fr: { fr: "France", en: "France" },
    de: { fr: "Allemagne", en: "Germany" }, gh: { fr: "Ghana", en: "Ghana" },
    gr: { fr: "Gr\u00e8ce", en: "Greece" }, gt: { fr: "Guatemala", en: "Guatemala" },
    ht: { fr: "Ha\u00efti", en: "Haiti" }, hn: { fr: "Honduras", en: "Honduras" },
    ir: { fr: "Iran", en: "Iran" }, iq: { fr: "Irak", en: "Iraq" },
    ie: { fr: "Irlande", en: "Ireland" }, ci: { fr: "C\u00f4te d'Ivoire", en: "Ivory Coast" },
    it: { fr: "Italie", en: "Italy" }, jm: { fr: "Jama\u00efque", en: "Jamaica" },
    jp: { fr: "Japon", en: "Japan" }, jo: { fr: "Jordanie", en: "Jordan" },
    ml: { fr: "Mali", en: "Mali" }, mx: { fr: "Mexique", en: "Mexico" },
    ma: { fr: "Maroc", en: "Morocco" }, nl: { fr: "Pays-Bas", en: "Netherlands" },
    nz: { fr: "Nouvelle-Z\u00e9lande", en: "New Zealand" }, ng: { fr: "Nig\u00e9ria", en: "Nigeria" },
    "gb-nir": { fr: "Irlande du Nord", en: "Northern Ireland" }, no: { fr: "Norv\u00e8ge", en: "Norway" },
    om: { fr: "Oman", en: "Oman" }, pa: { fr: "Panama", en: "Panama" },
    py: { fr: "Paraguay", en: "Paraguay" }, pe: { fr: "P\u00e9rou", en: "Peru" },
    pl: { fr: "Pologne", en: "Poland" }, pt: { fr: "Portugal", en: "Portugal" },
    qa: { fr: "Qatar", en: "Qatar" }, sa: { fr: "Arabie saoudite", en: "Saudi Arabia" },
    "gb-sct": { fr: "\u00c9cosse", en: "Scotland" }, sn: { fr: "S\u00e9n\u00e9gal", en: "Senegal" },
    rs: { fr: "Serbie", en: "Serbia" }, za: { fr: "Afrique du Sud", en: "South Africa" },
    kr: { fr: "Cor\u00e9e du Sud", en: "South Korea" }, es: { fr: "Espagne", en: "Spain" },
    sr: { fr: "Suriname", en: "Suriname" }, se: { fr: "Su\u00e8de", en: "Sweden" },
    ch: { fr: "Suisse", en: "Switzerland" }, tn: { fr: "Tunisie", en: "Tunisia" },
    tr: { fr: "Turquie", en: "T\u00fcrkiye" }, ua: { fr: "Ukraine", en: "Ukraine" },
    ae: { fr: "\u00c9mirats arabes unis", en: "United Arab Emirates" },
    us: { fr: "\u00c9tats-Unis", en: "USA" }, uy: { fr: "Uruguay", en: "Uruguay" },
    uz: { fr: "Ouzb\u00e9kistan", en: "Uzbekistan" }, ve: { fr: "Venezuela", en: "Venezuela" },
    "gb-wls": { fr: "Pays de Galles", en: "Wales" },
  };

  const norm = (s) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  function code(team) {
    return team ? MAP[norm(team.name)] || null : null;
  }

  // Nom d'\u00e9quipe localis\u00e9 selon la langue active (fr \u2192 fran\u00e7ais, sinon anglais
  // canonique ; repli sur le nom d'origine si le pays n'est pas connu).
  window.teamName = function (team) {
    if (!team) return "";
    const entry = NAMES[code(team)];
    if (entry) {
      const lang = window.getLang ? window.getLang() : "fr";
      return (lang === "fr" && entry.fr) || entry.en || team.name;
    }
    return team.name || "";
  };

  // Article fran\u00e7ais par pays (pour les phrases : \u00ab L'\u00c9gypte \u00bb, \u00ab La France \u00bb,
  // \u00ab Le Br\u00e9sil \u00bb, \u00ab Les Pays-Bas \u00bb). "" = pas d'article (Oman, Ha\u00efti\u2026).
  const ART = {
    dz: "l'", ar: "l'", au: "l'", at: "l'", be: "la", ba: "la", br: "le", ca: "le",
    cv: "le", cm: "le", cl: "le", co: "la", cr: "le", hr: "la", cw: "", dk: "le",
    cd: "la", ec: "l'", eg: "l'", sv: "le", "gb-eng": "l'", fr: "la", de: "l'",
    gh: "le", gr: "la", gt: "le", ht: "", hn: "le", ir: "l'", iq: "l'", ie: "l'",
    ci: "la", it: "l'", jm: "la", jp: "le", jo: "la", ml: "le", mx: "le", ma: "le",
    nl: "les", nz: "la", ng: "le", "gb-nir": "l'", no: "la", om: "", pa: "le",
    py: "le", pe: "le", pl: "la", pt: "le", qa: "le", sa: "l'", "gb-sct": "l'",
    sn: "le", rs: "la", za: "l'", kr: "la", es: "l'", sr: "le", se: "la", ch: "la",
    tn: "la", tr: "la", ua: "l'", ae: "les", us: "les", uy: "l'", uz: "l'",
    ve: "le", "gb-wls": "le",
  };

  // Nom d'\u00e9quipe pr\u00e9c\u00e9d\u00e9 de son article fran\u00e7ais (\u00ab l'\u00c9gypte \u00bb / \u00ab La France \u00bb).
  // capital = true \u2192 majuscule initiale (d\u00e9but de phrase). Hors fran\u00e7ais : nom nu.
  window.teamNameArt = function (team, capital) {
    const name = window.teamName(team);
    const fr = window.getLang ? window.getLang() === "fr" : true;
    if (!fr) return name;
    const art = ART[code(team)];
    if (!art) return name; // pas d'article connu
    if (art === "l'") return (capital ? "L'" : "l'") + name;
    return (capital ? art.charAt(0).toUpperCase() + art.slice(1) : art) + " " + name;
  };

  window.flagHTML = function (team, h) {
    h = h || 15;
    const w = Math.round((h * 4) / 3);
    const c = code(team);
    const name = (team && team.name) || "";
    if (c) {
      return `<img class="flag-img" src="https://flagcdn.com/${c}.svg" alt="${name}" width="${w}" height="${h}" loading="lazy" />`;
    }
    return `<span class="flag-emoji">${(team && team.flag) || "🏳️"}</span>`;
  };
})();
