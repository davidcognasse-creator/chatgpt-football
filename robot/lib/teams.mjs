// Métadonnées des sélections (drapeau + code) — les API de cotes ne renvoient
// que le nom anglais de l'équipe, on l'enrichit ici. Fallback générique sinon.

const TEAMS = {
  "Argentina": { flag: "🇦🇷", code: "ARG" },
  "France": { flag: "🇫🇷", code: "FRA" },
  "Brazil": { flag: "🇧🇷", code: "BRA" },
  "England": { flag: "🏴", code: "ENG" },
  "Spain": { flag: "🇪🇸", code: "ESP" },
  "Portugal": { flag: "🇵🇹", code: "POR" },
  "Netherlands": { flag: "🇳🇱", code: "NED" },
  "Germany": { flag: "🇩🇪", code: "GER" },
  "Belgium": { flag: "🇧🇪", code: "BEL" },
  "Italy": { flag: "🇮🇹", code: "ITA" },
  "Croatia": { flag: "🇭🇷", code: "CRO" },
  "Uruguay": { flag: "🇺🇾", code: "URU" },
  "Colombia": { flag: "🇨🇴", code: "COL" },
  "Mexico": { flag: "🇲🇽", code: "MEX" },
  "United States": { flag: "🇺🇸", code: "USA" },
  "USA": { flag: "🇺🇸", code: "USA" },
  "Canada": { flag: "🇨🇦", code: "CAN" },
  "Morocco": { flag: "🇲🇦", code: "MAR" },
  "Senegal": { flag: "🇸🇳", code: "SEN" },
  "Japan": { flag: "🇯🇵", code: "JPN" },
  "South Korea": { flag: "🇰🇷", code: "KOR" },
  "Korea Republic": { flag: "🇰🇷", code: "KOR" },
  "Australia": { flag: "🇦🇺", code: "AUS" },
  "Switzerland": { flag: "🇨🇭", code: "SUI" },
  "Denmark": { flag: "🇩🇰", code: "DEN" },
  "Poland": { flag: "🇵🇱", code: "POL" },
  "Serbia": { flag: "🇷🇸", code: "SRB" },
  "Austria": { flag: "🇦🇹", code: "AUT" },
  "Turkey": { flag: "🇹🇷", code: "TUR" },
  "Ukraine": { flag: "🇺🇦", code: "UKR" },
  "Sweden": { flag: "🇸🇪", code: "SWE" },
  "Norway": { flag: "🇳🇴", code: "NOR" },
  "Ecuador": { flag: "🇪🇨", code: "ECU" },
  "Peru": { flag: "🇵🇪", code: "PER" },
  "Chile": { flag: "🇨🇱", code: "CHI" },
  "Paraguay": { flag: "🇵🇾", code: "PAR" },
  "Nigeria": { flag: "🇳🇬", code: "NGA" },
  "Ghana": { flag: "🇬🇭", code: "GHA" },
  "Cameroon": { flag: "🇨🇲", code: "CMR" },
  "Ivory Coast": { flag: "🇨🇮", code: "CIV" },
  "Côte d'Ivoire": { flag: "🇨🇮", code: "CIV" },
  "Egypt": { flag: "🇪🇬", code: "EGY" },
  "Algeria": { flag: "🇩🇿", code: "ALG" },
  "Tunisia": { flag: "🇹🇳", code: "TUN" },
  "Saudi Arabia": { flag: "🇸🇦", code: "KSA" },
  "Iran": { flag: "🇮🇷", code: "IRN" },
  "Qatar": { flag: "🇶🇦", code: "QAT" },
  "Costa Rica": { flag: "🇨🇷", code: "CRC" },
  "Panama": { flag: "🇵🇦", code: "PAN" },
  "Jamaica": { flag: "🇯🇲", code: "JAM" },
  "New Zealand": { flag: "🇳🇿", code: "NZL" },
  "Scotland": { flag: "🏴", code: "SCO" },
  "Wales": { flag: "🏴", code: "WAL" },
};

/** Crée un code à 3 lettres et un drapeau générique pour un nom inconnu. */
function fallback(name) {
  const code = (name || "???")
    .replace(/[^A-Za-z ]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "X");
  return { flag: "🏳️", code };
}

/** Renvoie { name, flag, code } pour un nom d'équipe. */
export function team(name) {
  const meta = TEAMS[name] || fallback(name);
  return { name, flag: meta.flag, code: meta.code };
}

// Quelques sélections ont un titre Wikipédia non standard.
const WIKI_OVERRIDES = {
  "United States": "United States men's national soccer team",
  USA: "United States men's national soccer team",
  Canada: "Canada men's national soccer team",
  "South Korea": "South Korea national football team",
  "Ivory Coast": "Ivory Coast national football team",
};

/** Titre d'article Wikipédia (en) pour la sélection nationale. */
export function wikiTitle(name) {
  return WIKI_OVERRIDES[name] || `${name} national football team`;
}
