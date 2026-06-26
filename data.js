// Données de démonstration — pronostics IA pour la Coupe du Monde 2026.
// Chaque match contient les probabilités du modèle (en %), un score attendu,
// un indice de confiance et une courte analyse générée.
//
// NB : ce sont des données illustratives. Pour brancher de vraies prédictions,
// remplacez ce tableau par la sortie de votre modèle / API.

window.WC_DATA = {
  updatedAt: "2026-06-26T09:00:00Z",
  matches: [
    {
      id: "m1",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-06-28T19:00:00Z",
      venue: "MetLife Stadium, New York",
      home: { name: "France", flag: "🇫🇷", code: "FRA" },
      away: { name: "Sénégal", flag: "🇸🇳", code: "SEN" },
      probs: { home: 56, draw: 24, away: 20 },
      predictedScore: { home: 2, away: 1 },
      confidence: 72,
      analysis:
        "La France domine la possession et la qualité offensive, mais le pressing sénégalais a déjà fait vaciller de gros favoris. Match à élimination directe serré jusqu'au dernier tiers."
    },
    {
      id: "m2",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-06-28T22:30:00Z",
      venue: "SoFi Stadium, Los Angeles",
      home: { name: "Argentine", flag: "🇦🇷", code: "ARG" },
      away: { name: "Japon", flag: "🇯🇵", code: "JPN" },
      probs: { home: 61, draw: 22, away: 17 },
      predictedScore: { home: 2, away: 0 },
      confidence: 78,
      analysis:
        "Tenante du titre, l'Argentine part favorite. Le Japon, très discipliné, peut contenir le jeu mais manque de réussite face aux blocs bas qu'on lui opposera."
    },
    {
      id: "m3",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-06-29T18:00:00Z",
      venue: "AT&T Stadium, Dallas",
      home: { name: "Brésil", flag: "🇧🇷", code: "BRA" },
      away: { name: "Croatie", flag: "🇭🇷", code: "CRO" },
      probs: { home: 52, draw: 27, away: 21 },
      predictedScore: { home: 1, away: 1 },
      confidence: 58,
      analysis:
        "Revanche du quart de 2022. La Croatie excelle dans les matchs fermés et les séances de tirs au but ; le modèle voit une issue indécise pouvant filer en prolongation."
    },
    {
      id: "m4",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-06-29T21:30:00Z",
      venue: "Estadio Azteca, Mexico",
      home: { name: "Mexique", flag: "🇲🇽", code: "MEX" },
      away: { name: "Pays-Bas", flag: "🇳🇱", code: "NED" },
      probs: { home: 34, draw: 27, away: 39 },
      predictedScore: { home: 1, away: 2 },
      confidence: 55,
      analysis:
        "Porté par son public à l'Azteca, le Mexique aura l'énergie, mais la maîtrise technique néerlandaise et la profondeur de banc font pencher légèrement la balance."
    },
    {
      id: "m5",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-06-30T19:00:00Z",
      venue: "Mercedes-Benz Stadium, Atlanta",
      home: { name: "Angleterre", flag: "🏴", code: "ENG" },
      away: { name: "Belgique", flag: "🇧🇪", code: "BEL" },
      probs: { home: 45, draw: 28, away: 27 },
      predictedScore: { home: 2, away: 1 },
      confidence: 61,
      analysis:
        "Choc européen équilibré. L'Angleterre possède l'avantage du collectif et des phases arrêtées ; la Belgique reste dangereuse en transition mais paraît plus friable défensivement."
    },
    {
      id: "m6",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-06-30T22:30:00Z",
      venue: "Lumen Field, Seattle",
      home: { name: "Espagne", flag: "🇪🇸", code: "ESP" },
      away: { name: "Maroc", flag: "🇲🇦", code: "MAR" },
      probs: { home: 50, draw: 28, away: 22 },
      predictedScore: { home: 1, away: 1 },
      confidence: 53,
      analysis:
        "Le Maroc a déjà sorti l'Espagne en 2022. Le bloc marocain et son gardien décisif peuvent rééditer l'exploit ; le modèle reste prudent malgré la domination espagnole attendue."
    },
    {
      id: "m7",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-07-01T18:00:00Z",
      venue: "Hard Rock Stadium, Miami",
      home: { name: "Portugal", flag: "🇵🇹", code: "POR" },
      away: { name: "Uruguay", flag: "🇺🇾", code: "URU" },
      probs: { home: 48, draw: 26, away: 26 },
      predictedScore: { home: 2, away: 1 },
      confidence: 60,
      analysis:
        "Génération talentueuse côté portugais face à un Uruguay agressif et rugueux. L'efficacité sur coups de pied arrêtés pourrait départager deux équipes très proches."
    },
    {
      id: "m8",
      stage: "Huitièmes",
      group: "1/8 de finale",
      datetime: "2026-07-01T21:30:00Z",
      venue: "BMO Field, Toronto",
      home: { name: "Allemagne", flag: "🇩🇪", code: "GER" },
      away: { name: "États-Unis", flag: "🇺🇸", code: "USA" },
      probs: { home: 54, draw: 25, away: 21 },
      predictedScore: { home: 2, away: 1 },
      confidence: 64,
      analysis:
        "L'Allemagne retrouve un visage conquérant, mais les États-Unis, à domicile et en plein essor, ont les armes pour bousculer la hiérarchie. Ferveur populaire garantie."
    }
  ]
};
