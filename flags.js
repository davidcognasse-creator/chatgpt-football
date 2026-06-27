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

  const norm = (s) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  function code(team) {
    return team ? MAP[norm(team.name)] || null : null;
  }

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
