# Progression hors ligne : SOREAL IDLE comparé à NGU Idle (2026-09-24, mis à jour le 2026-09-29)

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
| Basic Training | oui | oui, plafonné à **30 jours** depuis le 2026-09-27 (aligné) | conforme (corrigé) |
| ITOPOD hors ligne | oui, sans y être ; ≥ 650 Power | oui depuis le 2026-09-27, dès que `towerHitsV1(power,idleBonus,0)<=1` (= 650 Power) | conforme (corrigé) |
| Drops MacGuffin de l'ITOPOD (perk) hors ligne | oui, placés dans l'inventaire au retour | confirmé le 2026-09-27 : `macguffinOnItopodKillsV1` dépose bien dans l'inventaire | conforme |
| **Titans en Auto-Kill hors ligne** | oui, sans butin | présent depuis le 2026-09-27 (`advanceTitanAutoKillV1`), sans butin | conforme (corrigé) |
| Butin d'Aventure hors ligne | jamais | **changement de règle voulu par Norman (2026-09-29)**, voir suivi 6 : farm automatique de la dernière zone de combat, plafonné 8h / 70% de l'inventaire, mort réelle possible | écart **assumé**, pas un manque (Norman : « je veux changer une règle par rapport à NGU IDLE ») |
| Butin de boss principal hors ligne | n'existe pas | **existait** (tirage d'objet à chaque victoire, y compris quand le serveur résout un combat en cours) | corrigé aujourd'hui : plus aucun objet de boss (voir `WORKLOG.md`) |
| Combat de boss principal en cours à la fermeture | non documenté | le serveur continue le combat jusqu'à sa fin (victoire ou défaite) puis s'arrête sur le boss suivant | à confirmer par Norman en jouant les deux jeux |
| Boost du Cube de l'infini hors ligne | oui, aucune formule publiée | **absent** du rattrapage | manque, bloqué par « pas de valeur inventée » (voir point 4 ci-dessous) |
| Anciennes mécaniques (AUTO-Aventure hors ligne, mana) | n'existent pas | code présent mais désactivé (`LEGACY_DISABLED`) | à supprimer (voir `AUDIT-CHIFFRES.md`) |
| Plafond de rattrapage hors ligne de Basic Training | aucun publié | **corrigé (2026-09-27)** : aligné sur 30 jours comme les autres systèmes (`EARLY_GAME_MAX_OFFLINE_SECONDS`), au lieu des 12 h inventées | conforme (par cohérence interne, faute de source) |

## Suivi (2026-09-27, Norman : « traite le point 1, ensuite 2, ensuite 3 et termine avec le 4 »)

1. **Fait** — Titans en Auto-Kill hors ligne : réglage `autoKillTitansEnabled` (adventure), rattrapage à chaque
   `syncIdleNguState` (en ligne et hors ligne, comme le décrit le wiki). Seuils AutoKillP/AutoKillT/AutoKillKills
   ajoutés à chaque titan (source : sa page wiki, ligne « AutoKill »), alternative « N kills à cette difficulté »
   pour Exile/IT HUNGERS/ROCK LOBSTER/AMALGAMATE (nouveau suivi par difficulté). Walderp réservé au joueur ayant
   déjà vaincu sa forme finale manuellement (le butin garanti de cette 1re victoire n'est jamais accordé par
   Auto-Kill). Aucun objet ne tombe (or/EXP/AP/PP/QP seulement, wiki : « no items drop while you are offline »).
   Non modélisé (limitations documentées, pas des manques accidentels) : la croissance de force de 1 % par
   attaque du titan, et le seuil « Health Regen » associé à certains paliers AutoKill — SOREAL ne modélise déjà
   pas ces mécaniques pour les combats Manual/Idle non plus. Voir `advanceTitanAutoKillV1`
   (`cloudflare/src/idle-adventure-v47.js`), test `idle-titan-autokill-offline.test.mjs`.
