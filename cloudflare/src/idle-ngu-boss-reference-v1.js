/*
 * SOREAL IDLE — RÉFÉRENCE BOSS NGU V1
 *
 * Mission NGU (2026-09-09) : la progression PV/Attaque/XP des boss dans
 * idle-sqlite-runtime.js (equilibrerBossPrincipalSorealIdleV413_ pour le
 * plancher minimum, et definitionBossSorealIdle_ pour la progression
 * infinie au-delà du catalogue) reposait sur des constantes INVENTÉES,
 * jamais sourcées (×3/boss et ×2/boss pour le plancher, ×2.75/×1.35/boss
 * pour la suite infinie, ×1.18/boss pour l'XP) — voir cloudflare/reference/
 * README.md pour le détail. Ces valeurs sont beaucoup plus faibles que la
 * vraie règle NGU, ce qui explique très probablement le bug déjà signalé
 * ("j'ai pu tuer les 20 premiers boss en spammant le bouton fight").
 *
 * Ce module fournit la vraie progression, sourcée depuis le wiki officiel
 * NGU Idle (https://ngu-idle.fandom.com/wiki/Boss_Fights, consulté
 * 2026-09-09) : les 160 premiers boss sont une table exacte (copiée depuis
 * cloudflare/reference/ngu-boss-reference-v1.json, vérifiée sans écart sur
 * la règle "PV = Attaque × 10" et "×5 du boss 5 au boss 20, ×10 à partir du
 * boss 21"). Au-delà du boss 160, cette même règle ×10/boss (texte officiel
 * du jeu sur cette page wiki) est prolongée par EXTRAPOLATION — ce n'est pas
 * une valeur individuellement vérifiée boss par boss.
 *
 * Ré-investigation 2026-09-14 (cf. cloudflare/reference/README.md, section
 * "Boss au-delà de 160") : vérifié en HTML brut que le tableau du wiki
 * lui-même devient incohérent dès le boss 161 (Attaque/Défense/PV du boss161
 * dupliquent EXACTEMENT le boss159, boss162 duplique le boss160 — pas une
 * progression ×10), avec une anomalie supplémentaire isolée sur la colonne
 * Défense des boss165/166 (×10 en trop par rapport à Attaque/PV de la même
 * ligne) et une stagnation du boss178 (valeurs identiques au boss177). Le
 * tableau ne contient plus AUCUNE valeur Attaque/Défense/PV à partir du
 * boss184 (cellule vide, vérifié jusqu'au dernier boss de la page, le 301).
 * Conclusion : la toute première ligne après le boss 160 étant déjà
 * corrompue sur le wiki, il n'existe aucune ligne propre à partir de
 * laquelle étendre honnêtement NGU_BOSS_REFERENCE_V1 sans deviner une
 * correction non sourcée — l'extrapolation ×10/boss ci-dessous reste donc
 * la meilleure approximation documentée au-delà du boss 160, sciemment
 * divergente du wiki sur la plage 161-183 identifiée ci-dessus comme
 * anormale, et sans aucune donnée wiki disponible au-delà du boss 183.
 *
 * Ce module ne fournit QUE les stats numériques (pv/attaque/defense/xp).
 * Le nom, les pièces, la chance de loot, l'histoire et les capacités d'un
 * boss restent la propriété du catalogue SOREAL (identité visuelle/
 * textuelle SOREAL, cf. mission règle 9-10) — non touchés ici.
 *
 * Round 2 (2026-09-18) : vérifié que "respawn/cooldown" et "drops d'objet"
 * (demandés dans le sweep Fight Boss) n'existent tout simplement pas comme
 * mécanique NGU pour ce mode. Le template wiki {{Enemy}} (voir
 * design/parse-ngu-wiki.mjs, ENEMY_FIELD_KEYS) ne publie aucun champ
 * bf_respawn/bf_cooldown/bf_drop pour les 301 fiches du catalogue Fight
 * Boss — cohérent avec le jeu réel (l'équipement/loot n'existe QUE en
 * Adventure Mode, déjà documenté dans idle-sqlite-runtime.js,
 * statsCombatPrincipalSorealIdleV413_, audit du 2026-09-16). Rien à
 * corriger ici : ce ne sont pas des champs oubliés, juste des champs qui
 * n'existent pas pour ce mode.
 *
 * Audit 2026-09-13 (Norman, en jouant les deux jeux en parallèle) : le
 * champ `defense` était déjà extrait du wiki dans
 * cloudflare/reference/ngu-boss-reference-v1.json depuis le 2026-09-09,
 * mais jamais reporté dans NGU_BOSS_REFERENCE_V1 ni exposé par
 * nguBossStatsV1 — la Defense d'un boss n'existait donc nulle part côté
 * runtime. Cause racine confirmée d'un vrai bug de fidélité séparé : le
 * dégât du joueur contre le boss (client, Soreal_Idle_UI.html) ne
 * soustrayait jamais cette Defense (contrairement au wiki, page Attack :
 * "Your attack minus the defense of the boss is the amount you deduct
 * from the HP of the boss per second"), alors que le dégât du boss VERS
 * le joueur le faisait déjà correctement. Régénéré mécaniquement depuis
 * le JSON (jamais retranscrit à la main) — vérifié par script que les
 * 160 valeurs pv/attaque/xp déjà en place restaient identiques au bit
 * près avant d'ajouter defense.
 *
 * Audit exhaustif 2026-09-16 (Norman signale "plein d'erreurs dans les
 * chiffres") : ré-extraction complète et automatisée (via DOM, pas de
 * lecture manuelle) du tableau "Boss listing" sur
 * https://ngu-idle.fandom.com/wiki/Boss_Fights, boss 1 à 301. Bosses 1-8
 * confirmés identiques au bit près (nombres entiers pleins publiés tels
 * quels par le wiki, sans arrondi). À partir du boss 9, le wiki bascule en
 * notation abrégée à deux niveaux de précision différents sur la même
 * cellule : un libellé en unités ("4.062 B", "198.364 Qa"...) qui conserve
 * ~6 chiffres significatifs, et une parenthèse en notation scientifique
 * ("4.062E+09") tronquée à 4 chiffres significatifs. Les valeurs pv/
 * attaque/defense des boss 9 à 160 dans ce fichier avaient été calculées
 * à partir de cette parenthèse tronquée (ex. boss9 attaque = 4 062 000 000
 * au lieu de 4 062 500 000), une erreur d'environ 0,02% qui se composait
 * ensuite à chaque boss suivant via le multiplicateur ×5/×10 (donc présente,
 * à des degrés divers, sur les 152 entrées boss9-boss160). Corrigé en
 * recalculant chaque valeur en arithmétique exacte (BigInt) depuis les
 * bases boss1-4 confirmées ci-dessus et la règle officielle du wiki
 * ("×5 du boss5 au boss20, ×10 à partir du boss21", HP=10×Attaque) — vérifié
 * que le résultat correspond aux libellés en unités du wiki (les plus
 * précis) à 6 chiffres significatifs près pour un large échantillon
 * (boss9, boss20, etc.). xp (Exp Reward) déjà exact, non modifié : chaque
 * valeur boss1-160 re-comparée à la colonne "Exp Reward" du wiki, aucun
 * écart.
 *
 * Correctif 2026-09-16 (suite, Norman : "mon screenshot vient de NGU
 * IDLE lancé sur mon PC. Une toute nouvelle partie... la vérité ce sont
 * mes screenshots. Ils sont pris du jeu original.") : le boss 4 "A Small
 * Mouse" ci-dessus était FAUX malgré la vérification précédente — sourcé
 * du tableau récapitulatif "Boss listing" (1 300 000/700 000/13 000 000),
 * qui est en réalité en DÉSACCORD avec la fiche individuelle du wiki pour
 * ce boss précis (https://ngu-idle.fandom.com/wiki/A_Small_Mouse :
 * 1 100 000/600 000/11 000 000) — les deux pages du même wiki se
 * contredisent. Confirmé par capture d'écran RÉELLE du jeu original
 * (fournie par Norman, partie neuve) : les vraies valeurs sont bien
 * celles de la fiche individuelle. Corrigé en conséquence (index 3).
 *
 * Important : cette correction ne se propage PAS à boss5+ — vérifié en
 * direct que la fiche individuelle de "A Slightly Bigger Mouse" (boss 5,
 * https://ngu-idle.fandom.com/wiki/A_Slightly_Bigger_Mouse) affiche
 * 6 500 000/3 500 000/65 000 000, soit exactement ×5 de l'ANCIENNE valeur
 * boss4 (13 000 000), pas de la nouvelle (11 000 000×5=55 000 000). Ceci
 * est cohérent avec le texte officiel du wiki lui-même : la règle ×5/boss
 * ne s'applique QUE "du boss 5 au boss 20" — la transition boss3→boss4
 * (comme boss1→2→3) est une valeur individuellement conçue par les
 * développeurs, jamais une formule, donc aucune contradiction à ce que
 * boss4 diverge de ×5×boss3 sans que boss5+ n'en soit affecté. Seul
 * l'index 3 a été corrigé ; boss5-160 restent inchangés et déjà vérifiés.
 *
 * Round 2 (2026-09-18, reprise du sweep Fight Boss à partir du boss 3) —
 * DEUX vérifications indépendantes menées via le miroir local des vraies
 * pages wiki individuelles (C:\Users\n0rma\Documents\NGU-Wiki\pages, un
 * export MediaWiki réel, déjà utilisé comme source par
 * design/build-idle-boss-fight-real-names-v1.mjs -- jamais une page
 * inventée) :
 *
 * 1. Contre-vérification boss3-160 (158 index) : script one-off comparant
 *    pv/attaque/defense/xp de CHAQUE entrée ci-dessus à bf_hp/bf_power/
 *    bf_toughness/bf_exp de sa fiche {{Enemy}} individuelle (157/160 fiches
 *    disponibles avec ces champs -- boss92/115/116 seuls sans fiche
 *    individuelle exploitable). Résultat : 0 écart (tolérance 0,1%, pour
 *    absorber l'arrondi float des trés grandes valeurs) sur les 157 fiches
 *    -- confirme, depuis une source indépendante de la table agrégée
 *    "Boss listing" déjà utilisée en 2026-09-16, qu'aucune régression ne
 *    s'est introduite depuis.
 *
 * 2. Extension sourcée 161-190 (indices 160-189 ci-dessous) : la note du
 *    2026-09-14 documentait que le tableau AGRÉGÉ "Boss listing" devient
 *    incohérent dès le boss161 (valeurs dupliquées, colonnes vides) et
 *    concluait qu'aucune extension proprement sourcée n'était possible
 *    au-delà de 160. Cette conclusion portait sur la table agrégée
 *    uniquement -- 28 des 30 boss 161-190 ont en réalité leur PROPRE fiche
 *    {{Enemy}} individuelle (boss181 "The Slammer" et boss182 "Demonic
 *    Flurbie" exceptés : leur page dans le miroir local est une redirection
 *    cassée vers elle-même, aucun contenu récupérable), et ces fiches sont
 *    PROPRES (aucune duplication, progression ×10/boss strictement
 *    respectée bf_power161=1.984E+158 -> bf_power190=1.984E+187, à la
 *    précision 4 chiffres significatifs publiée par le template -- la
 *    seule précision disponible côté fiche individuelle, moins précise que
 *    le calcul exact ci-dessous mais rigoureusement cohérente avec lui).
 *    boss190 "TRUE FINAL BOSS" (ngu-idle.fandom.com/wiki/TRUE_FINAL_BOSS)
 *    est le DERNIER combat de la séquence à porter une fiche {{Enemy}}
 *    individuelle avec des champs bf_* renseignés -- boss191 "Small Bart"
 *    et tout ce qui suit n'ont plus aucune donnée bf_hp/bf_power/
 *    bf_toughness/bf_exp exploitable dans le miroir local, quelle que soit
 *    la page. Les entrées 161-190 ci-dessous sont donc désormais SOURCÉES
 *    (continuation exacte ×10/boss depuis boss160, confirmée par ces 28
 *    fiches), pas seulement extrapolées comme avant ce round -- même valeur
 *    numérique qu'avant (la formule d'extrapolation était déjà correcte),
 *    seul leur statut de traçabilité change. bf_exp n'est publié sur AUCUNE
 *    fiche individuelle au-delà du boss20 (vérifié, cf.
 *    NGU_BOSS_FTBE_BONUS_XP_V1 plus bas) : le xp de ces 30 entrées reste
 *    donc dérivé de la formule déjà confirmée (nguBossXpForBossNumberV1),
 *    jamais d'une valeur bf_exp individuelle (absente).
 *
 * Boss192-301 restent une extrapolation non individuellement sourcée
 * (aucune fiche wiki, individuelle ou agrégée, ne publie de stats à partir
 * de boss191) -- inchangé par ce round, toujours honnêtement documenté
 * comme tel par NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE ci-dessous.
 */

