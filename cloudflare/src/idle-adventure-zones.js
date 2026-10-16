/*
 * Aventure : zones, monstres, bestiaire et Titans (données) (audit d'architecture, 2026-10-16 : découpage de idle-adventure-v47.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { H } from "./idle-adventure-base.js";

/*
 * Correctif 2026-09-14 (Norman : "les mobs n'ont pas les mêmes PV. Nous
 * non plus d'ailleurs") — champ oneHitP ajouté à chaque zone de combat,
 * sourcé de https://ngu-idle.fandom.com/wiki/Adventure_Mode, colonne
 * "One Hit P" du tableau de zones (vérifié en direct au navigateur
 * 2026-09-14) : c'est le Power exact nécessaire pour tuer un ennemi
 * normal de cette zone EN UN SEUL coup — la vraie valeur de "PV" d'un
 * monstre normal côté wiki, jamais publiée comme telle mais définie sans
 * ambiguïté par le wiki lui-même. Remplace l'ancien proxy `t` (Manual
 * Toughness, qui sert à tout autre chose : le seuil de survie du JOUEUR,
 * pas les PV du monstre) utilisé par erreur comme pool de PV monstre
 * dans monsterHpMaxForZoneV1 — d'où l'écart signalé (Tutorial: t=10 vs
 * la vraie valeur wiki 129.5, plus de 10x d'écart, et l'écart grandit
 * avec chaque zone). Safety Zone n'a aucun combat (oneHitP absent,
 * jamais utilisé). Ancient Battlefield : le wiki précise "with the
 * Spoopy (set) bonus" sur cette ligne — seule valeur disponible,
 * conservée telle quelle et documentée comme potentiellement gonflée par
 * un bonus d'équipement plutôt qu'un pur PV de base.
 */
/*
 * Idle P/T (2026-09-18, Norman en chat : demande directe d'implémenter ce
 * troisième nombre du wiki, jamais fait jusqu'ici) -- champs idleP/idleT
 * ajoutés à chaque zone de combat, sourcés de
 * https://ngu-idle.fandom.com/wiki/Adventure_Mode, colonne "Idle P/T" du
 * tableau de zones (vérifié en direct au navigateur 2026-09-18). Le wiki
 * définit exactement ce que mesure ce nombre, en toutes lettres au-dessus
 * du tableau : "Idle values indicate minimum toughness to maintain about
 * 90% health and enough Power to kill any exploder" -- le seuil minimum
 * pour laisser la zone tourner sans surveillance (AFK / Auto Aventure)
 * sans mourir, distinct de Manual P/T (survie en combat manuel cliqué,
 * z.p/z.t) et de One Hit P (one-shot un ennemi normal, z.oneHitP déjà en
 * place depuis le 2026-09-14).
 *
 * À partir de Chocolate World (zone 22) et pour toutes les zones Evil/
 * Sadistic, le wiki publie DEUX valeurs Idle P/T selon un toggle "Beast
 * Mode ON/OFF" -- bonus du set Fad ("+3 Beast Butters", voir commentaire
 * fad{} dans SETS plus bas), mécanique confirmée réelle mais jamais
 * construite chez SOREAL. idleP/idleT ci-dessous reprennent SYSTÉMATIQUEMENT
 * la valeur "Beast Mode OFF" (l'état par défaut, sans un bonus que SOREAL
 * ne modélise pas) -- jamais "Beast Mode ON", qui décrirait un état
 * inatteignable ici.
 *
 * Trois zones ont une valeur Idle P/T génuinement ambiguë entre plusieurs
 * lectures/pages wiki EN DIRECT (pas une extrapolation) -- conformément à
 * la règle n°1 d'AGENTS.md, aucun nombre de repli n'est inventé ; le champ
 * concerné est simplement omis pour cette zone :
 * - beardverse : la table agrégée affiche Idle Toughness "2 M" avec son
 *   propre repli scientifique "(2E6)" (les deux cohérents entre eux), mais
 *   la page dédiée https://ngu-idle.fandom.com/wiki/The_Beardverse affiche
 *   "1.7 M (1.7E+06)" pour la même case -- désaccord réel entre deux pages
 *   wiki, jamais tranché ici (idleT omis). idleP=2 500 000 reste ajouté :
 *   la page dédiée confirme cette valeur, la table agrégée elle-même étant
 *   déjà incohérente en interne ("3 M" affiché contre "(2.5E6)" entre
 *   parenthèses sur la même ligne).
 * - typozone : Idle Power affiché "370 Qi" mais repli scientifique
 *   "(2.7E20)" -- 370 Qi vaudrait 3,7E20, pas 2,7E20, un écart de plus de
 *   25% (pas un simple arrondi, comparer aux écarts <10% tolérés ailleurs
 *   sur cette table, ex. badly: "35 M" affiché contre "(3.7E7)" entre
 *   parenthèses). idleP omis, idleT (accord parfait "240 Qi"/"2.4E20")
 *   conservé.
 * - construction : la table agrégée affiche Idle Power "113 No" en texte
 *   mais "(1.45E32)" entre parenthèses (deux nombres différents dans LA
 *   MÊME cellule), et la page dédiée
 *   https://ngu-idle.fandom.com/wiki/Construction_Zone donne une TROISIÈME
 *   valeur, "125.90 No (1.26E+32)" -- trois sources, trois nombres
 *   différents pour Idle Power (et Toughness diverge pareillement). idleP/
 *   idleT omis entièrement pour cette zone plutôt que de choisir
 *   arbitrairement l'une des trois.
 *
 * Walderp (t5) et The Exile (t7, "Ninth Titan" du wiki) n'ont AUCUNE valeur
 * Idle P/T publiée -- voir le commentaire dédié au-dessus de
 * IDLE_ADVENTURE_TITANS.
 */
/*
 * Correctif 2026-09-15 (Norman : "on tombe uniquement sur le boss...
 * l'ennemi qu'on rencontre doit être aléatoire... recopie les
 * pourcentages") — bossChance ajouté par zone, sourcé de la section
 * "Enemies" / "Boss chance X/Y" de la page wiki NGU DE CHAQUE ZONE
 * (vérifié en direct au navigateur le 2026-09-15, jamais une valeur
 * universelle devinée) : ce ratio n'est PAS le même partout (18,75% à
 * Cave contre 25% à Tutorial/Sewers/2D/Ancient/AVSP) — un premier
 * correctif avait à tort figé 25% pour toutes les zones. safe n'a aucun
 * combat (bossChance absent, jamais utilisé, startZoneFight rejette
 * cette zone explicitement).
 */
