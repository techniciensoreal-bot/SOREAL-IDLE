# Progression hors ligne : SOREAL IDLE comparé à NGU Idle (2026-09-24)

Question de Norman : « Est-ce que la manière dont le jeu fonctionne quand il est fermé correspond à celle de NGU ? Je sais qu'on tue les titans, ou
qu'on a certains loots, en étant hors ligne. » Sources : miroir local du wiki (pages *Inventory*, *Adventure Mode*, *Titans*, *Build History* 2018,
*Perk Points*, *New Player Guide (Truth)*, *Challenges*, *Boost*, *Advanced Guide*) et le code (`advanceIdleNguState`, `idle-ngu-progression.js`).

## Ce que dit le wiki

1. **Le butin ne tombe qu'en ligne** (*Inventory*) : « loot only drops while online », **sauf** les drops de MacGuffin de l'ITOPOD avec le perk
   « MacGuffin ITOPOD Drops », calculés rétroactivement au prochain lancement et placés dans l'inventaire.
2. **Titans** (*Titans*, *Adventure Mode*, *New Player Guide*) : avec le réglage « Automatically Kill Titans » et les stats requises **avant** la
   fermeture, ils sont tués hors ligne dès que le temps de recharge est écoulé ; « no items drop while you are offline » ; l'EXP, l'AP et depuis
   THE BEAST un peu de PP sont accordés (*Build History*).
3. **ITOPOD** (*Build History*, build .398) : la progression hors ligne a lieu **sans être dans l'ITOPOD** au moment de fermer ; il faut l'ITOPOD
   débloqué et 650 de Power d'Aventure au total (tuer l'étage 1 en un coup) ; les kills donnent EXP (dès l'étage 1) et AP, et comptent pour
   Red Liquid.
4. Autres systèmes qui progressent hors ligne : Basic Training (perk « Double Basic Training »), NGU Energy et Magic, Blood Magic, Wishes, Beards
   (« still run offline »), Daily Spin, Questing (idle), Cube de l'infini (boost calculé hors ligne), Yggdrasil, Hacks.
5. **Défis sans hors-ligne** : 24 Hour, 100 Level et Troll (*Challenges*).
6. Autres détails : Boost Recycling n'agit pas sur la progression de boost hors ligne (*Boost*) ; les potions Delta ne fonctionnent pas hors ligne
   (*New Player Guide*). Aucune page ne donne de **durée maximale** de rattrapage.

## Ce que fait SOREAL IDLE

| Élément | NGU (wiki) | SOREAL | Écart |
|---|---|---|---|
| Énergie, Magie, Augmentations, Advanced Training, Time Machine, Blood Magic, Yggdrasil, Wandoos, NGU, Beards, Hacks, Wishes, Money Pit / Daily Spin, Cooking, Cards, Daycare, Questing, Auto Merge / Auto Boost (minuteurs) | oui | oui : un seul rattrapage commun `advanceIdleNguState` (temps écoulé depuis la dernière synchronisation) | conforme ; plafond **30 jours** (le wiki n'en donne pas) |
| Défis 24 Hour / 100 Levels / Troll | pas de hors-ligne | rattrapage plafonné à 60 s | conforme |
| Basic Training | oui | oui, mais **plafonné à 12 h** (`PROGRESSION_HORS_LIGNE_MAX_SECONDES`) | écart : plafond inventé, différent des autres systèmes |
| ITOPOD hors ligne | oui, sans y être ; ≥ 650 Power | oui, mais seulement si l'ITOPOD est **actif** (`tower.active`) | écart : NGU ne demande pas d'y être au moment de fermer |
| Drops MacGuffin de l'ITOPOD (perk) hors ligne | oui, placés dans l'inventaire au retour | compteur MacGuffin alimenté par les kills (`macguffinOnItopodKillsV1`) | à vérifier : dépôt effectif dans l'inventaire |
| **Titans en Auto-Kill hors ligne** | oui, sans butin | **absent** : l'Auto-Kill est « hors périmètre » (`idle-adventure-v47.js`) | manque |
| Butin d'Aventure hors ligne | jamais | l'Aventure est pilotée par le client (rien hors ligne) | conforme |
| Butin de boss principal hors ligne | n'existe pas | **existait** (tirage d'objet à chaque victoire, y compris quand le serveur résout un combat en cours) | corrigé aujourd'hui : plus aucun objet de boss (voir `WORKLOG.md`) |
| Combat de boss principal en cours à la fermeture | non documenté | le serveur continue le combat jusqu'à sa fin (victoire ou défaite) puis s'arrête sur le boss suivant | à confirmer par Norman en jouant les deux jeux |
| Boost du Cube de l'infini hors ligne | oui | **absent** du rattrapage | manque |
| Anciennes mécaniques (AUTO-Aventure hors ligne, mana) | n'existent pas | code présent mais désactivé (`LEGACY_DISABLED`) | à supprimer (voir `AUDIT-CHIFFRES.md`) |

## Proposition (rien de ce qui suit n'est fait)

1. Titans en Auto-Kill hors ligne : ajouter le réglage et le rattrapage (EXP / AP / PP, aucun objet) — demande les stats minimales de chaque titan
   (déjà dans le miroir : pages de titans et *Adventure Mode*).
2. ITOPOD hors ligne sans être actif : lever la condition `tower.active` et exiger 650 de Power d'Aventure.
3. Aligner le plafond de Basic Training sur celui des autres systèmes (ou trouver la source d'un plafond réel).
4. Cube de l'infini : boost calculé hors ligne.
5. Vérifier le dépôt des MacGuffins de l'ITOPOD dans l'inventaire au retour.