const NGU_BOSS_REFERENCE_V1 = [
  { pv: 500000, attaque: 50000, defense: 40000, xp: 0 },
  { pv: 1000000, attaque: 100000, defense: 90000, xp: 0 },
  { pv: 4000000, attaque: 400000, defense: 350000, xp: 0 },
  { pv: 11000000, attaque: 1100000, defense: 600000, xp: 1 }, /* jeu réel (capture) ; le tableau Boss Fights du wiki dit 1,3 M/700 k/13 M (formule par défaut du modèle) -- ne pas "corriger" */
  { pv: 65000000, attaque: 6500000, defense: 3500000, xp: 0 },
  { pv: 325000000, attaque: 32500000, defense: 17500000, xp: 0 },
  { pv: 1625000000, attaque: 162500000, defense: 87500000, xp: 1 },
  { pv: 8125000000, attaque: 812500000, defense: 437500000, xp: 1 },
  { pv: 40625000000, attaque: 4062500000, defense: 2187500000, xp: 1 },
  { pv: 203125000000, attaque: 20312500000, defense: 10937500000, xp: 1 },
  { pv: 1015625000000, attaque: 101562500000, defense: 54687500000, xp: 1 },
  { pv: 5078125000000, attaque: 507812500000, defense: 273437500000, xp: 1 },
  { pv: 25390625000000, attaque: 2539062500000, defense: 1367187500000, xp: 1 },
  { pv: 126953125000000, attaque: 12695312500000, defense: 6835937500000, xp: 1 },
  { pv: 634765625000000, attaque: 63476562500000, defense: 34179687500000, xp: 1 },
  { pv: 3173828125000000, attaque: 317382812500000, defense: 170898437500000, xp: 1 },
  { pv: 15869140625000000, attaque: 1586914062500000, defense: 854492187500000, xp: 1 },
  { pv: 79345703125000000, attaque: 7934570312500000, defense: 4272460937500000, xp: 1 },
  { pv: 396728515625000000, attaque: 39672851562500000, defense: 21362304687500000, xp: 1 },
  { pv: 1983642578125000000, attaque: 198364257812500000, defense: 106811523437500000, xp: 1 },
  { pv: 19836425781250000000, attaque: 1983642578125000000, defense: 1068115234375000000, xp: 1 },
  { pv: 198364257812500000000, attaque: 19836425781250000000, defense: 10681152343750000000, xp: 1 },
  { pv: 1.983642578125e+21, attaque: 198364257812500000000, defense: 106811523437500000000, xp: 1 },
  { pv: 1.983642578125e+22, attaque: 1.983642578125e+21, defense: 1.068115234375e+21, xp: 1 },
  { pv: 1.983642578125e+23, attaque: 1.983642578125e+22, defense: 1.068115234375e+22, xp: 1 },
  { pv: 1.983642578125e+24, attaque: 1.983642578125e+23, defense: 1.068115234375e+23, xp: 1 },
  { pv: 1.983642578125e+25, attaque: 1.983642578125e+24, defense: 1.068115234375e+24, xp: 1 },
  { pv: 1.983642578125e+26, attaque: 1.983642578125e+25, defense: 1.068115234375e+25, xp: 1 },
  { pv: 1.983642578125e+27, attaque: 1.983642578125e+26, defense: 1.068115234375e+26, xp: 1 },
  { pv: 1.983642578125e+28, attaque: 1.983642578125e+27, defense: 1.068115234375e+27, xp: 1 },
  { pv: 1.983642578125e+29, attaque: 1.983642578125e+28, defense: 1.068115234375e+28, xp: 1 },
  { pv: 1.983642578125e+30, attaque: 1.983642578125e+29, defense: 1.068115234375e+29, xp: 1 },
  { pv: 1.983642578125e+31, attaque: 1.983642578125e+30, defense: 1.068115234375e+30, xp: 1 },
  { pv: 1.983642578125e+32, attaque: 1.983642578125e+31, defense: 1.068115234375e+31, xp: 2 },
  { pv: 1.983642578125e+33, attaque: 1.983642578125e+32, defense: 1.068115234375e+32, xp: 2 },
  { pv: 1.983642578125e+34, attaque: 1.983642578125e+33, defense: 1.068115234375e+33, xp: 2 },
  { pv: 1.983642578125e+35, attaque: 1.983642578125e+34, defense: 1.068115234375e+34, xp: 2 },
  { pv: 1.983642578125e+36, attaque: 1.983642578125e+35, defense: 1.068115234375e+35, xp: 2 },
  { pv: 1.983642578125e+37, attaque: 1.983642578125e+36, defense: 1.068115234375e+36, xp: 2 },
  { pv: 1.983642578125e+38, attaque: 1.983642578125e+37, defense: 1.068115234375e+37, xp: 2 },
  { pv: 1.983642578125e+39, attaque: 1.983642578125e+38, defense: 1.068115234375e+38, xp: 2 },
  { pv: 1.983642578125e+40, attaque: 1.983642578125e+39, defense: 1.068115234375e+39, xp: 2 },
  { pv: 1.983642578125e+41, attaque: 1.983642578125e+40, defense: 1.068115234375e+40, xp: 2 },
  { pv: 1.983642578125e+42, attaque: 1.983642578125e+41, defense: 1.068115234375e+41, xp: 3 },
  { pv: 1.983642578125e+43, attaque: 1.983642578125e+42, defense: 1.068115234375e+42, xp: 3 },
  { pv: 1.983642578125e+44, attaque: 1.983642578125e+43, defense: 1.068115234375e+43, xp: 3 },
  { pv: 1.983642578125e+45, attaque: 1.983642578125e+44, defense: 1.068115234375e+44, xp: 3 },
  { pv: 1.983642578125e+46, attaque: 1.983642578125e+45, defense: 1.068115234375e+45, xp: 3 },
  { pv: 1.983642578125e+47, attaque: 1.983642578125e+46, defense: 1.068115234375e+46, xp: 3 },
  { pv: 1.983642578125e+48, attaque: 1.983642578125e+47, defense: 1.068115234375e+47, xp: 3 },
  { pv: 1.983642578125e+49, attaque: 1.983642578125e+48, defense: 1.068115234375e+48, xp: 3 },
  { pv: 1.983642578125e+50, attaque: 1.983642578125e+49, defense: 1.068115234375e+49, xp: 3 },
  { pv: 1.983642578125e+51, attaque: 1.983642578125e+50, defense: 1.068115234375e+50, xp: 3 },
  { pv: 1.983642578125e+52, attaque: 1.983642578125e+51, defense: 1.068115234375e+51, xp: 4 },
  { pv: 1.983642578125e+53, attaque: 1.983642578125e+52, defense: 1.068115234375e+52, xp: 4 },
  { pv: 1.983642578125e+54, attaque: 1.983642578125e+53, defense: 1.068115234375e+53, xp: 4 },
  { pv: 1.983642578125e+55, attaque: 1.983642578125e+54, defense: 1.068115234375e+54, xp: 4 },
  { pv: 1.983642578125e+56, attaque: 1.983642578125e+55, defense: 1.068115234375e+55, xp: 4 },
  { pv: 1.983642578125e+57, attaque: 1.983642578125e+56, defense: 1.068115234375e+56, xp: 4 },
  { pv: 1.983642578125e+58, attaque: 1.983642578125e+57, defense: 1.068115234375e+57, xp: 4 },
  { pv: 1.983642578125e+59, attaque: 1.983642578125e+58, defense: 1.068115234375e+58, xp: 4 },
  { pv: 1.983642578125e+60, attaque: 1.983642578125e+59, defense: 1.068115234375e+59, xp: 4 },
  { pv: 1.983642578125e+61, attaque: 1.983642578125e+60, defense: 1.068115234375e+60, xp: 4 },
  { pv: 1.983642578125e+62, attaque: 1.983642578125e+61, defense: 1.068115234375e+61, xp: 5 },
  { pv: 1.983642578125e+63, attaque: 1.983642578125e+62, defense: 1.068115234375e+62, xp: 5 },
  { pv: 1.983642578125e+64, attaque: 1.983642578125e+63, defense: 1.068115234375e+63, xp: 5 },
  { pv: 1.983642578125e+65, attaque: 1.983642578125e+64, defense: 1.068115234375e+64, xp: 5 },
  { pv: 1.983642578125e+66, attaque: 1.983642578125e+65, defense: 1.068115234375e+65, xp: 5 },
  { pv: 1.983642578125e+67, attaque: 1.983642578125e+66, defense: 1.068115234375e+66, xp: 5 },
  { pv: 1.983642578125e+68, attaque: 1.983642578125e+67, defense: 1.068115234375e+67, xp: 5 },
  { pv: 1.983642578125e+69, attaque: 1.983642578125e+68, defense: 1.068115234375e+68, xp: 5 },
  { pv: 1.983642578125e+70, attaque: 1.983642578125e+69, defense: 1.068115234375e+69, xp: 5 },
  { pv: 1.983642578125e+71, attaque: 1.983642578125e+70, defense: 1.068115234375e+70, xp: 5 },
  { pv: 1.983642578125e+72, attaque: 1.983642578125e+71, defense: 1.068115234375e+71, xp: 6 },
  { pv: 1.983642578125e+73, attaque: 1.983642578125e+72, defense: 1.068115234375e+72, xp: 6 },
  { pv: 1.983642578125e+74, attaque: 1.983642578125e+73, defense: 1.068115234375e+73, xp: 6 },
  { pv: 1.983642578125e+75, attaque: 1.983642578125e+74, defense: 1.068115234375e+74, xp: 6 },
  { pv: 1.983642578125e+76, attaque: 1.983642578125e+75, defense: 1.068115234375e+75, xp: 6 },
  { pv: 1.983642578125e+77, attaque: 1.983642578125e+76, defense: 1.068115234375e+76, xp: 6 },
  { pv: 1.983642578125e+78, attaque: 1.983642578125e+77, defense: 1.068115234375e+77, xp: 6 },
  { pv: 1.983642578125e+79, attaque: 1.983642578125e+78, defense: 1.068115234375e+78, xp: 6 },
  { pv: 1.983642578125e+80, attaque: 1.983642578125e+79, defense: 1.068115234375e+79, xp: 6 },
  { pv: 1.983642578125e+81, attaque: 1.983642578125e+80, defense: 1.068115234375e+80, xp: 6 },
  { pv: 1.983642578125e+82, attaque: 1.983642578125e+81, defense: 1.068115234375e+81, xp: 7 },
  { pv: 1.983642578125e+83, attaque: 1.983642578125e+82, defense: 1.068115234375e+82, xp: 7 },
  { pv: 1.983642578125e+84, attaque: 1.983642578125e+83, defense: 1.068115234375e+83, xp: 7 },
  { pv: 1.983642578125e+85, attaque: 1.983642578125e+84, defense: 1.068115234375e+84, xp: 7 },
  { pv: 1.983642578125e+86, attaque: 1.983642578125e+85, defense: 1.068115234375e+85, xp: 7 },
  { pv: 1.983642578125e+87, attaque: 1.983642578125e+86, defense: 1.068115234375e+86, xp: 7 },
  { pv: 1.983642578125e+88, attaque: 1.983642578125e+87, defense: 1.068115234375e+87, xp: 7 },
  { pv: 1.983642578125e+89, attaque: 1.983642578125e+88, defense: 1.068115234375e+88, xp: 7 },
  { pv: 1.983642578125e+90, attaque: 1.983642578125e+89, defense: 1.068115234375e+89, xp: 7 },
  { pv: 1.983642578125e+91, attaque: 1.983642578125e+90, defense: 1.068115234375e+90, xp: 7 },
  { pv: 1.983642578125e+92, attaque: 1.983642578125e+91, defense: 1.068115234375e+91, xp: 8 },
  { pv: 1.983642578125e+93, attaque: 1.983642578125e+92, defense: 1.068115234375e+92, xp: 8 },
  { pv: 1.983642578125e+94, attaque: 1.983642578125e+93, defense: 1.068115234375e+93, xp: 8 },
  { pv: 1.983642578125e+95, attaque: 1.983642578125e+94, defense: 1.068115234375e+94, xp: 8 },
  { pv: 1.983642578125e+96, attaque: 1.983642578125e+95, defense: 1.068115234375e+95, xp: 8 },
  { pv: 1.983642578125e+97, attaque: 1.983642578125e+96, defense: 1.068115234375e+96, xp: 8 },
  { pv: 1.983642578125e+98, attaque: 1.983642578125e+97, defense: 1.068115234375e+97, xp: 8 },
  { pv: 1.983642578125e+99, attaque: 1.983642578125e+98, defense: 1.068115234375e+98, xp: 8 },
  { pv: 1.983642578125e+100, attaque: 1.983642578125e+99, defense: 1.068115234375e+99, xp: 8 },
  { pv: 1.983642578125e+101, attaque: 1.983642578125e+100, defense: 1.068115234375e+100, xp: 8 },
  { pv: 1.983642578125e+102, attaque: 1.983642578125e+101, defense: 1.068115234375e+101, xp: 9 },
  { pv: 1.983642578125e+103, attaque: 1.983642578125e+102, defense: 1.068115234375e+102, xp: 9 },
  { pv: 1.983642578125e+104, attaque: 1.983642578125e+103, defense: 1.068115234375e+103, xp: 9 },
  { pv: 1.983642578125e+105, attaque: 1.983642578125e+104, defense: 1.068115234375e+104, xp: 9 },
  { pv: 1.983642578125e+106, attaque: 1.983642578125e+105, defense: 1.068115234375e+105, xp: 9 },
  { pv: 1.983642578125e+107, attaque: 1.983642578125e+106, defense: 1.068115234375e+106, xp: 9 },
  { pv: 1.983642578125e+108, attaque: 1.983642578125e+107, defense: 1.068115234375e+107, xp: 9 },
  { pv: 1.983642578125e+109, attaque: 1.983642578125e+108, defense: 1.068115234375e+108, xp: 9 },
  { pv: 1.983642578125e+110, attaque: 1.983642578125e+109, defense: 1.068115234375e+109, xp: 9 },
  { pv: 1.983642578125e+111, attaque: 1.983642578125e+110, defense: 1.068115234375e+110, xp: 9 },
  { pv: 1.983642578125e+112, attaque: 1.983642578125e+111, defense: 1.068115234375e+111, xp: 10 },
  { pv: 1.983642578125e+113, attaque: 1.983642578125e+112, defense: 1.068115234375e+112, xp: 10 },
  { pv: 1.983642578125e+114, attaque: 1.983642578125e+113, defense: 1.068115234375e+113, xp: 10 },
  { pv: 1.983642578125e+115, attaque: 1.983642578125e+114, defense: 1.068115234375e+114, xp: 10 },
  { pv: 1.983642578125e+116, attaque: 1.983642578125e+115, defense: 1.068115234375e+115, xp: 10 },
  { pv: 1.983642578125e+117, attaque: 1.983642578125e+116, defense: 1.068115234375e+116, xp: 10 },
  { pv: 1.983642578125e+118, attaque: 1.983642578125e+117, defense: 1.068115234375e+117, xp: 10 },
  { pv: 1.983642578125e+119, attaque: 1.983642578125e+118, defense: 1.068115234375e+118, xp: 10 },
  { pv: 1.983642578125e+120, attaque: 1.983642578125e+119, defense: 1.068115234375e+119, xp: 10 },
  { pv: 1.983642578125e+121, attaque: 1.983642578125e+120, defense: 1.068115234375e+120, xp: 10 },
  { pv: 1.983642578125e+122, attaque: 1.983642578125e+121, defense: 1.068115234375e+121, xp: 11 },
  { pv: 1.983642578125e+123, attaque: 1.983642578125e+122, defense: 1.068115234375e+122, xp: 11 },
  { pv: 1.983642578125e+124, attaque: 1.983642578125e+123, defense: 1.068115234375e+123, xp: 11 },
  { pv: 1.983642578125e+125, attaque: 1.983642578125e+124, defense: 1.068115234375e+124, xp: 11 },
  { pv: 1.983642578125e+126, attaque: 1.983642578125e+125, defense: 1.068115234375e+125, xp: 11 },
  { pv: 1.983642578125e+127, attaque: 1.983642578125e+126, defense: 1.068115234375e+126, xp: 11 },
  { pv: 1.983642578125e+128, attaque: 1.983642578125e+127, defense: 1.068115234375e+127, xp: 11 },
  { pv: 1.983642578125e+129, attaque: 1.983642578125e+128, defense: 1.068115234375e+128, xp: 11 },
  { pv: 1.983642578125e+130, attaque: 1.983642578125e+129, defense: 1.068115234375e+129, xp: 11 },
  { pv: 1.983642578125e+131, attaque: 1.983642578125e+130, defense: 1.068115234375e+130, xp: 11 },
  { pv: 1.983642578125e+132, attaque: 1.983642578125e+131, defense: 1.068115234375e+131, xp: 12 },
  { pv: 1.983642578125e+133, attaque: 1.983642578125e+132, defense: 1.068115234375e+132, xp: 12 },
  { pv: 1.983642578125e+134, attaque: 1.983642578125e+133, defense: 1.068115234375e+133, xp: 12 },
  { pv: 1.983642578125e+135, attaque: 1.983642578125e+134, defense: 1.068115234375e+134, xp: 12 },
  { pv: 1.983642578125e+136, attaque: 1.983642578125e+135, defense: 1.068115234375e+135, xp: 12 },
  { pv: 1.983642578125e+137, attaque: 1.983642578125e+136, defense: 1.068115234375e+136, xp: 12 },
  { pv: 1.983642578125e+138, attaque: 1.983642578125e+137, defense: 1.068115234375e+137, xp: 12 },
  { pv: 1.983642578125e+139, attaque: 1.983642578125e+138, defense: 1.068115234375e+138, xp: 12 },
  { pv: 1.983642578125e+140, attaque: 1.983642578125e+139, defense: 1.068115234375e+139, xp: 12 },
  { pv: 1.983642578125e+141, attaque: 1.983642578125e+140, defense: 1.068115234375e+140, xp: 12 },
  { pv: 1.983642578125e+142, attaque: 1.983642578125e+141, defense: 1.068115234375e+141, xp: 13 },
  { pv: 1.983642578125e+143, attaque: 1.983642578125e+142, defense: 1.068115234375e+142, xp: 13 },
  { pv: 1.983642578125e+144, attaque: 1.983642578125e+143, defense: 1.068115234375e+143, xp: 13 },
  { pv: 1.983642578125e+145, attaque: 1.983642578125e+144, defense: 1.068115234375e+144, xp: 13 },
  { pv: 1.983642578125e+146, attaque: 1.983642578125e+145, defense: 1.068115234375e+145, xp: 13 },
  { pv: 1.983642578125e+147, attaque: 1.983642578125e+146, defense: 1.068115234375e+146, xp: 13 },
  { pv: 1.983642578125e+148, attaque: 1.983642578125e+147, defense: 1.068115234375e+147, xp: 13 },
  { pv: 1.983642578125e+149, attaque: 1.983642578125e+148, defense: 1.068115234375e+148, xp: 13 },
  { pv: 1.983642578125e+150, attaque: 1.983642578125e+149, defense: 1.068115234375e+149, xp: 13 },
  { pv: 1.983642578125e+151, attaque: 1.983642578125e+150, defense: 1.068115234375e+150, xp: 13 },
  { pv: 1.983642578125e+152, attaque: 1.983642578125e+151, defense: 1.068115234375e+151, xp: 14 },
  { pv: 1.983642578125e+153, attaque: 1.983642578125e+152, defense: 1.068115234375e+152, xp: 14 },
  { pv: 1.983642578125e+154, attaque: 1.983642578125e+153, defense: 1.068115234375e+153, xp: 14 },
  { pv: 1.983642578125e+155, attaque: 1.983642578125e+154, defense: 1.068115234375e+154, xp: 14 },
  { pv: 1.983642578125e+156, attaque: 1.983642578125e+155, defense: 1.068115234375e+155, xp: 14 },
  { pv: 1.983642578125e+157, attaque: 1.983642578125e+156, defense: 1.068115234375e+156, xp: 14 },
  { pv: 1.983642578125e+158, attaque: 1.983642578125e+157, defense: 1.068115234375e+157, xp: 14 },
  // --- boss161-190 : Round 2 2026-09-18, sourcé via 28 fiches wiki
  // individuelles (voir commentaire de tête) ; boss181/182 sans fiche
  // exploitable mais encadrés des deux côtés par une progression ×10/boss
  // confirmée, donc conservés dans la continuité plutôt qu'isolés.
  { pv: 1.983642578125e+159, attaque: 1.983642578125e+158, defense: 1.068115234375e+158, xp: 14 },
  { pv: 1.983642578125e+160, attaque: 1.983642578125e+159, defense: 1.068115234375e+159, xp: 14 },
  { pv: 1.983642578125e+161, attaque: 1.983642578125e+160, defense: 1.068115234375e+160, xp: 14 },
  { pv: 1.983642578125e+162, attaque: 1.983642578125e+161, defense: 1.068115234375e+161, xp: 15 },
  { pv: 1.983642578125e+163, attaque: 1.983642578125e+162, defense: 1.068115234375e+162, xp: 15 },
  { pv: 1.983642578125e+164, attaque: 1.983642578125e+163, defense: 1.068115234375e+163, xp: 15 },
  { pv: 1.983642578125e+165, attaque: 1.983642578125e+164, defense: 1.068115234375e+164, xp: 15 },
  { pv: 1.983642578125e+166, attaque: 1.983642578125e+165, defense: 1.068115234375e+165, xp: 15 },
  { pv: 1.983642578125e+167, attaque: 1.983642578125e+166, defense: 1.068115234375e+166, xp: 15 },
  { pv: 1.983642578125e+168, attaque: 1.983642578125e+167, defense: 1.068115234375e+167, xp: 15 },
  { pv: 1.983642578125e+169, attaque: 1.983642578125e+168, defense: 1.068115234375e+168, xp: 15 },
  { pv: 1.983642578125e+170, attaque: 1.983642578125e+169, defense: 1.068115234375e+169, xp: 15 },
  { pv: 1.983642578125e+171, attaque: 1.983642578125e+170, defense: 1.068115234375e+170, xp: 15 },
  { pv: 1.983642578125e+172, attaque: 1.983642578125e+171, defense: 1.068115234375e+171, xp: 16 },
  { pv: 1.983642578125e+173, attaque: 1.983642578125e+172, defense: 1.068115234375e+172, xp: 16 },
  { pv: 1.983642578125e+174, attaque: 1.983642578125e+173, defense: 1.068115234375e+173, xp: 16 },
  { pv: 1.983642578125e+175, attaque: 1.983642578125e+174, defense: 1.068115234375e+174, xp: 16 },
  { pv: 1.983642578125e+176, attaque: 1.983642578125e+175, defense: 1.068115234375e+175, xp: 16 },
  { pv: 1.983642578125e+177, attaque: 1.983642578125e+176, defense: 1.068115234375e+176, xp: 16 },
  { pv: 1.983642578125e+178, attaque: 1.983642578125e+177, defense: 1.068115234375e+177, xp: 16 },
  { pv: 1.983642578125e+179, attaque: 1.983642578125e+178, defense: 1.068115234375e+178, xp: 16 },
  { pv: 1.983642578125e+180, attaque: 1.983642578125e+179, defense: 1.068115234375e+179, xp: 16 },
  { pv: 1.983642578125e+181, attaque: 1.983642578125e+180, defense: 1.068115234375e+180, xp: 16 },
  { pv: 1.983642578125e+182, attaque: 1.983642578125e+181, defense: 1.068115234375e+181, xp: 17 },
  { pv: 1.983642578125e+183, attaque: 1.983642578125e+182, defense: 1.068115234375e+182, xp: 17 },
  { pv: 1.983642578125e+184, attaque: 1.983642578125e+183, defense: 1.068115234375e+183, xp: 17 },
  { pv: 1.983642578125e+185, attaque: 1.983642578125e+184, defense: 1.068115234375e+184, xp: 17 },
  { pv: 1.983642578125e+186, attaque: 1.983642578125e+185, defense: 1.068115234375e+185, xp: 17 },
  { pv: 1.983642578125e+187, attaque: 1.983642578125e+186, defense: 1.068115234375e+186, xp: 17 },
  { pv: 1.983642578125e+188, attaque: 1.983642578125e+187, defense: 1.068115234375e+187, xp: 17 },
];

