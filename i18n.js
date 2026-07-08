// Internationalisation (i18n) · site statique multilingue.
// window.t(clé, vars) renvoie la traduction ; les éléments [data-i18n],
// [data-i18n-html] et [data-i18n-attr] du HTML sont traduits automatiquement ;
// l'évènement "i18n:changed" est émis au changement de langue pour que les
// scripts re-rendent leur contenu dynamique.
(function () {
  "use strict";

  const LANGS = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
    { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
  ];

  const T = {
    fr: {
      nav_predictions: "Pronostics", nav_winner: "Vainqueur", nav_groups: "Mon groupe", nav_history: "Historique",
      brand_sub: "Coupe du Monde 2026",
      nav_card: "Ma Carte Panini", card_eyebrow: "Carte à collectionner", card_h1: "Crée ta carte Panini", card_lede: "Ta carte à ton effigie, façon vignette de foot. Remplis le formulaire, ajoute ta photo, télécharge et partage-la pour faire connaître le site.", card_form_title: "🎴 Ta carte", card_photo: "Photo", card_name: "Nom", card_role: "Poste", card_number: "Numéro", card_country: "Pays", card_company: "Entreprise / équipe", card_stats: "Statistiques (0–99)", card_download: "📥 Télécharger", card_share: "📤 Partager", card_photo_ph: "Ajoute ta photo", card_jersey: "👕 Habiller d'un maillot aux couleurs du pays",
      card_ai: "✨ Version IA (maillot réaliste)", card_ai_loading: "✨ Génération IA en cours…", card_ai_need_photo: "Ajoute d'abord une photo.", card_ai_unconfigured: "La version IA n'est pas encore activée sur ce site.", card_ai_error: "Échec de la génération IA.", card_share_hint: "Astuce : télécharge l'image puis joins-la à ton post (sur Instagram, partage depuis ta galerie).", card_privacy: "🔒 Tout se passe dans ton navigateur : ta photo n'est jamais envoyée à un serveur.", card_foot: "Image générée localement à des fins ludiques. Marque Panini™ citée à titre d'inspiration, sans affiliation.", card_share_text: "J'ai créé ma carte façon Panini sur chatgpt.football ⚽ · crée la tienne et affronte l'IA en pronostics !",
      foot_disclaimer_label: "Avertissement.", foot_updated: "Modèle mis à jour",
      // accueil
      idx_eyebrow: "Prédictions par intelligence artificielle",
      idx_lede: "Probabilités de victoire, scores attendus et buteurs probables générés par l'IA pour chaque match à venir du Mondial 2026.",
      idx_pitch: "🎯 <b>Partage tes pronostics avec tes amis</b> et grimpe au classement&nbsp;!",
      idx_pitchbot: "Le 🤖 <b>bot du site joue aussi&nbsp;!</b> Va-t-il vous battre&nbsp;?",
      idx_cta_group: "👥 Créer un groupe entre amis", idx_cta_winner: "🏆 Qui va gagner ?",
      idx_search_ph: "Rechercher une équipe…", idx_empty: "Aucun match ne correspond à votre recherche.",
      idx_foot_disclaimer: "Ces pronostics sont générés automatiquement à des fins d'illustration et de divertissement. Ils ne constituent pas un conseil de pari.",
      idx_foot_credit: "Modèle prédictif · données réelles agrégées (paris · forme · presse · X) · CDM 2026",
      // stats accueil
      st_analyzed: "Matchs analysés", st_accuracy: "Précision ({n} matchs)", st_avgconf: "Confiance moyenne",
      st_nextfav: "Prochain favori", st_sources: "Sources agrégées",
      card_scoreia: "Score IA", nav_gains: "Paris", nav_loto: "Loto", gains_lede: "Si on avait misé 20 € fictifs sur chaque match où l'IA donnait le favori à plus de 50 %. Gains théoriques Unibet vs Polymarket. Simulation éducative · aucun pari réel.", gains_c_match: "Match", gains_c_pick: "Pronostic IA", gains_c_odds: "Cote", gains_c_res: "Issue", gains_c_uni: "Cumul Unibet", gains_c_poly: "Cumul Polymarket", pf_poly_note: "estimé · ≈ prix marché", pf_book: "cotes Unibet (marge ~6 %)", his_aet: "prolongations", his_pens: "tirs au but", pf_title: "Portefeuille virtuel", pf_virtual: "Fictif", pf_sub: "Mise fictive de {stake} € sur chaque match où l'IA donnait le favori > 50 %.", pf_bets: "Paris", pf_wl: "Gagnés / Perdus", pf_staked: "Total misé", pf_pnl: "Gain net", pf_roi: "Rentabilité", pf_edge: "Paris à valeur", pf_warn: "Simulation fictive à but éducatif · aucun pari réel. Chaque pari était en fait perdant en espérance (proba IA < prix marché) : un bon taux de réussite ne garantit pas de gagner de l'argent.", card_finished: "Terminé", card_result: "Résultat", card_ai_short: "IA :", card_conf: "Confiance", card_draw: "Nul",
      pf_start: "Mise de départ",
      pf_final: "Capital final",
      pf_strategy: "40 % du capital par pari",
      gains_c_stake: "Mise",
      gains_c_bank: "Capital",
      card_projected: "Projeté", card_projected_title: "Affiche projetée selon les pronostics",
      src_summary: "Détail des sources agrégées",
      scorers_head: "⚽ Buteurs probables", filter_all: "Tous",
      scorers_est: "estimation",
      updated_at: "à {time} le {date}", load_error: "Impossible de charger les pronostics.",
      // simulateur
      sim_eyebrow: "Estimation du vainqueur", sim_h1: "Qui va gagner<br />la Coupe du Monde&nbsp;?",
      sim_lede: "Probabilités de titre estimées à partir des marchés agrégés, recalculées après chaque match joué.",
      sim_title: "🏆 Probabilités de titre",
      sim_foot_disclaimer: "Estimations générées automatiquement à des fins d'illustration. Ne constituent pas un conseil de pari.",
      sim_foot_credit: "Probabilités de titre = marchés agrégés · CDM 2026",
      sim_fav_label: "Favori pour le titre · {p}%", sim_updated: "Mis à jour le {d}", sim_unavailable: "Estimation de titre indisponible.",
      sim_path_title: "🧭 Chemin projeté vers le titre", sim_round_r16: "8es de finale", sim_round_quarter: "Quarts de finale", sim_round_semi: "Demi-finales", sim_round_final: "Finale", sim_champion: "Champion projeté",
      sim_path_note: "Scénario hypothétique fondé sur les probabilités de titre : à chaque tour, l'équipe la plus probable l'emporte. Le tirage réel peut différer.",
      // historique
      his_eyebrow: "Pronostics vs résultats réels", his_h1: "Historique & précision", his_prob_legend: "Le % indique la probabilité estimée par l'IA pour son pronostic.",
      his_lede: "Chaque pronostic IA d'avant-match est archivé, puis confronté au score réel. Voici le bilan, match par match.",
      his_empty: "Aucun match réglé pour l'instant.",
      his_foot_disclaimer: "Pronostics générés automatiquement à des fins d'illustration. Ils ne constituent pas un conseil de pari.",
      his_foot_credit: "Précision calculée sur les matchs terminés · CDM 2026",
      his_stat_accuracy: "Précision (1N2)", his_stat_good: "Bons pronostics", his_stat_finished: "Matchs terminés",
      his_verdict_ok: "✓ Bon pronostic", his_verdict_ko: "✗ Raté", his_exact: "score exact",
      his_pred_label: "Pronostic IA", his_pred_prob_title: "Probabilité estimée par l'IA pour ce pronostic (la plus élevée des 3 issues 1·N·2)",
      his_real_label: "Résultat réel", his_draw: "Match nul", his_unavailable: "Impossible de charger l'historique.",
      his_insight_title_perfect: "Quand l'IA est sûre d'elle, elle ne se trompe pas",
      his_insight_title_good: "Plus l'IA est confiante, plus elle voit juste",
      his_insight_perfect: "Sur les <b>{n} matchs</b> où elle estimait une probabilité <b>supérieure à 50&nbsp;%</b>, son pronostic s'est révélé <b>juste à chaque fois</b>.",
      his_insight_good: "Sur les <b>{n} matchs</b> où elle estimait une probabilité <b>supérieure à 50&nbsp;%</b>, son pronostic a été <b>bon {k} fois sur {n}</b>.",
      his_insight_cap: "de réussite",
      // groupes
      grp_eyebrow: "Entre amis", grp_h1: "Groupes & classement",
      grp_lede: "Crée un groupe, invite tes amis, pronostique chaque match à venir et grimpe au classement, le 🤖 bot du site joue aussi !",
      grp_loading: "Chargement…",
      grp_foot_disclaimer: "Jeu de pronostics entre amis, à but de divertissement.",
      grp_foot_credit: "Comptes & données : Firebase · CDM 2026",
      g_logout: "Déconnexion", g_profile: "⚙️ Profil", g_back: "← Retour", g_new_group: "➕ Nouveau groupe",
      g_tab_pred: "⚽ Mes pronostics", g_tab_rank: "🏆 Classement", g_tab_forum: "💬 Forum",
      g_invite_copy: "🔗 Copier le lien d'invitation", g_invite_copied: "✅ Lien copié !", g_invite_email: "✉️ Inviter par e-mail",
      g_create_title: "➕ Créer un groupe", g_create_ph: "Nom du groupe (ex. Les potes)", g_create_btn: "Créer",
      g_join_title: "🔗 Rejoindre un groupe", g_join_text: "Tu as reçu un lien d'invitation ? Ouvre-le simplement, tu seras ajouté automatiquement.",
      g_members: "membre(s)", g_score: "Score", g_saved: "✅ enregistré", g_locked: "🔒 match commencé, pronostic verrouillé",
      g_no_upcoming: "Aucun match à venir pour le moment.",
      g_rules: "📜 Règles",
      g_rule1: "🎯 <b>Score exact</b> = <b>3 pts</b> · ✅ <b>bon résultat</b> (1N2) = <b>2 pts</b> · ❌ raté = 0",
      g_rule2: "⏱️ Seuls comptent les matchs <b>à partir de la création du groupe</b>.",
      g_rule3: "🔒 Un pronostic se verrouille au <b>coup d'envoi</b> du match.",
      g_lb_note: "{n} match(s) comptabilisé(s) depuis la création du groupe",
      g_lb_player: "Joueur", g_lb_played: "Joués", g_lb_exact: "Exacts", g_lb_points: "Points", g_bot: "Bot du site",
      g_forum_ph: "Écris un message au groupe…", g_forum_send: "Envoyer",
      g_forum_empty: "Aucun message. Lance la discussion ! 💬", g_forum_unavailable: "Forum indisponible.",
      g_remove_member: "Retirer ce membre du groupe ?",
      g_delete_group: "🗑️ Supprimer le groupe", g_delete_group_confirm: "Supprimer définitivement le groupe « {name} » ? Cette action est irréversible pour tous les membres.",
      g_profile_title: "⚙️ Mon profil", g_p_name: "Nom", g_p_email: "E-mail", g_p_conn: "Connexion", g_p_groups: "Groupes",
      g_p_via_google: "Google", g_p_via_email: "E-mail / mot de passe", g_p_email_none: "non renseigné",
      g_danger: "Zone de danger", g_delete_btn: "🗑️ Supprimer mon compte",
      g_delete_warn: "La suppression de ton compte est <b>définitive</b> : tu es retiré de tous tes groupes et tes pronostics sont effacés.",
      g_delete_confirm: "Supprimer définitivement ton compte ? Cette action est irréversible.", g_deleting: "Suppression…",
      g_pwd_prompt: "Pour confirmer, saisis ton mot de passe :",
      g_auth_title: "Connexion / Inscription", g_signin: "Se connecter", g_signup: "Créer un compte",
      g_email: "E-mail", g_password: "Mot de passe", g_name: "Ton nom (pseudo)",
      g_google: "Continuer avec Google", g_or: "ou",
      g_auth_no_account: "Pas encore de compte ?", g_auth_have_account: "Déjà inscrit ?", g_pwd_ph: "Mot de passe (6+ caractères)", g_signup_do: "Créer mon compte", g_auth_title_login: "Connexion",
      g_err_badcred: "E-mail ou mot de passe incorrect.", g_err_inuse: "Cet e-mail a déjà un compte.",
      g_err_weak: "Mot de passe trop court (6 caractères min).", g_err_email: "E-mail invalide.", g_err_popup: "Fenêtre Google fermée.",
      g_invite_subject: "Invitation au groupe de pronostics « {name} »",
      g_invite_body: "Salut !\n\nJe t'invite à rejoindre mon groupe de pronostics « {name} » sur Chat Game Prediction Technology ⚽\n\nClique sur ce lien pour participer :\n{link}\n\nÀ toi de jouer 🏆",
    },
    en: {
      nav_predictions: "Predictions", nav_winner: "Winner", nav_groups: "My group", nav_history: "History",
      brand_sub: "World Cup 2026",
      nav_card: "My Panini card", card_eyebrow: "Collectible card", card_h1: "Create your Panini card", card_lede: "Your own card in football-sticker style. Fill in the form, add your photo, download and share it to spread the word.", card_form_title: "🎴 Your card", card_photo: "Photo", card_name: "Name", card_role: "Role", card_number: "Number", card_country: "Country", card_company: "Company / team", card_stats: "Stats (0–99)", card_download: "📥 Download", card_share: "📤 Share", card_photo_ph: "Add your photo", card_jersey: "👕 Add a jersey in the country's colours",
      card_ai: "✨ AI version (realistic jersey)", card_ai_loading: "✨ AI generating…", card_ai_need_photo: "Add a photo first.", card_ai_unconfigured: "The AI version is not enabled on this site yet.", card_ai_error: "AI generation failed.", card_share_hint: "Tip: download the image then attach it to your post (on Instagram, share from your gallery).", card_privacy: "🔒 Everything happens in your browser: your photo is never sent to a server.", card_foot: "Image generated locally for fun. Panini™ trademark cited as inspiration, no affiliation.", card_share_text: "I made my Panini-style card on chatgpt.football ⚽ · make yours and take on the AI in predictions!",
      foot_disclaimer_label: "Disclaimer.", foot_updated: "Model updated",
      idx_eyebrow: "Predictions powered by artificial intelligence",
      idx_lede: "Win probabilities, expected scores and likely scorers generated by AI for every upcoming match of the 2026 World Cup.",
      idx_pitch: "🎯 <b>Share your predictions with friends</b> and climb the leaderboard&nbsp;!",
      idx_pitchbot: "The 🤖 <b>site bot plays too&nbsp;!</b> Will it beat you&nbsp;?",
      idx_cta_group: "👥 Create a group with friends", idx_cta_winner: "🏆 Who will win?",
      idx_search_ph: "Search for a team…", idx_empty: "No match matches your search.",
      idx_foot_disclaimer: "These predictions are generated automatically for illustration and entertainment. They are not betting advice.",
      idx_foot_credit: "Predictive model · aggregated real data (odds · form · press · X) · WC 2026",
      st_analyzed: "Matches analysed", st_accuracy: "Accuracy ({n} matches)", st_avgconf: "Average confidence",
      st_nextfav: "Next favourite", st_sources: "Aggregated sources",
      card_scoreia: "AI score", nav_gains: "Bets", nav_loto: "Loto", gains_lede: "If we had staked a fictional €20 on every match where the AI rated the favourite above 50%. Theoretical Unibet vs Polymarket returns. Educational simulation · no real betting.", gains_c_match: "Match", gains_c_pick: "AI pick", gains_c_odds: "Odds", gains_c_res: "Result", gains_c_uni: "Unibet total", gains_c_poly: "Polymarket total", pf_poly_note: "estimated · ≈ market price", pf_book: "Unibet odds (~6% margin)", his_aet: "extra time", his_pens: "penalties", pf_title: "Virtual portfolio", pf_virtual: "Paper", pf_sub: "Fictional {stake} € stake on every match where the AI's favourite was above 50%.", pf_bets: "Bets", pf_wl: "Won / Lost", pf_staked: "Total staked", pf_pnl: "Net P&L", pf_roi: "ROI", pf_edge: "Value bets", pf_warn: "Educational paper simulation · no real betting. Every bet was actually negative expected value (AI prob < market price): a high hit rate does not guarantee profit.", card_finished: "Full-time", card_result: "Result", card_ai_short: "AI:", card_conf: "Confidence", card_draw: "Draw",
      pf_start: "Starting bankroll",
      pf_final: "Final bankroll",
      pf_strategy: "40% of bankroll per bet",
      gains_c_stake: "Stake",
      gains_c_bank: "Bankroll",
      card_projected: "Projected", card_projected_title: "Projected fixture based on predictions",
      src_summary: "Aggregated sources detail",
      scorers_head: "⚽ Likely scorers", filter_all: "All",
      scorers_est: "estimate",
      updated_at: "at {time} on {date}", load_error: "Unable to load the predictions.",
      sim_eyebrow: "Winner estimate", sim_h1: "Who will win<br />the World Cup&nbsp;?",
      sim_lede: "Title probabilities estimated from aggregated markets, recalculated after each match played.",
      sim_title: "🏆 Title probabilities",
      sim_foot_disclaimer: "Estimates generated automatically for illustration. They are not betting advice.",
      sim_foot_credit: "Title probabilities = aggregated markets · WC 2026",
      sim_fav_label: "Title favourite · {p}%", sim_updated: "Updated on {d}", sim_unavailable: "Title estimate unavailable.",
      sim_path_title: "🧭 Projected path to the title", sim_round_r16: "Round of 16", sim_round_quarter: "Quarter-finals", sim_round_semi: "Semi-finals", sim_round_final: "Final", sim_champion: "Projected champion",
      sim_path_note: "Hypothetical scenario based on title probabilities: each round, the more likely team advances. The real draw may differ.",
      his_eyebrow: "Predictions vs real results", his_h1: "History & accuracy", his_prob_legend: "The % is the AI's estimated probability for its pick.",
      his_lede: "Every pre-match AI prediction is archived, then compared to the real score. Here is the record, match by match.",
      his_empty: "No settled match yet.",
      his_foot_disclaimer: "Predictions generated automatically for illustration. They are not betting advice.",
      his_foot_credit: "Accuracy computed on finished matches · WC 2026",
      his_stat_accuracy: "Accuracy (1X2)", his_stat_good: "Correct predictions", his_stat_finished: "Finished matches",
      his_verdict_ok: "✓ Good prediction", his_verdict_ko: "✗ Missed", his_exact: "exact score",
      his_pred_label: "AI prediction", his_pred_prob_title: "Probability estimated by the AI for this prediction (the highest of the 3 outcomes 1·X·2)",
      his_real_label: "Actual result", his_draw: "Draw", his_unavailable: "Unable to load the history.",
      his_insight_title_perfect: "When the AI is confident, it doesn't get it wrong",
      his_insight_title_good: "The more confident the AI, the more it gets right",
      his_insight_perfect: "Across the <b>{n} matches</b> where it estimated a probability <b>above 50&nbsp;%</b>, its prediction was <b>right every time</b>.",
      his_insight_good: "Across the <b>{n} matches</b> where it estimated a probability <b>above 50&nbsp;%</b>, its prediction was <b>correct {k} out of {n}</b>.",
      his_insight_cap: "success rate",
      grp_eyebrow: "With friends", grp_h1: "Groups & leaderboard",
      grp_lede: "Create a group, invite your friends, predict every upcoming match and climb the leaderboard, the 🤖 site bot plays too!",
      grp_loading: "Loading…",
      grp_foot_disclaimer: "Prediction game among friends, for entertainment.",
      grp_foot_credit: "Accounts & data: Firebase · WC 2026",
      g_logout: "Sign out", g_profile: "⚙️ Profile", g_back: "← Back", g_new_group: "➕ New group",
      g_tab_pred: "⚽ My predictions", g_tab_rank: "🏆 Leaderboard", g_tab_forum: "💬 Forum",
      g_invite_copy: "🔗 Copy invite link", g_invite_copied: "✅ Link copied!", g_invite_email: "✉️ Invite by email",
      g_create_title: "➕ Create a group", g_create_ph: "Group name (e.g. The crew)", g_create_btn: "Create",
      g_join_title: "🔗 Join a group", g_join_text: "Got an invite link? Just open it, you'll be added automatically.",
      g_members: "member(s)", g_score: "Score", g_saved: "✅ saved", g_locked: "🔒 match started, prediction locked",
      g_no_upcoming: "No upcoming match for now.",
      g_rules: "📜 Rules",
      g_rule1: "🎯 <b>Exact score</b> = <b>3 pts</b> · ✅ <b>correct result</b> (1X2) = <b>2 pts</b> · ❌ missed = 0",
      g_rule2: "⏱️ Only matches <b>from the group's creation</b> count.",
      g_rule3: "🔒 A prediction locks at <b>kick-off</b>.",
      g_lb_note: "{n} match(es) counted since the group was created",
      g_lb_player: "Player", g_lb_played: "Played", g_lb_exact: "Exact", g_lb_points: "Points", g_bot: "Site bot",
      g_forum_ph: "Write a message to the group…", g_forum_send: "Send",
      g_forum_empty: "No messages yet. Start the conversation! 💬", g_forum_unavailable: "Forum unavailable.",
      g_remove_member: "Remove this member from the group?",
      g_delete_group: "🗑️ Delete group", g_delete_group_confirm: "Permanently delete the group “{name}”? This is irreversible for all members.",
      g_profile_title: "⚙️ My profile", g_p_name: "Name", g_p_email: "Email", g_p_conn: "Sign-in", g_p_groups: "Groups",
      g_p_via_google: "Google", g_p_via_email: "Email / password", g_p_email_none: "not provided",
      g_danger: "Danger zone", g_delete_btn: "🗑️ Delete my account",
      g_delete_warn: "Deleting your account is <b>permanent</b>: you are removed from all your groups and your predictions are erased.",
      g_delete_confirm: "Permanently delete your account? This action is irreversible.", g_deleting: "Deleting…",
      g_pwd_prompt: "To confirm, enter your password:",
      g_auth_title: "Sign in / Sign up", g_signin: "Sign in", g_signup: "Create account",
      g_email: "Email", g_password: "Password", g_name: "Your name (nickname)",
      g_google: "Continue with Google", g_or: "or",
      g_auth_no_account: "No account yet?", g_auth_have_account: "Already registered?", g_pwd_ph: "Password (6+ characters)", g_signup_do: "Create my account", g_auth_title_login: "Sign in",
      g_err_badcred: "Incorrect email or password.", g_err_inuse: "This email already has an account.",
      g_err_weak: "Password too short (6 characters min).", g_err_email: "Invalid email.", g_err_popup: "Google window closed.",
      g_invite_subject: "Invitation to the prediction group “{name}”",
      g_invite_body: "Hi!\n\nI'm inviting you to join my prediction group “{name}” on Chat Game Prediction Technology ⚽\n\nClick this link to take part:\n{link}\n\nGood luck 🏆",
    },
    es: {
      nav_predictions: "Pronósticos", nav_winner: "Ganador", nav_groups: "Mi grupo", nav_history: "Historial",
      brand_sub: "Mundial 2026",
      nav_card: "Mi cromo Panini", card_eyebrow: "Cromo coleccionable", card_h1: "Crea tu cromo Panini", card_lede: "Tu propio cromo estilo álbum de fútbol. Rellena el formulario, añade tu foto, descárgalo y compártelo para dar a conocer el sitio.", card_form_title: "🎴 Tu cromo", card_photo: "Foto", card_name: "Nombre", card_role: "Puesto", card_number: "Número", card_country: "País", card_company: "Empresa / equipo", card_stats: "Estadísticas (0–99)", card_download: "📥 Descargar", card_share: "📤 Compartir", card_photo_ph: "Añade tu foto", card_jersey: "👕 Vestir una camiseta de los colores del país",
      card_ai: "✨ Versión IA (camiseta realista)", card_ai_loading: "✨ Generando con IA…", card_ai_need_photo: "Añade una foto primero.", card_ai_unconfigured: "La versión IA aún no está activada en este sitio.", card_ai_error: "Error en la generación con IA.", card_share_hint: "Consejo: descarga la imagen y adjúntala a tu publicación (en Instagram, comparte desde tu galería).", card_privacy: "🔒 Todo ocurre en tu navegador: tu foto nunca se envía a un servidor.", card_foot: "Imagen generada localmente con fines lúdicos. Marca Panini™ citada como inspiración, sin afiliación.", card_share_text: "¡Creé mi cromo estilo Panini en chatgpt.football ⚽ · crea el tuyo y reta a la IA en los pronósticos!",
      foot_disclaimer_label: "Aviso.", foot_updated: "Modelo actualizado",
      idx_eyebrow: "Predicciones con inteligencia artificial",
      idx_lede: "Probabilidades de victoria, marcadores esperados y posibles goleadores generados por IA para cada próximo partido del Mundial 2026.",
      idx_pitch: "🎯 <b>Comparte tus pronósticos con tus amigos</b> y sube en la clasificación&nbsp;!",
      idx_pitchbot: "El 🤖 <b>bot del sitio también juega&nbsp;!</b> ¿Te va a ganar&nbsp;?",
      idx_cta_group: "👥 Crear un grupo con amigos", idx_cta_winner: "🏆 ¿Quién ganará?",
      idx_search_ph: "Buscar un equipo…", idx_empty: "Ningún partido coincide con tu búsqueda.",
      idx_foot_disclaimer: "Estos pronósticos se generan automáticamente con fines ilustrativos y de entretenimiento. No constituyen un consejo de apuestas.",
      idx_foot_credit: "Modelo predictivo · datos reales agregados (cuotas · forma · prensa · X) · Mundial 2026",
      st_analyzed: "Partidos analizados", st_accuracy: "Precisión ({n} partidos)", st_avgconf: "Confianza media",
      st_nextfav: "Próximo favorito", st_sources: "Fuentes agregadas",
      card_scoreia: "Marcador IA", nav_gains: "Apuestas", nav_loto: "Loto", gains_lede: "Si hubiéramos apostado 20 € ficticios en cada partido donde la IA daba al favorito por encima del 50 %. Ganancias teóricas Unibet vs Polymarket. Simulación educativa · sin apuestas reales.", gains_c_match: "Partido", gains_c_pick: "Pronóstico IA", gains_c_odds: "Cuota", gains_c_res: "Resultado", gains_c_uni: "Total Unibet", gains_c_poly: "Total Polymarket", pf_poly_note: "estimado · ≈ precio de mercado", pf_book: "cuotas Unibet (margen ~6 %)", his_aet: "prórroga", his_pens: "penaltis", pf_title: "Cartera virtual", pf_virtual: "Ficticio", pf_sub: "Apuesta ficticia de {stake} € en cada partido donde la IA daba al favorito por encima del 50 %.", pf_bets: "Apuestas", pf_wl: "Ganadas / Perdidas", pf_staked: "Total apostado", pf_pnl: "Ganancia neta", pf_roi: "Rentabilidad", pf_edge: "Apuestas con valor", pf_warn: "Simulación ficticia educativa · sin apuestas reales. Cada apuesta tenía en realidad valor esperado negativo (prob. IA < precio de mercado): un buen porcentaje de acierto no garantiza ganar dinero.", card_finished: "Finalizado", card_result: "Resultado", card_ai_short: "IA:", card_conf: "Confianza", card_draw: "Empate",
      pf_start: "Capital inicial",
      pf_final: "Capital final",
      pf_strategy: "40 % del capital por apuesta",
      gains_c_stake: "Apuesta",
      gains_c_bank: "Capital",
      card_projected: "Proyectado", card_projected_title: "Partido proyectado según los pronósticos",
      src_summary: "Detalle de las fuentes agregadas",
      scorers_head: "⚽ Goleadores probables", filter_all: "Todos",
      scorers_est: "estimación",
      updated_at: "a las {time} del {date}", load_error: "No se pudieron cargar los pronósticos.",
      sim_eyebrow: "Estimación del ganador", sim_h1: "¿Quién ganará<br />el Mundial&nbsp;?",
      sim_lede: "Probabilidades de título estimadas a partir de mercados agregados, recalculadas tras cada partido jugado.",
      sim_title: "🏆 Probabilidades de título",
      sim_foot_disclaimer: "Estimaciones generadas automáticamente con fines ilustrativos. No constituyen un consejo de apuestas.",
      sim_foot_credit: "Probabilidades de título = mercados agregados · Mundial 2026",
      sim_fav_label: "Favorito al título · {p}%", sim_updated: "Actualizado el {d}", sim_unavailable: "Estimación de título no disponible.",
      sim_path_title: "🧭 Camino proyectado al título", sim_round_r16: "Octavos de final", sim_round_quarter: "Cuartos de final", sim_round_semi: "Semifinales", sim_round_final: "Final", sim_champion: "Campeón proyectado",
      sim_path_note: "Escenario hipotético basado en las probabilidades de título: en cada ronda gana el equipo más probable. El sorteo real puede variar.",
      his_eyebrow: "Pronósticos vs resultados reales", his_h1: "Historial y precisión", his_prob_legend: "El % es la probabilidad estimada por la IA para su pronóstico.",
      his_lede: "Cada pronóstico de la IA antes del partido se archiva y luego se compara con el marcador real. Aquí está el balance, partido a partido.",
      his_empty: "Aún no hay partidos cerrados.",
      his_foot_disclaimer: "Pronósticos generados automáticamente con fines ilustrativos. No constituyen un consejo de apuestas.",
      his_foot_credit: "Precisión calculada sobre los partidos terminados · Mundial 2026",
      his_stat_accuracy: "Precisión (1X2)", his_stat_good: "Buenos pronósticos", his_stat_finished: "Partidos terminados",
      his_verdict_ok: "✓ Buen pronóstico", his_verdict_ko: "✗ Fallado", his_exact: "marcador exacto",
      his_pred_label: "Pronóstico IA", his_pred_prob_title: "Probabilidad estimada por la IA para este pronóstico (la más alta de las 3 opciones 1·X·2)",
      his_real_label: "Resultado real", his_draw: "Empate", his_unavailable: "No se pudo cargar el historial.",
      his_insight_title_perfect: "Cuando la IA está segura, no se equivoca",
      his_insight_title_good: "Cuanto más segura está la IA, más acierta",
      his_insight_perfect: "En los <b>{n} partidos</b> donde estimaba una probabilidad <b>superior al 50&nbsp;%</b>, su pronóstico fue <b>correcto siempre</b>.",
      his_insight_good: "En los <b>{n} partidos</b> donde estimaba una probabilidad <b>superior al 50&nbsp;%</b>, su pronóstico fue <b>correcto {k} de {n}</b>.",
      his_insight_cap: "de acierto",
      grp_eyebrow: "Entre amigos", grp_h1: "Grupos y clasificación",
      grp_lede: "Crea un grupo, invita a tus amigos, pronostica cada próximo partido y sube en la clasificación, ¡el 🤖 bot del sitio también juega!",
      grp_loading: "Cargando…",
      grp_foot_disclaimer: "Juego de pronósticos entre amigos, con fines de entretenimiento.",
      grp_foot_credit: "Cuentas y datos: Firebase · Mundial 2026",
      g_logout: "Cerrar sesión", g_profile: "⚙️ Perfil", g_back: "← Volver", g_new_group: "➕ Nuevo grupo",
      g_tab_pred: "⚽ Mis pronósticos", g_tab_rank: "🏆 Clasificación", g_tab_forum: "💬 Foro",
      g_invite_copy: "🔗 Copiar enlace de invitación", g_invite_copied: "✅ ¡Enlace copiado!", g_invite_email: "✉️ Invitar por correo",
      g_create_title: "➕ Crear un grupo", g_create_ph: "Nombre del grupo (ej. Los amigos)", g_create_btn: "Crear",
      g_join_title: "🔗 Unirse a un grupo", g_join_text: "¿Recibiste un enlace de invitación? Solo ábrelo, se te añadirá automáticamente.",
      g_members: "miembro(s)", g_score: "Marcador", g_saved: "✅ guardado", g_locked: "🔒 partido empezado, pronóstico bloqueado",
      g_no_upcoming: "Ningún partido próximo por ahora.",
      g_rules: "📜 Reglas",
      g_rule1: "🎯 <b>Marcador exacto</b> = <b>3 pts</b> · ✅ <b>resultado correcto</b> (1X2) = <b>2 pts</b> · ❌ fallado = 0",
      g_rule2: "⏱️ Solo cuentan los partidos <b>a partir de la creación del grupo</b>.",
      g_rule3: "🔒 Un pronóstico se bloquea al <b>pitido inicial</b>.",
      g_lb_note: "{n} partido(s) contabilizado(s) desde la creación del grupo",
      g_lb_player: "Jugador", g_lb_played: "Jugados", g_lb_exact: "Exactos", g_lb_points: "Puntos", g_bot: "Bot del sitio",
      g_forum_ph: "Escribe un mensaje al grupo…", g_forum_send: "Enviar",
      g_forum_empty: "Aún no hay mensajes. ¡Inicia la conversación! 💬", g_forum_unavailable: "Foro no disponible.",
      g_remove_member: "¿Quitar a este miembro del grupo?",
      g_delete_group: "🗑️ Eliminar grupo", g_delete_group_confirm: "¿Eliminar definitivamente el grupo «{name}»? Es irreversible para todos los miembros.",
      g_profile_title: "⚙️ Mi perfil", g_p_name: "Nombre", g_p_email: "Correo", g_p_conn: "Conexión", g_p_groups: "Grupos",
      g_p_via_google: "Google", g_p_via_email: "Correo / contraseña", g_p_email_none: "no indicado",
      g_danger: "Zona de peligro", g_delete_btn: "🗑️ Eliminar mi cuenta",
      g_delete_warn: "Eliminar tu cuenta es <b>definitivo</b>: se te quita de todos tus grupos y se borran tus pronósticos.",
      g_delete_confirm: "¿Eliminar definitivamente tu cuenta? Esta acción es irreversible.", g_deleting: "Eliminando…",
      g_pwd_prompt: "Para confirmar, introduce tu contraseña:",
      g_auth_title: "Iniciar sesión / Registrarse", g_signin: "Iniciar sesión", g_signup: "Crear cuenta",
      g_email: "Correo", g_password: "Contraseña", g_name: "Tu nombre (apodo)",
      g_google: "Continuar con Google", g_or: "o",
      g_auth_no_account: "¿Aún no tienes cuenta?", g_auth_have_account: "¿Ya tienes cuenta?", g_pwd_ph: "Contraseña (6+ caracteres)", g_signup_do: "Crear mi cuenta", g_auth_title_login: "Iniciar sesión",
      g_err_badcred: "Correo o contraseña incorrectos.", g_err_inuse: "Este correo ya tiene una cuenta.",
      g_err_weak: "Contraseña demasiado corta (6 caracteres mín.).", g_err_email: "Correo inválido.", g_err_popup: "Ventana de Google cerrada.",
      g_invite_subject: "Invitación al grupo de pronósticos «{name}»",
      g_invite_body: "¡Hola!\n\nTe invito a unirte a mi grupo de pronósticos «{name}» en Chat Game Prediction Technology ⚽\n\nHaz clic en este enlace para participar:\n{link}\n\n¡Suerte! 🏆",
    },
    pt: {
      nav_predictions: "Palpites", nav_winner: "Vencedor", nav_groups: "Meu grupo", nav_history: "Histórico",
      brand_sub: "Copa do Mundo 2026",
      nav_card: "Minha carta Panini", card_eyebrow: "Carta colecionável", card_h1: "Crie sua carta Panini", card_lede: "Sua própria carta no estilo figurinha de futebol. Preencha o formulário, adicione sua foto, baixe e compartilhe para divulgar o site.", card_form_title: "🎴 Sua carta", card_photo: "Foto", card_name: "Nome", card_role: "Cargo", card_number: "Número", card_country: "País", card_company: "Empresa / time", card_stats: "Estatísticas (0–99)", card_download: "📥 Baixar", card_share: "📤 Compartilhar", card_photo_ph: "Adicione sua foto", card_jersey: "👕 Vestir uma camisa nas cores do país",
      card_ai: "✨ Versão IA (camisa realista)", card_ai_loading: "✨ Gerando com IA…", card_ai_need_photo: "Adicione uma foto primeiro.", card_ai_unconfigured: "A versão IA ainda não está ativada neste site.", card_ai_error: "Falha na geração com IA.", card_share_hint: "Dica: baixe a imagem e anexe à sua publicação (no Instagram, compartilhe da galeria).", card_privacy: "🔒 Tudo acontece no seu navegador: sua foto nunca é enviada a um servidor.", card_foot: "Imagem gerada localmente para diversão. Marca Panini™ citada como inspiração, sem afiliação.", card_share_text: "Criei minha carta estilo Panini no chatgpt.football ⚽ · crie a sua e desafie a IA nos palpites!",
      foot_disclaimer_label: "Aviso.", foot_updated: "Modelo atualizado",
      idx_eyebrow: "Previsões por inteligência artificial",
      idx_lede: "Probabilidades de vitória, placares esperados e prováveis goleadores gerados por IA para cada próximo jogo da Copa do Mundo 2026.",
      idx_pitch: "🎯 <b>Compartilhe seus palpites com seus amigos</b> e suba no ranking&nbsp;!",
      idx_pitchbot: "O 🤖 <b>bot do site também joga&nbsp;!</b> Será que vai te vencer&nbsp;?",
      idx_cta_group: "👥 Criar um grupo com amigos", idx_cta_winner: "🏆 Quem vai ganhar?",
      idx_search_ph: "Procurar uma seleção…", idx_empty: "Nenhum jogo corresponde à sua busca.",
      idx_foot_disclaimer: "Estes palpites são gerados automaticamente para fins ilustrativos e de entretenimento. Não constituem aconselhamento de apostas.",
      idx_foot_credit: "Modelo preditivo · dados reais agregados (odds · forma · imprensa · X) · Copa 2026",
      st_analyzed: "Jogos analisados", st_accuracy: "Precisão ({n} jogos)", st_avgconf: "Confiança média",
      st_nextfav: "Próximo favorito", st_sources: "Fontes agregadas",
      card_scoreia: "Placar IA", nav_gains: "Apostas", nav_loto: "Loto", gains_lede: "Se tivéssemos apostado 20 € fictícios em cada jogo onde a IA dava o favorito acima de 50 %. Ganhos teóricos Unibet vs Polymarket. Simulação educativa · sem apostas reais.", gains_c_match: "Jogo", gains_c_pick: "Palpite IA", gains_c_odds: "Odd", gains_c_res: "Resultado", gains_c_uni: "Total Unibet", gains_c_poly: "Total Polymarket", pf_poly_note: "estimado · ≈ preço de mercado", pf_book: "odds Unibet (margem ~6 %)", his_aet: "prolongamento", his_pens: "penáltis", pf_title: "Carteira virtual", pf_virtual: "Fictício", pf_sub: "Aposta fictícia de {stake} € em cada jogo onde a IA dava o favorito acima de 50 %.", pf_bets: "Apostas", pf_wl: "Ganhas / Perdidas", pf_staked: "Total apostado", pf_pnl: "Lucro líquido", pf_roi: "Rentabilidade", pf_edge: "Apostas com valor", pf_warn: "Simulação fictícia educativa · sem apostas reais. Cada aposta tinha na verdade valor esperado negativo (prob. IA < preço de mercado): uma boa taxa de acerto não garante lucro.", card_finished: "Terminado", card_result: "Resultado", card_ai_short: "IA:", card_conf: "Confiança", card_draw: "Empate",
      pf_start: "Banca inicial",
      pf_final: "Banca final",
      pf_strategy: "40% da banca por aposta",
      gains_c_stake: "Aposta",
      gains_c_bank: "Banca",
      card_projected: "Projetado", card_projected_title: "Jogo projetado segundo os palpites",
      src_summary: "Detalhe das fontes agregadas",
      scorers_head: "⚽ Prováveis goleadores", filter_all: "Todos",
      scorers_est: "estimativa",
      updated_at: "às {time} de {date}", load_error: "Não foi possível carregar os palpites.",
      sim_eyebrow: "Estimativa do vencedor", sim_h1: "Quem vai ganhar<br />a Copa do Mundo&nbsp;?",
      sim_lede: "Probabilidades de título estimadas a partir de mercados agregados, recalculadas após cada jogo disputado.",
      sim_title: "🏆 Probabilidades de título",
      sim_foot_disclaimer: "Estimativas geradas automaticamente para fins ilustrativos. Não constituem aconselhamento de apostas.",
      sim_foot_credit: "Probabilidades de título = mercados agregados · Copa 2026",
      sim_fav_label: "Favorito ao título · {p}%", sim_updated: "Atualizado em {d}", sim_unavailable: "Estimativa de título indisponível.",
      sim_path_title: "🧭 Caminho projetado até o título", sim_round_r16: "Oitavas de final", sim_round_quarter: "Quartas de final", sim_round_semi: "Semifinais", sim_round_final: "Final", sim_champion: "Campeão projetado",
      sim_path_note: "Cenário hipotético baseado nas probabilidades de título: em cada fase avança a seleção mais provável. O sorteio real pode diferir.",
      his_eyebrow: "Palpites vs resultados reais", his_h1: "Histórico e precisão", his_prob_legend: "O % é a probabilidade estimada pela IA para o seu palpite.",
      his_lede: "Cada palpite da IA antes do jogo é arquivado e depois comparado ao placar real. Veja o balanço, jogo a jogo.",
      his_empty: "Nenhum jogo encerrado ainda.",
      his_foot_disclaimer: "Palpites gerados automaticamente para fins ilustrativos. Não constituem aconselhamento de apostas.",
      his_foot_credit: "Precisão calculada sobre os jogos terminados · Copa 2026",
      his_stat_accuracy: "Precisão (1X2)", his_stat_good: "Bons palpites", his_stat_finished: "Jogos terminados",
      his_verdict_ok: "✓ Bom palpite", his_verdict_ko: "✗ Errou", his_exact: "placar exato",
      his_pred_label: "Palpite IA", his_pred_prob_title: "Probabilidade estimada pela IA para este palpite (a mais alta das 3 opções 1·X·2)",
      his_real_label: "Resultado real", his_draw: "Empate", his_unavailable: "Não foi possível carregar o histórico.",
      his_insight_title_perfect: "Quando a IA está confiante, ela não erra",
      his_insight_title_good: "Quanto mais confiante a IA, mais ela acerta",
      his_insight_perfect: "Nos <b>{n} jogos</b> em que estimou uma probabilidade <b>acima de 50&nbsp;%</b>, seu palpite esteve <b>certo todas as vezes</b>.",
      his_insight_good: "Nos <b>{n} jogos</b> em que estimou uma probabilidade <b>acima de 50&nbsp;%</b>, seu palpite esteve <b>certo {k} de {n}</b>.",
      his_insight_cap: "de acerto",
      grp_eyebrow: "Entre amigos", grp_h1: "Grupos e ranking",
      grp_lede: "Crie um grupo, convide seus amigos, dê palpites em cada próximo jogo e suba no ranking, o 🤖 bot do site também joga!",
      grp_loading: "Carregando…",
      grp_foot_disclaimer: "Jogo de palpites entre amigos, para entretenimento.",
      grp_foot_credit: "Contas e dados: Firebase · Copa 2026",
      g_logout: "Sair", g_profile: "⚙️ Perfil", g_back: "← Voltar", g_new_group: "➕ Novo grupo",
      g_tab_pred: "⚽ Meus palpites", g_tab_rank: "🏆 Ranking", g_tab_forum: "💬 Fórum",
      g_invite_copy: "🔗 Copiar link de convite", g_invite_copied: "✅ Link copiado!", g_invite_email: "✉️ Convidar por e-mail",
      g_create_title: "➕ Criar um grupo", g_create_ph: "Nome do grupo (ex. A turma)", g_create_btn: "Criar",
      g_join_title: "🔗 Entrar num grupo", g_join_text: "Recebeu um link de convite? Basta abri-lo, você será adicionado automaticamente.",
      g_members: "membro(s)", g_score: "Placar", g_saved: "✅ salvo", g_locked: "🔒 jogo começou, palpite bloqueado",
      g_no_upcoming: "Nenhum jogo próximo no momento.",
      g_rules: "📜 Regras",
      g_rule1: "🎯 <b>Placar exato</b> = <b>3 pts</b> · ✅ <b>resultado certo</b> (1X2) = <b>2 pts</b> · ❌ errou = 0",
      g_rule2: "⏱️ Só contam os jogos <b>a partir da criação do grupo</b>.",
      g_rule3: "🔒 Um palpite é bloqueado no <b>apito inicial</b>.",
      g_lb_note: "{n} jogo(s) contabilizado(s) desde a criação do grupo",
      g_lb_player: "Jogador", g_lb_played: "Jogados", g_lb_exact: "Exatos", g_lb_points: "Pontos", g_bot: "Bot do site",
      g_forum_ph: "Escreva uma mensagem ao grupo…", g_forum_send: "Enviar",
      g_forum_empty: "Nenhuma mensagem ainda. Comece a conversa! 💬", g_forum_unavailable: "Fórum indisponível.",
      g_remove_member: "Remover este membro do grupo?",
      g_delete_group: "🗑️ Excluir grupo", g_delete_group_confirm: "Excluir definitivamente o grupo “{name}”? É irreversível para todos os membros.",
      g_profile_title: "⚙️ Meu perfil", g_p_name: "Nome", g_p_email: "E-mail", g_p_conn: "Acesso", g_p_groups: "Grupos",
      g_p_via_google: "Google", g_p_via_email: "E-mail / senha", g_p_email_none: "não informado",
      g_danger: "Zona de perigo", g_delete_btn: "🗑️ Excluir minha conta",
      g_delete_warn: "Excluir sua conta é <b>definitivo</b>: você é removido de todos os seus grupos e seus palpites são apagados.",
      g_delete_confirm: "Excluir definitivamente sua conta? Esta ação é irreversível.", g_deleting: "Excluindo…",
      g_pwd_prompt: "Para confirmar, digite sua senha:",
      g_auth_title: "Entrar / Cadastrar", g_signin: "Entrar", g_signup: "Criar conta",
      g_email: "E-mail", g_password: "Senha", g_name: "Seu nome (apelido)",
      g_google: "Continuar com o Google", g_or: "ou",
      g_auth_no_account: "Ainda não tem conta?", g_auth_have_account: "Já tem conta?", g_pwd_ph: "Senha (6+ caracteres)", g_signup_do: "Criar minha conta", g_auth_title_login: "Entrar",
      g_err_badcred: "E-mail ou senha incorretos.", g_err_inuse: "Este e-mail já tem uma conta.",
      g_err_weak: "Senha muito curta (mín. 6 caracteres).", g_err_email: "E-mail inválido.", g_err_popup: "Janela do Google fechada.",
      g_invite_subject: "Convite para o grupo de palpites “{name}”",
      g_invite_body: "Oi!\n\nEstou te convidando para entrar no meu grupo de palpites “{name}” no Chat Game Prediction Technology ⚽\n\nClique neste link para participar:\n{link}\n\nBoa sorte 🏆",
    },
    de: {
      nav_predictions: "Tipps", nav_winner: "Sieger", nav_groups: "Meine Gruppe", nav_history: "Verlauf",
      brand_sub: "Weltmeisterschaft 2026",
      nav_card: "Meine Panini-Karte", card_eyebrow: "Sammelkarte", card_h1: "Erstelle deine Panini-Karte", card_lede: "Deine eigene Karte im Fußball-Sticker-Stil. Fülle das Formular aus, füge dein Foto hinzu, lade sie herunter und teile sie.", card_form_title: "🎴 Deine Karte", card_photo: "Foto", card_name: "Name", card_role: "Position", card_number: "Nummer", card_country: "Land", card_company: "Firma / Team", card_stats: "Werte (0–99)", card_download: "📥 Herunterladen", card_share: "📤 Teilen", card_photo_ph: "Foto hinzufügen", card_jersey: "👕 Trikot in den Landesfarben anziehen",
      card_ai: "✨ KI-Version (realistisches Trikot)", card_ai_loading: "✨ KI generiert…", card_ai_need_photo: "Füge zuerst ein Foto hinzu.", card_ai_unconfigured: "Die KI-Version ist auf dieser Seite noch nicht aktiviert.", card_ai_error: "KI-Generierung fehlgeschlagen.", card_share_hint: "Tipp: Lade das Bild herunter und füge es deinem Beitrag bei (bei Instagram aus der Galerie teilen).", card_privacy: "🔒 Alles passiert in deinem Browser: dein Foto wird nie an einen Server gesendet.", card_foot: "Bild lokal zum Spaß erzeugt. Marke Panini™ als Inspiration genannt, ohne Zugehörigkeit.", card_share_text: "Ich habe meine Panini-Karte auf chatgpt.football erstellt ⚽ · erstelle deine und tritt gegen die KI an!",
      foot_disclaimer_label: "Hinweis.", foot_updated: "Modell aktualisiert",
      idx_eyebrow: "Vorhersagen mit künstlicher Intelligenz",
      idx_lede: "Siegwahrscheinlichkeiten, erwartete Ergebnisse und wahrscheinliche Torschützen, von der KI für jedes kommende Spiel der WM 2026 erstellt.",
      idx_pitch: "🎯 <b>Teile deine Tipps mit deinen Freunden</b> und steig in der Rangliste auf&nbsp;!",
      idx_pitchbot: "Der 🤖 <b>Bot der Seite spielt auch mit&nbsp;!</b> Schlägt er dich&nbsp;?",
      idx_cta_group: "👥 Gruppe mit Freunden erstellen", idx_cta_winner: "🏆 Wer gewinnt?",
      idx_search_ph: "Mannschaft suchen…", idx_empty: "Kein Spiel passt zu deiner Suche.",
      idx_foot_disclaimer: "Diese Tipps werden automatisch zu Illustrations- und Unterhaltungszwecken erstellt. Sie sind keine Wettberatung.",
      idx_foot_credit: "Prognosemodell · aggregierte echte Daten (Quoten · Form · Presse · X) · WM 2026",
      st_analyzed: "Analysierte Spiele", st_accuracy: "Genauigkeit ({n} Spiele)", st_avgconf: "Ø Zuversicht",
      st_nextfav: "Nächster Favorit", st_sources: "Aggregierte Quellen",
      card_scoreia: "KI-Ergebnis", nav_gains: "Wetten", nav_loto: "Loto", gains_lede: "Hätten wir auf jedes Spiel, in dem die KI den Favoriten über 50 % sah, fiktive 20 € gesetzt. Theoretische Unibet- vs. Polymarket-Erträge. Lernsimulation · keine echten Wetten.", gains_c_match: "Spiel", gains_c_pick: "KI-Tipp", gains_c_odds: "Quote", gains_c_res: "Ergebnis", gains_c_uni: "Unibet gesamt", gains_c_poly: "Polymarket gesamt", pf_poly_note: "geschätzt · ≈ Marktpreis", pf_book: "Unibet-Quoten (~6 % Marge)", his_aet: "Verlängerung", his_pens: "Elfmeterschießen", pf_title: "Virtuelles Portfolio", pf_virtual: "Fiktiv", pf_sub: "Fiktiver Einsatz von {stake} € auf jedes Spiel, in dem die KI den Favoriten über 50 % sah.", pf_bets: "Wetten", pf_wl: "Gewonnen / Verloren", pf_staked: "Gesamteinsatz", pf_pnl: "Netto-Gewinn", pf_roi: "Rendite", pf_edge: "Value-Wetten", pf_warn: "Fiktive Lernsimulation · keine echten Wetten. Jede Wette hatte tatsächlich negativen Erwartungswert (KI-Wahrsch. < Marktpreis): eine hohe Trefferquote garantiert keinen Gewinn.", card_finished: "Beendet", card_result: "Ergebnis", card_ai_short: "KI:", card_conf: "Zuversicht", card_draw: "Unent.",
      pf_start: "Startkapital",
      pf_final: "Endkapital",
      pf_strategy: "40 % des Kapitals pro Wette",
      gains_c_stake: "Einsatz",
      gains_c_bank: "Kapital",
      card_projected: "Projiziert", card_projected_title: "Projiziertes Spiel laut Tipps",
      src_summary: "Details der aggregierten Quellen",
      scorers_head: "⚽ Wahrscheinliche Torschützen", filter_all: "Alle",
      scorers_est: "Schätzung",
      updated_at: "um {time} am {date}", load_error: "Tipps konnten nicht geladen werden.",
      sim_eyebrow: "Sieger-Schätzung", sim_h1: "Wer gewinnt<br />die Weltmeisterschaft&nbsp;?",
      sim_lede: "Titelwahrscheinlichkeiten aus aggregierten Märkten geschätzt, nach jedem gespielten Spiel neu berechnet.",
      sim_title: "🏆 Titelwahrscheinlichkeiten",
      sim_foot_disclaimer: "Schätzungen automatisch zu Illustrationszwecken erstellt. Keine Wettberatung.",
      sim_foot_credit: "Titelwahrscheinlichkeiten = aggregierte Märkte · WM 2026",
      sim_fav_label: "Titelfavorit · {p}%", sim_updated: "Aktualisiert am {d}", sim_unavailable: "Titel-Schätzung nicht verfügbar.",
      sim_path_title: "🧭 Prognostizierter Weg zum Titel", sim_round_r16: "Achtelfinale", sim_round_quarter: "Viertelfinale", sim_round_semi: "Halbfinale", sim_round_final: "Finale", sim_champion: "Prognostizierter Champion",
      sim_path_note: "Hypothetisches Szenario auf Basis der Titelwahrscheinlichkeiten: In jeder Runde setzt sich das wahrscheinlichere Team durch. Die echte Auslosung kann abweichen.",
      his_eyebrow: "Tipps vs. echte Ergebnisse", his_h1: "Verlauf & Genauigkeit", his_prob_legend: "Das % ist die von der KI geschätzte Wahrscheinlichkeit für ihren Tipp.",
      his_lede: "Jeder KI-Tipp vor dem Spiel wird archiviert und dann mit dem echten Ergebnis verglichen. Hier die Bilanz, Spiel für Spiel.",
      his_empty: "Noch kein abgeschlossenes Spiel.",
      his_foot_disclaimer: "Tipps automatisch zu Illustrationszwecken erstellt. Keine Wettberatung.",
      his_foot_credit: "Genauigkeit auf beendeten Spielen berechnet · WM 2026",
      his_stat_accuracy: "Genauigkeit (1X2)", his_stat_good: "Richtige Tipps", his_stat_finished: "Beendete Spiele",
      his_verdict_ok: "✓ Guter Tipp", his_verdict_ko: "✗ Daneben", his_exact: "exaktes Ergebnis",
      his_pred_label: "KI-Tipp", his_pred_prob_title: "Von der KI für diesen Tipp geschätzte Wahrscheinlichkeit (die höchste der 3 Ausgänge 1·X·2)",
      his_real_label: "Echtes Ergebnis", his_draw: "Unentschieden", his_unavailable: "Verlauf konnte nicht geladen werden.",
      his_insight_title_perfect: "Wenn die KI sicher ist, liegt sie richtig",
      his_insight_title_good: "Je sicherer die KI, desto öfter trifft sie",
      his_insight_perfect: "Bei den <b>{n} Spielen</b>, bei denen sie eine Wahrscheinlichkeit <b>über 50&nbsp;%</b> schätzte, lag ihr Tipp <b>jedes Mal richtig</b>.",
      his_insight_good: "Bei den <b>{n} Spielen</b>, bei denen sie eine Wahrscheinlichkeit <b>über 50&nbsp;%</b> schätzte, lag ihr Tipp <b>{k} von {n} richtig</b>.",
      his_insight_cap: "Trefferquote",
      grp_eyebrow: "Unter Freunden", grp_h1: "Gruppen & Rangliste",
      grp_lede: "Erstelle eine Gruppe, lade deine Freunde ein, tippe jedes kommende Spiel und steig in der Rangliste auf, der 🤖 Bot der Seite spielt auch mit!",
      grp_loading: "Wird geladen…",
      grp_foot_disclaimer: "Tippspiel unter Freunden, zur Unterhaltung.",
      grp_foot_credit: "Konten & Daten: Firebase · WM 2026",
      g_logout: "Abmelden", g_profile: "⚙️ Profil", g_back: "← Zurück", g_new_group: "➕ Neue Gruppe",
      g_tab_pred: "⚽ Meine Tipps", g_tab_rank: "🏆 Rangliste", g_tab_forum: "💬 Forum",
      g_invite_copy: "🔗 Einladungslink kopieren", g_invite_copied: "✅ Link kopiert!", g_invite_email: "✉️ Per E-Mail einladen",
      g_create_title: "➕ Gruppe erstellen", g_create_ph: "Gruppenname (z. B. Die Crew)", g_create_btn: "Erstellen",
      g_join_title: "🔗 Gruppe beitreten", g_join_text: "Einladungslink erhalten? Einfach öffnen, du wirst automatisch hinzugefügt.",
      g_members: "Mitglied(er)", g_score: "Ergebnis", g_saved: "✅ gespeichert", g_locked: "🔒 Spiel begonnen, Tipp gesperrt",
      g_no_upcoming: "Derzeit kein kommendes Spiel.",
      g_rules: "📜 Regeln",
      g_rule1: "🎯 <b>Exaktes Ergebnis</b> = <b>3 Pkt</b> · ✅ <b>richtiger Ausgang</b> (1X2) = <b>2 Pkt</b> · ❌ daneben = 0",
      g_rule2: "⏱️ Es zählen nur Spiele <b>ab der Gruppenerstellung</b>.",
      g_rule3: "🔒 Ein Tipp wird beim <b>Anpfiff</b> gesperrt.",
      g_lb_note: "{n} Spiel(e) seit Gruppenerstellung gewertet",
      g_lb_player: "Spieler", g_lb_played: "Gespielt", g_lb_exact: "Exakt", g_lb_points: "Punkte", g_bot: "Seiten-Bot",
      g_forum_ph: "Schreibe eine Nachricht an die Gruppe…", g_forum_send: "Senden",
      g_forum_empty: "Noch keine Nachrichten. Starte die Unterhaltung! 💬", g_forum_unavailable: "Forum nicht verfügbar.",
      g_remove_member: "Dieses Mitglied aus der Gruppe entfernen?",
      g_delete_group: "🗑️ Gruppe löschen", g_delete_group_confirm: "Die Gruppe „{name}“ endgültig löschen? Das ist für alle Mitglieder unumkehrbar.",
      g_profile_title: "⚙️ Mein Profil", g_p_name: "Name", g_p_email: "E-Mail", g_p_conn: "Anmeldung", g_p_groups: "Gruppen",
      g_p_via_google: "Google", g_p_via_email: "E-Mail / Passwort", g_p_email_none: "nicht angegeben",
      g_danger: "Gefahrenzone", g_delete_btn: "🗑️ Mein Konto löschen",
      g_delete_warn: "Das Löschen deines Kontos ist <b>endgültig</b>: du wirst aus allen Gruppen entfernt und deine Tipps werden gelöscht.",
      g_delete_confirm: "Konto endgültig löschen? Diese Aktion ist unumkehrbar.", g_deleting: "Wird gelöscht…",
      g_pwd_prompt: "Zur Bestätigung gib dein Passwort ein:",
      g_auth_title: "Anmelden / Registrieren", g_signin: "Anmelden", g_signup: "Konto erstellen",
      g_email: "E-Mail", g_password: "Passwort", g_name: "Dein Name (Spitzname)",
      g_google: "Mit Google fortfahren", g_or: "oder",
      g_auth_no_account: "Noch kein Konto?", g_auth_have_account: "Bereits registriert?", g_pwd_ph: "Passwort (6+ Zeichen)", g_signup_do: "Mein Konto erstellen", g_auth_title_login: "Anmelden",
      g_err_badcred: "E-Mail oder Passwort falsch.", g_err_inuse: "Diese E-Mail hat bereits ein Konto.",
      g_err_weak: "Passwort zu kurz (mind. 6 Zeichen).", g_err_email: "Ungültige E-Mail.", g_err_popup: "Google-Fenster geschlossen.",
      g_invite_subject: "Einladung zur Tippgruppe „{name}“",
      g_invite_body: "Hallo!\n\nIch lade dich in meine Tippgruppe „{name}“ auf Chat Game Prediction Technology ein ⚽\n\nKlicke auf diesen Link, um mitzumachen:\n{link}\n\nViel Erfolg 🏆",
    },
    it: {
      nav_predictions: "Pronostici", nav_winner: "Vincitore", nav_groups: "Il mio gruppo", nav_history: "Storico",
      brand_sub: "Mondiali 2026",
      nav_card: "La mia figurina Panini", card_eyebrow: "Figurina da collezione", card_h1: "Crea la tua figurina Panini", card_lede: "La tua figurina in stile album di calcio. Compila il modulo, aggiungi la tua foto, scaricala e condividila per far conoscere il sito.", card_form_title: "🎴 La tua figurina", card_photo: "Foto", card_name: "Nome", card_role: "Ruolo", card_number: "Numero", card_country: "Paese", card_company: "Azienda / squadra", card_stats: "Statistiche (0–99)", card_download: "📥 Scarica", card_share: "📤 Condividi", card_photo_ph: "Aggiungi la tua foto", card_jersey: "👕 Indossa una maglia nei colori del paese",
      card_ai: "✨ Versione IA (maglia realistica)", card_ai_loading: "✨ Generazione IA…", card_ai_need_photo: "Aggiungi prima una foto.", card_ai_unconfigured: "La versione IA non è ancora attiva su questo sito.", card_ai_error: "Generazione IA non riuscita.", card_share_hint: "Suggerimento: scarica l'immagine e allegala al tuo post (su Instagram, condividi dalla galleria).", card_privacy: "🔒 Tutto avviene nel tuo browser: la tua foto non viene mai inviata a un server.", card_foot: "Immagine generata localmente per gioco. Marchio Panini™ citato come ispirazione, senza affiliazione.", card_share_text: "Ho creato la mia figurina stile Panini su chatgpt.football ⚽ · crea la tua e sfida l'IA nei pronostici!",
      foot_disclaimer_label: "Avviso.", foot_updated: "Modello aggiornato",
      idx_eyebrow: "Previsioni con intelligenza artificiale",
      idx_lede: "Probabilità di vittoria, risultati attesi e probabili marcatori generati dall'IA per ogni prossima partita dei Mondiali 2026.",
      idx_pitch: "🎯 <b>Condividi i tuoi pronostici con gli amici</b> e scala la classifica&nbsp;!",
      idx_pitchbot: "Il 🤖 <b>bot del sito gioca anche lui&nbsp;!</b> Riuscirà a batterti&nbsp;?",
      idx_cta_group: "👥 Crea un gruppo con gli amici", idx_cta_winner: "🏆 Chi vincerà?",
      idx_search_ph: "Cerca una squadra…", idx_empty: "Nessuna partita corrisponde alla tua ricerca.",
      idx_foot_disclaimer: "Questi pronostici sono generati automaticamente a scopo illustrativo e di intrattenimento. Non costituiscono un consiglio di scommessa.",
      idx_foot_credit: "Modello predittivo · dati reali aggregati (quote · forma · stampa · X) · Mondiali 2026",
      st_analyzed: "Partite analizzate", st_accuracy: "Precisione ({n} partite)", st_avgconf: "Fiducia media",
      st_nextfav: "Prossimo favorito", st_sources: "Fonti aggregate",
      card_scoreia: "Risultato IA", nav_gains: "Scommesse", nav_loto: "Loto", gains_lede: "Se avessimo puntato 20 € fittizi su ogni partita in cui l'IA dava il favorito sopra il 50 %. Guadagni teorici Unibet vs Polymarket. Simulazione educativa · nessuna scommessa reale.", gains_c_match: "Partita", gains_c_pick: "Pronostico IA", gains_c_odds: "Quota", gains_c_res: "Esito", gains_c_uni: "Totale Unibet", gains_c_poly: "Totale Polymarket", pf_poly_note: "stimato · ≈ prezzo di mercato", pf_book: "quote Unibet (margine ~6 %)", his_aet: "supplementari", his_pens: "rigori", pf_title: "Portafoglio virtuale", pf_virtual: "Fittizio", pf_sub: "Puntata fittizia di {stake} € su ogni partita in cui l'IA dava il favorito sopra il 50 %.", pf_bets: "Scommesse", pf_wl: "Vinte / Perse", pf_staked: "Totale puntato", pf_pnl: "Profitto netto", pf_roi: "Rendimento", pf_edge: "Scommesse di valore", pf_warn: "Simulazione fittizia a scopo didattico · nessuna scommessa reale. Ogni scommessa aveva in realtà valore atteso negativo (prob. IA < prezzo di mercato): un buon tasso di successo non garantisce un guadagno.", card_finished: "Finita", card_result: "Risultato", card_ai_short: "IA:", card_conf: "Fiducia", card_draw: "Pareggio",
      pf_start: "Capitale iniziale",
      pf_final: "Capitale finale",
      pf_strategy: "40% del capitale per scommessa",
      gains_c_stake: "Puntata",
      gains_c_bank: "Capitale",
      card_projected: "Proiettato", card_projected_title: "Partita proiettata secondo i pronostici",
      src_summary: "Dettaglio delle fonti aggregate",
      scorers_head: "⚽ Probabili marcatori", filter_all: "Tutte",
      scorers_est: "stima",
      updated_at: "alle {time} del {date}", load_error: "Impossibile caricare i pronostici.",
      sim_eyebrow: "Stima del vincitore", sim_h1: "Chi vincerà<br />i Mondiali&nbsp;?",
      sim_lede: "Probabilità di titolo stimate dai mercati aggregati, ricalcolate dopo ogni partita giocata.",
      sim_title: "🏆 Probabilità di titolo",
      sim_foot_disclaimer: "Stime generate automaticamente a scopo illustrativo. Non costituiscono un consiglio di scommessa.",
      sim_foot_credit: "Probabilità di titolo = mercati aggregati · Mondiali 2026",
      sim_fav_label: "Favorita per il titolo · {p}%", sim_updated: "Aggiornato il {d}", sim_unavailable: "Stima del titolo non disponibile.",
      sim_path_title: "🧭 Percorso proiettato verso il titolo", sim_round_r16: "Ottavi di finale", sim_round_quarter: "Quarti di finale", sim_round_semi: "Semifinali", sim_round_final: "Finale", sim_champion: "Campione proiettato",
      sim_path_note: "Scenario ipotetico basato sulle probabilità di titolo: a ogni turno avanza la squadra più probabile. Il sorteggio reale può differire.",
      his_eyebrow: "Pronostici vs risultati reali", his_h1: "Storico e precisione", his_prob_legend: "La % è la probabilità stimata dall'IA per il suo pronostico.",
      his_lede: "Ogni pronostico dell'IA prima della partita viene archiviato, poi confrontato con il risultato reale. Ecco il bilancio, partita per partita.",
      his_empty: "Nessuna partita conclusa per ora.",
      his_foot_disclaimer: "Pronostici generati automaticamente a scopo illustrativo. Non costituiscono un consiglio di scommessa.",
      his_foot_credit: "Precisione calcolata sulle partite terminate · Mondiali 2026",
      his_stat_accuracy: "Precisione (1X2)", his_stat_good: "Buoni pronostici", his_stat_finished: "Partite terminate",
      his_verdict_ok: "✓ Buon pronostico", his_verdict_ko: "✗ Sbagliato", his_exact: "risultato esatto",
      his_pred_label: "Pronostico IA", his_pred_prob_title: "Probabilità stimata dall'IA per questo pronostico (la più alta dei 3 esiti 1·X·2)",
      his_real_label: "Risultato reale", his_draw: "Pareggio", his_unavailable: "Impossibile caricare lo storico.",
      his_insight_title_perfect: "Quando l'IA è sicura, non sbaglia",
      his_insight_title_good: "Più l'IA è sicura, più ci azzecca",
      his_insight_perfect: "Nelle <b>{n} partite</b> in cui stimava una probabilità <b>superiore al 50&nbsp;%</b>, il suo pronostico è stato <b>corretto ogni volta</b>.",
      his_insight_good: "Nelle <b>{n} partite</b> in cui stimava una probabilità <b>superiore al 50&nbsp;%</b>, il suo pronostico è stato <b>corretto {k} su {n}</b>.",
      his_insight_cap: "di successo",
      grp_eyebrow: "Tra amici", grp_h1: "Gruppi e classifica",
      grp_lede: "Crea un gruppo, invita i tuoi amici, pronostica ogni prossima partita e scala la classifica, il 🤖 bot del sito gioca anche lui!",
      grp_loading: "Caricamento…",
      grp_foot_disclaimer: "Gioco di pronostici tra amici, a scopo di intrattenimento.",
      grp_foot_credit: "Account e dati: Firebase · Mondiali 2026",
      g_logout: "Esci", g_profile: "⚙️ Profilo", g_back: "← Indietro", g_new_group: "➕ Nuovo gruppo",
      g_tab_pred: "⚽ I miei pronostici", g_tab_rank: "🏆 Classifica", g_tab_forum: "💬 Forum",
      g_invite_copy: "🔗 Copia link d'invito", g_invite_copied: "✅ Link copiato!", g_invite_email: "✉️ Invita via e-mail",
      g_create_title: "➕ Crea un gruppo", g_create_ph: "Nome del gruppo (es. La compagnia)", g_create_btn: "Crea",
      g_join_title: "🔗 Unisciti a un gruppo", g_join_text: "Hai ricevuto un link d'invito? Aprilo e basta, verrai aggiunto automaticamente.",
      g_members: "membro/i", g_score: "Risultato", g_saved: "✅ salvato", g_locked: "🔒 partita iniziata, pronostico bloccato",
      g_no_upcoming: "Nessuna partita in programma al momento.",
      g_rules: "📜 Regole",
      g_rule1: "🎯 <b>Risultato esatto</b> = <b>3 pti</b> · ✅ <b>esito corretto</b> (1X2) = <b>2 pti</b> · ❌ sbagliato = 0",
      g_rule2: "⏱️ Contano solo le partite <b>dalla creazione del gruppo</b>.",
      g_rule3: "🔒 Un pronostico si blocca al <b>fischio d'inizio</b>.",
      g_lb_note: "{n} partita/e conteggiata/e dalla creazione del gruppo",
      g_lb_player: "Giocatore", g_lb_played: "Giocate", g_lb_exact: "Esatti", g_lb_points: "Punti", g_bot: "Bot del sito",
      g_forum_ph: "Scrivi un messaggio al gruppo…", g_forum_send: "Invia",
      g_forum_empty: "Nessun messaggio. Inizia la conversazione! 💬", g_forum_unavailable: "Forum non disponibile.",
      g_remove_member: "Rimuovere questo membro dal gruppo?",
      g_delete_group: "🗑️ Elimina gruppo", g_delete_group_confirm: "Eliminare definitivamente il gruppo “{name}”? È irreversibile per tutti i membri.",
      g_profile_title: "⚙️ Il mio profilo", g_p_name: "Nome", g_p_email: "E-mail", g_p_conn: "Accesso", g_p_groups: "Gruppi",
      g_p_via_google: "Google", g_p_via_email: "E-mail / password", g_p_email_none: "non indicato",
      g_danger: "Zona di pericolo", g_delete_btn: "🗑️ Elimina il mio account",
      g_delete_warn: "L'eliminazione del tuo account è <b>definitiva</b>: vieni rimosso da tutti i tuoi gruppi e i tuoi pronostici vengono cancellati.",
      g_delete_confirm: "Eliminare definitivamente il tuo account? Questa azione è irreversibile.", g_deleting: "Eliminazione…",
      g_pwd_prompt: "Per confermare, inserisci la tua password:",
      g_auth_title: "Accedi / Registrati", g_signin: "Accedi", g_signup: "Crea account",
      g_email: "E-mail", g_password: "Password", g_name: "Il tuo nome (nickname)",
      g_google: "Continua con Google", g_or: "o",
      g_auth_no_account: "Non hai ancora un account?", g_auth_have_account: "Hai già un account?", g_pwd_ph: "Password (6+ caratteri)", g_signup_do: "Crea il mio account", g_auth_title_login: "Accedi",
      g_err_badcred: "E-mail o password errati.", g_err_inuse: "Questa e-mail ha già un account.",
      g_err_weak: "Password troppo corta (min. 6 caratteri).", g_err_email: "E-mail non valida.", g_err_popup: "Finestra Google chiusa.",
      g_invite_subject: "Invito al gruppo di pronostici “{name}”",
      g_invite_body: "Ciao!\n\nTi invito a unirti al mio gruppo di pronostici “{name}” su Chat Game Prediction Technology ⚽\n\nClicca questo link per partecipare:\n{link}\n\nIn bocca al lupo 🏆",
    },
    sw: {
      nav_predictions: "Ubashiri", nav_winner: "Mshindi", nav_groups: "Kikundi changu", nav_history: "Historia",
      brand_sub: "Kombe la Dunia 2026",
      nav_card: "Kadi yangu ya Panini", card_eyebrow: "Kadi ya kukusanya", card_h1: "Tengeneza kadi yako ya Panini", card_lede: "Kadi yako mwenyewe kwa mtindo wa stika za mpira. Jaza fomu, ongeza picha yako, pakua na uishiriki kueneza habari za tovuti.", card_form_title: "🎴 Kadi yako", card_photo: "Picha", card_name: "Jina", card_role: "Cheo", card_number: "Nambari", card_country: "Nchi", card_company: "Kampuni / timu", card_stats: "Takwimu (0–99)", card_download: "📥 Pakua", card_share: "📤 Shiriki", card_photo_ph: "Ongeza picha yako", card_jersey: "👕 Vaa jezi ya rangi za nchi",
      card_ai: "✨ Toleo la AI (jezi halisi)", card_ai_loading: "✨ AI inazalisha…", card_ai_need_photo: "Ongeza picha kwanza.", card_ai_unconfigured: "Toleo la AI bado halijawashwa kwenye tovuti hii.", card_ai_error: "Uzalishaji wa AI umeshindwa.", card_share_hint: "Kidokezo: pakua picha kisha uiambatishe kwenye chapisho lako (kwenye Instagram, shiriki kutoka kwenye matunzio).", card_privacy: "🔒 Kila kitu kinafanyika kwenye kivinjari chako: picha yako haitumwi kamwe kwa seva.", card_foot: "Picha imetengenezwa ndani kwa ajili ya burudani. Chapa ya Panini™ imetajwa kama msukumo, bila uhusiano.", card_share_text: "Nimetengeneza kadi yangu ya mtindo wa Panini kwenye chatgpt.football ⚽ · tengeneza yako na ushindane na AI katika ubashiri!",
      foot_disclaimer_label: "Tahadhari.", foot_updated: "Modeli imesasishwa",
      idx_eyebrow: "Ubashiri kwa akili bandia",
      idx_lede: "Uwezekano wa ushindi, matokeo yanayotarajiwa na wafungaji wanaowezekana, vilivyotengenezwa na AI kwa kila mechi ijayo ya Kombe la Dunia 2026.",
      idx_pitch: "🎯 <b>Shiriki ubashiri wako na marafiki</b> na upande katika msimamo&nbsp;!",
      idx_pitchbot: "🤖 <b>Roboti ya tovuti pia inacheza&nbsp;!</b> Je, itakushinda&nbsp;?",
      idx_cta_group: "👥 Unda kikundi na marafiki", idx_cta_winner: "🏆 Nani atashinda?",
      idx_search_ph: "Tafuta timu…", idx_empty: "Hakuna mechi inayolingana na utafutaji wako.",
      idx_foot_disclaimer: "Ubashiri huu unatengenezwa kiotomatiki kwa madhumuni ya mfano na burudani. Si ushauri wa kubeti.",
      idx_foot_credit: "Modeli ya ubashiri · data halisi iliyokusanywa (odd · fomu · vyombo vya habari · X) · Kombe 2026",
      st_analyzed: "Mechi zilizochambuliwa", st_accuracy: "Usahihi (mechi {n})", st_avgconf: "Uhakika wa wastani",
      st_nextfav: "Kipenzi kijacho", st_sources: "Vyanzo vilivyokusanywa",
      card_scoreia: "Skoa ya AI", nav_gains: "Dau", nav_loto: "Loto", gains_lede: "Kama tungeweka dau la kubuni la € 20 kwa kila mechi ambapo AI ilikadiria kipenzi zaidi ya 50%. Faida za kinadharia Unibet vs Polymarket. Uigaji wa kielimu · hakuna kamari halisi.", gains_c_match: "Mechi", gains_c_pick: "Ubashiri AI", gains_c_odds: "Odd", gains_c_res: "Matokeo", gains_c_uni: "Jumla Unibet", gains_c_poly: "Jumla Polymarket", pf_poly_note: "makadirio · ≈ bei ya soko", pf_book: "odd za Unibet (~6% marja)", his_aet: "muda wa ziada", his_pens: "penati", pf_title: "Mkoba wa kubuni", pf_virtual: "Kubuni", pf_sub: "Dau la kubuni la € {stake} kwa kila mechi ambapo AI ilikadiria kipenzi zaidi ya 50%.", pf_bets: "Dau", pf_wl: "Zilizoshinda / Zilizopotea", pf_staked: "Jumla iliyowekwa", pf_pnl: "Faida halisi", pf_roi: "Faida %", pf_edge: "Dau zenye thamani", pf_warn: "Uigaji wa kubuni kwa elimu · hakuna kamari halisi. Kila dau kwa kweli lilikuwa na matarajio hasi (uwezekano wa AI < bei ya soko): kiwango kizuri cha ushindi hakihakikishi faida.", card_finished: "Imeisha", card_result: "Matokeo", card_ai_short: "AI:", card_conf: "Uhakika", card_draw: "Sare",
      pf_start: "Mtaji wa kuanzia",
      pf_final: "Mtaji wa mwisho",
      pf_strategy: "40% ya mtaji kila dau",
      gains_c_stake: "Dau",
      gains_c_bank: "Mtaji",
      card_projected: "Iliyokadiriwa", card_projected_title: "Mechi iliyokadiriwa kulingana na ubashiri",
      src_summary: "Maelezo ya vyanzo vilivyokusanywa",
      scorers_head: "⚽ Wafungaji wanaowezekana", filter_all: "Zote",
      scorers_est: "makadirio",
      updated_at: "saa {time} tarehe {date}", load_error: "Imeshindwa kupakia ubashiri.",
      sim_eyebrow: "Makadirio ya mshindi", sim_h1: "Nani atashinda<br />Kombe la Dunia&nbsp;?",
      sim_lede: "Uwezekano wa ubingwa uliokadiriwa kutoka soko zilizokusanywa, unaohesabiwa upya baada ya kila mechi.",
      sim_title: "🏆 Uwezekano wa ubingwa",
      sim_foot_disclaimer: "Makadirio yaliyotengenezwa kiotomatiki kwa mfano. Si ushauri wa kubeti.",
      sim_foot_credit: "Uwezekano wa ubingwa = soko zilizokusanywa · Kombe 2026",
      sim_fav_label: "Kipenzi cha ubingwa · {p}%", sim_updated: "Imesasishwa {d}", sim_unavailable: "Makadirio ya ubingwa hayapatikani.",
      sim_path_title: "🧭 Njia inayotabiriwa hadi ubingwa", sim_round_r16: "Hatua ya 16", sim_round_quarter: "Robo fainali", sim_round_semi: "Nusu fainali", sim_round_final: "Fainali", sim_champion: "Bingwa anayetabiriwa",
      sim_path_note: "Hali ya kudhania kulingana na uwezekano wa ubingwa: kila raundi timu yenye uwezekano zaidi inashinda. Kura halisi inaweza kutofautiana.",
      his_eyebrow: "Ubashiri dhidi ya matokeo halisi", his_h1: "Historia na usahihi", his_prob_legend: "Asilimia ni uwezekano uliokadiriwa na AI kwa ubashiri wake.",
      his_lede: "Kila ubashiri wa AI kabla ya mechi huhifadhiwa, kisha hulinganishwa na skoa halisi. Hii ni ripoti, mechi kwa mechi.",
      his_empty: "Hakuna mechi iliyomalizika bado.",
      his_foot_disclaimer: "Ubashiri uliotengenezwa kiotomatiki kwa mfano. Si ushauri wa kubeti.",
      his_foot_credit: "Usahihi uliohesabiwa kwa mechi zilizomalizika · Kombe 2026",
      his_stat_accuracy: "Usahihi (1X2)", his_stat_good: "Ubashiri sahihi", his_stat_finished: "Mechi zilizomalizika",
      his_verdict_ok: "✓ Ubashiri mzuri", his_verdict_ko: "✗ Kukosea", his_exact: "skoa kamili",
      his_pred_label: "Ubashiri wa AI", his_pred_prob_title: "Uwezekano uliokadiriwa na AI kwa ubashiri huu (wa juu zaidi kati ya 1·X·2)",
      his_real_label: "Matokeo halisi", his_draw: "Sare", his_unavailable: "Imeshindwa kupakia historia.",
      his_insight_title_perfect: "AI ikiwa na uhakika, haikosei",
      his_insight_title_good: "Kadiri AI inavyokuwa na uhakika, ndivyo inavyofanikiwa zaidi",
      his_insight_perfect: "Katika <b>mechi {n}</b> ambapo ilikadiria uwezekano <b>zaidi ya 50&nbsp;%</b>, ubashiri wake ulikuwa <b>sahihi kila wakati</b>.",
      his_insight_good: "Katika <b>mechi {n}</b> ambapo ilikadiria uwezekano <b>zaidi ya 50&nbsp;%</b>, ubashiri wake ulikuwa <b>sahihi {k} kati ya {n}</b>.",
      his_insight_cap: "ya mafanikio",
      grp_eyebrow: "Miongoni mwa marafiki", grp_h1: "Vikundi na msimamo",
      grp_lede: "Unda kikundi, alika marafiki, bashiri kila mechi ijayo na upande katika msimamo, 🤖 roboti ya tovuti pia inacheza!",
      grp_loading: "Inapakia…",
      grp_foot_disclaimer: "Mchezo wa ubashiri miongoni mwa marafiki, kwa burudani.",
      grp_foot_credit: "Akaunti na data: Firebase · Kombe 2026",
      g_logout: "Toka", g_profile: "⚙️ Wasifu", g_back: "← Rudi", g_new_group: "➕ Kikundi kipya",
      g_tab_pred: "⚽ Ubashiri wangu", g_tab_rank: "🏆 Msimamo", g_tab_forum: "💬 Jukwaa",
      g_invite_copy: "🔗 Nakili kiungo cha mwaliko", g_invite_copied: "✅ Kiungo kimenakiliwa!", g_invite_email: "✉️ Alika kwa barua pepe",
      g_create_title: "➕ Unda kikundi", g_create_ph: "Jina la kikundi (mf. Wenzangu)", g_create_btn: "Unda",
      g_join_title: "🔗 Jiunge na kikundi", g_join_text: "Umepokea kiungo cha mwaliko? Kifungue tu, utaongezwa kiotomatiki.",
      g_members: "mwanachama", g_score: "Skoa", g_saved: "✅ imehifadhiwa", g_locked: "🔒 mechi imeanza, ubashiri umefungwa",
      g_no_upcoming: "Hakuna mechi ijayo kwa sasa.",
      g_rules: "📜 Sheria",
      g_rule1: "🎯 <b>Skoa kamili</b> = <b>pt 3</b> · ✅ <b>matokeo sahihi</b> (1X2) = <b>pt 2</b> · ❌ kukosea = 0",
      g_rule2: "⏱️ Zinahesabiwa tu mechi <b>tangu kuundwa kwa kikundi</b>.",
      g_rule3: "🔒 Ubashiri hufungwa wakati wa <b>kuanza kwa mechi</b>.",
      g_lb_note: "Mechi {n} zimehesabiwa tangu kuundwa kwa kikundi",
      g_lb_player: "Mchezaji", g_lb_played: "Zilizochezwa", g_lb_exact: "Kamili", g_lb_points: "Pointi", g_bot: "Roboti ya tovuti",
      g_forum_ph: "Andika ujumbe kwa kikundi…", g_forum_send: "Tuma",
      g_forum_empty: "Hakuna ujumbe bado. Anzisha mazungumzo! 💬", g_forum_unavailable: "Jukwaa halipatikani.",
      g_remove_member: "Kumuondoa mwanachama huyu kwenye kikundi?",
      g_delete_group: "🗑️ Futa kikundi", g_delete_group_confirm: "Futa kabisa kikundi “{name}”? Kitendo hiki hakirudishiki kwa wanachama wote.",
      g_profile_title: "⚙️ Wasifu wangu", g_p_name: "Jina", g_p_email: "Barua pepe", g_p_conn: "Kuingia", g_p_groups: "Vikundi",
      g_p_via_google: "Google", g_p_via_email: "Barua pepe / nenosiri", g_p_email_none: "haijatolewa",
      g_danger: "Eneo la hatari", g_delete_btn: "🗑️ Futa akaunti yangu",
      g_delete_warn: "Kufuta akaunti yako ni <b>kwa kudumu</b>: unaondolewa kwenye vikundi vyako vyote na ubashiri wako unafutwa.",
      g_delete_confirm: "Futa akaunti yako kabisa? Kitendo hiki hakirudishiki.", g_deleting: "Inafuta…",
      g_pwd_prompt: "Kuthibitisha, weka nenosiri lako:",
      g_auth_title: "Ingia / Jisajili", g_signin: "Ingia", g_signup: "Fungua akaunti",
      g_email: "Barua pepe", g_password: "Nenosiri", g_name: "Jina lako (lakabu)",
      g_google: "Endelea na Google", g_or: "au",
      g_auth_no_account: "Bado huna akaunti?", g_auth_have_account: "Tayari una akaunti?", g_pwd_ph: "Nenosiri (herufi 6+)", g_signup_do: "Fungua akaunti yangu", g_auth_title_login: "Ingia",
      g_err_badcred: "Barua pepe au nenosiri si sahihi.", g_err_inuse: "Barua pepe hii tayari ina akaunti.",
      g_err_weak: "Nenosiri ni fupi mno (angalau herufi 6).", g_err_email: "Barua pepe si sahihi.", g_err_popup: "Dirisha la Google limefungwa.",
      g_invite_subject: "Mwaliko kwa kikundi cha ubashiri “{name}”",
      g_invite_body: "Habari!\n\nNakualika ujiunge na kikundi changu cha ubashiri “{name}” kwenye Chat Game Prediction Technology ⚽\n\nBofya kiungo hiki kushiriki:\n{link}\n\nKila la heri 🏆",
    },
    ar: {
      nav_predictions: "التوقعات", nav_winner: "الفائز", nav_groups: "مجموعتي", nav_history: "السجل",
      brand_sub: "كأس العالم 2026",
      nav_card: "بطاقة Panini الخاصة بي", card_eyebrow: "بطاقة للجمع", card_h1: "أنشئ بطاقة Panini الخاصة بك", card_lede: "بطاقتك الخاصة على طراز ملصقات كرة القدم. املأ النموذج، أضف صورتك، نزّلها وشاركها للتعريف بالموقع.", card_form_title: "🎴 بطاقتك", card_photo: "الصورة", card_name: "الاسم", card_role: "المنصب", card_number: "الرقم", card_country: "البلد", card_company: "الشركة / الفريق", card_stats: "الإحصاءات (0–99)", card_download: "📥 تنزيل", card_share: "📤 مشاركة", card_photo_ph: "أضف صورتك", card_jersey: "👕 ارتداء قميص بألوان البلد",
      card_ai: "✨ نسخة الذكاء الاصطناعي (قميص واقعي)", card_ai_loading: "✨ جارٍ التوليد بالذكاء الاصطناعي…", card_ai_need_photo: "أضف صورة أولًا.", card_ai_unconfigured: "نسخة الذكاء الاصطناعي غير مفعّلة بعد على هذا الموقع.", card_ai_error: "فشل التوليد بالذكاء الاصطناعي.", card_share_hint: "نصيحة: نزّل الصورة ثم أرفقها بمنشورك (على إنستغرام، شارك من معرض الصور).", card_privacy: "🔒 كل شيء يحدث في متصفحك: صورتك لا تُرسَل أبدًا إلى خادم.", card_foot: "صورة مُولَّدة محليًا للتسلية. علامة Panini™ مذكورة للإلهام دون أي ارتباط.", card_share_text: "أنشأت بطاقتي على طراز Panini على chatgpt.football ⚽ · أنشئ بطاقتك وتحدَّ الذكاء الاصطناعي في التوقعات!",
      foot_disclaimer_label: "تنبيه.", foot_updated: "تم تحديث النموذج",
      idx_eyebrow: "توقعات بالذكاء الاصطناعي",
      idx_lede: "احتمالات الفوز والنتائج المتوقعة والهدّافون المحتملون، مولّدة بالذكاء الاصطناعي لكل مباراة قادمة في كأس العالم 2026.",
      idx_pitch: "🎯 <b>شارك توقعاتك مع أصدقائك</b> وتسلّق الترتيب&nbsp;!",
      idx_pitchbot: "🤖 <b>روبوت الموقع يلعب أيضًا&nbsp;!</b> هل سيتغلب عليك&nbsp;؟",
      idx_cta_group: "👥 أنشئ مجموعة مع الأصدقاء", idx_cta_winner: "🏆 مَن سيفوز؟",
      idx_search_ph: "ابحث عن فريق…", idx_empty: "لا توجد مباراة تطابق بحثك.",
      idx_foot_disclaimer: "تُولَّد هذه التوقعات تلقائيًا لأغراض توضيحية وترفيهية. وهي ليست نصيحة للمراهنة.",
      idx_foot_credit: "نموذج تنبّؤي · بيانات حقيقية مجمّعة (الرهانات · الأداء · الصحافة · X) · كأس 2026",
      st_analyzed: "مباريات محلَّلة", st_accuracy: "الدقة ({n} مباراة)", st_avgconf: "متوسط الثقة",
      st_nextfav: "المرشّح القادم", st_sources: "مصادر مجمّعة",
      card_scoreia: "نتيجة الذكاء الاصطناعي", nav_gains: "الرهانات", nav_loto: "Loto", gains_lede: "لو راهنا بمبلغ افتراضي 20 € على كل مباراة رشّح فيها الذكاء الاصطناعي الفريق المفضّل بأكثر من 50%. أرباح نظرية Unibet مقابل Polymarket. محاكاة تعليمية · بلا رهان حقيقي.", gains_c_match: "المباراة", gains_c_pick: "توقع الذكاء", gains_c_odds: "الاحتمال", gains_c_res: "النتيجة", gains_c_uni: "إجمالي Unibet", gains_c_poly: "إجمالي Polymarket", pf_poly_note: "تقديري · ≈ سعر السوق", pf_book: "احتمالات Unibet (هامش ~6%)", his_aet: "بعد الوقت الإضافي", his_pens: "ركلات الترجيح", pf_title: "محفظة افتراضية", pf_virtual: "افتراضي", pf_sub: "رهان افتراضي بقيمة {stake} € على كل مباراة رشّح فيها الذكاء الاصطناعي الفريق المفضّل بأكثر من 50%.", pf_bets: "الرهانات", pf_wl: "فوز / خسارة", pf_staked: "إجمالي الرهان", pf_pnl: "صافي الربح", pf_roi: "العائد", pf_edge: "رهانات ذات قيمة", pf_warn: "محاكاة افتراضية تعليمية · بلا رهان حقيقي. كل رهان كان في الواقع سالب التوقع (احتمال الذكاء < سعر السوق): نسبة نجاح عالية لا تضمن الربح.", card_finished: "انتهت", card_result: "النتيجة", card_ai_short: "الذكاء:", card_conf: "الثقة", card_draw: "تعادل",
      pf_start: "رأس المال الأولي",
      pf_final: "رأس المال النهائي",
      pf_strategy: "40٪ من رأس المال لكل رهان",
      gains_c_stake: "الرهان",
      gains_c_bank: "الرصيد",
      card_projected: "متوقَّع", card_projected_title: "مباراة متوقَّعة حسب التوقعات",
      src_summary: "تفاصيل المصادر المجمّعة",
      scorers_head: "⚽ الهدّافون المحتملون", filter_all: "الكل",
      scorers_est: "تقدير",
      updated_at: "الساعة {time} بتاريخ {date}", load_error: "تعذّر تحميل التوقعات.",
      sim_eyebrow: "تقدير الفائز", sim_h1: "مَن سيفوز<br />بكأس العالم&nbsp;؟",
      sim_lede: "احتمالات اللقب مقدَّرة من الأسواق المجمّعة، تُعاد حسابها بعد كل مباراة.",
      sim_title: "🏆 احتمالات اللقب",
      sim_foot_disclaimer: "تقديرات تُولَّد تلقائيًا لأغراض توضيحية. وهي ليست نصيحة للمراهنة.",
      sim_foot_credit: "احتمالات اللقب = أسواق مجمّعة · كأس 2026",
      sim_fav_label: "المرشّح للقب · {p}%", sim_updated: "آخر تحديث {d}", sim_unavailable: "تقدير اللقب غير متاح.",
      sim_path_title: "🧭 المسار المتوقَّع نحو اللقب", sim_round_r16: "دور الـ16", sim_round_quarter: "ربع النهائي", sim_round_semi: "نصف النهائي", sim_round_final: "النهائي", sim_champion: "البطل المتوقَّع",
      sim_path_note: "سيناريو افتراضي مبني على احتمالات اللقب: في كل دور يتأهل المنتخب الأكثر احتمالًا. القرعة الحقيقية قد تختلف.",
      his_eyebrow: "التوقعات مقابل النتائج الحقيقية", his_h1: "السجل والدقة", his_prob_legend: "النسبة المئوية هي احتمال يقدّره الذكاء الاصطناعي لتوقعه.",
      his_lede: "يُؤرشَف كل توقع للذكاء الاصطناعي قبل المباراة، ثم يُقارَن بالنتيجة الحقيقية. إليك الحصيلة، مباراة بمباراة.",
      his_empty: "لا توجد مباراة منتهية بعد.",
      his_foot_disclaimer: "توقعات تُولَّد تلقائيًا لأغراض توضيحية. وهي ليست نصيحة للمراهنة.",
      his_foot_credit: "الدقة محسوبة على المباريات المنتهية · كأس 2026",
      his_stat_accuracy: "الدقة (1X2)", his_stat_good: "توقعات صحيحة", his_stat_finished: "مباريات منتهية",
      his_verdict_ok: "✓ توقع صحيح", his_verdict_ko: "✗ خطأ", his_exact: "نتيجة مطابقة",
      his_pred_label: "توقع الذكاء الاصطناعي", his_pred_prob_title: "الاحتمال الذي قدّره الذكاء الاصطناعي لهذا التوقع (الأعلى بين الاحتمالات الثلاثة 1·X·2)",
      his_real_label: "النتيجة الحقيقية", his_draw: "تعادل", his_unavailable: "تعذّر تحميل السجل.",
      his_insight_title_perfect: "عندما يكون الذكاء الاصطناعي واثقًا، فإنه لا يخطئ",
      his_insight_title_good: "كلما زادت ثقة الذكاء الاصطناعي، زادت إصابته",
      his_insight_perfect: "في <b>{n} مباراة</b> قدّر فيها احتمالًا <b>أكثر من 50&nbsp;%</b>، كان توقعه <b>صحيحًا في كل مرة</b>.",
      his_insight_good: "في <b>{n} مباراة</b> قدّر فيها احتمالًا <b>أكثر من 50&nbsp;%</b>، كان توقعه <b>صحيحًا {k} من {n}</b>.",
      his_insight_cap: "نسبة النجاح",
      grp_eyebrow: "بين الأصدقاء", grp_h1: "المجموعات والترتيب",
      grp_lede: "أنشئ مجموعة، وادعُ أصدقاءك، وتوقّع كل مباراة قادمة وتسلّق الترتيب، 🤖 روبوت الموقع يلعب أيضًا!",
      grp_loading: "جارٍ التحميل…",
      grp_foot_disclaimer: "لعبة توقعات بين الأصدقاء، لأغراض الترفيه.",
      grp_foot_credit: "الحسابات والبيانات: Firebase · كأس 2026",
      g_logout: "تسجيل الخروج", g_profile: "⚙️ الملف الشخصي", g_back: "← رجوع", g_new_group: "➕ مجموعة جديدة",
      g_tab_pred: "⚽ توقعاتي", g_tab_rank: "🏆 الترتيب", g_tab_forum: "💬 المنتدى",
      g_invite_copy: "🔗 نسخ رابط الدعوة", g_invite_copied: "✅ تم نسخ الرابط!", g_invite_email: "✉️ دعوة بالبريد",
      g_create_title: "➕ أنشئ مجموعة", g_create_ph: "اسم المجموعة (مثلاً: الأصدقاء)", g_create_btn: "إنشاء",
      g_join_title: "🔗 انضم إلى مجموعة", g_join_text: "هل تلقّيت رابط دعوة؟ افتحه فقط، ستُضاف تلقائيًا.",
      g_members: "عضو/أعضاء", g_score: "النتيجة", g_saved: "✅ تم الحفظ", g_locked: "🔒 بدأت المباراة، التوقع مقفل",
      g_no_upcoming: "لا توجد مباراة قادمة حاليًا.",
      g_rules: "📜 القواعد",
      g_rule1: "🎯 <b>نتيجة مطابقة</b> = <b>3 نقاط</b> · ✅ <b>نتيجة صحيحة</b> (1X2) = <b>نقطتان</b> · ❌ خطأ = 0",
      g_rule2: "⏱️ تُحتسب فقط المباريات <b>من تاريخ إنشاء المجموعة</b>.",
      g_rule3: "🔒 يُقفل التوقع عند <b>انطلاق المباراة</b>.",
      g_lb_note: "{n} مباراة محتسبة منذ إنشاء المجموعة",
      g_lb_player: "لاعب", g_lb_played: "لعبها", g_lb_exact: "مطابقة", g_lb_points: "نقاط", g_bot: "روبوت الموقع",
      g_forum_ph: "اكتب رسالة إلى المجموعة…", g_forum_send: "إرسال",
      g_forum_empty: "لا توجد رسائل بعد. ابدأ النقاش! 💬", g_forum_unavailable: "المنتدى غير متاح.",
      g_remove_member: "إزالة هذا العضو من المجموعة؟",
      g_delete_group: "🗑️ حذف المجموعة", g_delete_group_confirm: "حذف المجموعة «{name}» نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه لجميع الأعضاء.",
      g_profile_title: "⚙️ ملفي الشخصي", g_p_name: "الاسم", g_p_email: "البريد الإلكتروني", g_p_conn: "تسجيل الدخول", g_p_groups: "المجموعات",
      g_p_via_google: "Google", g_p_via_email: "البريد / كلمة المرور", g_p_email_none: "غير مُدخل",
      g_danger: "منطقة الخطر", g_delete_btn: "🗑️ حذف حسابي",
      g_delete_warn: "حذف حسابك <b>نهائي</b>: ستُزال من جميع مجموعاتك وستُمحى توقعاتك.",
      g_delete_confirm: "حذف حسابك نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه.", g_deleting: "جارٍ الحذف…",
      g_pwd_prompt: "للتأكيد، أدخل كلمة المرور:",
      g_auth_title: "تسجيل الدخول / إنشاء حساب", g_signin: "تسجيل الدخول", g_signup: "إنشاء حساب",
      g_email: "البريد الإلكتروني", g_password: "كلمة المرور", g_name: "اسمك (لقب)",
      g_google: "المتابعة باستخدام Google", g_or: "أو",
      g_auth_no_account: "ليس لديك حساب بعد؟", g_auth_have_account: "لديك حساب بالفعل؟", g_pwd_ph: "كلمة المرور (6 أحرف على الأقل)", g_signup_do: "إنشاء حسابي", g_auth_title_login: "تسجيل الدخول",
      g_err_badcred: "البريد الإلكتروني أو كلمة المرور غير صحيحة.", g_err_inuse: "هذا البريد لديه حساب بالفعل.",
      g_err_weak: "كلمة المرور قصيرة جدًا (6 أحرف على الأقل).", g_err_email: "بريد إلكتروني غير صالح.", g_err_popup: "تم إغلاق نافذة Google.",
      g_invite_subject: "دعوة إلى مجموعة التوقعات «{name}»",
      g_invite_body: "مرحبًا!\n\nأدعوك للانضمام إلى مجموعة التوقعات «{name}» على Chat Game Prediction Technology ⚽\n\nانقر على هذا الرابط للمشاركة:\n{link}\n\nبالتوفيق 🏆",
    },
  };

  function detect() {
    try {
      const saved = localStorage.getItem("lang");
      if (saved && T[saved]) return saved;
    } catch (e) {}
    const nav = ((navigator.language || "fr").slice(0, 2)).toLowerCase();
    return T[nav] ? nav : "fr";
  }

  let cur = detect();

  window.t = function (key, vars) {
    let s = (T[cur] && T[cur][key] != null) ? T[cur][key] : (T.fr[key] != null ? T.fr[key] : key);
    if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  };
  window.getLang = () => cur;

  function apply(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = window.t(el.getAttribute("data-i18n")); });
    root.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = window.t(el.getAttribute("data-i18n-html")); });
    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(";").forEach((pair) => {
        const i = pair.indexOf(":");
        if (i > 0) el.setAttribute(pair.slice(0, i).trim(), window.t(pair.slice(i + 1).trim()));
      });
    });
    document.documentElement.lang = cur;
    document.documentElement.dir = (cur === "ar") ? "rtl" : "ltr";
  }
  window.applyI18n = apply;

  window.setLang = function (code) {
    if (!T[code]) return;
    cur = code;
    try { localStorage.setItem("lang", code); } catch (e) {}
    buildSwitchers();
    apply();
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: code } }));
  };

  // Code pays (ISO) par langue pour l'image de drapeau (flagcdn).
  const LANG_CC = { fr: "fr", en: "gb", es: "es", pt: "pt", de: "de", it: "it", sw: "tz", ar: "sa" };
  const flagImg = (code) => `https://flagcdn.com/w40/${LANG_CC[code] || code}.png`;

  function buildSwitchers() {
    document.querySelectorAll("[data-lang-switcher]").forEach((host) => {
      const curL = LANGS.find((l) => l.code === cur) || LANGS[0];
      const wrap = document.createElement("div");
      wrap.className = "lang-flags";
      wrap.innerHTML =
        `<button type="button" class="lang-current" aria-haspopup="listbox" aria-expanded="false" aria-label="${curL.label}">
           <img src="${flagImg(cur)}" alt="${curL.label}" width="22" height="16" loading="lazy" />
           <svg viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
         </button>
         <ul class="lang-menu" role="listbox" hidden>` +
        LANGS.map((l) =>
          `<li role="option"${l.code === cur ? ' aria-selected="true"' : ""}>` +
          `<button type="button" data-code="${l.code}"><img src="${flagImg(l.code)}" alt="" width="22" height="16" loading="lazy" /> ${l.label}</button></li>`
        ).join("") +
        `</ul>`;
      const btn = wrap.querySelector(".lang-current");
      const menu = wrap.querySelector(".lang-menu");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = menu.hidden;
        menu.hidden = !willOpen;
        btn.setAttribute("aria-expanded", String(willOpen));
      });
      menu.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-code]");
        if (b) window.setLang(b.dataset.code);
      });
      host.innerHTML = "";
      host.appendChild(wrap);
    });
    if (!window.__langOutsideClose) {
      window.__langOutsideClose = true;
      document.addEventListener("click", () => {
        document.querySelectorAll(".lang-menu").forEach((m) => (m.hidden = true));
        document.querySelectorAll(".lang-current").forEach((b) => b.setAttribute("aria-expanded", "false"));
      });
    }
  }
  window.buildLangSwitchers = buildSwitchers;

  // ---- Détection de langue par pays (géolocalisation IP) ----
  function mapCountryToLang(cc) {
    cc = (cc || "").toUpperCase();
    if (cc === "CH") return "de"; // Suisse multilingue → allemand par défaut
    const M = {
      // français
      FR: "fr", BE: "fr", MC: "fr", LU: "fr", CI: "fr", SN: "fr", ML: "fr", BF: "fr",
      NE: "fr", TG: "fr", BJ: "fr", GA: "fr", CG: "fr", CD: "fr", CM: "fr", MG: "fr",
      GN: "fr", TD: "fr", DJ: "fr", HT: "fr",
      // español
      ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es", VE: "es", EC: "es",
      GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es",
      CR: "es", PA: "es", UY: "es",
      // português
      PT: "pt", BR: "pt", AO: "pt", MZ: "pt", CV: "pt",
      // deutsch
      DE: "de", AT: "de", LI: "de",
      // italiano
      IT: "it", SM: "it", VA: "it",
      // kiswahili (Afrique de l'Est)
      KE: "sw", TZ: "sw", UG: "sw", RW: "sw", BI: "sw",
      // english
      GB: "en", US: "en", IE: "en", AU: "en", NZ: "en", CA: "en", ZA: "en", NG: "en",
      GH: "en", IN: "en", PK: "en", PH: "en", SG: "en", JM: "en", TT: "en",
      // العربية (Golfe, مصر، المشرق)
      SA: "ar", AE: "ar", EG: "ar", IQ: "ar", JO: "ar", KW: "ar", QA: "ar", BH: "ar",
      OM: "ar", YE: "ar", SY: "ar", LB: "ar", LY: "ar", SD: "ar", PS: "ar",
    };
    return M[cc] || null;
  }

  function userHasChosen() {
    try { const s = localStorage.getItem("lang"); return !!(s && T[s]); } catch (e) { return false; }
  }

  // Si l'utilisateur n'a pas choisi de langue, on déduit la meilleure langue
  // depuis son pays (IP). Ne touche jamais à un choix manuel.
  async function detectByIP() {
    if (userHasChosen()) return;
    try {
      const r = await fetch("https://get.geojs.io/v1/ip/country.json", { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      const lang = mapCountryToLang((j && (j.country_code || j.country)) || "");
      if (lang && T[lang] && lang !== cur && !userHasChosen()) {
        cur = lang;
        buildSwitchers();
        apply();
        document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: cur, auto: true } }));
      }
    } catch (e) { /* hors-ligne ou bloqué : on garde la langue du navigateur */ }
  }

  // ---- Thème clair / sombre ----
  const THEME_KEY = "theme";
  const getTheme = () => { try { return localStorage.getItem(THEME_KEY) || "dark"; } catch (e) { return "dark"; } };
  function applyTheme(th) {
    document.documentElement.setAttribute("data-theme", th);
    try { localStorage.setItem(THEME_KEY, th); } catch (e) {}
    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) btn.textContent = th === "light" ? "🌙 Mode sombre" : "☀️ Mode clair";
  }
  // Appliqué tout de suite (script dans <head>) pour éviter le flash au chargement.
  document.documentElement.setAttribute("data-theme", getTheme());

  function buildThemeToggle() {
    if (document.querySelector("[data-theme-toggle]")) return;
    const foot = document.querySelector(".site-footer") || document.body;
    const wrap = document.createElement("div");
    wrap.className = "theme-toggle-wrap";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("data-theme-toggle", "");
    btn.addEventListener("click", () =>
      applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light"));
    wrap.appendChild(btn);
    foot.appendChild(wrap);
    applyTheme(getTheme());
  }

  function init() { buildSwitchers(); apply(); buildThemeToggle(); detectByIP(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