2. **Fait** — ITOPOD hors ligne sans être actif : `tower.active` ne conditionne plus la progression, seulement le
   choix/suivi d'un intervalle de niveaux à l'écran. Le seuil « 650 Power » du wiki n'est pas dupliqué en dur :
   c'est exactement la condition déjà utilisée pour l'étage optimal (`towerHitsV1(power, idleBonus, 0) <= 1`,
   « tuer l'étage 1 en un coup »). Voir `advanceTowerV1`, test `idle-itopod-passive-offline.test.mjs`.
3. **Fait** — Basic Training : plafond aligné sur 30 jours (`EARLY_GAME_MAX_OFFLINE_SECONDS`), comme tous les
   autres systèmes ; l'ancien plafond de 12 h n'avait aucune source wiki. Test
   `idle-basic-training-offline-cap-30-days.test.mjs`.
4. **Non fait — bloqué par la règle « pas de valeur inventée »** : Cube de l'infini calculé hors ligne. Recherché
   à nouveau le 2026-09-27 (page « Infinity Cube » du miroir local, section Boost) : AUCUNE formule ni aucun
   nombre n'y est publié. La seule mention retrouvée est une ligne d'un ancien changelog (`Build History`) :
   « Added offline Infinity Cube boost calculations! When you go offline, *MATH* will be done to give you some
   extra boost to your Infinity cube when you come back. » — volontairement vague, sans le moindre détail
   chiffrable. Implémenter ce point demanderait d'inventer un taux/une formule, ce qui contredit directement la
   règle du projet (« pas de valeur de jeu inventée, wiki d'abord »). Reste un écart confirmé, documenté, sans
   solution tant qu'aucune source wiki chiffrée n'est trouvée — à rouvrir si Norman retrouve une page ou une
   vidéo qui donne le taux réel.
5. Vérifié en passant (2026-09-27, aucun correctif nécessaire) : les MacGuffins de l'ITOPOD (perk dédié) sont bien
   déposés dans l'inventaire dès qu'ils tombent hors ligne (`macguffinOnItopodKillsV1` → `dropRandom`/`addDrop` →
   `data.inventory.push(frag)`). Le point « à vérifier » de l'audit du 24/09 est donc résolu : ce n'était pas un
   manque.
6. **Fait (2026-09-29)** — Farm automatique de zone d'Aventure hors ligne, changement de règle EXPLICITEMENT
   demandé par Norman (« J'aimerais changer une règle par rapport à NGU IDLE... le mode aventure tourne même le
   jeu fermé »), donc un écart **voulu**, pas une divergence accidentelle avec le wiki (contrairement aux autres
   lignes de ce tableau, qui visent la conformité). Contraintes fixées par Norman en clarification directe :
   8h de farm hors ligne maximum, jamais plus de 70% de l'inventaire rempli par ce farm (toujours une place pour
   le butin de titan etc.), zone ciblée = `lastCombatZone`, combat réellement calculé (mort possible, avec le
   monstre/la zone lisibles dans le journal de combat à la reconnexion).
   Premier essai (Beta 6.3) construit par erreur sur l'ancien simulateur LEGACY (`idle-sqlite-runtime.js`,
   `j.aventure`, zones à ID numérique) : un système jamais utilisé par aucun joueur réel, dont le déclencheur
   n'était d'ailleurs jamais activé nulle part dans le code — entièrement inerte, symptôme signalé par Norman
   (« Je ne loot pas en étant hors ligne »). Reconstruit sur le VRAI système (`state.adventure`,
   `IDLE_ADVENTURE_ZONES`, `rollKill`) : `advanceAdventureZoneAutoFarmOfflineV1`
   (`cloudflare/src/idle-adventure-v47.js`), câblé dans `advanceLateSystems`
   (`cloudflare/src/idle-ngu-progression.js`) derrière un seuil de 5 minutes (empêche un double calcul pendant
   une partie EN LIGNE, où le client simule déjà le combat en temps réel).
   Simplification assumée et documentée (même principe que la croissance de force des titans, non modélisée par
   `advanceTitanAutoKillV1`) : le combat de zone réel est CLIENT-autoritaire pour le timing exact coup par coup
   (aucun client ne tourne hors ligne) — ce simulateur reproduit donc les mêmes formules de dégâts/intervalles que
   `Soreal_Idle_UI.html`, mais résout chaque combat analytiquement (temps jusqu'à 0 PV, avec régénération) plutôt
   que coup par coup avec le facteur aléatoire (0,8-1,2) par coup, remplacé par sa moyenne — jamais une valeur de
   jeu inventée (Power, Toughness, PV, régénération, butin restent exactement les vraies formules déjà sourcées
   ailleurs dans ce fichier), seulement une méthode de résolution différente pour rester bornée en CPU sur
   potentiellement des centaines de combats simulés en une seule reconnexion. Tests :
   `idle-adventure-offline-farm-limits-v1.test.mjs`, `idle-adventure-auto-defeat-log-v1.test.mjs`.