/*
 * Multiplicateur confirmé par boss au-delà de la table sourcée (règle
 * officielle : "×10 par boss à partir du boss 21", vérifiée exacte sur
 * toute la plage 21-190 dans NGU_BOSS_REFERENCE_V1 ci-dessus -- 21-160 via
 * la table agrégée "Boss listing" (2026-09-16), 161-190 via 28 fiches
 * wiki individuelles (Round 2, 2026-09-18, voir commentaire de tête).
 * Reste la meilleure approximation documentée pour boss191+, où plus
 * aucune fiche (individuelle ou agrégée) ne publie de stats.
 */
const NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE = 10;

/*
 * XP confirmée : palier +1 tous les 10 boss à partir du boss 34
 * (xp = floor((boss-34)/10)+2). Prolongée telle quelle au-delà du boss 190
 * — motif confirmé (y compris pour 161-190, cf. commentaire de tête :
 * bf_exp n'est publié sur aucune fiche individuelle au-delà du boss20), pas
 * individuellement vérifié au-delà de 190.
 */
function nguBossXpForBossNumberV1(bossNumber) {
  if (bossNumber < 34) {
    // Couvert exhaustivement par la table sourcée en dessous de 34.
    return 0;
  }
  return Math.floor((bossNumber - 34) / 10) + 2;
}

