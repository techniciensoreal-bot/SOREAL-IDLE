# Money Pit : ce que dit le code du jeu (build 1260, lu le 2026-11-16)

Source : `PitController::oneTossReward` (id 1589) et `tier1Reward` … `tier16Reward` (ids 1592 à 1607), `Assembly-CSharp.dll`, avec `cloudflare/tools/banc-vrai-jeu/lecteur-il.mjs`.

## Palier
`n = max(1, floor(log10(Or jeté)))`. AP versés = `n` (avant tout), puis : n < 5 : rien. n < 7 : palier 1 ; < 9 : 2 ; < 11 : 3 ; < 13 : 4 ; < 15 : 5 ; < 18 : 6 ; < 21 : 7 ; < 24 : 8 ; < 27 : 9 ; < 30 : 10. Au-dessus : palier 11 si le souhait n°4 est au niveau 0, sinon < 50 : 11, < 55 : 12, < 60 : 13, < 65 : 14, < 70 : 15, sinon 16. (Le moteur a déjà les paliers 1 à 11 aux mêmes seuils.)

## Tirage : UN entier uniforme (`Random.Range(1, N)`), chaque cas = UN lot
Un lot = un seul effet ; Puissance et Robustesse sont deux lots SÉPARÉS (le moteur actuel les verse ensemble : écart).

| Palier | Tirage | Cas (un lot chacun) |
|---|---|---|
| 1 | 1 à 8 | 3 objets (boosts id 1, 14, 27), +1 Puissance, +1 Robustesse, +10 PV, +0,1 régén., (8) rien |
| 2 | 1 à 9 | 3 objets (ids 2?, 15, 28), 1 niveau d'équipement au hasard, +1 EXP, +2 Puissance, +2 Robustesse, +20 PV, +0,2 régén. |
| 3 | 1 à 9 | idem, ids …, 16, 29, EXP 2, +5 / +5, +50 PV, +0,5 régén. |
| 4 | 1 à 9 | idem, ids …, 17, 30 ; 2 niveaux d'équipement ; EXP 3 ; +10 / +10 ; +75 PV ; +1 régén. |
| 5 | 1 à 10 | Cube +5 Puissance, Cube +5 Robustesse, Cube +3 et +3, niveau d'équipement (tous), EXP 10, graines 10, +20 / +20, +150 PV, +1,5 régén. |
| 6 | 1 à 11 | Cube 10 / 10 / 5+5, niveau d'équipement (tous), EXP 25, graines 25, +50 / +50, +200 PV, +2 régén., Wandoos +1 (plafond 20) |
| 7 | 1 à 12 | Cube 20 / 20 / 10+10, niveaux, EXP 25, graines 100, +100 / +100, +300 PV, +3 régén., Wandoos 50 + un 12e cas « niveaux » |
| 8 | 1 à 12 | Cube 50 / 50 / 25+25, niveaux, EXP 200, graines 200, +150 / +150, +450 PV, +5 régén., Wandoos (100, x2), niveaux |
| 9 | 1 à 12 | Cube 100 / 100 / 50+50, EXP 300, graines 300, +200 / +200, +700 PV, +6 régén., Wandoos (100, x2), niveaux |
| 10 | 1 à 12 | Cube 150 / 150 / 75+75, EXP 400, graines 500, +250 / +250, +750 PV, +7,5 régén., Wandoos (100, x2), niveaux |
| 11 | 1 à 12 | Cube 200 / 200 / 100+100, EXP 500, graines 700, +300 / +300, +900 PV, +9 régén., Wandoos (100, x3), niveaux |
| 12 à 16 | 1 à 5 | « pilule » +0,20 / 0,25 / 0,30 / 0,35 / 0,40 aux stats d'Aventure, niveaux, EXP 2500 / 3000 / 3500 / 4000 / 5000, graines (0,02 à 0,04 x …), rien |

À vérifier avant de recoder : les ids d'objets des paliers 2 à 4, la formule des graines des paliers 12-16, le sens exact de `randomLevelUp` (un accessoire équipé au hasard, +1 niveau, jusqu'à 100) et `allLevelUp`, et si le Wandoos du palier 6 à 11 est bien « +niveau avec plafond ».

## Écart avec le moteur actuel (`idle-ngu-snapshot.js`, `IDLE_MONEY_PIT_REWARDS_V1`)
- Puissance et Robustesse versées ENSEMBLE (`adventureStats`) : dans le jeu, deux lots distincts, donc deux fois plus de lots dans le tirage.
- Boosts : 3 cas sur 8 (palier 1) ou 9 (paliers 2 à 4), pas un seul lot.
- Cas « rien » (palier 1) et lots « niveaux d'équipement » absents du tirage.
- Paliers 12 à 16 absents.
Rien de ceci n'est encore corrigé : le niveau d'équipement exige de modéliser `Equipment::levelUp` (stats par niveau des accessoires équipés).