export const IDLE_ADVENTURE_ZONES=Object.freeze([
{id:"safe",name:"Zone sûre",boss:4,p:0,t:0,set:"",dropLevel:0,avatarLevel:1},
{id:"tutorial",name:"Zone Tutoriel",boss:4,p:10,t:10,oneHitP:129.5,idleP:13,idleT:13,bossChance:1/4,set:"training",dropLevel:10,avatarLevel:1},
{id:"sewers",name:"Égouts",boss:7,p:12,t:12,oneHitP:194,idleP:21,idleT:21,bossChance:1/4,set:"sewers",dropLevel:4,avatarLevel:1},
{id:"forest",name:"Forêt",boss:17,p:35,t:35,oneHitP:1134,idleP:53,idleT:53,bossChance:2/9,set:"forest",dropLevel:1,avatarLevel:2},
{id:"cave",name:"Grotte aux multiples choses",boss:37,p:150,t:150,oneHitP:3811,idleP:200,idleT:200,bossChance:3/16,set:"cave",dropLevel:0,avatarLevel:2},
{id:"sky",name:"Le Ciel",boss:48,p:600,t:400,oneHitP:11420,idleP:750,idleT:650,bossChance:1/5,set:"",dropLevel:0,avatarLevel:3},
{id:"hsb",name:"Base haute sécurité",boss:58,p:700,t:500,oneHitP:15220,idleP:750,idleT:750,bossChance:1/5,set:"hsb",dropLevel:0,avatarLevel:3},
{id:"clock",name:"Dimension de l’horloge",boss:66,p:3250,t:2250,oneHitP:107110,idleP:4500,idleT:3000,bossChance:2/9,set:"clock",dropLevel:0,avatarLevel:4},
{id:"2d",name:"Univers 2D",boss:74,p:4500,t:3500,oneHitP:168223,idleP:8000,idleT:6000,bossChance:1/4,set:"2d",dropLevel:0,avatarLevel:4},
{id:"ancient",name:"Champ de bataille antique",boss:82,p:12000,t:10000,oneHitP:282966,idleP:17000,idleT:16000,bossChance:1/4,set:"spoopy",dropLevel:0,avatarLevel:5},
{id:"avsp",name:"Un endroit très étrange",boss:90,p:28000,t:18000,oneHitP:842483,idleP:48000,idleT:38000,bossChance:1/4,set:"gaudy",dropLevel:0,avatarLevel:5},
{id:"mega",name:"Mégaterres",boss:100,p:125000,t:60000,oneHitP:3540000,idleP:265000,idleT:145000,bossChance:1/5,set:"mega",dropLevel:0,avatarLevel:6},
/*
 * V143 — Norman (2026-09-11) : "tu as tout sur le wiki, utilise ton
 * navigateur." Manual P/T copiés directement des pages de zone du wiki
 * NGU (ngu-idle.fandom.com), vérifiées en direct au navigateur le
 * 2026-09-11 (pas depuis la copie brute ngu-adventure-raw-v1.txt, dont au
 * moins une valeur — Beardverse Toughness — s'est révélée périmée face au
 * wiki live). avatarLevel reste à 6 (le palier max déjà utilisé par Mega
 * Lands) : ce champ est un choix cosmétique SOREAL (quel palier d'avatar
 * réutiliser), pas une donnée de jeu NGU à sourcer — aucun visuel de
 * palier 7+ n'existe.
 */
/*
 * Re-audit 2026-09-13 (Norman : "boss ennemis pas pareil en aventure") :
 * re-vérifié en direct au navigateur (wiki, page Adventure_Mode, ligne
 * "17. The Beardverse") — Toughness Manual = 550 000, pas 850 000 (valeur
 * en place depuis la vérification du 2026-09-11, cf. commentaire V143
 * ci-dessus). Le wiki a dû être modifié entre les deux vérifications ;
 * confirmé par capture d'écran de la ligne du tableau, pas seulement le
 * texte brut. Power (1 300 000) reste inchangé, déjà exact.
 */
{id:"beardverse",name:"The Beardverse",boss:108,p:1300000,t:550000,oneHitP:46230000,idleP:2500000,bossChance:1/4,set:"beardverse",dropLevel:0,avatarLevel:6},
{id:"badly",name:"Badly Drawn World",boss:116,p:18000000,t:11000000,oneHitP:889080000,idleP:45000000,idleT:35000000,bossChance:1/4,set:"badly",dropLevel:0,avatarLevel:6},
{id:"boring",name:"Boring-Ass Earth",boss:124,p:180000000,t:90000000,oneHitP:7210000000,idleP:360000000,idleT:270000000,bossChance:2/9,set:"stealth",dropLevel:0,avatarLevel:6},
{id:"chocolate",name:"Chocolate World",boss:137,p:70000000000,t:50000000000,oneHitP:2720000000000,idleP:150000000000,idleT:90000000000,bossChance:3/13,set:"choco",dropLevel:0,avatarLevel:6},
/*
 * Zones Evil/Sadistic (2026-09-18, Norman : "il faut tout faire", fidélité
 * NGU). Stats "Manual P/T" et "One Hit P" sourcées du wiki NGU local, page
 * "Adventure Mode", tableaux "Evil"/"SADISTIC" (numérotation réelle du
 * wiki entre parenthèses -- même mapping SOREAL-zone#/wiki-zone# que
 * ngu-wiki-reference/item-id-mapping-wiki-to-soreal.md). requiredDifficulty
 * gate ces zones via unlockedZone ci-dessus ("Zones from Evilverse onwards
 * unlockable by beating their corresponding boss in evil difficulty" /
 * "...from Back to School onwards... in Sadistic").
 *
 * set:"" (aucun équipement) pour les 17 zones ci-dessous : les sets réels
 * (Edgy, Pretty Pink Princess, Rad, etc., wiki-documentés) ne sont pas
 * encore construits dans ce moteur -- volontairement hors périmètre de ce
 * correctif (zones jouables/franchissables dès maintenant, drop
 * d'équipement dédié en suivi séparé). avatarLevel:6 (palier max déjà utilisé,
 * aucun visuel de palier 7+ n'existe -- même raison que les zones Normal
 * tardives ci-dessus).
 *
 * Audit zones 2026-09-23 (script sur le miroir local ; "The Fad-lands" et
 * "Back To School", absentes du miroir par collision de casse, relues sur
 * le wiki live via l'API MediaWiki) :
 * - bossChance : désormais explicite pour les 14 zones qui retombaient sur
 *   le repli 0.25 de startZoneFight -- ligne "Boss chance 1/4" de la
 *   section Enemies de chaque page de zone (et colonne "Boss Chance" du
 *   tableau "Adventure Mode Enemies"). Comportement inchangé (1/4 = 0.25).
 * - oneHitP : ajouté pour 7 zones dont seule la page de zone publie la
 *   ligne "One Hit" (le tableau agrégé "Adventure Mode" dit seulement,
 *   à partir de Typo Zonw, qu'il n'y a plus d'intérêt à one-shot) :
 *   typozone 6.915e21, fadlands 3.562e22, radlands 1.88575e26,
 *   backtoschool 5.23908333333333e28, westworld 2.22158333333333e29,
 *   seventies "13.6 No (1.36E+31)", halloweenies "42.0 Non (4.2E+31)".
 *   construction omis : la page affiche "1.42 Dec (1.42E+32)" -- 1.42 Dc
 *   vaudrait 1.42E33, dix fois la parenthèse (même règle que typozone
 *   idleP). breadverse ("-") et duckduck ("?") ne publient rien.
 *   Aucun effet sur les PV des mobs de ces zones (bestiaire réel complet,
 *   monsterHpMaxForZoneV1WithMob) : oneHitP ne sert qu'au repli zone-plat
 *   et est exposé tel quel dans le snapshot des zones.
 * - Manual/Idle P/T : le code suit le tableau agrégé "Adventure Mode"
 *   (source unique déjà retenue). Les pages de zone publient souvent
 *   d'autres nombres (ex. breadverse Manual 1.73e29/6.41e28 contre
 *   1.4e29/2.4e28 agrégé, netherregions Idle 7.8e32/5.2e32 contre
 *   6.9e32/5e32, aethereansea -- listée dans le tableau agrégé sous son
 *   ancien titre "The Aethereal Sea Part 1" -- Idle 5.2e34/3.3e34 page
 *   contre 4.76e34/3.4e34 agrégé) : désaccord entre deux pages wiki, jamais
 *   tranché ici, aucune valeur modifiée.
 * - Déblocage : boss/requiredDifficulty des 32 zones identiques à la
 *   table "Boss fights that unlock things" (page Boss Fights) et à la
 *   phrase "unlocked by beating boss #N [on evil/SADISTIC difficulty]" de
 *   chaque page de zone.
 */
{id:"evilverse",name:"The Evilverse",boss:58,p:1e13,t:4.7e12,oneHitP:4.40e14,idleP:2.4e13,idleT:1.6e13,bossChance:2/9,set:"edgy",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"pinkprincess",name:"Pretty Pink Princess Land",boss:100,p:5.4e13,t:2.4e13,oneHitP:2.27e15,idleP:1.3e14,idleT:9.7e13,bossChance:1/4,set:"pinkprincess",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"metaland",name:"Meta Land",boss:158,p:2.6e16,t:1.2e16,oneHitP:1.05e18,idleP:4.5e16,idleT:3.1e16,bossChance:1/4,set:"meta",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"interdimensional",name:"Interdimensional Party",boss:166,p:2.5e17,t:1.1e17,oneHitP:1.05e19,idleP:4.8e17,idleT:3.1e17,bossChance:1/4,set:"party",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
/*
 * typozone : idleP omis -- ambiguïté >25% entre "370 Qi" et son repli
 * scientifique "(2.7E20)" sur la table agrégée, voir commentaire détaillé
 * au-dessus de IDLE_ADVENTURE_ZONES. idleT (240 Qi/2.4E20, accord parfait)
 * conservé.
 */
{id:"typozone",name:"Typo Zonw",boss:174,p:1.5e20,t:6.8e19,oneHitP:6.915e21,idleT:2.4e20,bossChance:1/4,set:"typo",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"fadlands",name:"The Fad-lands",boss:182,p:7e20,t:4e20,oneHitP:3.562e22,idleP:1.5e21,idleT:1.1e21,bossChance:1/4,set:"fad",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"jrpgville",name:"JRPGVille",boss:190,p:3e21,t:2.1e21,oneHitP:1.89e23,idleP:8e21,idleT:6e21,bossChance:1/4,set:"jrpg",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"radlands",name:"The Rad-Lands",boss:200,p:3.2e24,t:1.4e24,oneHitP:1.88575e26,idleP:9.1e24,idleT:5.6e24,bossChance:1/5,set:"rad",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"backtoschool",name:"Back To School",boss:125,p:5e26,t:2.5e26,oneHitP:2.72433e28,idleP:1.7e27,idleT:8.5e26,bossChance:1/4,set:"backtoschool",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"westworld",name:"The West World",boss:150,p:2.65e27,t:8.3e26,oneHitP:2.22158333333333e29,idleP:8e27,idleT:3.5e27,bossChance:1/4,set:"western",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"breadverse",name:"The Breadverse",boss:208,p:1.4e29,t:2.4e28,idleP:4.31e29,idleT:2.43e29,bossChance:1/4,set:"bread",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"seventies",name:"That 70's Zone",boss:216,p:5.1e29,t:7.6e28,oneHitP:1.36e31,idleP:1.5e30,idleT:6.5e29,bossChance:1/4,set:"disco",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"halloweenies",name:"The Halloweenies",boss:224,p:1.52e30,t:3.83e29,oneHitP:4.2e31,idleP:3.2e30,idleT:2.4e30,bossChance:1/4,set:"halloweenie",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
/*
 * construction : idleP/idleT omis entièrement -- trois sources wiki
 * (table agrégée en texte, sa propre parenthèse scientifique, et la page
 * dédiée Construction_Zone) donnent trois valeurs différentes pour Idle
 * Power ("113 No" / "1.45E32" / "125.90 No"), voir commentaire détaillé
 * au-dessus de IDLE_ADVENTURE_ZONES. Jamais tranché arbitrairement.
 */
{id:"construction",name:"Construction Zone",boss:232,p:5.24e31,t:2.01e31,bossChance:1/4,set:"construction",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"duckduck",name:"DUCK DUCK ZONE",boss:240,p:1.28e32,t:3.2e31,idleP:3.5e32,idleT:2.3e32,bossChance:1/4,set:"duck",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"netherregions",name:"The Nether Regions",boss:248,p:3.15e32,t:8.42e31,idleP:6.9e32,idleT:5e32,bossChance:1/4,set:"dutch",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"aethereansea",name:"The Aethereal Sea",boss:269,p:1.72e34,t:6.1e33,oneHitP:5.75e35,idleP:4.76e34,idleT:3.4e34,bossChance:4/21,set:"pirate",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"}
]);

/*
 * Norman (2026-09-16) : "j'ai plusieurs images qui sont utilisée pour le
 * même mob. Ce qui fait que dans collection, je n'ai jamais tous les
 * mobs. Il remplace juste par la nouvelle image. Chacune des image doit
 * être reliée à un ennemi. Le compte est bon normalement pour les
 * premières zones."
 *
 * Root cause confirmée : s.zone.encounters[zoneId]/bossEncounters[zoneId]
 * étaient de simples compteurs GLOBAUX par zone (un seul pour TOUS les
 * mobs normaux, un seul pour TOUS les boss) — construireBestiaireSorealIdle_
 * (idle-sqlite-runtime.js) n'en tirait donc jamais que 2 entrées Collection
 * par zone, quel que soit le nombre réel d'images R2 (3 à 8 mobs normaux
 * + 0 à 3 portraits de boss selon la zone). Le média (choisirCleMobR2_,
 * worker.js côté SOREAL-APP) piochait ensuite une image "au hasard mais
 * stable" dans tout le dossier via ce même compteur cumulé — donnant
 * l'impression trompeuse qu'"une nouvelle image remplace l'ancienne"
 * sur cette unique entrée.
 *
 * Ce moteur (idle-adventure-v47.js) reste volontairement isolé de R2 (cf.
 * index-idle-coordinator-v1.js : "runSorealIdleOperation() ne dépend que
 * d'un handle SQLite brut, jamais d'accès réseau externe") — un petit
 * catalogue statique, sourcé en énumérant les vraies clés R2 en direct
 * via /api/idle/media/mob (en-tête x-soreal-idle-r2-key, seed 0-15 par
 * zone), sert donc de contrat partagé avec worker.js (SOREAL-APP), qui
 * trie et indexe SES pools EXACTEMENT dans le même ordre alphabétique —
 * mêmes noms de base ci-dessous, sans le préfixe de zone ni l'extension.
 * Ce ne sont PAS de vrais monstres NGU (aucune fiche wiki dédiée) : ce
 * sont des créations SOREAL originales sur le thème dépôt/entrepôt —
 * leur nom affiché en Collection se dérive directement du nom de fichier,
 * jamais inventé depuis le wiki.
 *
 * Un seul boss par zone existe réellement dans le moteur de jeu (rollKill/
 * startZoneFight, pas de notion de boss "en plusieurs étapes") : quand
 * une zone a plusieurs portraits "_boss_" en R2 (ex. Cave en a 3), ce
 * ne sont que des variantes visuelles du MÊME unique boss de zone,
 * chacune devenant sa propre entrée Collection au même titre qu'un mob
 * normal — jamais une nouvelle mécanique de boss à étapes.
 *
 * beardverse/badly/boring/chocolate n'ont pas encore d'art R2 dédié
 * (dossiers absents de IDLE_ADVENTURE_MOB_FOLDERS côté worker.js) —
 * catalogues vides ici en attendant, sans effet néfaste (l'image de
 * Collection retombe déjà sur un émoji générique via l'attribut onerror
 * du <img>, Soreal_Idle_UI.html).
 */
/*
 * Correctif 2026-09-16 (Norman, Tutorial : "il manque l'épouvantail et
 * qu'on voit 2 fois l'image du boss" — 4 vrais fichiers R2 confirmés par
 * Norman : tutorial_cardboard_foreman_boss.webp, tutorial_monster_box.webp,
 * tutorial_pallet_goblin.webp, tutorial_scarecrow.webp). L'énumération
 * initiale (seed 0-15, ancien mécanisme haché) n'avait jamais fait
 * remonter le fichier boss pour cette zone — catalogué à tort "0 boss".
 * Le fichier boss a "boss" en SUFFIXE (juste avant l'extension), jamais
 * revu jusqu'ici : choisirCleMobR2_ (worker.js) a été élargi pour
 * reconnaître "boss" en infixe OU en suffixe, pas seulement en infixe.
 */
/*
 * NOTE 2026-09-24 : ce catalogue (anciens noms de fichiers d'illustrations « thème dépôt/entrepôt ») ne sert plus qu'à compter les créatures des zones
 * sans bestiaire. Les NOMS affichés (combat, Collection) sont les vrais noms NGU de IDLE_ADVENTURE_MOB_BESTIARY_V1, et les images R2 portent déjà
 * les vrais noms (Adv_<id>_<nom>.png) : l'image est choisie par NOM (idle-media-v1.js, choisirCleMobR2_), l'index n'est qu'un repli.
 */
export const IDLE_ADVENTURE_MOB_CATALOG_V1=Object.freeze({
  tutorial:{normal:["monster_box","pallet_goblin","scarecrow"],boss:["cardboard_foreman"]},
  sewers:{normal:["biobox_mimic","hazard_cone","mutant_rat"],boss:[]},
  forest:{normal:["boar","crow","hyena","shroom","spider","squirrel","woodling"],boss:["ancient_tree","pallet_wolf"]},
  cave:{normal:["barrel","camera","carcass","crate","dog","fish","forklift","worker"],boss:["abattoir","freezer","leviathan"]},
  sky:{normal:["cloud_spirit","drone","hornet","pigeon","plastic_ghost","seagull","supply_drop","wind_elemental"],boss:["airship"]},
  hsb:{normal:["dog","forklift","guard","hazmat","heavybot","mine","recon","turret"],boss:["chief","mutant"]},
  clock:{normal:["box","drone","forkbot","guard","hourglass","pallet","rat"],boss:["timewarden"]},
  "2d":{normal:["glitch_cube","pixel_slime","scanline_wraith","sprite_knight","vector_spider","wireframe_rat"],boss:["crt_demon","glitch_colossus"]},
  ancient:{normal:["ghost_worker","haunted_drone","mimic_crate","pallet_rat","pallet_walker","possessed_forklift"],boss:["forklord","pallet_golem"]},
  avsp:{normal:["crystal_brain","eye_blob","floating_mask","mouth_cube","tentacle_worker","void_spider"],boss:["cosmic_manager","reality_eater"]},
  mega:{normal:["drone","hound","leaker","riot","scavenger","slime","spitter","spore"],boss:["excavator"]},
  beardverse:{normal:[],boss:[]},
  badly:{normal:[],boss:[]},
  boring:{normal:[],boss:[]},
  chocolate:{normal:[],boss:[]}
});

/*
 * Norman (2026-09-17, capture d'écran de la fiche wiki "A Small Piece of
 * Fluff") : "Pour les mobs aventure, tu dois cliquer sur l'onglet aventure
 * en dessous de la photo. Les statistiques des mobs ne sont pas bonnes...
 * il y a une version boss fight et une version adventure pour chaque
 * mobs. Tu dois connaitre les 2." Chaque fiche wiki NGU d'un mob possède
 * un tabber à 2 onglets : "Boss fight" (Number/Exp/Attack/Defense/HP
 * Regen/Max HP — déjà câblé côté NGU_BOSS_REFERENCE_V1, jamais touché
 * ici) et "Adventure" (Bestiary ID/Location/Type/Attack Rate/Power/
 * Toughness/HP Regen/Max HP — jamais exploité jusqu'ici : monsterHpMax
 * ne dépendait que de z.oneHitP, un nombre UNIQUE par zone, identique
 * quel que soit le mob réellement tiré par startZoneFight, alors que le
 * wiki donne des PV/Power/Toughness différents par mob individuel).
 *
 * Extrait en direct au navigateur le 2026-09-17 (tabber : les 2 panneaux
 * restent dans le DOM, seule la visibilité change — extraction fiable
 * quel que soit l'onglet visuellement actif) pour les zones accessibles
 * en tout début/milieu de progression (avatarLevel 1 à 4 d'
 * IDLE_ADVENTURE_ZONES, celles que testent les joueurs en ce moment) :
 * tutorial, sewers, forest (8 des 9 entrées réelles — Fast Zombie n'a
 * AUCUN onglet Adventure sur sa fiche, jamais rencontré en Aventure côté
 * vrai NGU, volontairement absent), sky, hsb, clock, 2d — Bestiary ID
 * 1-20 (tutorial/sewers/forest/cave) recoupé avec la page-résumé
 * https://ngu-idle.fandom.com/wiki/Adventure_Mode (section "Adventure
 * Mode Enemies", qui liste le VRAI roster Non-Boss/Boss par zone) puis
 * chaque fiche individuelle pour Sky/HSB/Clock/2D (Bestiary ID 38-74).
 *
 * cave : seulement 3 des 16 ennemis réels de la zone ont été vérifiés
 * (Gorgonzola/Brie/Gouda, déjà dans l'ancien tableau 1-20) — les 13
 * autres (T-800, Floppy Mattress, Fluffy Chair, Couch, Parmesan, Evil
 * Fridge, The Kitchen Sink, Robot, A Wide Screen T.V, + 3 boss) et TOUTES
 * les zones au-delà de 2D (Ancient Battlefield avatarLevel 5 et plus)
 * n'ont PAS été vérifiées cette session, faute de temps — volontairement
 * ABSENTES ci-dessous plutôt qu'inventées (consigne explicite de Norman :
 * "tu ne dois jamais inventer de valeurs toi-même"). monsterHpMaxForZoneV1
 * retombe sur l'ancien calcul zone-plat (z.oneHitP) pour tout mob dont
 * l'index tiré n'a pas d'entrée réelle ci-dessous — jamais un plantage,
 * jamais une valeur inventée.
 *
 * "boss" ci-dessous = l'ennemi à couronne jaune PROPRE à l'Aventure de
 * cette zone (ex. Brown Slime à Sewers, A Bird Person au Ciel) — un
 * concept wiki totalement différent du "Combat de Boss" séquentiel
 * (NGU_BOSS_REFERENCE_V1, boss 1-137, jamais touché ici). Un même mob
 * (ex. "A Small Mouse") peut être Boss fight n°4 dans le classement
 * séquentiel ET, séparément, l'ennemi Aventure à couronne de sa propre
 * zone (Tutorial Zone) — les 2 rôles cohabitent sans conflit.
 *
 * name ci-dessous = le VRAI nom wiki (uniquement pour audit/lisibilité de
 * ce fichier) — jamais affiché tel quel au joueur, qui voit toujours le
 * nom SOREAL reskin (IDLE_ADVENTURE_MOB_CATALOG_V1, thème dépôt/
 * entrepôt, cf. commentaire 2026-09-16 ci-dessus) : exactement le même
 * principe déjà appliqué à IDLE_ADVENTURE_ZONES (p/t/oneHitP réels sous
 * un nom de zone reskin). Les tableaux normal[]/boss[] ci-dessous sont
 * INDEXÉS INDÉPENDAMMENT du reskin (longueurs différentes assumées) —
 * monsterHpMaxForZoneV1 utilise le même monsterIndex tiré au hasard que
 * le reskin, mais modulo la longueur RÉELLE de ce tableau-ci.
 */
/*
 * V2 (2026-09-17, Norman : "il y a une COMPLETE LOCAL MIRROR de tout le
 * wiki déjà sur le disque ... copie absolument tout dans le jeu") --
 * régénéré par design/build-idle-adventure-bestiary-v2.mjs (utilise
 * design/parse-ngu-wiki.mjs) depuis le miroir local complet du wiki NGU
 * Idle, au lieu de la navigation manuelle page par page qui n'avait
 * couvert que 8 des 15 zones jouables (tutorial/sewers/forest/sky/hsb/
 * clock/2d + 3 des 16 ennemis de Cave) plus tôt le même jour. Couvre
 * maintenant les 15 zones au complet (tutorial -> chocolate), chacune
 * avec TOUS ses ennemis normaux et TOUS ses "boss" d'Aventure réels
 * (`boss=yes` sur la fiche wiki -- distinct du Combat de Boss séquentiel,
 * cf. commentaire au-dessus). Rien n'est inventé : toute zone/ennemi sans
 * donnée exploitable sur le miroir reste absent plutôt que deviné.
 *
 * 2 divergences trouvées en régénérant, par rapport à l'ancienne V1
 * écrite à la main :
 *  - Sewers avait 3 ennemis normaux répertoriés, le wiki en a 4 (« Small
 *    Mouse » manquait) -- ajouté.
 *  - Forest classait « Rat of Unusual Size » comme normal ; sa fiche
 *    wiki porte bien `boss=yes` (c'est un second "boss" d'Aventure de
 *    Forest, aux côtés de Gorgon) -- déplacé dans boss[]. Cohérent avec
 *    IDLE_ADVENTURE_MOB_CATALOG_V1.forest.boss qui a toujours eu 2
 *    entrées ("ancient_tree","pallet_wolf") alors que ce bestiaire n'en
 *    documentait qu'une seule jusqu'ici.
 * Toutes les valeurs déjà présentes en V1 (tutorial/sewers/forest/sky/
 * hsb/clock/2d/cave partiel) restent identiques au bit près -- revérifié
 * par script contre les 20 premiers Combats de Boss déjà sourcés
 * (idle-ngu-boss-reference-v1.js) : aucun écart de PV/Attaque/Défense/XP.
 */
/*
 * Audit zones 2026-09-23 (diff systématique par script contre le miroir
 * local : pour chaque zone, la liste "==Enemies==" de SA page de zone,
 * puis la fiche {{Enemy}} de chaque ennemi listé -- nom, Type, Attack
 * Rate, Power, Toughness, HP Regen, Max HP, normal ET boss). 30 zones,
 * 254 ennemis comparés : aucun écart de stats (pages absentes du miroir
 * par collision de casse -- "The Fad-lands", "Back To School", "KING
 * CIRCLE", "The Slammer" -- relues sur le wiki live via l'API MediaWiki).
 * Corrigé :
 * - The West World : THE OUTLAW / THE SHERIFF déplacés de normal[] vers
 *   boss[]. La page "The West World" les liste en {{BossLink}}, le tableau
 *   "Adventure Mode Enemies" (page Adventure Mode) les met dans la colonne
 *   "Bosses" (6 normaux + 2 boss, "Boss chance 1/4"). Leurs fiches n'ont
 *   pas `boss=yes`, d'où l'erreur du générateur. Avant : boss:[] -> un
 *   tirage boss (25 %) n'avait aucun mob réel et retombait sur les PV
 *   zone-plat.
 * - The Rad-Lands : attackRate des 7 ennemis normaux publiés "attack_rate=?"
 *   sur leurs fiches (ex. "Small Bart") -> null au lieu de 0 (le 0 était
 *   une valeur inventée par le générateur). idleAdventureMobAttackFactorV1
 *   retombe déjà sur 1 quand attackRate est inconnu ; la moyenne de zone
 *   ignore désormais les null (idleAdventureBestiaryAverageV1).
 * 2026-09-24, SOURCE EXTERNE (dérogation à la règle n°1 acceptée par Norman) :
 * - netherregions (8 ennemis) et aethereansea (21) : les fiches du wiki sont
 *   des stubs sans stats (Nether) ou n'existent pas (Aethereal, API
 *   "missing"). Stats prises dans NGU-Wiki\external\late-zone-enemies.json
 *   (dépôt thecaligarmo/ngu-idle-calculators, src/assets/enemy.ts, commit
 *   42aafcb), gardées après contrôles de cohérence : effectif et boss chance
 *   identiques aux pages de zone, puissance moyenne / puissance Manual
 *   recommandée 0,80 et 0,76 (zones voisines 0,54-0,80), 212 ennemis sur 222
 *   déjà identiques au wiki. Noms et rôles (boss) suivent le wiki.
 * - The Rad-Lands : les 7 attack_rate "?" sont comblés par la même source
 *   (NGU-Wiki\external\attack-rate-gaps.json), autres stats identiques.
 * - APPLIQUÉ (2026-09-24) : les 21 écarts de NGU-Wiki\external\proposed-corrections.json,
 *   la source gagne : Back To School (P/T/regen/PV x2 au wiki, coquille probable),
 *   A Bulldozer (PV 2,07e33), 3 Guys Carrying a Beam, attack_rate 1 -> 1,1/1,2 des
 *   zones récentes (le wiki avait laissé la valeur par défaut) ; type "paralzye" -> "paralyze".
 * - Écart de roster connu, non corrigé : les images R2
 *   (IDLE_ADVENTURE_MOB_CATALOG_V1) n'existent que pour tutorial..mega ;
 *   leurs longueurs diffèrent du roster wiki (ex. sewers boss:[] en image
 *   pour 1 boss réel) -- l'image est choisie modulo sa propre longueur,
 *   aucune image n'est inventée.
 * NOTE : ne pas relancer design/build-idle-adventure-bestiary-v2.mjs tel
 * quel -- le miroir actuel a perdu ou renommé des fiches par collision de
 * casse Windows (ex. "KING CIRCLE" écrasé par la redirection "King
 * Circle", "The Slammer" ; "Kitten In a Mech Woman" et "EVIL SPIKY HAIRED
 * GUY" désormais titrés en casse différente) : une régénération
 * supprimerait ou renommerait des entrées pourtant vérifiées.
 */
export const IDLE_ADVENTURE_MOB_BESTIARY_V1=Object.freeze({
  "tutorial":{normal:[{name:"A Small Piece of Fluff",type:"normal",attackRate:1,power:7,toughness:6,hpRegen:1,maxHp:40},{name:"Floating Sewage",type:"normal",attackRate:1.2,power:7,toughness:6,hpRegen:1.5,maxHp:45},{name:"A Stick?",type:"normal",attackRate:1.5,power:8,toughness:7,hpRegen:0.5,maxHp:55}],boss:[{name:"A Small Mouse",type:"normal",attackRate:1,power:9,toughness:9,hpRegen:1,maxHp:100}]},
  "sewers":{normal:[{name:"A Slightly Bigger Mouse",type:"normal",attackRate:1.2,power:10,toughness:10,hpRegen:1.5,maxHp:50},{name:"A Large Rat",type:"normal",attackRate:1.5,power:11,toughness:11,hpRegen:0.5,maxHp:70},{name:"Small Mouse",type:"normal",attackRate:1,power:9,toughness:9,hpRegen:1,maxHp:40}],boss:[{name:"Brown Slime",type:"poison",attackRate:1,power:13,toughness:13,hpRegen:1,maxHp:150}]},
  "forest":{normal:[{name:"Skeleton",type:"normal",attackRate:1.1,power:26,toughness:29,hpRegen:3,maxHp:400},{name:"Goblin",type:"rapid",attackRate:0.9,power:30,toughness:29,hpRegen:1,maxHp:420},{name:"Orc",type:"normal",attackRate:1.2,power:31,toughness:31,hpRegen:2,maxHp:450},{name:"Slow Zombie",type:"normal",attackRate:1.5,power:30,toughness:17,hpRegen:8,maxHp:900},{name:"Ent",type:"normal",attackRate:1.2,power:28,toughness:34,hpRegen:4,maxHp:515},{name:"Giant",type:"charger",attackRate:1.3,power:30,toughness:35,hpRegen:1,maxHp:500},{name:"Fairy",type:"exploder",attackRate:5,power:33,toughness:31,hpRegen:2,maxHp:200}],boss:[{name:"Rat of Unusual Size",type:"normal",attackRate:1.5,power:32,toughness:32,hpRegen:3,maxHp:500},{name:"Gorgon",type:"paralyze",attackRate:1.25,power:33,toughness:33,hpRegen:2.5,maxHp:600}]},
  "cave":{normal:[{name:"Gorgonzola",type:"normal",attackRate:1.3,power:114,toughness:113,hpRegen:8,maxHp:1900},{name:"Brie",type:"normal",attackRate:1.3,power:110,toughness:117,hpRegen:10,maxHp:1900},{name:"Gouda",type:"normal",attackRate:1.5,power:107,toughness:120,hpRegen:12,maxHp:1940},{name:"Blue Cheese",type:"poison",attackRate:1.5,power:114,toughness:110,hpRegen:8,maxHp:2050},{name:"Parmesan",type:"normal",attackRate:1.2,power:117,toughness:112,hpRegen:13,maxHp:1900},{name:"Robot",type:"charger",attackRate:1,power:114,toughness:111,hpRegen:8,maxHp:2080},{name:"A fluffy Chair",type:"normal",attackRate:1,power:115,toughness:110,hpRegen:10,maxHp:2100},{name:"Couch",type:"normal",attackRate:1.5,power:119,toughness:114,hpRegen:12,maxHp:1900},{name:"Floppy Mattress",type:"poison",attackRate:1.5,power:111,toughness:110,hpRegen:8,maxHp:1810},{name:"Evil Fridge",type:"normal",attackRate:1.2,power:115,toughness:112,hpRegen:13,maxHp:2000},{name:"T-800",type:"rapid",attackRate:1.2,power:113,toughness:111,hpRegen:13,maxHp:2130},{name:"A Wide Screen T.V",type:"normal",attackRate:1.2,power:112,toughness:110,hpRegen:13,maxHp:1900},{name:"The Kitchen Sink",type:"rapid",attackRate:1.2,power:113,toughness:110,hpRegen:13,maxHp:1900}],boss:[{name:"Limburger Cheese",type:"charger",attackRate:1.2,power:110,toughness:110,hpRegen:15,maxHp:2800},{name:"Mega-Rat",type:"normal",attackRate:1.2,power:120,toughness:119,hpRegen:16,maxHp:2900},{name:"A Fifth Giant Mole",type:"charger",attackRate:1.2,power:120,toughness:122,hpRegen:17,maxHp:3000}]},
  "sky":{normal:[{name:"Kid On a Cloud",type:"grower",attackRate:1.3,power:300,toughness:323,hpRegen:20,maxHp:4600},{name:"747",type:"normal",attackRate:1.3,power:350,toughness:310,hpRegen:20,maxHp:4500},{name:"Oriental Dragon",type:"charger",attackRate:1,power:322,toughness:322,hpRegen:22,maxHp:4440},{name:"Lester",type:"poison",attackRate:1.3,power:350,toughness:350,hpRegen:18,maxHp:4550},{name:"Excitable Ninja Samurai",type:"rapid",attackRate:1.3,power:350,toughness:342,hpRegen:13,maxHp:4800},{name:"Icarus Proudbottom",type:"exploder",attackRate:9,power:340,toughness:320,hpRegen:10,maxHp:4900},{name:"Gigantic Flock of Seagulls",type:"poison",attackRate:1.3,power:340,toughness:317,hpRegen:20,maxHp:5200},{name:"A Weird Two-Headed Guy",type:"normal",attackRate:1.3,power:330,toughness:310,hpRegen:19,maxHp:3500}],boss:[{name:"Gigantic Flock of Canada Geese",type:"poison",attackRate:1.3,power:365,toughness:360,hpRegen:23,maxHp:8700},{name:"A Bird Person",type:"rapid",attackRate:1.3,power:340,toughness:340,hpRegen:25,maxHp:9000}]},
  "hsb":{normal:[{name:"Hooloovoo",type:"rapid",attackRate:1.3,power:400,toughness:403,hpRegen:40,maxHp:6333},{name:"Gross Green Alien",type:"normal",attackRate:1.3,power:400,toughness:410,hpRegen:30,maxHp:6500},{name:"The Rat God",type:"charger",attackRate:1,power:412,toughness:422,hpRegen:32,maxHp:6440},{name:"Massive Plant Monster",type:"poison",attackRate:1.3,power:390,toughness:451,hpRegen:28,maxHp:6500},{name:"High Security Insect Guard 1",type:"normal",attackRate:1.3,power:420,toughness:402,hpRegen:23,maxHp:6140},{name:"High Security Insect Guard 2",type:"normal",attackRate:1.2,power:426,toughness:404,hpRegen:20,maxHp:6600},{name:"The Experiment",type:"grower",attackRate:1.1,power:416,toughness:410,hpRegen:20,maxHp:6200},{name:"A Whole Lotta Guards",type:"normal",attackRate:1.3,power:410,toughness:427,hpRegen:30,maxHp:6300}],boss:[{name:"One Mega-Guard",type:"charger",attackRate:1.3,power:435,toughness:440,hpRegen:33,maxHp:11200},{name:"Spiky Haired Guy",type:"rapid",attackRate:1.3,power:440,toughness:440,hpRegen:35,maxHp:12000}]},
  "clock":{normal:[{name:"Monday",type:"charger",attackRate:1.3,power:1641,toughness:1571,hpRegen:147,maxHp:50000},{name:"Tuesday",type:"normal",attackRate:1.3,power:1641,toughness:1591,hpRegen:149,maxHp:52000},{name:"Wednesday",type:"normal",attackRate:1.3,power:1611,toughness:1611,hpRegen:141,maxHp:54000},{name:"Thursday",type:"normal",attackRate:1.3,power:1631,toughness:1631,hpRegen:143,maxHp:56000},{name:"Friday",type:"normal",attackRate:1.3,power:1651,toughness:1651,hpRegen:145,maxHp:58000},{name:"Saturday",type:"normal",attackRate:1.3,power:1671,toughness:1671,hpRegen:147,maxHp:60000},{name:"Sunday",type:"normal",attackRate:1.3,power:1691,toughness:1691,hpRegen:149,maxHp:62000}],boss:[{name:"Sundae",type:"normal",attackRate:1.3,power:1700,toughness:1720,hpRegen:200,maxHp:85000}]},
  "2d":{normal:[{name:"A Flat Mouse",type:"charger",attackRate:1,power:3076,toughness:3071,hpRegen:307,maxHp:100000},{name:"A Tiny Triangle",type:"normal",attackRate:1.1,power:3001,toughness:3091,hpRegen:309,maxHp:101000},{name:"A Square Bear",type:"normal",attackRate:1.1,power:3065,toughness:3011,hpRegen:301,maxHp:100000},{name:"The Pentagon",type:"rapid",attackRate:1.2,power:3022,toughness:3031,hpRegen:303,maxHp:105000},{name:"The First Stop Sign",type:"normal",attackRate:1.2,power:3086,toughness:3071,hpRegen:307,maxHp:108000},{name:"The Second Stop Sign",type:"normal",attackRate:1.2,power:3159,toughness:3091,hpRegen:309,maxHp:100000}],boss:[{name:"A Super Hexagon",type:"normal",attackRate:1.2,power:3133,toughness:3133,hpRegen:303,maxHp:133333},{name:"KING CIRCLE",type:"normal",attackRate:1.2,power:3041,toughness:3050,hpRegen:300,maxHp:100000}]},
  "ancient":{normal:[{name:"Ghost Mice",type:"charger",attackRate:1,power:6300,toughness:7100,hpRegen:720,maxHp:256000},{name:"Crasper, The Pissed Off Ghost",type:"paralyze",attackRate:1.1,power:6200,toughness:7100,hpRegen:719,maxHp:250000},{name:"Living Armor",type:"normal",attackRate:1.1,power:6665,toughness:7200,hpRegen:721,maxHp:250000},{name:"Living Armour",type:"normal",attackRate:1.2,power:6480,toughness:7400,hpRegen:723,maxHp:255000},{name:"\"\"",type:"poison",attackRate:1.2,power:6500,toughness:7500,hpRegen:726,maxHp:248000},{name:"The Pantheon of Fallen Gods",type:"rapid",attackRate:1.2,power:6550,toughness:7550,hpRegen:729,maxHp:260000}],boss:[{name:"Ghost Dad",type:"normal",attackRate:1.2,power:6600,toughness:7600,hpRegen:730,maxHp:335000},{name:"Mysterious Figure",type:"charger",attackRate:1.2,power:6600,toughness:7600,hpRegen:782,maxHp:332000}]},
  "avsp":{normal:[{name:"The Entire Alphabet Up a Coconut Tree",type:"rapid",attackRate:1,power:16100,toughness:18100,hpRegen:1620,maxHp:756000},{name:"The Lummox",type:"paralyze",attackRate:1.1,power:16100,toughness:18100,hpRegen:1619,maxHp:750000},{name:"A Metal Slime",type:"normal",attackRate:1.1,power:16000,toughness:18000,hpRegen:1621,maxHp:750000},{name:"A Ginormous Sword",type:"charger",attackRate:1.2,power:16000,toughness:18100,hpRegen:1623,maxHp:755000},{name:"An Ordinary Chicken",type:"normal",attackRate:1.2,power:16100,toughness:18100,hpRegen:1626,maxHp:748000},{name:"743 pissed off Cuckoos",type:"rapid",attackRate:1.2,power:16200,toughness:18100,hpRegen:1629,maxHp:760000}],boss:[{name:"Kenny",type:"rapid",attackRate:1.2,power:16300,toughness:18300,hpRegen:1660,maxHp:950000},{name:"Vic",type:"charger",attackRate:1.2,power:16300,toughness:18300,hpRegen:1682,maxHp:1000000}]},
  "mega":{normal:[{name:"Broken VCR Man",type:"rapid",attackRate:1,power:63500,toughness:63000,hpRegen:7620,maxHp:3600000},{name:"Mr Plow",type:"normal",attackRate:1.1,power:63700,toughness:63700,hpRegen:7621,maxHp:3650000},{name:"ROBUTT",type:"poison",attackRate:1.2,power:63700,toughness:63100,hpRegen:7623,maxHp:3700000},{name:"Former Canadian PM Stephen Harper",type:"rapid",attackRate:1.2,power:63100,toughness:63100,hpRegen:7626,maxHp:3750000},{name:"A Cyberdemon",type:"charger",attackRate:1.2,power:63200,toughness:63100,hpRegen:7629,maxHp:3800000},{name:"Robo Rat 9000",type:"paralyze",attackRate:1.2,power:63200,toughness:63100,hpRegen:7629,maxHp:3850000},{name:"Butter-Passing Robot",type:"normal",attackRate:1.2,power:64200,toughness:63100,hpRegen:7629,maxHp:3950000},{name:"Kitten In a Mech Woman",type:"exploder",attackRate:12,power:63500,toughness:63500,hpRegen:7619,maxHp:3600000}],boss:[{name:"Doctor Wahwee",type:"rapid",attackRate:1.2,power:64300,toughness:63300,hpRegen:7660,maxHp:4200000}]},
  "beardverse":{normal:[{name:"A Bearded Lady",type:"rapid",attackRate:1,power:740000,toughness:740000,hpRegen:74000,maxHp:50000000},{name:"A Bearded Man",type:"charger",attackRate:1,power:740000,toughness:740000,hpRegen:74000,maxHp:50000000},{name:"Cousin Itt",type:"normal",attackRate:1.1,power:742000,toughness:742000,hpRegen:74200,maxHp:51000000},{name:"A Naked Molerat",type:"rapid",attackRate:1.2,power:744000,toughness:744000,hpRegen:74400,maxHp:52000000},{name:"Rob Boss",type:"exploder",attackRate:12,power:746000,toughness:746000,hpRegen:74600,maxHp:40000000},{name:"Gossamer",type:"paralyze",attackRate:1.2,power:748000,toughness:748000,hpRegen:74800,maxHp:53000000}],boss:[{name:"An Orange Toupée With Fists",type:"charger",attackRate:1.2,power:750000,toughness:750000,hpRegen:75000,maxHp:54000000},{name:"A Clogged Shower Drain",type:"poison",attackRate:1.2,power:750000,toughness:750000,hpRegen:75000,maxHp:55000000}]},
  "badly":{normal:[{name:"Badly Drawn Dragon",type:"normal",attackRate:1,power:11000000,toughness:11000000,hpRegen:1100000,maxHp:1000000000},{name:"Really Bad Sonic Fanart",type:"charger",attackRate:1,power:11200000,toughness:11200000,hpRegen:1102000,maxHp:1000000000},{name:"Badly Drawn Schoolgirl",type:"poison",attackRate:1.1,power:11400000,toughness:11400000,hpRegen:1140000,maxHp:1010000000},{name:"No Enemy(?)",type:"rapid",attackRate:1.2,power:11600000,toughness:11600000,hpRegen:1160000,maxHp:1020000000},{name:"Really Bad MLP Fanart",type:"grower",attackRate:1.1,power:11800000,toughness:11800000,hpRegen:1180000,maxHp:1030000000},{name:"Loss.png",type:"paralyze",attackRate:1.2,power:11000000,toughness:11000000,hpRegen:1100000,maxHp:1040000000}],boss:[{name:"EVIL SPIKY HAIRED GUY",type:"rapid",attackRate:1.2,power:11200000,toughness:11200000,hpRegen:1120000,maxHp:1050000000},{name:"EVIL BADLY DRAWN KITTY",type:"paralyze",attackRate:1.2,power:11500000,toughness:11500000,hpRegen:1150000,maxHp:1060000000}]},
  "boring":{normal:[{name:"The Eiffel Tower",type:"normal",attackRate:1,power:89000000,toughness:89000000,hpRegen:8900000,maxHp:8500000000},{name:"A Mummy",type:"charger",attackRate:1,power:89000000,toughness:89000000,hpRegen:8900000,maxHp:8500000000},{name:"A Daddy",type:"poison",attackRate:1.1,power:89200000,toughness:89200000,hpRegen:8920000,maxHp:8520000000},{name:"Two Bananas In Pyjamas",type:"rapid",attackRate:1.2,power:89400000,toughness:89400000,hpRegen:8940000,maxHp:8540000000},{name:"Giant Raisins From California",type:"grower",attackRate:1.1,power:89600000,toughness:89600000,hpRegen:8960000,maxHp:8560000000},{name:"An Annoying Penguin",type:"paralyze",attackRate:1.2,power:89800000,toughness:89800000,hpRegen:8980000,maxHp:8580000000},{name:"An Army of Annoying Penguins",type:"rapid",attackRate:1.2,power:90000000,toughness:90000000,hpRegen:9000000,maxHp:8600001000}],boss:[{name:"The Elusive 'C.S'",type:"poison/paralyze",attackRate:1.2,power:90000000,toughness:90000000,hpRegen:9000000,maxHp:8600000000}]},
  "chocolate":{normal:[{name:"Chocolate Mouse",type:"normal",attackRate:1,power:30000000000,toughness:30000000000,hpRegen:3000000000,maxHp:3000000000000},{name:"Chocolate Mimic",type:"rapid",attackRate:1,power:30100000000,toughness:30100000000,hpRegen:3010000000,maxHp:3050000000000},{name:"Chocolate Crowbar (Enemy)",type:"poison",attackRate:1.1,power:30100000000,toughness:30100000000,hpRegen:3010000000,maxHp:3050000000000},{name:"Chocolate Freeman",type:"rapid",attackRate:1.2,power:30200000000,toughness:30200000000,hpRegen:3020000000,maxHp:3100000000000},{name:"Chocolate Fondue",type:"exploder",attackRate:12,power:30200000000,toughness:30200000000,hpRegen:3020000000,maxHp:3100000000000},{name:"Chocolate Slime",type:"poison",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Dark Chocolate",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Chocolate Salty Balls",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Screaming Chocolate Fish",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"A Mighty Lump of Poo",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000}],boss:[{name:"Melted Chocolate Blob (?)",type:"grower",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000},{name:"Choco Golem",type:"rapid",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000},{name:"Type 2 Diabetes",type:"charger",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000}]},
  "evilverse":{normal:[{name:"Evil Brown Slime",type:"poison",attackRate:1.2,power:5030000000000,toughness:5030000000000,hpRegen:503000000000,maxHp:515000000000000},{name:"Evil Goblin",type:"rapid",attackRate:1,power:5010000000000,toughness:5010000000000,hpRegen:501000000000,maxHp:505000000000000},{name:"Evil Gorgon",type:"poison",attackRate:1.1,power:5010000000000,toughness:5010000000000,hpRegen:501000000000,maxHp:505000000000000},{name:"Evil Icarus Proudbottom",type:"exploder",attackRate:12,power:5020000000000,toughness:5020000000000,hpRegen:502000000000,maxHp:510000000000000},{name:"Evil Mole",type:"rapid",attackRate:1.2,power:5020000000000,toughness:5020000000000,hpRegen:502000000000,maxHp:510000000000000},{name:"Evil Mouse",type:"normal",attackRate:1,power:5000000000000,toughness:5000000000000,hpRegen:500000000000,maxHp:500000000000000},{name:"Flock of Canada Geese",type:"rapid",attackRate:1.2,power:5030000000000,toughness:5030000000000,hpRegen:503000000000,maxHp:515000000000000}],boss:[{name:"EVIL CHAD(BOSS)",type:"charger",attackRate:1.2,power:5050000000000,toughness:5050000000000,hpRegen:505000000000,maxHp:525000000000000},{name:"EVIL SPIKY HAIRED GUY (BOSS)",type:"rapid",attackRate:1.2,power:5050000000000,toughness:5050000000000,hpRegen:505000000000,maxHp:525000000000000}]},
  "pinkprincess":{normal:[{name:"'The More You Know' Star",type:"charger",attackRate:1.1,power:25100000000000,toughness:25100000000000,hpRegen:2510000000000,maxHp:2550000000000000},{name:"A Fabulous Leprechaun",type:"grower",attackRate:1.2,power:25200000000000,toughness:25200000000000,hpRegen:2520000000000,maxHp:2600000000000000},{name:"An Ordinary Possum",type:"poison",attackRate:1.2,power:25200000000000,toughness:25200000000000,hpRegen:2520000000000,maxHp:2600000000000000},{name:"Barry, the Beer Fairy",type:"exploder",attackRate:12,power:25300000000000,toughness:25300000000000,hpRegen:2530000000000,maxHp:2650000000000000},{name:"Pooky The Bunny",type:"rapid",attackRate:1,power:25100000000000,toughness:25100000000000,hpRegen:2510000000000,maxHp:2550000000000000},{name:"The Humkeycorn",type:"normal",attackRate:1,power:25000000000000,toughness:25000000000000,hpRegen:2500000000000,maxHp:2500000000000000}],boss:[{name:"AN ASSHOLE SWAN (BOSS)",type:"rapid",attackRate:1.2,power:25300000000000,toughness:25300000000000,hpRegen:2530000000000,maxHp:2650000000000000},{name:"TINKLES (BOSS)",type:"charger",attackRate:1.2,power:25500000000000,toughness:25500000000000,hpRegen:2550000000000,maxHp:2700000000000000}]},
  "metaland":{normal:[{name:"A Half-eaten Cookie",type:"normal",attackRate:1,power:10000000000000000,toughness:10000000000000000,hpRegen:1000000000000000,maxHp:1000000000000000000},{name:"A Rusty Crank",type:"poison",attackRate:1,power:10200000000000000,toughness:10200000000000000,hpRegen:1020000000000000,maxHp:1050000000000000000},{name:"Ahh!! A Shark!!",type:"charger",attackRate:1.1,power:10400000000000000,toughness:10400000000000000,hpRegen:1040000000000000,maxHp:1100000000000000000},{name:"The number 1.8 x 10^308",type:"normal",attackRate:1.2,power:10600000000000000,toughness:10600000000000000,hpRegen:1060000000000000,maxHp:1150000000000000000},{name:"A Weird Goblin-Demon-Thing",type:"rapid",attackRate:1.2,power:10800000000000000,toughness:10800000000000000,hpRegen:1080000000000000,maxHp:1200000000000000000},{name:"A Cute Kitten",type:"exploder",attackRate:12,power:11000000000000000,toughness:11000000000000000,hpRegen:1100000000000000,maxHp:1200000000000000000}],boss:[{name:"THE DRAGON OF WISDOM",type:"grower",attackRate:1.2,power:11200000000000000,toughness:11200000000000000,hpRegen:1120000000000000,maxHp:1250000000000000000},{name:"THE DRAGON OF DILDO",type:"grower",attackRate:1.2,power:11500000000000000,toughness:11500000000000000,hpRegen:1150000000000000,maxHp:1250000000000000000}]},
  "interdimensional":{normal:[{name:"The Bouncer, Part 2",type:"normal",attackRate:1,power:100000000000000000,toughness:100000000000000000,hpRegen:10000000000000000,maxHp:11000000000000000000},{name:"Jambi",type:"rapid",attackRate:1,power:102000000000000000,toughness:102000000000000000,hpRegen:10200000000000000,maxHp:11000000000000000000},{name:"God of Thunder",type:"charger",attackRate:1.1,power:104000000000000000,toughness:104000000000000000,hpRegen:10400000000000000,maxHp:11500000000000000000},{name:"The Entire State of South Dakota",type:"normal",attackRate:1.2,power:106000000000000000,toughness:106000000000000000,hpRegen:10600000000000000,maxHp:11500000000000000000},{name:"A Huge Stack of Pogs",type:"poison",attackRate:1.2,power:108000000000000000,toughness:108000000000000000,hpRegen:10800000000000000,maxHp:12000000000000000000},{name:"Three Guys Shouting out 'Ed'",type:"exploder",attackRate:12,power:110000000000000000,toughness:110000000000000000,hpRegen:11000000000000000,maxHp:12000000000000000000}],boss:[{name:"Mr. Chow",type:"normal",attackRate:1.2,power:112000000000000000,toughness:112000000000000000,hpRegen:11200000000000000,maxHp:12500000000000000000},{name:"The Life Of The Party",type:"grower",attackRate:1.2,power:115000000000000000,toughness:115000000000000000,hpRegen:11500000000000000,maxHp:12500000000000000000}]},
  "typozone":{normal:[{name:"Permanenet",type:"normal",attackRate:1,power:80000000000000000000,toughness:80000000000000000000,hpRegen:8000000000000000000,maxHp:8.1e+21},{name:"Coudl",type:"rapid",attackRate:1,power:80200000000000000000,toughness:80200000000000000000,hpRegen:8020000000000000000,maxHp:8.1e+21},{name:"Liek",type:"charger",attackRate:1.1,power:80400000000000000000,toughness:80400000000000000000,hpRegen:8040000000000000000,maxHp:8.15e+21},{name:"Blodo",type:"poison",attackRate:1.2,power:80800000000000000000,toughness:80800000000000000000,hpRegen:8080000000000000000,maxHp:8.2e+21},{name:"Brian",type:"normal",attackRate:1.2,power:80600000000000000000,toughness:80600000000000000000,hpRegen:8060000000000000000,maxHp:8.15e+21},{name:"Odign",type:"rapid",attackRate:0.8,power:81000000000000000000,toughness:81000000000000000000,hpRegen:8100000000000000000,maxHp:8.2e+21}],boss:[{name:"Horus",type:"normal",attackRate:1.2,power:81200000000000000000,toughness:81200000000000000000,hpRegen:8120000000000000000,maxHp:8.25e+21},{name:"ELDER TYPO GOD, ELXU",type:"grower",attackRate:1.2,power:81500000000000000000,toughness:81500000000000000000,hpRegen:8150000000000000000,maxHp:8.25e+21}]},
  "fadlands":{normal:[{name:"A Very Sad Slinky :c",type:"normal",attackRate:1,power:400000000000000000000,toughness:400000000000000000000,hpRegen:40000000000000000000,maxHp:4.1e+22},{name:"Giant Metal Spinning Top",type:"rapid",attackRate:1,power:402000000000000000000,toughness:402000000000000000000,hpRegen:40200000000000000000,maxHp:4.1e+22},{name:"A Stack of Krazy Bonez",type:"charger",attackRate:1.1,power:404000000000000000000,toughness:404000000000000000000,hpRegen:40400000000000000000,maxHp:4.15e+22},{name:"Rare Foil Pokeyman Card (Enemy)",type:"normal",attackRate:1.2,power:406000000000000000000,toughness:406000000000000000000,hpRegen:40600000000000000000,maxHp:4.15e+22},{name:"A Busted Gameboy",type:"poison",attackRate:1.2,power:408000000000000000000,toughness:408000000000000000000,hpRegen:40800000000000000000,maxHp:4.2e+22},{name:"A Worthless Bean-y Baby",type:"rapid",attackRate:0.8,power:410000000000000000000,toughness:410000000000000000000,hpRegen:41000000000000000000,maxHp:4.2e+22}],boss:[{name:"THE SLAMMER",type:"charger",attackRate:1.2,power:4.12e+20,toughness:4.12e+20,hpRegen:4.12e+19,maxHp:4.25e+22},{name:"DEMONIC FLURBIE",type:"grower",attackRate:1.2,power:4.15e+20,toughness:4.15e+20,hpRegen:4.15e+19,maxHp:4.25e+22}]},
  "jrpgville":{normal:[{name:"Sentient Pile of Belts",type:"normal",attackRate:1,power:2e+21,toughness:2e+21,hpRegen:200000000000000000000,maxHp:2.1e+23},{name:"Mimic 'Mimic Chest' Chest",type:"paralyze",attackRate:1,power:2.02e+21,toughness:2.02e+21,hpRegen:202000000000000000000,maxHp:2.1e+23},{name:"A Suplexing Train",type:"charger",attackRate:1.1,power:2.04e+21,toughness:2.04e+21,hpRegen:204000000000000000000,maxHp:2.15e+23},{name:"The Annoying Fan",type:"normal",attackRate:1.2,power:2.06e+21,toughness:2.06e+21,hpRegen:206000000000000000000,maxHp:2.15e+23},{name:"The Infinity+1 Sword",type:"poison",attackRate:1.2,power:2.08e+21,toughness:2.08e+21,hpRegen:208000000000000000000,maxHp:2.2e+23},{name:"The Damage Cap",type:"grower",attackRate:1.1,power:2.1e+21,toughness:2.1e+21,hpRegen:210000000000000000000,maxHp:2.2e+23}],boss:[{name:"FINAL BOSS",type:"normal",attackRate:1.2,power:2.12e+21,toughness:2.12e+21,hpRegen:212000000000000000000,maxHp:2.25e+23},{name:"TRUE FINAL BOSS",type:"grower",attackRate:1.2,power:2.15e+21,toughness:2.15e+21,hpRegen:215000000000000000000,maxHp:2.25e+23}]},
  "radlands":{normal:[{name:"Small Bart",type:"normal",attackRate:1,power:2e+24,toughness:2e+24,hpRegen:2e+23,maxHp:2.1e+26},{name:"Nuclear Power Pants",type:"poison",attackRate:1.2,power:2.08e+24,toughness:2.08e+24,hpRegen:2.08e+23,maxHp:2.2e+26},{name:"Lame Security Guard",type:"normal",attackRate:1,power:2e+24,toughness:2e+24,hpRegen:2e+23,maxHp:2.1e+26},{name:"A Giant Vat of Plutonium-238",type:"charger",attackRate:1.1,power:2.04e+24,toughness:2.04e+24,hpRegen:2.04e+23,maxHp:2.15e+26},{name:"Mutant Zombie Marie Curie",type:"normal",attackRate:1.2,power:2.06e+24,toughness:2.06e+24,hpRegen:2.06e+23,maxHp:2.15e+26},{name:"Pair of Shades Wearing Shades",type:"paralyze",attackRate:1,power:2.02e+24,toughness:2.02e+24,hpRegen:2.02e+23,maxHp:2.1e+26},{name:"A Wandering Gamma Ray",type:"grower",attackRate:1,power:2.1e+24,toughness:2.1e+24,hpRegen:2.1e+23,maxHp:2.2e+26},{name:"A Massive Sealed Vault",type:"normal",attackRate:1.2,power:2.12e+24,toughness:2.12e+24,hpRegen:2.12e+23,maxHp:2.25e+26}],boss:[{name:"A.C SKATER",type:"normal",attackRate:1,power:2e+24,toughness:2e+24,hpRegen:2e+23,maxHp:2.1e+26},{name:"RADIOACTIVE MACGUFFIN",type:"grower",attackRate:1.2,power:2.15e+24,toughness:2.15e+24,hpRegen:2.15e+23,maxHp:2.25e+26}]},
  "backtoschool":{normal:[{name:"A Different Greasy Nerd",type:"normal",attackRate:1,power:3e+26,toughness:3e+26,hpRegen:3e+25,maxHp:3.1e+28},{name:"A Really Strict Nun",type:"normal",attackRate:1.2,power:3.06e+26,toughness:3.06e+26,hpRegen:3.06e+25,maxHp:3.15e+28},{name:"Sentient Jock Strap",type:"paralyze",attackRate:1,power:3.02e+26,toughness:3.02e+26,hpRegen:3.02e+25,maxHp:3.1e+28},{name:"The Flying Spinelli Monster",type:"charger",attackRate:1.1,power:3.04e+26,toughness:3.04e+26,hpRegen:3.04e+25,maxHp:3.15e+28},{name:"The Mystery Meat",type:"grower",attackRate:1.1,power:3.1e+26,toughness:3.1e+26,hpRegen:3.1e+25,maxHp:3.2e+28},{name:"The Nun's Ruler",type:"poison",attackRate:1.2,power:3.08e+26,toughness:3.08e+26,hpRegen:3.08e+25,maxHp:3.2e+28}],boss:[{name:"BELDING",type:"grower",attackRate:1.2,power:3.15e+26,toughness:3.15e+26,hpRegen:3.15e+25,maxHp:3.25e+28},{name:"WILLY",type:"normal",attackRate:1.2,power:3.12e+26,toughness:3.12e+26,hpRegen:3.12e+25,maxHp:3.25e+28}]},
  "westworld":{normal:[{name:"A Stickman Cowboy",type:"normal",attackRate:1,power:1.5e+27,toughness:1.5e+27,hpRegen:1.5e+26,maxHp:1.5e+29},{name:"A Giant Cannon",type:"paralyze",attackRate:1,power:1.52e+27,toughness:1.52e+27,hpRegen:1.52e+26,maxHp:1.5e+29},{name:"A Pathetic Tumbleweed",type:"poison",attackRate:1.2,power:1.56e+27,toughness:1.56e+27,hpRegen:1.56e+26,maxHp:1.55e+29},{name:"A Single Cow",type:"charger",attackRate:1.2,power:1.58e+27,toughness:1.58e+27,hpRegen:1.58e+26,maxHp:1.6e+29},{name:"Herd of Pissed Off Cows",type:"grower",attackRate:1.1,power:1.6e+27,toughness:1.6e+27,hpRegen:1.6e+26,maxHp:1.6e+29},{name:"The Entire Bar",type:"rapid",attackRate:1.1,power:1.54e+27,toughness:1.54e+27,hpRegen:1.54e+26,maxHp:1.55e+29}],boss:[{name:"THE OUTLAW",type:"normal",attackRate:1.2,power:1.62e+27,toughness:1.62e+27,hpRegen:1.62e+26,maxHp:1.65e+29},{name:"THE SHERIFF",type:"grower",attackRate:1.2,power:1.65e+27,toughness:1.65e+27,hpRegen:1.65e+26,maxHp:1.65e+29}]},
  "breadverse":{normal:[{name:"Grandma's 'Brownies'",type:"normal",attackRate:1,power:1e+29,toughness:1.2e+29,hpRegen:1.2e+28,maxHp:5.5e+30},{name:"Angry Raw Cookie Dough",type:"paralyze",attackRate:1,power:1.02e+29,toughness:1.22e+29,hpRegen:1.22e+28,maxHp:5.4e+30},{name:"A Bearded Breaded Braid",type:"normal",attackRate:1,power:1e+29,toughness:1.2e+29,hpRegen:1.2e+28,maxHp:5.6e+30},{name:"Butcher & Candlestick Maker",type:"normal",attackRate:1,power:1e+29,toughness:1.2e+29,hpRegen:1.2e+28,maxHp:5.7e+30},{name:"The Ex-Greatest Thing",type:"charger",attackRate:1.1,power:1.04e+29,toughness:1.24e+29,hpRegen:1.24e+28,maxHp:5.8e+30},{name:"Moldy Slice Of Bread",type:"normal",attackRate:1.2,power:1.06e+29,toughness:1.26e+29,hpRegen:1.26e+28,maxHp:5.9e+30}],boss:[{name:"THE YEAST BEAST",type:"poison",attackRate:1.2,power:1.08e+29,toughness:1.28e+29,hpRegen:1.28e+28,maxHp:6e+30},{name:"A DAY-OLD BAGUETTE",type:"grower",attackRate:1.2,power:1.1e+29,toughness:1.3e+29,hpRegen:1.35e+28,maxHp:6e+30}]},
  "seventies":{normal:[{name:"A Groovy Saxophone",type:"normal",attackRate:1,power:3e+29,toughness:4e+29,hpRegen:4e+28,maxHp:2.02e+31},{name:"A Giant Pair Of Roller Skates",type:"paralyze",attackRate:1,power:3.02e+29,toughness:4.02e+29,hpRegen:4.02e+28,maxHp:2.02e+31},{name:"A 70's Porn Mustasche",type:"normal",attackRate:1,power:3e+29,toughness:4e+29,hpRegen:4e+28,maxHp:2.03e+31},{name:"A Disgusting Bong",type:"normal",attackRate:1,power:3e+29,toughness:4e+29,hpRegen:4e+28,maxHp:2.03e+31},{name:"A Hippie with a Hip",type:"charger",attackRate:1.1,power:3.04e+29,toughness:4.04e+29,hpRegen:4.04e+28,maxHp:2.04e+31},{name:"Holy Crap It's Another Shark",type:"rapid",attackRate:1.2,power:3.06e+29,toughness:4.06e+29,hpRegen:4.06e+28,maxHp:2.04e+31}],boss:[{name:"THE WORST VINYL RECORD",type:"poison",attackRate:1.2,power:3.08e+29,toughness:4.08e+29,hpRegen:4.08e+28,maxHp:2.05e+31},{name:"THE 'FRO",type:"grower",attackRate:1.2,power:3.15e+29,toughness:4.1e+29,hpRegen:4.15e+28,maxHp:2.06e+31}]},
  "halloweenies":{normal:[{name:"Ultra Instinct Stoner",type:"normal",attackRate:1,power:1e+30,toughness:1.2e+30,hpRegen:1.2e+29,maxHp:6e+31},{name:"A Skeleton Inside a Body",type:"paralyze",attackRate:1,power:1e+30,toughness:1.22e+30,hpRegen:1.22e+29,maxHp:6e+31},{name:"A Badly Made Sexy Florida Costume",type:"normal",attackRate:1,power:1e+30,toughness:1.2e+30,hpRegen:1.2e+29,maxHp:6e+31},{name:"An Unnecessary Sequel",type:"normal",attackRate:1,power:1e+30,toughness:1.2e+30,hpRegen:1.2e+29,maxHp:6e+31},{name:"An Elevator Full of Blood",type:"charger",attackRate:1.1,power:1.04e+30,toughness:1.24e+30,hpRegen:1.24e+29,maxHp:6.5e+31},{name:"Candy Corn",type:"normal",attackRate:1.2,power:1.06e+30,toughness:1.26e+30,hpRegen:1.26e+29,maxHp:6.5e+31}],boss:[{name:"TEXAS CHAINSAW MASCARA",type:"normal",attackRate:1.2,power:1.08e+30,toughness:1.28e+30,hpRegen:1.28e+29,maxHp:6e+31},{name:"JIGSAW",type:"charger",attackRate:1.2,power:1.12e+30,toughness:1.3e+30,hpRegen:1.25e+29,maxHp:6.5e+31}]},
  "construction":{normal:[{name:"A Construction Slob",type:"poison",attackRate:1,power:4e+31,toughness:4.2e+31,hpRegen:4.2e+30,maxHp:2.05e+33},{name:"Quicksand Cement",type:"rapid",attackRate:1,power:4.02e+31,toughness:4.22e+31,hpRegen:4.22e+30,maxHp:2.04e+33},{name:"A Cement Truck",type:"normal",attackRate:1,power:4e+31,toughness:4.2e+31,hpRegen:4.2e+30,maxHp:2.06e+33},{name:"A Bulldozer",type:"normal",attackRate:1,power:4e+31,toughness:4.2e+31,hpRegen:4.2e+30,maxHp:2.07e+33},{name:"3 Guys Carrying a Beam",type:"normal",attackRate:1.1,power:4.04e+31,toughness:4.24e+31,hpRegen:4.24e+30,maxHp:2.08e+33},{name:"A Piano-Safe",type:"exploder",attackRate:14,power:4.06e+31,toughness:4.26e+31,hpRegen:4.26e+30,maxHp:2.09e+33}],boss:[{name:"7 GUYS TAKING A BREAK",type:"normal",attackRate:1.2,power:4.08e+31,toughness:4.28e+31,hpRegen:4.28e+30,maxHp:2.1e+33},{name:"THE CRANE",type:"charger",attackRate:1.2,power:4.1e+31,toughness:4.3e+31,hpRegen:4.35e+30,maxHp:2.1e+33}]},
  "duckduck":{normal:[{name:"A Duck",type:"normal",attackRate:1,power:1e+32,toughness:1e+32,hpRegen:1e+30,maxHp:5.02e+33},{name:"Another Duck",type:"normal",attackRate:1,power:1.02e+32,toughness:1.02e+32,hpRegen:1.02e+30,maxHp:5.02e+33},{name:"...Goose!",type:"normal",attackRate:1,power:1e+32,toughness:1e+32,hpRegen:1e+30,maxHp:5.03e+33},{name:"Scientifically Accurate Duck",type:"paralyze",attackRate:1,power:1e+32,toughness:1e+32,hpRegen:1e+30,maxHp:5.03e+33},{name:"A MotherDucker",type:"charger",attackRate:1.1,power:1.04e+32,toughness:1.04e+32,hpRegen:1.04e+30,maxHp:5.04e+33},{name:"Totally A Duck",type:"rapid",attackRate:1.2,power:1.06e+32,toughness:1.06e+32,hpRegen:1.06e+30,maxHp:5.04e+33}],boss:[{name:"THE DOG",type:"grower",attackRate:1.2,power:1.08e+32,toughness:1.08e+32,hpRegen:1.08e+30,maxHp:5.05e+33},{name:"A SINGLE GRAPE",type:"poison",attackRate:1.2,power:1e+32,toughness:1.1e+32,hpRegen:1e+30,maxHp:5.06e+33}]},
  "netherregions":{normal:[{name:"A Patch of Tulips",type:"normal",attackRate:1,power:2.5e+32,toughness:2.5e+32,hpRegen:2.5e+30,maxHp:1.2e+34},{name:"A Random Lady",type:"paralyze",attackRate:1,power:2.5e+32,toughness:2.5e+32,hpRegen:2.52e+30,maxHp:1.2e+34},{name:"A Lost Canadian Moose :c",type:"normal",attackRate:1,power:2.5e+32,toughness:2.5e+32,hpRegen:2.5e+30,maxHp:1.2e+34},{name:"A 5-Bladed Windmill",type:"charger",attackRate:1.1,power:2.54e+32,toughness:2.54e+32,hpRegen:2.54e+30,maxHp:1.25e+34},{name:"A Jerk Cyclist",type:"normal",attackRate:1.2,power:2.56e+32,toughness:2.56e+32,hpRegen:2.56e+30,maxHp:1.25e+34},{name:"A Dutch Oven",type:"normal",attackRate:1,power:2.5e+32,toughness:2.5e+32,hpRegen:2.5e+30,maxHp:1.2e+34}],boss:[{name:"THE GRAND DUTCH DUCHY",type:"normal",attackRate:1.2,power:2.58e+32,toughness:2.68e+32,hpRegen:2.58e+30,maxHp:1.3e+34},{name:"DAAN VAN DER VAAN JAANSEN",type:"charger",attackRate:1.2,power:2.6e+32,toughness:2.6e+32,hpRegen:2.55e+30,maxHp:1.3e+34}]},
  "aethereansea":{normal:[{name:"A Seagull",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"Cosmic Jellyfish",type:"paralyze",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.32e+32,maxHp:8.2e+35},{name:"Aether Eel",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"You.",type:"charger",attackRate:1.1,power:1.34e+34,toughness:1.34e+34,hpRegen:1.34e+32,maxHp:8.25e+35},{name:"A Pi-rat",type:"rapid",attackRate:1.2,power:1.36e+34,toughness:1.36e+34,hpRegen:1.36e+32,maxHp:8.25e+35},{name:"A Bunch of Old Newspapers",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"Another You.",type:"paralyze",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.32e+32,maxHp:8.25e+35},{name:"A Paddlefish",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.26e+35},{name:"An Anglerfish",type:"rapid",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.27e+35},{name:"A Bunch of Cannons",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.28e+35},{name:"A Pile of Ropes",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"Ladders!",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"And Snakes!!!",type:"poison",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"The First Pirate",type:"normal",attackRate:1.2,power:1.36e+34,toughness:1.36e+34,hpRegen:1.36e+32,maxHp:8.25e+35},{name:"The Second Pirate",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"The Third Pirate",type:"normal",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.2e+35},{name:"The Fourth Pirate",type:"paralyze",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.32e+32,maxHp:8.2e+35}],boss:[{name:"THE BUCKET",type:"normal",attackRate:1.2,power:1.38e+34,toughness:1.38e+34,hpRegen:1.38e+32,maxHp:8.34e+35},{name:"A TAR BLOB MONSTER",type:"poison",attackRate:1,power:1.3e+34,toughness:1.3e+34,hpRegen:1.3e+32,maxHp:8.34e+35},{name:"RAMSHACKLE SEA INN",type:"charger",attackRate:1.1,power:1.34e+34,toughness:1.34e+34,hpRegen:1.34e+32,maxHp:8.35e+35},{name:"THE CAPTAIN",type:"charger",attackRate:1.2,power:1.3e+34,toughness:1.3e+34,hpRegen:1.35e+32,maxHp:8.35e+35}]}
});

/*
 * Moyenne des ennemis normaux réels d'une zone (jamais les boss, qui ont
 * leur propre variance) — sert à 2 choses : 1) le facteur d'échelle qui
 * ramène les PV réels du wiki (petits nombres, ex. 40-5200) au même
 * ordre de grandeur que z.oneHitP déjà utilisé partout côté SOREAL
 * (ancrage explicite sur cette donnée déjà wiki-vérifiée, jamais un
 * nouveau nombre inventé) ; 2) la référence Power/Attack Rate "moyenne
 * de zone" pour juger si UN mob précis est relativement plus ou moins
 * dangereux que la moyenne de sa zone.
 */
/*
 * Audit zones 2026-09-23 : une valeur non publiée par le wiki (null, ex.
 * attackRate "?" des ennemis normaux de The Rad-Lands) est exclue de la
 * moyenne au lieu d'y compter pour 0 -- sinon la moyenne de zone serait
 * tirée vers 0 par des valeurs inconnues, pas par des valeurs réelles.
 */
export function idleAdventureBestiaryAverageV1(list,key){
  if(!list||!list.length)return 0;
  let total=0,count=0;
  for(const m of list){const v=m&&m[key];if(v==null||!Number.isFinite(+v))continue;total+=+v;count++}
  return count?total/count:0;
}

/*
 * Facteur d'échelle PV réel -> échelle SOREAL, ancré sur z.oneHitP (déjà
 * wiki-vérifié, cf. commentaire 2026-09-14 sur IDLE_ADVENTURE_ZONES) :
 * scale = oneHitP / (moyenne des Max HP réels des mobs normaux de la
 * zone). Par construction, appliquer ce facteur à la moyenne redonne
 * exactement oneHitP — le fallback zone-plat (monstre "moyen") et le
 * nouveau calcul par-mob restent donc cohérents entre eux, seule la
 * variance RÉELLE autour de cette moyenne (un mob plus ou moins costaud
 * que ses voisins de zone, comme le vrai wiki le documente) devient enfin
 * visible côté SOREAL.
 */
export const IDLE_ADVENTURE_TITANS=Object.freeze([
/*
 * Re-audit 2026-09-13 (Norman : "boss ennemis pas pareil en aventure") :
 * re-vérifié en direct au navigateur (wiki, page Adventure_Mode, ligne
 * "8. Gordon Ramsay Bolton", First Titan) — Manual P/T = 1 300 / 1 300,
 * pas 1 350 / 1 350 (capture d'écran de la ligne du tableau, pas
 * seulement le texte brut).
 */
/*
 * Idle P/T pour les Titans (2026-09-18, même passe que les zones -- voir le
 * commentaire détaillé au-dessus de IDLE_ADVENTURE_ZONES). Contrairement
 * aux zones normales, la page Adventure_Mode publie ICI une vraie
 * structure à TROIS paliers par Titan (Manual/Idle/AutoKill, parfois avec
 * un 4e chiffre Regen sur l'AutoKill), vérifiée en direct au navigateur
 * 2026-09-18, colonne "Idle P/T" de chaque ligne Titan. Seuls idleP/idleT
 * sont ajoutés ici (AutoKill hors périmètre de ce correctif -- SOREAL n'a
 * aucune mécanique "Automatically Kill Titans", jamais construite).
 *
 * t1 (GRB) : Idle P/T = 2 300 / 2 100.
 * t2 (Grand Corrupted Tree) : Idle P/T = 6 000 / 5 000.
 * t3 (Jake From Accounting) : Idle P/T = 22 000 / 14 000.
 * t4 (UUG) : Idle P/T = 600 000 / 400 000.
 *
 * t5 (Walderp) : AUCUNE valeur Idle P/T publiée -- le wiki précise
 * explicitement sur sa propre ligne du tableau : "Walderp cannot be idled
 * due to his ability" (seules des colonnes Manual et AutoKill existent
 * pour lui, jamais de colonne Idle). Champ idleP/idleT volontairement
 * absent sur t5 ci-dessous, jamais inventé.
 *
 * t6 (The Beast) : voir idleP/idleT ajoutés directement dans chaque palier
 * de `difficulties` ci-dessous (Idle P/T publié séparément par palier
 * Easy/Normal/Hard/Brutal, comme Manual/AutoKill le sont déjà).
 *
 * t7 (The Exile, "Ninth Titan" du wiki) : AUCUNE valeur Idle P/T publiée --
 * la page Adventure_Mode ne montre pour lui que des colonnes Manual et
 * AutoKill par palier, avec la note "AutoKills for the Exile are also
 * unlocked by 24 manual kills at that difficulty, unlikely to reach idle
 * stats before it" (sous-entend que le concept "Idle" existe en théorie
 * pour ce Titan mais n'est jamais chiffré par le wiki). Champ idleP/idleT
 * volontairement absent sur t7 plus bas, jamais inventé.
 */
{id:"t1",name:"GRB",boss:58,cooldown:H,p:1300,t:1300,idleP:2300,idleT:2100,autoKillP:3000,autoKillT:2500,drop:"aNumber",unlock:"ngu",avatarLevel:3},
{id:"t2",name:"Grand Corrupted Tree",boss:66,cooldown:H,p:5000,t:4000,idleP:6000,idleT:5000,autoKillP:9000,autoKillT:7000,drop:"giantSeed",unlock:"yggdrasil",avatarLevel:4,requiresTitan:"t1",requiresKills:24,requiresUnlock:"ngu"},
{id:"t3",name:"Jake From Accounting",boss:82,cooldown:2*H,p:14000,t:12000,idleP:22000,idleT:14000,autoKillP:25000,autoKillT:15000,drop:"scrapPaper",unlock:"diggers",avatarLevel:5,requiresTitan:"t2",requiresKills:24,requiresUnlock:"yggdrasil"},
{id:"t4",name:"UUG",boss:100,cooldown:2*H,p:400000,t:300000,idleP:600000,idleT:400000,autoKillP:800000,autoKillT:400000,drop:"uugHair",unlock:"beards",flag:"ringOfApathyMaxed",avatarLevel:6,requiresTitan:"t3",requiresKills:28,requiresUnlock:"diggers"},
/*
 * V144 — Norman (2026-09-11) : "pas le choix", suite du monde Normal
 * après les 4 zones simples. Manual P/T (Form 1 pour Walderp, 4 paliers
 * réels pour The Beast) et cooldown copiés du wiki (vérifiés au
 * navigateur). requiresTitan/requiresKills/requiresUnlock (chaîne
 * anti-skip t1→t4) est une invention SOREAL déjà assumée (cf. commentaire
 * V49 plus bas, "100 hours of Titan cooldown") pour RALENTIR la
 * progression — jamais un blocage du vrai NGU. Ne pas inventer un
 * nouveau palier pour t5/t6 sans confirmation de Norman : gate laissé au
 * seul seuil de boss réel.
 *
 * Walderp : Norman (2026-09-11) a confirmé que ce n'est "pas vraiment
 * un minijeu... il faut juste aller à certains endroits et faire
 * certaines choses" — reproduit pour de vrai (V147) : 5 formes (Manual
 * P/T du wiki, forms[] ci-dessous), et entre chaque forme (sauf la
 * dernière), Walderp se cache dans un panneau de l'app tiré au sort
 * (WALDERP_HIDE_PANELS_V147) — le combat suivant reste bloqué
 * (TITAN_CACHE) tant que le joueur ne l'a pas retrouvé (action
 * titanFound, cf. plus bas), qui démarre ALORS le vrai cooldown de 180
 * minutes avant la forme suivante. Aucun butin sur les formes 1-4 (le
 * wiki : "After killing Walderp's final form he will begin to drop his
 * items") — seule la 5e forme (et toutes les suivantes, "Final Form"
 * permanente) donne le butin. Simplification assumée : pas de fenêtre
 * de 3 minutes ni de visibilité progressive (le wiki décrit un cycle où
 * il se re-cache si on met trop de temps) — une fois cache, il reste
 * dans le MÊME panneau jusqu'à ce qu'on le trouve, sans limite de temps.
 *
 * The Beast : les 4 paliers réels (Easy/Normal/Hard/Brutal, Manual P/T
 * du wiki, ×10 à chaque palier) SONT reproduits — Norman (2026-09-11) :
 * "c'est pas vraiment des minijeu, il faut juste faire certaines choses,
 * non ?" confirmé : ce n'est qu'un choix de seuil, pas une mécanique à
 * inventer. difficulties{} porte les 4 jeux de seuils ; titan() ci-dessous
 * sélectionne celui demandé par p.difficulty (repli sur "easy"). Le
 * cooldown (respawn) est UNIQUE et partagé entre les 4 paliers (le wiki
 * n'affiche qu'une seule valeur "Respawn: 210 minutes", pas une par
 * palier) — combattre The Beast à n'importe quelle difficulté consomme
 * le même unique cooldown. Butin : Slimy (set) commun aux 4 paliers
 * (wiki : "All Modes"), Heroic Sigil idem ; Normal/Hard/Brutal ajoutent
 * CHACUN un objet rare supplémentaire au butin garanti (au lieu du jet
 * aléatoire à % du wiki — titan() ne fait aucun tirage aléatoire
 * aujourd'hui, ajouter une chance% ici serait une mécanique nouvelle non
 * demandée ; le garantir à la place reste honnête : plus dur = strictement
 * plus de butin, jamais moins).
 */
{id:"t5",name:"Walderp",boss:116,cooldown:3*H,drop:"wanderersCane",avatarLevel:6,forms:[
  {p:800000,t:400000},
  {p:1600000,t:800000},
  {p:2400000,t:1500000},
  {p:3200000,t:2300000},
  {p:4000000,t:3000000,autoKillP:13000000,autoKillT:7000000}
]},
{id:"t6",name:"The Beast",boss:132,cooldown:3.5*H,drop:"heroicSigil",avatarLevel:6,difficulties:{
  easy:{p:700000000,t:500000000,idleP:1e9,idleT:7e8,autoKillP:2.5e9,autoKillT:1.6e9},
  normal:{p:7000000000,t:5000000000,idleP:1e10,idleT:7e9,autoKillP:2.5e10,autoKillT:1.6e10},
  hard:{p:70000000000,t:50000000000,idleP:1e11,idleT:7e10,autoKillP:2.5e11,autoKillT:1.6e11},
  brutal:{p:700000000000,t:500000000000,idleP:1e12,idleT:7e11,autoKillP:2.5e12,autoKillT:1.6e12}
}},
/*
 * The Exile (2026-09-18, Norman : "il faut tout faire" -- prérequis
 * "Exile v4 vaincu" du déblocage Sadistic, wiki "SADISTIC difficulty").
 * Wiki NGU local, page "The Exile" : 9e Titan, débloqué en battant le
 * boss 190 EN DIFFICULTÉ EVIL (hors périmètre de ce champ `boss`, qui ne
 * connaît que le compteur de boss courant -- pas une régression, aucun
 * autre titan de cette liste n'est encore gated par difficulté non plus).
 * Respawn 330 minutes = 5.5*H. 4 paliers (Easy/Normal/Hard/Brutal), p/t =
 * stats "Manual" recommandées du wiki (même convention que The Beast
 * ci-dessus). AutoKill (2026-09-27, correctif hors-ligne) : voir
 * advanceTitanAutoKillV1 -- seuils autoKillP/autoKillT/autoKillKills ci-
 * dessous, page "The Exile" (24 manual kills en alternative aux stats).
 * drop="stillBeatingHeart" (guaranteed
 * lvl 4, débloque Cards -- wiki : "guaranteed to drop A Still-Beating
 * Heart, which unlocks Cards"). Butin complet (Exile (set), Hat of Greed,
 * Blue Eyes White Chestplate, etc.) volontairement HORS périmètre de ce
 * correctif -- seul le combat/tracking "v4 vaincu" est nécessaire pour la
 * condition de déblocage Sadistic ; le butin sera une passe séparée.
 */
{id:"t7",name:"The Exile",boss:190,evilOnly:true,cooldown:5.5*H,drop:"stillBeatingHeart",avatarLevel:6,difficulties:{
  easy:{p:2.3e22,t:1.2e22,autoKillP:1e23,autoKillT:5e22,autoKillKills:24},
  normal:{p:3.72e23,t:1.56e23,autoKillP:2e24,autoKillT:1e24,autoKillKills:24},
  hard:{p:7.45e24,t:3.55e24,autoKillP:4e25,autoKillT:2e25,autoKillKills:24},
  brutal:{p:2.2e26,t:1.0e26,autoKillP:7.5e26,autoKillT:3.7e26,autoKillKills:24}
}},
/*
 * 2026-09-23 (audit, page Titans + page de chaque titan) : Greasy Nerd (7e), The Godmother
 * (8e), IT HUNGERS (10e), ROCK LOBSTER (11e) et AMALGAMATE (12e) n'existaient pas. Seuils
 * "Manual P/T" de la page de chaque titan (tableau des recommandations), cooldown, boss de
 * déblocage et difficulté minimale de la page Titans. Le Greasy Nerd et la Godmother
 * déverrouillent Hacks et Wishes (objets Incriminating Evidence / A Severed Unicorn's Head).
 * Non modélisé : la quête du Secrets and Spoilers (Nerd, Godmother, IT HUNGERS), le butin
 * d'objets qui n'existent pas encore, GLOP (IT HUNGERS), les 3 objets « paper » (ROCK LOBSTER),
 * le Ring of Apathy (AMALGAMATE Brutal), TIPPI et THE TRAITOR (respawn/EXP/or/butin non publiés).
 */
{id:"nerd",name:"Greasy Nerd",boss:125,evilOnly:true,cooldown:4.5*H,drop:"incriminatingEvidence",avatarLevel:6,difficulties:{
  easy:{p:1.37e14,t:8.9e13,idleP:3e14,idleT:2e14,autoKillP:5e14,autoKillT:2.5e14},
  normal:{p:3.2e15,t:1.6e15,idleP:6e15,idleT:4e15,autoKillP:1e16,autoKillT:5e15},
  hard:{p:5.5e16,t:3.5e16,idleP:1.2e17,idleT:8e16,autoKillP:2e17,autoKillT:1e17},
  brutal:{p:1.3e18,t:7.5e17,idleP:2.5e18,idleT:1.5e18,autoKillP:5e18,autoKillT:2.5e18}
}},
{id:"godmother",name:"The Godmother",boss:166,evilOnly:true,cooldown:5*H,drop:"severedUnicornHead",avatarLevel:6,difficulties:{
  easy:{p:1.7e18,t:7e17,autoKillP:5e18,autoKillT:2.5e18},
  normal:{p:3.9e19,t:1.5e19,autoKillP:1e20,autoKillT:5e19},
  hard:{p:6.6e20,t:3.5e20,autoKillP:2e21,autoKillT:1e21},
  brutal:{p:1.5e22,t:6.4e21,autoKillP:5e22,autoKillT:2.5e22}
}},
{id:"hungers",name:"IT HUNGERS",boss:175,sadisticOnly:true,cooldown:6.5*H,drop:"",avatarLevel:6,difficulties:{
  easy:{p:1.55e28,t:3e27,autoKillP:4e28,autoKillT:2e28,autoKillKills:5},
  normal:{p:1.3e29,t:3.6e28,autoKillP:3.2e29,autoKillT:1.6e29,autoKillKills:5},
  hard:{p:7.83e29,t:1.61e29,autoKillP:2e30,autoKillT:1e30,autoKillKills:5},
  brutal:{p:3.95e30,t:9e29,autoKillP:1e31,autoKillT:5e30,autoKillKills:5}
}},
{id:"lobster",name:"ROCK LOBSTER",boss:224,sadisticOnly:true,cooldown:7*H,drop:"",avatarLevel:6,difficulties:{
  easy:{p:1.1e31,t:4e30,autoKillP:1.8e31,autoKillT:6e30,autoKillKills:5},
  normal:{p:6e31,t:1.8e31,autoKillP:9e31,autoKillT:3e31,autoKillKills:5},
  hard:{p:2.4e32,t:8.6e31,autoKillP:3.6e32,autoKillT:1.2e32,autoKillKills:5},
  brutal:{p:7.5e32,t:2.5e32,autoKillP:1.1e33,autoKillT:3.6e32,autoKillKills:5}
}},
{id:"amalgamate",name:"AMALGAMATE",boss:248,sadisticOnly:true,cooldown:(433+1/3)/60*H,drop:"",avatarLevel:6,difficulties:{
  easy:{p:1.47e33,t:4.7e32,autoKillP:3e33,autoKillT:1e33,autoKillKills:5},
  normal:{p:5.6e33,t:2.1e33,autoKillP:1.2e34,autoKillT:4e33,autoKillKills:5},
  hard:{p:2.13e34,t:6.11e33,autoKillP:3.6e34,autoKillT:1.2e34,autoKillKills:5},
  brutal:{p:4.12e34,t:1e34,autoKillP:7.2e34,autoKillT:2.4e34,autoKillKills:5}
}},
/*
 * 2026-09-25 : 13e et 14e titans (Sadistic). Pages « TIPPI THE TUTORIAL MOUSE » et « THE TRAITOR (titan) » du wiki + tableau de la page Titans.
 * Seuils = « Recommended stats to defeat titan » (même lecture que les autres titans) : Tippi 40 Dc Power (4E+34) / 15 Dc Toughness (1,5E+34),
 * le Traitor 150 Dc (1,5E+35) / 40 Dc (4E+34) ; le wiki y ajoute HP 1,5E+35 et Regen 1,5E+33 pour le Traitor (non testés : seuls Power et
 * Toughness le sont pour tous les titans). Déblocage : boss 296 pour Tippi (la page du titan et le tableau de la page Titans se contredisent :
 * 296 contre 295 ; on suit la page du titan), boss 300 pour le Traitor + Tippi tué au moins une fois. Respawn, EXP, AP, or et butin de
 * Tippi : rien de publié (« the only purpose this titan serves is that you have to kill it at least once to unlock the Traitor » = un commentaire) ;
 * même chose pour le respawn du Traitor : on applique le plancher du wiki (« a minimum of 60 minutes »), rien d'inventé de plus.
 * secret : ni nom ni carte tant que le titan n'est pas accessible.
 */
{id:"tippi",name:"TIPPI THE TUTORIAL MOUSE",boss:296,sadisticOnly:true,secret:true,cooldown:H,p:4e34,t:1.5e34,drop:"",avatarLevel:6},
{id:"traitor",name:"THE TRAITOR",boss:300,sadisticOnly:true,secret:true,cooldown:H,p:1.5e35,t:4e34,drop:"",avatarLevel:6,requiresTitan:"tippi",requiresKills:1}
]);