/*
 * Diviseur de combat Evil/SADISTIC (2026-09-18, Norman : "il faut tout
 * faire", fidélité Evil/Sadistic). Wiki NGU local, page "Evil difficulty"
 * section "Differences" : "Fight boss attack defense divided by 1
 * nonillion (1e30)" ; page "SADISTIC difficulty" section "Differences" :
 * "Fight boss attack/defense is divided by 1e30 compared to Normal (this
 * attack modifier is the same as Evil as of patch 1.110)" -- UN SEUL
 * diviseur, identique pour Evil et SADISTIC, jamais un second diviseur
 * cumulé. Ne s'applique qu'à attaque/defense ; pv reste dérivé de la règle
 * déjà vérifiée HP=Attaque×10 (donc mécaniquement divisé dans les mêmes
 * proportions), xp ne change jamais avec la difficulté (non documenté par
 * le wiki comme variant).
 */
const NGU_BOSS_EVIL_SADISTIC_DIVIDER_V1 = 1e30;

/*
 * HP Regen Fight Boss — valeurs du vrai jeu.
 *
 * Les fiches individuelles du wiki exposent bf_hp_regen. Les quatre
 * premiers boss sont des valeurs conçues séparément (40 / 90 / 350 / 170).
 * À partir du boss 5 la progression publiée suit ×5 jusqu'au boss 20,
 * puis ×10 par boss à partir du boss 21, comme le reste des stats Fight
 * Boss. Cette formule reproduit les valeurs publiées (ex. boss 5 = 1 000,
 * boss 20 ≈ 3.052e13, boss 190 ≈ 3.052e183) sans dépendre d'un champ
 * historique SOREAL ni de la Defense du boss.
 */
