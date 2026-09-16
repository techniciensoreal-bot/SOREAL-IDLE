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
 */

const NGU_BOSS_REFERENCE_V1 = [
  { pv: 500000, attaque: 50000, defense: 40000, xp: 0 },
  { pv: 1000000, attaque: 100000, defense: 90000, xp: 0 },
  { pv: 4000000, attaque: 400000, defense: 350000, xp: 0 },
  { pv: 13000000, attaque: 1300000, defense: 700000, xp: 1 },
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
];

/*
 * Multiplicateur confirmé par boss au-delà de la table sourcée (règle
 * officielle : "×10 par boss à partir du boss 21", vérifiée exacte sur
 * toute la plage 21-160 dans NGU_BOSS_REFERENCE_V1 ci-dessus).
 */
const NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE = 10;

/*
 * XP confirmée : palier +1 tous les 10 boss à partir du boss 34
 * (xp = floor((boss-34)/10)+2). Prolongée telle quelle au-delà du boss 160
 * — motif confirmé, pas individuellement vérifié au-delà de 160.
 */
function nguBossXpForBossNumberV1(bossNumber) {
  if (bossNumber < 34) {
    // Couvert exhaustivement par la table sourcée en dessous de 34.
    return 0;
  }
  return Math.floor((bossNumber - 34) / 10) + 2;
}

/*
 * Stats NGU sourcées/extrapolées pour un boss, par index 0-based (0 = boss
 * n°1, comme le paramètre `bossVaincus`/`n` déjà utilisé dans
 * idle-sqlite-runtime.js::definitionBossSorealIdle_).
 */
export function nguBossStatsV1(index) {
  const i = Math.max(0, Math.floor(Number(index) || 0));

  if (i < NGU_BOSS_REFERENCE_V1.length) {
    return NGU_BOSS_REFERENCE_V1[i];
  }

  const last = NGU_BOSS_REFERENCE_V1[NGU_BOSS_REFERENCE_V1.length - 1];
  const supplement = i - (NGU_BOSS_REFERENCE_V1.length - 1);
  const bossNumber = i + 1;

  return {
    pv: last.pv * Math.pow(NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE, supplement),
    attaque: last.attaque * Math.pow(NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE, supplement),
    defense: last.defense * Math.pow(NGU_BOSS_MULTIPLIER_BEYOND_REFERENCE, supplement),
    xp: nguBossXpForBossNumberV1(bossNumber)
  };
}

export const NGU_BOSS_REFERENCE_COUNT_V1 = NGU_BOSS_REFERENCE_V1.length;