function nguBossHpRegenForBossNumberV1(bossNumber) {
  const n=Math.max(1,Math.floor(Number(bossNumber)||1));

  if(n===1)return 40;
  if(n===2)return 90;
  if(n===3)return 350;
  if(n===4)return 170;

  if(n<=20){
    return 1000*Math.pow(5,n-5);
  }

  return 30517578125000*Math.pow(10,n-20);
}

/*
 * Stats NGU sourcées/extrapolées pour un boss, par index 0-based (0 = boss
 * n°1, comme le paramètre `bossVaincus`/`n` déjà utilisé dans
 * idle-sqlite-runtime.js::definitionBossSorealIdle_). `difficulty` :
 * "normal" (défaut, compatible avec tous les appelants existants) /
 * "difficile" (Evil) / "extreme" (SADISTIC) -- voir
 * NGU_BOSS_EVIL_SADISTIC_DIVIDER_V1 ci-dessus.
 */
export function nguBossStatsV1(index, difficulty) {
  const i = Math.max(0, Math.floor(Number(index) || 0));
  const divider = difficulty === "difficile" || difficulty === "extreme"
    ? NGU_BOSS_EVIL_SADISTIC_DIVIDER_V1
    : 1;

  const bossNumber = i + 1;
  const regen =
    nguBossHpRegenForBossNumberV1(bossNumber) /
    divider;

  if (i < NGU_BOSS_REFERENCE_V1.length) {
    const ref = NGU_BOSS_REFERENCE_V1[i];
    return {
      pv: ref.pv / divider,
      attaque: ref.attaque / divider,
      defense: ref.defense / divider,
      regen: regen,
      xp: ref.xp
    };
  }

  const last = NGU_BOSS_REFERENCE_V1[NGU_BOSS_REFERENCE_V1.length - 1];
  const supplement = i - (NGU_BOSS_REFERENCE_V1.length - 1);

  return {
    pv: last.pv * Math.pow(NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE, supplement) / divider,
    attaque: last.attaque * Math.pow(NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE, supplement) / divider,
    defense: last.defense * Math.pow(NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE, supplement) / divider,
    regen: regen,
    xp: nguBossXpForBossNumberV1(bossNumber)
  };
}

export const NGU_BOSS_REFERENCE_COUNT_V1 = NGU_BOSS_REFERENCE_V1.length;

/*
 * Bonus XP "First Time Beaten Ever" (FTBE) — récompense ONE-TIME accordée
 * la toute première fois qu'un boss est vaincu par ce compte, EN PLUS de
 * l'XP normale (nguBossStatsV1(i).xp), jamais reversée aux tueries
 * suivantes (même run ou après une Renaissance).
 *
 * Sourcé le 2026-09-17 par Norman en visitant en direct les 20 fiches wiki
 * individuelles du catalogue SOREAL (ngu-idle.fandom.com/wiki/<NomBoss>),
 * croisé avec son propre test EN JEU RÉEL pour les deux premiers : boss 1
 * "La Palette Infernale" (A Simple Slime en VO) -> 2 XP FTBE, boss 2
 * "Le Pain Éternel" -> 3 XP FTBE. Les 18 valeurs suivantes proviennent des
 * mêmes fiches individuelles (pas du tableau récapitulatif "Boss listing",
 * qui ne documente pas ce bonus séparément).
 *
 * Ne couvre QUE les 20 boss du catalogue SOREAL. Au-delà (progression
 * infinie, definitionBossSorealIdle_ pour n >= catalogue.length), aucune
 * fiche wiki individuelle n'a été vérifiée pour ce bonus précis — plutôt
 * que d'inventer une extrapolation non sourcée (exactement l'erreur qui a
 * causé le bug XP corrigé le même jour, cf. NGU_BOSS_REFERENCE_V1 plus
 * haut), nguBossFtbeBonusXpV1 renvoie 0 au-delà de l'index 19 : ces boss
 * gardent leur XP normale à chaque kill, sans bonus première fois.
 *
 * Round 2 (2026-09-18) : confirmé que cette limite à 20 n'est pas une
 * simple absence de vérification mais un vrai plafond côté wiki. En
 * parcourant les 147 fiches {{Enemy}} du miroir local qui publient un
 * champ bf_exp (boss1 à ~155, cf. design/ngu-boss-fight-real-names-v1.json),
 * SEULES les 20 déjà connues portent l'annotation "(N first time
 * ever/beaten)" — à partir du boss21 (ex. "Blue Cheese"), bf_exp est un
 * simple nombre sans annotation FTBE (vérifié en direct sur plusieurs
 * fiches, ex. boss21-40). Aucune extension n'est donc possible sans
 * deviner une magnitude non publiée — ce plafond reste correct.
 */
const NGU_BOSS_FTBE_BONUS_XP_V1 = Object.freeze([
  2, 3, 4, 10, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3
]);

export function nguBossFtbeBonusXpV1(index) {
  const i = Math.max(0, Math.floor(Number(index) || 0));
  return i < NGU_BOSS_FTBE_BONUS_XP_V1.length
    ? NGU_BOSS_FTBE_BONUS_XP_V1[i]
    : 0;
}
