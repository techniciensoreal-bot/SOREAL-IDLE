export const IDLE_ADVENTURE_V47="ADVENTURE-V47-NGU-EARLY";
const MAX=100, H=3600000;
const N=(v,d=0)=>Number.isFinite(+v)?+v:d,I=(v,d=0)=>Math.floor(N(v,d)),C=(v,a,b)=>Math.max(a,Math.min(b,N(v,a))),X=v=>JSON.parse(JSON.stringify(v));
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
{id:"safe",name:"Safety Zone",boss:4,p:0,t:0,set:"",dropLevel:0,avatarLevel:1},
{id:"tutorial",name:"Tutoriel SOREAL",boss:4,p:10,t:10,oneHitP:129.5,bossChance:1/4,set:"training",dropLevel:10,avatarLevel:1},
{id:"sewers",name:"Biobox maudites",boss:7,p:12,t:12,oneHitP:194,bossChance:1/4,set:"sewers",dropLevel:4,avatarLevel:1},
{id:"forest",name:"Forêt de palettes",boss:17,p:35,t:35,oneHitP:1134,bossChance:2/9,set:"forest",dropLevel:1,avatarLevel:2},
{id:"cave",name:"Chambre froide",boss:37,p:150,t:150,oneHitP:3811,bossChance:3/16,set:"cave",dropLevel:0,avatarLevel:2},
{id:"sky",name:"Quai céleste",boss:48,p:600,t:400,oneHitP:11420,bossChance:1/5,set:"",dropLevel:0,avatarLevel:3},
{id:"hsb",name:"High Security Base SOREAL",boss:58,p:700,t:500,oneHitP:15220,bossChance:1/5,set:"hsb",dropLevel:0,avatarLevel:3},
{id:"clock",name:"Horloge du dépôt",boss:66,p:3250,t:2250,oneHitP:107110,bossChance:2/9,set:"clock",dropLevel:0,avatarLevel:4},
{id:"2d",name:"Zone 2D",boss:74,p:4500,t:3500,oneHitP:168223,bossChance:1/4,set:"2d",dropLevel:0,avatarLevel:4},
{id:"ancient",name:"Ancien entrepôt",boss:82,p:12000,t:10000,oneHitP:282966,bossChance:1/4,set:"spoopy",dropLevel:0,avatarLevel:5},
{id:"avsp",name:"Endroit très étrange",boss:90,p:28000,t:18000,oneHitP:842483,bossChance:1/4,set:"gaudy",dropLevel:0,avatarLevel:5},
{id:"mega",name:"Mega Lands SOREAL",boss:100,p:125000,t:60000,oneHitP:3540000,bossChance:1/5,set:"mega",dropLevel:0,avatarLevel:6},
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
{id:"beardverse",name:"The Beardverse",boss:108,p:1300000,t:550000,oneHitP:46230000,bossChance:1/4,set:"beardverse",dropLevel:0,avatarLevel:6},
{id:"badly",name:"Badly Drawn World",boss:116,p:18000000,t:11000000,oneHitP:889080000,bossChance:1/4,set:"badly",dropLevel:0,avatarLevel:6},
{id:"boring",name:"Boring-Ass Earth",boss:124,p:180000000,t:90000000,oneHitP:7210000000,bossChance:2/9,set:"stealth",dropLevel:0,avatarLevel:6},
{id:"chocolate",name:"Chocolate World",boss:137,p:70000000000,t:50000000000,oneHitP:2720000000000,bossChance:3/13,set:"choco",dropLevel:0,avatarLevel:6}
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
  "mega":{normal:[{name:"Broken VCR Man",type:"rapid",attackRate:1,power:63500,toughness:63000,hpRegen:7620,maxHp:3600000},{name:"Mr Plow",type:"normal",attackRate:1.1,power:63700,toughness:63700,hpRegen:7621,maxHp:3650000},{name:"ROBUTT",type:"poison",attackRate:1.2,power:63700,toughness:63100,hpRegen:7623,maxHp:3700000},{name:"Former Canadian PM Stephen Harper",type:"rapid",attackRate:1.2,power:63100,toughness:63100,hpRegen:7626,maxHp:3750000},{name:"A Cyberdemon",type:"charger",attackRate:1.2,power:63200,toughness:63100,hpRegen:7629,maxHp:3800000},{name:"Robo Rat 9000",type:"paralyze",attackRate:1.2,power:63200,toughness:63100,hpRegen:7629,maxHp:3850000},{name:"Butter-Passing Robot",type:"normal",attackRate:1.2,power:64200,toughness:63100,hpRegen:7629,maxHp:3950000}],boss:[{name:"Doctor Wahwee",type:"rapid",attackRate:1.2,power:64300,toughness:63300,hpRegen:7660,maxHp:4200000}]},
  "beardverse":{normal:[{name:"A Bearded Lady",type:"rapid",attackRate:1,power:740000,toughness:740000,hpRegen:74000,maxHp:50000000},{name:"A Bearded Man",type:"charger",attackRate:1,power:740000,toughness:740000,hpRegen:74000,maxHp:50000000},{name:"Cousin Itt",type:"normal",attackRate:1.1,power:742000,toughness:742000,hpRegen:74200,maxHp:51000000},{name:"A Naked Molerat",type:"rapid",attackRate:1.2,power:744000,toughness:744000,hpRegen:74400,maxHp:52000000},{name:"Rob Boss",type:"exploder",attackRate:12,power:746000,toughness:746000,hpRegen:74600,maxHp:40000000},{name:"Gossamer",type:"paralyze",attackRate:1.2,power:748000,toughness:748000,hpRegen:74800,maxHp:53000000}],boss:[{name:"An Orange Toupée With Fists",type:"charger",attackRate:1.2,power:750000,toughness:750000,hpRegen:75000,maxHp:54000000},{name:"A Clogged Shower Drain",type:"poison",attackRate:1.2,power:750000,toughness:750000,hpRegen:75000,maxHp:55000000}]},
  "badly":{normal:[{name:"Badly Drawn Dragon",type:"normal",attackRate:1,power:11000000,toughness:11000000,hpRegen:1100000,maxHp:1000000000},{name:"Really Bad Sonic Fanart",type:"charger",attackRate:1,power:11200000,toughness:11200000,hpRegen:1102000,maxHp:1000000000},{name:"Badly Drawn Schoolgirl",type:"poison",attackRate:1.1,power:11400000,toughness:11400000,hpRegen:1140000,maxHp:1010000000},{name:"No Enemy(?)",type:"rapid",attackRate:1.2,power:11600000,toughness:11600000,hpRegen:1160000,maxHp:1020000000},{name:"Really Bad MLP Fanart",type:"grower",attackRate:1.1,power:11800000,toughness:11800000,hpRegen:1180000,maxHp:1030000000},{name:"Loss.png",type:"paralyze",attackRate:1.2,power:11000000,toughness:11000000,hpRegen:1100000,maxHp:1040000000}],boss:[]},
  "boring":{normal:[{name:"The Eiffel Tower",type:"normal",attackRate:1,power:89000000,toughness:89000000,hpRegen:8900000,maxHp:8500000000},{name:"A Mummy",type:"charger",attackRate:1,power:89000000,toughness:89000000,hpRegen:8900000,maxHp:8500000000},{name:"A Daddy",type:"poison",attackRate:1.1,power:89200000,toughness:89200000,hpRegen:8920000,maxHp:8520000000},{name:"Two Bananas In Pyjamas",type:"rapid",attackRate:1.2,power:89400000,toughness:89400000,hpRegen:8940000,maxHp:8540000000},{name:"Giant Raisins From California",type:"grower",attackRate:1.1,power:89600000,toughness:89600000,hpRegen:8960000,maxHp:8560000000},{name:"An Annoying Penguin",type:"paralyze",attackRate:1.2,power:89800000,toughness:89800000,hpRegen:8980000,maxHp:8580000000},{name:"An Army of Annoying Penguins",type:"rapid",attackRate:1.2,power:90000000,toughness:90000000,hpRegen:9000000,maxHp:8600001000}],boss:[{name:"The Elusive 'C.S'",type:"poison/paralyze",attackRate:1.2,power:90000000,toughness:90000000,hpRegen:9000000,maxHp:8600000000}]},
  "chocolate":{normal:[{name:"Chocolate Mouse",type:"normal",attackRate:1,power:30000000000,toughness:30000000000,hpRegen:3000000000,maxHp:3000000000000},{name:"Chocolate Mimic",type:"rapid",attackRate:1,power:30100000000,toughness:30100000000,hpRegen:3010000000,maxHp:3050000000000},{name:"Chocolate Crowbar (Enemy)",type:"poison",attackRate:1.1,power:30100000000,toughness:30100000000,hpRegen:3010000000,maxHp:3050000000000},{name:"Chocolate Freeman",type:"rapid",attackRate:1.2,power:30200000000,toughness:30200000000,hpRegen:3020000000,maxHp:3100000000000},{name:"Chocolate Fondue",type:"exploder",attackRate:12,power:30200000000,toughness:30200000000,hpRegen:3020000000,maxHp:3100000000000},{name:"Chocolate Slime",type:"poison",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Dark Chocolate",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Chocolate Salty Balls",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Screaming Chocolate Fish",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"A Mighty Lump of Poo",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000}],boss:[{name:"Melted Chocolate Blob (?)",type:"grower",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000},{name:"Choco Golem",type:"rapid",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000},{name:"Type 2 Diabetes",type:"charger",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000}]}
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
export function idleAdventureBestiaryAverageV1(list,key){
  if(!list||!list.length)return 0;
  let total=0;for(const m of list)total+=N(m&&m[key]);
  return total/list.length;
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
export function idleAdventureMobScaleV1(z,bestiaryZone){
  const avgHp=idleAdventureBestiaryAverageV1(bestiaryZone&&bestiaryZone.normal,"maxHp");
  if(!avgHp)return 0;
  return N(z.oneHitP||z.t)/avgHp;
}
export const IDLE_ADVENTURE_TITANS=Object.freeze([
/*
 * Re-audit 2026-09-13 (Norman : "boss ennemis pas pareil en aventure") :
 * re-vérifié en direct au navigateur (wiki, page Adventure_Mode, ligne
 * "8. Gordon Ramsay Bolton", First Titan) — Manual P/T = 1 300 / 1 300,
 * pas 1 350 / 1 350 (capture d'écran de la ligne du tableau, pas
 * seulement le texte brut).
 */
{id:"t1",name:"GRB",boss:58,cooldown:H,p:1300,t:1300,drop:"aNumber",unlock:"ngu",avatarLevel:3},
{id:"t2",name:"Grand Corrupted Tree",boss:66,cooldown:H,p:5000,t:4000,drop:"giantSeed",unlock:"yggdrasil",avatarLevel:4,requiresTitan:"t1",requiresKills:24,requiresUnlock:"ngu"},
{id:"t3",name:"Jake From Accounting",boss:82,cooldown:2*H,p:14000,t:12000,drop:"scrapPaper",unlock:"diggers",avatarLevel:5,requiresTitan:"t2",requiresKills:24,requiresUnlock:"yggdrasil"},
{id:"t4",name:"UUG",boss:100,cooldown:2*H,p:400000,t:300000,drop:"uugHair",unlock:"beards",flag:"ringOfApathyMaxed",avatarLevel:6,requiresTitan:"t3",requiresKills:28,requiresUnlock:"diggers"},
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
  {p:4000000,t:3000000}
]},
{id:"t6",name:"The Beast",boss:132,cooldown:3.5*H,drop:"heroicSigil",avatarLevel:6,difficulties:{
  easy:{p:700000000,t:500000000},
  normal:{p:7000000000,t:5000000000},
  hard:{p:70000000000,t:50000000000},
  brutal:{p:700000000000,t:500000000000}
}}
]);
const SETS={
training:{name:"Training Set",source:"tutorial",slots:["head","chest","legs","boots","weapon"],p:6,t:8,reward:{experience:10,energySpeed:2}},
sewers:{name:"Sewers Set",source:"sewers",slots:["head","chest","legs","boots","weapon","ring","amulet"],p:20,t:20,reward:{experience:20,adventurePower:5,adventureToughness:5,adventureHp:15,adventureRegen:.2}},
/*
 * V152 — audit wiki (Norman, 2026-09-11, "parcours les pages du wiki et
 * applique tout") : la récompense de complétion réelle du set Forest
 * (wiki, page Forest_(set)) est "2 Energy potions α / 2 Energy potions β /
 * 2 Energy bar bars / +5 Energy power / 200 EXP" — energyBars:1 ci-dessous
 * n'a jamais été sourcé du wiki (aucune mention d'un bonus Energy Bars
 * plat dans cette récompense, seulement Energy Bar BAR — déjà repris
 * correctement par energyBarBar:2), retiré.
 */
forest:{name:"Forest Set",source:"forest",slots:["head","chest","legs","boots","weapon","ring","pendant"],p:176,t:176,reward:{experience:200,energyPower:5,energyPotionA:2,energyPotionB:2,energyBarBar:2}},
cave:{name:"Cave Set",source:"cave",slots:["head","chest","legs","boots","weapon","ring","amulet","combat"],p:470,t:470,reward:{experience:300,magicPower:2,magicBars:2,magicCap:40000}},
hsb:{name:"HSB Set",source:"hsb",slots:["head","chest","legs","boots","weapon","ring","amulet"],p:1090,t:1090,reward:{experience:500,magicPower:3,magicBars:3,magicCap:30000,magicPotionA:1,magicPotionB:1,magicBarBar:1}},
grb:{name:"GRB Set",source:"t1",slots:["head","chest","legs","boots","weapon","necklace","meat"],p:3120,t:2660,reward:{experience:2000,safeZoneRegen10x:true,noEquipmentChallenge:true}},
clock:{name:"Clock Set",source:"clock",slots:["head","chest","legs","boots","weapon","alarm","sands"],p:6080,t:4840,reward:{experience:1000,respawn:.05}},
"2d":{name:"2D Set",source:"2d",slots:["head","chest","legs","boots","weapon","cube","amulet"],p:10960,t:7310,reward:{experience:2000,drop:.0743}},
spoopy:{name:"Spoopy Set",source:"ancient",slots:["head","chest","legs","boots","weapon","ring","amulet"],p:20396,t:11070,reward:{experience:3000,idleAttack:true}},
jake:{name:"Jake Set",source:"t3",slots:["head","chest","legs","boots","weapon","tie","paperweight"],p:26540,t:13561,reward:{experience:7000,wandoosMeh:true,diggerSlot:1}},
gaudy:{name:"Gaudy Set",source:"avsp",slots:["head","chest","legs","boots","weapon"],p:42060,t:19800,reward:{experience:5000,luckyCharms:2,extraDropLevelChance:.10}},
mega:{name:"Mega Set",source:"mega",slots:["head","chest","legs","boots","weapon"],p:90400,t:44800,reward:{experience:6000,chargeMultiplier:2.2}},
/*
 * V143 — p/t = "Total Power/Toughness Max" copiés directement des pages
 * de set du wiki NGU (vérifiées au navigateur le 2026-09-11), pas une
 * extrapolation. reward = uniquement les bonus de complétion RÉELLEMENT
 * exprimables avec le vocabulaire déjà existant de setRewards :
 * - beardverse (8 000 EXP réel) : le wiki ajoute aussi "10% de pénalité
 *   de vitesse en moins en équipant plusieurs Beards de même ressource",
 *   qui suppose tout le système "Beards" (non construit chez SOREAL) —
 *   volontairement omis plutôt qu'approximé.
 * - badly (30k EXP + 5k AP + boosts 20% plus efficaces réels) :
 *   "boostEffectiveness" est un NOUVEAU champ de reward, branché dans
 *   applyBoost() ci-dessous — la seule des 4 récompenses qui correspond
 *   à un mécanisme déjà existant côté SOREAL.
 * - stealth (50k EXP + 10k AP réels) : le wiki débloque aussi un coffre
 *   rare "The Stealthiest Armour" — nécessite un mécanisme de coffre/
 *   remplacement de pièce qui n'existe pas encore, omis.
 * - choco : la récompense réelle du wiki ("débloque MacGuffins/Bar Bar")
 *   dépend ENTIÈREMENT du système MacGuffins (non construit) — aucun
 *   nombre à mettre ici sans l'inventer, reward volontairement vide.
 */
beardverse:{name:"Beardverse Set",source:"beardverse",slots:["head","chest","legs","boots","weapon"],p:175000,t:111000,reward:{experience:8000}},
badly:{name:"Badly Drawn Set",source:"badly",slots:["head","chest","legs","boots","weapon"],p:1000000,t:530000,reward:{experience:30000,ap:5000,boostEffectiveness:.2}},
stealth:{name:"Stealth Set",source:"boring",slots:["head","chest","legs","boots","weapon"],p:2040000,t:1054000,reward:{experience:50000,ap:10000}},
choco:{name:"Choco Set",source:"chocolate",slots:["head","chest","legs","boots","weapon"],p:7780000,t:3286000,reward:{}},
/*
 * V144 — uug : UUG's Rings (set) est 5 anneaux COÉQUIPABLES simultanément
 * (Greed/Might/Utility/Way Too Much Energy/Way Too Much Magic), pas 5
 * emplacements corps distincts comme les autres sets. equip() traite déjà
 * tout item avec slot==="accessory" comme un ajout à un tableau (pas un
 * remplacement unique), sans jamais comparer o.slot — les 5 noms de slot
 * ci-dessous ne servent donc QU'au suivi de complétion (itemList/
 * checkSets), le vrai emplacement d'équipement reste "accessory" pour
 * les 5 (câblé côté client). wanderer/rerednaw : 4 pièces chacun (pas de
 * "weapon" — le Cane/Candy Cane sont des objets à part, pas repris ici).
 * Récompenses : uniquement exp/ap réels ; "Fanny Pack"/"Dorky Glasses"
 * ("débloque le 1er/2e emplacement accessoire") sont sans objet chez
 * SOREAL (accessories est déjà un tableau sans limite, aucun palier à
 * débloquer) ; "UUG's Special Ring" (coffre rare) et le bonus "Parry"
 * de Slimy dépendent de mécaniques non construites, omis.
 *
 * V149 — bug trouvé en vérifiant l'inventaire complet du monde Normal
 * (Norman, 2026-09-11 : "tu as terminé d'adapter le mode normal
 * alors ?") : le set était bien défini et se complétait correctement
 * une fois les objets obtenus, mais titan() (ci-dessous) n'avait JAMAIS
 * de branche id==="t4" pour le faire réellement tomber au combat — UUG
 * était donc battable indéfiniment sans jamais droper son propre set en
 * jeu normal, seulement via addItem manuel (comme utilisé par les
 * tests). Corrigé, même schéma que t1/t3/t5/t6.
 */
uug:{name:"UUG's Rings Set",source:"t4",slots:["ringGreed","ringMight","ringUtility","ringEnergy","ringMagic"],p:19332,t:19332,reward:{experience:20000,ap:20000}},
wanderer:{name:"Wanderer's Set",source:"t5",slots:["head","chest","legs","boots"],p:8000,t:184000,reward:{experience:50000,ap:10000}},
rerednaw:{name:"S'rerednaW Set",source:"t5",slots:["head","chest","legs","boots"],p:8000,t:180000,reward:{experience:50000,ap:10000}},
slimy:{name:"Slimy Set",source:"t6",slots:["head","chest","legs","boots","weapon"],p:4484000,t:2154000,reward:{experience:100000,ap:10000}}
};
export const IDLE_ADVENTURE_SETS=Object.freeze(Object.fromEntries(Object.entries(SETS).map(([id,s])=>[id,Object.freeze({id,...s})])));
/*
 * Audit wiki par pièce (2026-09-15, Norman : "je veux que chaque item ait
 * exactement les mêmes statistiques que dans NGU Idle... tu dois regarder
 * chacune des pages du wiki avec les sets d'armures"). item()/idleAdventureBaseStatsV1
 * ci-dessous répartissaient jusqu'ici Power/Toughness du SET de façon
 * ÉGALE entre toutes ses pièces (s.p/k, s.t/k) — jamais la vraie
 * répartition du wiki, où l'arme porte l'essentiel du Power (et rien en
 * Toughness) tandis que les pièces d'armure portent le Toughness (et peu
 * ou pas de Power), avec des valeurs souvent inégales entre elles.
 *
 * Chaque entrée ci-dessous = "Stats Max" (niveau 100) copié tel quel de
 * la fiche wiki dédiée (ngu-idle.fandom.com/wiki/<Set>_(set)), vérifiée au
 * navigateur le 2026-09-15 pour les 16 sets déjà présents dans SETS
 * ci-dessus. Même convention que s.p/s.t au niveau SET (déjà établie
 * plus haut) : ces valeurs sont le total à NIVEAU 100 (double du niveau
 * 0) — item() continue de diviser par 2 puis d'appliquer q=1+niveau/100,
 * jamais une nouvelle formule.
 *
 * Découverte en vérifiant : dans TOUS les objets contrôlés (armes,
 * armures, anneaux/amulettes), HP Max = Power×3 et HP Regen =
 * Toughness×0.03, SANS EXCEPTION (aux arrondis wiki près sur 1 item de
 * Mega). C'est manifestement une vraie règle du moteur NGU, pas une
 * coïncidence par set — jamais besoin de stocker HP Max/Regen à part,
 * item()/special() les dérivent directement de power/toughness.
 *
 * Audit complété 2026-09-16 (Norman : "mets à jour les stats des objets
 * avant notre update des chiffres") pour les 4 derniers sets non audités
 * (2d, uug, wanderer, rerednaw) — mêmes fiches wiki dédiées
 * (ngu-idle.fandom.com/wiki/2D_(set), .../UUG's_rings_(set),
 * .../Wanderer's_(set), .../S'rerednaW_(set)), même convention "Stats Max"
 * niveau 100. Les totaux par set (s.p/s.t ci-dessus) étaient déjà
 * corrects — seule la répartition PAR PIÈCE était fausse (égale au lieu
 * de suivre la vraie fiche wiki).
 */
const SET_ITEM_STATS_V1=Object.freeze({
  "training:weapon":{p:6,t:0},"training:head":{p:0,t:2},"training:chest":{p:0,t:2},"training:legs":{p:0,t:2},"training:boots":{p:0,t:2},
  "sewers:weapon":{p:40,t:0},"sewers:head":{p:0,t:10},"sewers:chest":{p:0,t:10},"sewers:legs":{p:0,t:10},"sewers:boots":{p:0,t:10},"sewers:ring":{p:2,t:2},"sewers:amulet":{p:10,t:10},
  "forest:weapon":{p:160,t:0},"forest:head":{p:0,t:40},"forest:chest":{p:0,t:40},"forest:legs":{p:0,t:40},"forest:boots":{p:0,t:40},"forest:ring":{p:16,t:16},
  "cave:weapon":{p:400,t:0},"cave:head":{p:0,t:100},"cave:chest":{p:0,t:100},"cave:legs":{p:0,t:100},"cave:boots":{p:0,t:100},"cave:ring":{p:8,t:8},"cave:amulet":{p:2,t:2},"cave:combat":{p:60,t:60},
  "hsb:weapon":{p:1000,t:0},"hsb:head":{p:0,t:250},"hsb:chest":{p:0,t:250},"hsb:legs":{p:0,t:250},"hsb:boots":{p:0,t:250},"hsb:ring":{p:90,t:90},"hsb:amulet":{p:0,t:0},
  "grb:weapon":{p:2000,t:160},"grb:head":{p:500,t:500},"grb:chest":{p:40,t:500},"grb:legs":{p:40,t:500},"grb:boots":{p:40,t:500},"grb:necklace":{p:500,t:500},"grb:meat":{p:0,t:0},
  "clock:weapon":{p:5000,t:160},"clock:head":{p:60,t:860},"clock:chest":{p:40,t:890},"clock:legs":{p:40,t:1000},"clock:boots":{p:40,t:1030},"clock:alarm":{p:900,t:900},"clock:sands":{p:0,t:0},
  "spoopy:weapon":{p:17776,t:600},"spoopy:head":{p:100,t:2000},"spoopy:chest":{p:160,t:2070},"spoopy:legs":{p:140,t:2120},"spoopy:boots":{p:120,t:2180},"spoopy:ring":{p:2100,t:2100},"spoopy:amulet":{p:0,t:0},
  "jake:weapon":{p:23000,t:0},"jake:head":{p:160,t:2600},"jake:chest":{p:160,t:2500},"jake:legs":{p:160,t:2798},"jake:boots":{p:160,t:2600},"jake:tie":{p:0,t:163},"jake:paperweight":{p:2900,t:2900},
  "gaudy:weapon":{p:40000,t:0},"gaudy:head":{p:560,t:4800},"gaudy:chest":{p:500,t:5000},"gaudy:legs":{p:600,t:5200},"gaudy:boots":{p:400,t:4800},
  "mega:weapon":{p:88000,t:0},"mega:head":{p:600,t:11200},"mega:chest":{p:600,t:11200},"mega:legs":{p:600,t:11400},"mega:boots":{p:600,t:11000},
  "beardverse:weapon":{p:166000,t:12000},"beardverse:head":{p:2200,t:24000},"beardverse:chest":{p:2200,t:25000},"beardverse:legs":{p:2200,t:25000},"beardverse:boots":{p:2400,t:25000},
  "badly:weapon":{p:1000000,t:50000},"badly:head":{p:0,t:120000},"badly:chest":{p:0,t:120000},"badly:legs":{p:0,t:120000},"badly:boots":{p:0,t:120000},
  "stealth:weapon":{p:2000000,t:120000},"stealth:head":{p:10000,t:224000},"stealth:chest":{p:10000,t:230000},"stealth:legs":{p:10000,t:236000},"stealth:boots":{p:10000,t:244000},
  "choco:weapon":{p:7600000,t:400000},"choco:head":{p:60000,t:704000},"choco:chest":{p:40000,t:740000},"choco:legs":{p:40000,t:710000},"choco:boots":{p:40000,t:732000},
  "slimy:weapon":{p:4400000,t:200000},"slimy:head":{p:22000,t:484000},"slimy:chest":{p:22000,t:500000},"slimy:legs":{p:20000,t:490000},"slimy:boots":{p:20000,t:480000},
  "2d:weapon":{p:9200,t:600},"2d:head":{p:100,t:1200},"2d:chest":{p:100,t:1290},"2d:legs":{p:140,t:1520},"2d:boots":{p:120,t:1400},"2d:cube":{p:1300,t:1300},"2d:amulet":{p:0,t:0},
  "uug:ringGreed":{p:0,t:0},"uug:ringMight":{p:13332,t:13332},"uug:ringUtility":{p:2000,t:2000},"uug:ringEnergy":{p:2000,t:2000},"uug:ringMagic":{p:2000,t:2000},
  "wanderer:head":{p:2000,t:44000},"wanderer:chest":{p:2000,t:46000},"wanderer:legs":{p:2000,t:46000},"wanderer:boots":{p:2000,t:48000},
  "rerednaw:head":{p:2000,t:42000},"rerednaw:chest":{p:2000,t:44000},"rerednaw:legs":{p:2000,t:46000},"rerednaw:boots":{p:2000,t:48000}
});
export function idleAdventureItemStatsMaxV1(set,slot){
  const override=SET_ITEM_STATS_V1[`${set}:${slot}`];
  if(override)return override;
  const s=SETS[set],k=Math.max(1,s?.slots.length||1);
  return{p:N(s?.p)/k,t:N(s?.t)/k};
}
/*
 * Audit 2026-09-13 (Norman : "trop d'objets n'ont pas encore leurs stats") :
 * special() (plus bas) renvoyait systématiquement power:0/toughness:0 pour
 * TOUS les accessoires d'Aventure ci-dessous, quel que soit l'objet réel —
 * seul le champ `p`/`t` (absent jusqu'ici) aurait pu porter une vraie
 * valeur. Chaque objet vérifié individuellement sur sa fiche dédiée du wiki
 * NGU (ngu-idle.fandom.com/wiki/<Nom exact de l'objet>, gabarit "Item_data") :
 * `p`/`t` reprennent le "Max stat at lvl 0" de Power/Toughness quand la
 * fiche en liste un (même convention que basePower=s.p/k/2 pour
 * l'équipement — valeur au niveau 0, qui DOUBLE au niveau 100 ; vérifié sur
 * chaque fiche que "Max stat at max lvl" = 2× "Max stat at lvl 0").
 * Beaucoup d'accessoires réels n'ont EFFECTIVEMENT aucune stat Power/
 * Toughness (ils ne donnent que des bonus "Specials" en %, ex. Energy/Magic
 * Cap/Power/Speed, Drop Chance) — SOREAL n'a jamais construit de mécanisme
 * de bonus par objet pour ces Specials (seuls les Specials globaux déjà
 * câblés via setRewards existent), donc les ajouter serait une NOUVELLE
 * mécanique non demandée : volontairement omis, `p`/`t` valent alors bien
 * 0 ci-dessous — valeur réelle et vérifiée du wiki, pas un oubli.
 */
const SPECIALS=Object.freeze({
/*
 * Pas de fiche wiki dédiée ("Tutorial Cube" n'existe pas sur le wiki) :
 * ceci représente uniquement le déblocage SOREAL du Cube, jamais un objet
 * réel. Norman (2026-09-14) : "le cube de l'infini ne tombe plus dans le
 * monde tutoriel." Confirmé : zone valait "sewers" (une zone PLUS TARDIVE,
 * id="sewers", palier 7) alors que son propre nom et son dropLevel (4)
 * correspondent exactement à IDLE_ADVENTURE_ZONES[0] (id="tutorial",
 * palier 4, la toute première zone) — une vraie incohérence interne,
 * jamais une zone volontairement plus difficile.
 */
/*
 * Correctif 2026-09-14 (Norman : "le tutorial cube doit pouvoir être
 * équipé comme un bijoux avant d'être transformé en cube de l'infini") —
 * vérifié en direct sur le wiki NGU (page "4G's Merge and Boost Tutorial
 * Cube") : Type Accessory, Drop Zone "lvl 4 in Sewers" (pas Tutorial
 * Zone — la page Sewers le liste explicitement en "Rare Drops"), Power/
 * Toughness base 0, max au niveau 0 = 7, max au niveau 100 = 14 (la
 * formule ×(1+niveau/100) déjà utilisée par special() donne exactement
 * ce doublement avec p:7,t:7). Avant ce correctif, zone:"tutorial" et
 * p:0,t:0 (aucune stat, jamais sourcé du wiki) — et equip() rejetait
 * tout kind==='cube' sans distinction, alors que seul le Cube DÉJÀ
 * débloqué (transformé, cf. record() plus bas) doit rester inéquipable ;
 * avant ce seuil, c'est un accessoire normal comme n'importe quel autre.
 */
/*
 * Correctif 2026-09-16 (Norman : "tu ne dois rien laisser différent de
 * NGU") : wiki ngu-idle.fandom.com/wiki/Sewers, section Loot > Boss —
 * "4G's Merge and Boost Tutorial Cube lvl 4 (10% base chance)", listé
 * uniquement sous les drops du BOSS (Brown Slime), jamais des ennemis
 * normaux. bossOnly:true + dropChance:0.10 (roll dédié dans rollKill,
 * jamais mélangé au pool générique 4% partagé par les autres SPECIALS).
 */
tutorialCube:{name:"Tutorial Cube",zone:"sewers",slot:"special",cube:true,dropLevel:4,p:7,t:7,bossOnly:true,dropChance:0.10},
// wiki : "The Tuba of Time" — Power/Toughness Max stat at lvl 0 = 10/10.
tubaTime:{name:"Tuba of Time",zone:"forest",slot:"accessory",dropLevel:1,p:10,t:10},
// wiki : "Cheese Grater" — Power Max at lvl 0 = 15 ; aucune stat Toughness listée.
cheeseGrater:{name:"Cheese Grater",zone:"cave",slot:"accessory",dropLevel:1,p:15,t:0},
// wiki : "A Dragon's Left Ball" — aucune stat Power/Toughness (Specials seulement : Magic Cap/Power).
skyBall:{name:"A Dragon's Left Ball",zone:"sky",slot:"accessory",dropLevel:1,p:0,t:0},
// wiki : "Pissed Off Key" — Type Consumable, aucune stat.
pissedOffKey:{name:"Pissed Off Key",zone:"sky",slot:"special",unlock:"tower",bossOnly:true,dropLevel:0,p:0,t:0},
/*
 * Audit 2026-09-16 (Norman, page wiki réelle vérifiée en direct
 * ngu-idle.fandom.com/wiki/The_Lonely_Flubber) : Accessoire, Tutorial
 * Zone, ID 120, Set None, aucune stat Power/Toughness (le Respawn 8%
 * n'apparaît qu'à l'évolution "The Triple Flubber" à la maximisation,
 * non implémentée ici). Chance de drop unique parmi les SPECIALS :
 * "drop chance is based off in CURRENT run's highest defeated boss,
 * starting at 0.82% at boss 59, and increasing by 0.41% every boss
 * after, up to 100% at boss 300... This item is NOT affected by drop
 * chance multipliers." Roll dédié dans rollKill (jamais gagné avant
 * boss 59, jamais multiplié par dropMult) -- contrairement à Tutorial
 * Cube (bossOnly), tombe aussi bien sur les mobs normaux que sur le
 * boss de zone (confirmé par le wiki : "the item drops equally from
 * normal enemies and bosses"). set:"training" est purement cosmétique
 * (partage le dossier R2 déjà résolu pour le Training Set,
 * "SOREAL_IDLE_Tutorial_Set" -- voir IDLE_ITEM_SET_FOLDER_ALIASES côté
 * SOREAL-APP), jamais compté comme une pièce du set (checkSets() ignore
 * ce champ, voir commentaire de special() plus haut).
 */
flubber:{name:"The Lonely Flubber",zone:"tutorial",slot:"accessory",set:"training",dropLevel:0,p:0,t:0},
// wiki : "A busted copy of Wandoos 98" — consommable de déblocage d'OS, aucune stat.
wandoos98:{name:"Wandoos 98",zone:"sky",slot:"special",unlock:"wandoos",dropLevel:0,p:0,t:0},
// wiki : "Magicite Crystal" — Power/Toughness Max at lvl 0 = 50/50.
magicite:{name:"Magicite Crystal",zone:"hsb",slot:"accessory",dropLevel:1,p:50,t:50},
// wiki : "Giant Windup Gear" — Power/Toughness Max at lvl 0 = 150/150.
windupGear:{name:"Giant Windup Gear",zone:"clock",slot:"accessory",dropLevel:1,p:150,t:150},
// wiki : "A Sinusoidal Wave" — aucune stat Power/Toughness (Specials seulement : Energy/Magic Cap).
sinusoidalWave:{name:"A Sinusoidal Wave",zone:"2d",slot:"accessory",dropLevel:1,p:0,t:0},
// wiki : "Ghost Typewriter" — Power/Toughness Max at lvl 0 = 600/600.
ghostTypewriter:{name:"Ghost Typewriter",zone:"ancient",slot:"accessory",dropLevel:1,p:600,t:600},
// wiki : "Gaudy Epaulettes" — Power/Toughness Max at lvl 0 = 900/900.
gaudyShoulders:{name:"Gaudy Epaulettes",zone:"avsp",slot:"accessory",dropLevel:1,p:900,t:900},
// wiki : "The F Tank" — Power/Toughness Max at lvl 0 = 4 000/4 000.
fTank:{name:"The F Tank",zone:"mega",slot:"accessory",dropLevel:1,p:4000,t:4000},
// wiki : "Ring of Apathy" — pas de section Stats du tout, aucune stat Power/Toughness.
ringOfApathy:{name:"Ring of Apathy",zone:"forest",slot:"accessory",dropLevel:1,maxFlag:"ringOfApathyMaxed",requiresBoss:100,p:0,t:0},
// wiki : "A Beard Comb" — aucune stat Power/Toughness (Specials seulement).
beardComb:{name:"Beard Comb",zone:"beardverse",slot:"accessory",dropLevel:1,p:0,t:0},
// wiki : "Random Crayons" — aucune stat Power/Toughness (Specials seulement).
randomCrayons:{name:"Random Crayons",zone:"badly",slot:"accessory",dropLevel:1,p:0,t:0},
// wiki : "Red Lipstick" — aucune stat Power/Toughness (Specials seulement).
redLipstick:{name:"Red Lipstick",zone:"boring",slot:"accessory",dropLevel:1,p:0,t:0},
// wiki : "Candy Corn Necklace" — aucune stat Power/Toughness (Specials seulement).
candyCornNecklace:{name:"Candy Corn Necklace",zone:"chocolate",slot:"accessory",dropLevel:1,p:0,t:0},
/*
 * Audit round 3 (2026-09-14, Norman : "trop d'objets n'ont pas encore
 * leurs stats") : le butin garanti de Walderp (t5, IDLE_ADVENTURE_TITANS)
 * était `drop:"wanderersCane"`, traité par titan() UNIQUEMENT comme un
 * flag unlockItems.wanderersCane — jamais dans unlockMap (consume()
 * l'aurait rejeté) ni dans IDLE_ADVENTURE_UNLOCK_ITEMS_V1 côté client
 * (Soreal_Idle_UI.html, jamais de bouton "Utiliser" proposé pour lui) : un
 * flag inerte, jamais consommé, jamais transformé en objet réel. Vérifié
 * sur sa fiche wiki dédiée (ngu-idle.fandom.com/wiki/Wanderer's_Cane) :
 * "Type: Weapon", PAS un consommable de déblocage comme A Number/Giant
 * Seed/Scrap Paper/UUG's Armpit Hair/Heroic Sigil (ceux-là restent
 * corrects, vérifiés individuellement, chacun bien "Type: Consumable" sans
 * aucune stat sur sa propre fiche) — une vraie arme équipable manquante,
 * pas juste un déblocage de fonctionnalité. Power Max at lvl 0 = 170 000,
 * Toughness Max at lvl 0 = 12 000 (doublement à 340 000/12 000→24 000 au
 * niveau 100, même formule q=1+niveau/100 que les autres SPECIALS),
 * "Item Drop Level : lvl 10 from Titan Walderp" (guaranteed). Ajoutée ici
 * au catalogue et distribuée par titan() (voir plus bas, branche t5) au
 * lieu du flag unlockItems seul — laissé en place, inoffensif, pour ne pas
 * élargir le correctif au-delà du gap stat identifié.
 */
wanderersCane:{name:"Wanderer's Cane",zone:"",slot:"weapon",dropLevel:10,p:170000,t:12000},
/*
 * V145 — butin exclusif aux paliers Normal+/Hard+/Brutal de The Beast
 * (t6), garanti au kill plutôt que le jet aléatoire à % du wiki (voir
 * commentaire sur IDLE_ADVENTURE_TITANS). zone:"" volontairement : ce
 * ne sont pas des butins de zone (jamais sélectionnés par rollKill),
 * uniquement distribués depuis titan().
 */
// wiki : "A Shrunken Voodoo Doll" (lvl 4, Titan The Beast Normal+) — Power/Toughness Max at lvl 0 = 66 666/66 666.
shrunkenVoodooDoll:{name:"Shrunken Voodoo Doll",zone:"",slot:"accessory",dropLevel:4,p:66666,t:66666},
// wiki : "A Priceless Van-Gogh Painting" (lvl 4, Titan The Beast Hard+) — Power/Toughness Max at lvl 0 = 30 000/30 000.
pricelessVanGoghPainting:{name:"A Priceless Van-Gogh Painting",zone:"",slot:"accessory",dropLevel:4,p:30000,t:30000},
// wiki : "A Small Gerbil" (lvl 4, Titan The Beast Brutal) — Power/Toughness Max at lvl 0 = 100 000/100 000.
smallGerbil:{name:"A Small Gerbil",zone:"",slot:"accessory",dropLevel:4,p:100000,t:100000}
});
export const IDLE_ADVENTURE_SPECIALS=SPECIALS;
/*
 * Collection (2026-09-11) — Norman : "je voudrais Renommer Bestiaire en
 * Collection... toutes les armes obtenues et montées niveau max... avec
 * l'image et les stats." itemList (record(), plus bas) ne garde que
 * {maxLevel,seen} par definitionId — jamais de quoi afficher un nom ou
 * une image, et un objet totalement fusionné/jeté n'a alors plus aucune
 * trace exploitable côté client. Ce catalogue statique (même forme que
 * item()/special() ci-dessous, jamais recalculé par joueur) permet de
 * retrouver nom/slot/set pour N'IMPORTE QUEL definitionId déjà rencontré,
 * même longtemps après que l'objet réel a disparu de l'inventaire.
 */
/*
 * Audit 2026-09-13 (Norman) : "Quand on la range dans le coffre, elles
 * doivent se classer dans le bon ordre, pas dans l'ordre où je les mets.
 * Exemple arme, tête, torse, jambe, bottes, anneaux, items de la zone..."
 * SETS déclare ses slots dans un ordre arbitraire de rédaction
 * (head/chest/legs/boots/weapon...), jamais pensé comme un ordre
 * d'affichage. Ce rang canonique reclasse chaque pièce d'équipement à
 * l'intérieur de sa zone, sans jamais réordonner les zones elles-mêmes
 * (déjà dans l'ordre de progression wiki-vérifié) — un seul tri, réutilisé
 * par tout consommateur du catalogue (Collection, Coffre), jamais un
 * second ordre inventé ailleurs.
 */
const IDLE_ADVENTURE_SLOT_RANK_V1={weapon:0,head:1,chest:2,legs:3,boots:4};
function idleAdventureSlotRankV1(slot){
  return IDLE_ADVENTURE_SLOT_RANK_V1[slot]!=null?IDLE_ADVENTURE_SLOT_RANK_V1[slot]:5;
}
export const IDLE_ADVENTURE_ITEM_CATALOG_V1=Object.freeze((()=>{
  const catalog={};
  for(const[setId,s]of Object.entries(SETS)){
    const slotsTries=[...s.slots].sort((a,b)=>idleAdventureSlotRankV1(a)-idleAdventureSlotRankV1(b));
    for(const slot of slotsTries){
      /*
       * Mêmes bases que item() ci-dessus (idleAdventureItemStatsMaxV1/2) —
       * permet au Collection (client) de recalculer Power/Toughness/HP
       * Max/Regen au niveau maxLevel enregistré dans itemList, sans
       * dupliquer une seconde fois la formule ni exiger un objet vivant
       * dans l'inventaire.
       */
      const{p,t}=idleAdventureItemStatsMaxV1(setId,slot);
      const baseP=p/2,baseT=t/2;
      catalog[`${setId}:${slot}`]=Object.freeze({
        kind:"equipment",set:setId,setName:s.name,slot,name:`${s.name} ${slot}`,
        basePower:baseP,baseToughness:baseT,baseHp:baseP*3,baseRegen:baseT*.03
      });
    }
  }
  for(const[id,d]of Object.entries(SPECIALS)){
    catalog[id]=Object.freeze({kind:d.cube?"cube":"special",set:"",setName:"",slot:d.slot,name:d.name,basePower:N(d.p),baseToughness:N(d.t),baseHp:N(d.p)*3,baseRegen:N(d.t)*.03});
  }
  return catalog;
})());
/*
 * Norman (2026-09-16) : "mets à jour les stats des objets avant notre
 * update des chiffres" — wiki NGU (page Boost) confirme 13 vrais paliers :
 * "1, 2, 5, 10, 20, 50, 100, 200, 500, 1k, 2k, 5k and 10k." Il n'en
 * manquait que les 6 derniers (200 à 10k), plafonnant à tort la
 * progression des boosts bien avant le vrai jeu. rollKill() (plus bas)
 * pioche déjà un INDEX dans ce tableau, borné par boss tués — l'étendre
 * suffit, aucune autre formule à toucher.
 */
const BOOSTS=Object.freeze([1,2,5,10,20,50,100,200,500,1000,2000,5000,10000]);
export const IDLE_ADVENTURE_BOOSTS=BOOSTS;
/*
 * hp/regen (2026-09-15) : dérivés de power/toughness (HP Max=Power×3,
 * HP Regen=Toughness×0.03), une règle du moteur NGU vérifiée sans
 * exception sur les ~90 objets audités (voir SET_ITEM_STATS_V1
 * ci-dessus) — jamais une donnée par objet à stocker séparément.
 */
function item(id,set,slot,lv=0){const s=SETS[set],{p,t}=idleAdventureItemStatsMaxV1(set,slot),baseP=p/2,baseT=t/2,q=1+C(lv,0,MAX)/100,power=baseP*q,toughness=baseT*q;return{id,definitionId:`${set}:${slot}`,name:`${s.name} ${slot}`,kind:"equipment",set,slot,level:C(lv,0,MAX),power,toughness,hp:power*3,regen:toughness*.03,special:0}}
/*
 * power/toughness (2026-09-13, cf. commentaire sourcé au-dessus de SPECIALS) :
 * même formule de niveau que item() (q=1+niveau/100, doublement à 100),
 * appliquée à la vraie base Power/Toughness du wiki (d.p/d.t, 0 quand
 * l'objet réel n'en a aucune) au lieu du power:0/toughness:0 fixe d'avant.
 */
/*
 * Audit 2026-09-16 : `special()` ne recopiait jamais `d.set` sur l'objet
 * créé -- le client (urlImageObjetAdventureIdleV138_/iconeObjetAdventureIdleV138_,
 * Soreal_Idle_UI.html) exige `item.set` pour même tenter une résolution
 * d'image réelle, sinon il retombe systématiquement sur une simple
 * emoji générique par slot. Aucun impact sur checkSets() (lit
 * s.itemList[`${setId}:${slot}`], une structure séparée indexée par le
 * SET et SES PROPRES slots -- jamais par le champ .set d'un item
 * individuel), donc un SPECIAL portant un `set` cosmétique (ex. "The
 * Lonely Flubber" -> set:"training", pour partager le dossier R2 du
 * Training Set sans compter comme une pièce du set) ne peut jamais être
 * compté à tort dans une complétion de set.
 */
function special(id,lv=0){const d=SPECIALS[id];if(!d)throw Error("SPECIAL_INVALIDE");const q=1+C(lv,0,MAX)/100,power=N(d.p)*q,toughness=N(d.t)*q;return{id,definitionId:id,name:d.name,kind:d.cube?"cube":"special",slot:d.slot,zone:d.zone,set:d.set||"",level:C(lv,0,MAX),power,toughness,hp:power*3,regen:toughness*.03,special:0}}
function boost(type,strength){if(!["power","toughness","special"].includes(type)||!BOOSTS.includes(+strength))throw Error("BOOST_INVALIDE");return{id:`boost:${type}:${strength}:${Math.random()}`,definitionId:`boost:${type}:${strength}`,name:`Boost ${type} ${strength}`,kind:"boost",boostType:type,strength:+strength,level:0}}
/*
 * Norman (2026-09-14) : "Regarde bien le wiki pour voir les % de
 * chance... JE VEUX QUE CHAQUE STATISTIQUES SOIENT INTEGREES." Le
 * Money Pit (wiki NGU) récompense certains paliers avec un vrai Boost
 * (Power/Toughness/Special, forces 1/2/5/10 — exactement BOOSTS
 * ci-dessus). Exportés pour être réutilisés tels quels par
 * idle-ngu-progression.js (tossMoneyPit) — jamais une seconde
 * fabrique de boost dupliquée.
 */
export function idleAdventureBoostV1(type,strength){return boost(type,strength)}
export function idleAdventureAddItemV1(state,o){return add(state,o)}
function base(){return{version:IDLE_ADVENTURE_V47,selectedZone:"safe",inventory:[],coffre:{},equipment:{head:"",chest:"",legs:"",boots:"",weapon:"",accessories:[]},itemList:{},completedSets:{},setRewards:{experience:0,ap:0,energySpeed:0,energyBars:0,energyPower:0,magicPower:0,magicBars:0,magicCap:0,adventurePower:0,adventureToughness:0,adventureHp:0,adventureRegen:0,respawn:0,drop:0,chargeMultiplier:1,idleAttack:false,noEquipmentChallenge:false,wandoosMeh:false,diggerSlot:0,luckyCharms:0,extraDropLevelChance:0,boostEffectiveness:0},permanent:{experience:0,ap:0,gold:0,energySpeedFlat:0,energyPowerFlat:0,energyBarsFlat:0,magicPowerFlat:0,magicBarsFlat:0,magicCapFlat:0},unlockItems:{},unlockFlags:{},cube:{power:0,toughness:0,unlocked:false},zone:{kills:{},bossKills:{},encounters:{},bossEncounters:{}},titans:{},fight:{active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0},serial:1}}
export function createIdleAdventureStateV47(){return base()}
/*
 * Migration 2026-09-16 (Norman : "je me retrouve avec des stats genre
 * Toughness 2/1 sur mon casque... tu dois mettre à jour les
 * sauvegardes des joueurs déjà en cours [...] tenir compte du nombre
 * de boosts réellement appliqué, ne pas remplir artificiellement les
 * statistiques") — conséquence directe du bug de plafond corrigé plus
 * haut (applyBoost utilisait basePower×2, le plafond ABSOLU, au lieu de
 * basePower×(1+niveau/100), le plafond du NIVEAU COURANT) : des objets
 * boostés SOUS le niveau 100 avaient pu accumuler une stat au-delà de ce
 * que leur vrai niveau autorise (ex. Toughness=2 sur un objet niveau 21,
 * dont le vrai plafond n'est que baseT×1.21≈1). cleanItem() tournant à
 * CHAQUE chargement (normalizeIdleAdventureStateV47, inventaire ET
 * coffre), ce correctif s'applique automatiquement, une seule fois par
 * objet concerné, à TOUTES les sauvegardes déjà en cours, sans action
 * manuelle. Toujours un plafonnement VERS LE BAS (jamais une valeur
 * ajoutée/inventée) : un objet déjà dans les clous n'est jamais modifié,
 * seul l'excédent illégitime (accumulé via le bug, jamais via un vrai
 * boost sous les nouvelles règles) est retiré.
 */
function cleanItem(o){if(!o||typeof o!=="object")return null;const z=X(o);z.id=String(z.id||"");z.definitionId=String(z.definitionId||"");z.level=C(z.level,0,MAX);z.power=Math.max(0,N(z.power));z.toughness=Math.max(0,N(z.toughness));z.special=Math.max(0,N(z.special));const d=defById(z.definitionId);const base=d?.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):(d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):null);if(base){const q=1+z.level/100;z.power=Math.min(z.power,base.baseP*q);z.toughness=Math.min(z.toughness,base.baseT*q);}return z}
export function normalizeIdleAdventureStateV47(raw){if(raw?.version!==IDLE_ADVENTURE_V47)return base();const s=Object.assign(base(),X(raw));s.inventory=(Array.isArray(s.inventory)?s.inventory:[]).map(cleanItem).filter(Boolean);
/*
 * Audit 2026-09-13 (Norman) : "on doit ranger nous-même dans la case
 * appropriée [du coffre]." Le coffre passe d'un tableau libre à un objet
 * indexé par definitionId — UN emplacement fixe par objet du catalogue
 * (ordre de progression déjà wiki-vérifié, IDLE_ADVENTURE_ITEM_CATALOG_V1),
 * jamais un choix libre du joueur. Migration : une ancienne sauvegarde en
 * tableau (mission Phase 12 initiale) est convertie sans perte, en gardant
 * le premier exemplaire déposé par emplacement si plusieurs coexistaient.
 */
if(Array.isArray(s.coffre)){
  const migrated={};
  for(const raw of s.coffre){
    const o=cleanItem(raw);
    if(o&&o.definitionId&&!migrated[o.definitionId])migrated[o.definitionId]=o;
  }
  s.coffre=migrated;
}else if(s.coffre&&typeof s.coffre==="object"){
  const cleaned={};
  for(const[defId,raw]of Object.entries(s.coffre)){
    const o=cleanItem(raw);
    if(o)cleaned[defId]=o;
  }
  s.coffre=cleaned;
}else{
  s.coffre={};
}
s.itemList=s.itemList&&typeof s.itemList==="object"?s.itemList:{};s.completedSets=s.completedSets&&typeof s.completedSets==="object"?s.completedSets:{};s.setRewards=Object.assign(base().setRewards,s.setRewards||{});s.permanent=Object.assign(base().permanent,s.permanent||{});s.unlockItems=s.unlockItems&&typeof s.unlockItems==="object"?s.unlockItems:{};s.unlockFlags=s.unlockFlags&&typeof s.unlockFlags==="object"?s.unlockFlags:{};s.cube=Object.assign(base().cube,s.cube||{});s.titans=s.titans&&typeof s.titans==="object"?s.titans:{};s.fight=Object.assign(base().fight,s.fight&&typeof s.fight==="object"?s.fight:{});
/*
 * Auto-guérison (Norman, 2026-09-09) : "j'ai été en safe zone et l'ennemi
 * est toujours présent." selectZone ne vidait jamais un combat actif
 * resté sur l'ancienne zone quand le joueur changeait de zone en cours
 * de combat — un combat "fantôme" restait actif indéfiniment, visible
 * sur le décor de n'importe quelle zone (y compris la Safe Zone, qui n'a
 * pourtant aucun ennemi). selectZone est corrigé pour ne plus jamais
 * laisser ça se reproduire, mais une sauvegarde déjà bloquée dans cet
 * état doit se réparer TOUTE SEULE au prochain chargement, sans attendre
 * une nouvelle remise à zéro complète.
 */
if(s.fight.active&&s.fight.zone&&s.fight.zone!==s.selectedZone){s.fight=X(base().fight)}
return s}
const defById=id=>{const [set,slot]=String(id).split(":");return SETS[set]?.slots.includes(slot)?{kind:"set",set,slot}:SPECIALS[id]?{kind:"special",id}:null};
/*
 * Correctif 2026-09-13 (Phase 9, audit initial) : remake() recalculait
 * Power/Toughness UNIQUEMENT depuis la formule de niveau (item(),
 * basePower×q), en écrasant toute valeur déjà présente — un boost déjà
 * absorbé avant une fusion était donc perdu à chaque fusion. Une première
 * correction avait tenté de conserver le SURPLUS (valeur actuelle moins
 * la pure formule à l'ancien niveau) en le réappliquant sur la formule au
 * nouveau niveau — mais cette approche était elle-même inventée, jamais
 * vérifiée contre le wiki.
 *
 * Correctif 2026-09-13 (re-audit, Norman : "une arme à 3/3 en force
 * passera 3/4 en fusionnant") : vérifié directement sur
 * ngu-idle.fandom.com/wiki/Inventory : "By upgrading the level of an
 * item, you raise the CAP of stats by 1% per level... The resulting
 * merged item will have the MAX NUMBER in each stat between the original
 * items — e.g., if the first had 3 power and 1 toughness and the second
 * had 1 power and 5 toughness. After merging, the result will have 3
 * power and 5 toughness." La fusion NE RECALCULE JAMAIS via une formule —
 * elle prend simplement le MAX de chaque stat entre les deux objets
 * fusionnés (voir merge() ci-dessous). Le "cap" (basePower×(1+niveau/100),
 * ci-dessous) grandit à chaque fusion via le niveau, mais la valeur
 * courante ne le rattrape PAS automatiquement — d'où le "3/3 → 3/4" :
 * seul un boost supplémentaire peut combler l'écart. remake() est donc
 * supprimée : plus aucun recalcul de formule n'a lieu à la fusion.
 */
function idleAdventureBaseStatsV1(set,slot){if(!SETS[set])return{baseP:0,baseT:0};const{p,t}=idleAdventureItemStatsMaxV1(set,slot);return{baseP:p/2,baseT:t/2}}
/*
 * Équivalent de idleAdventureBaseStatsV1 ci-dessus mais pour un accessoire
 * (SPECIALS), qui n'appartient à aucun set — ajouté le 2026-09-13 avec le
 * reste du correctif Power/Toughness des accessoires (cf. commentaire
 * sourcé au-dessus de SPECIALS) pour que le snapshot affiche la vraie base
 * au lieu de {baseP:0,baseT:0} fixe.
 */
function idleAdventureSpecialBaseStatsV1(id){const d=SPECIALS[id];return d?{baseP:N(d.p),baseT:N(d.t)}:{baseP:0,baseT:0}}
/*
 * Correctif 2026-09-13 (Phase 11, audit) : "objet réellement maxé"
 * (niveau 100) était vérifié par TROIS comparaisons ">=100" séparées —
 * jamais une seule fonction partagée. Unifié ici (niveau seul), fidèle au
 * badge officiel du jeu réel : wiki NGU, page Inventory — "Items that
 * have reached the maximum level of 100 will be... marked with a green
 * 'MAXXED' in their tooltip." C'est bien le NIVEAU seul qui déclenche ce
 * badge dans le vrai jeu, jamais le remplissage des boosts. Utilisée pour
 * le badge général (Collection, Item List) — PAS pour le Coffre, qui a
 * une exigence plus stricte (voir idleAdventureObjetPleinementMaxeV1
 * ci-dessous).
 */
export function idleAdventureNiveauEstMaxV1(niveau){return I(niveau,-1)>=MAX}
/*
 * Coffre (audit 2026-09-13, Norman) : "Une arme ne doit pas être
 * considérée comme maxée si elle n'a pas le level 100 ET les stats au
 * max grâce aux boosts." Exigence PROPRE au Coffre, plus stricte que le
 * badge MAXXED général ci-dessus (qui reste fidèle au niveau seul,
 * exactement comme le vrai jeu) — le Coffre est pensé comme la
 * collection des objets VRAIMENT terminés, boosts compris. Le "plafond"
 * (basePower×2/baseToughness×2 à niveau 100, wiki : "Level 100 items has
 * double the stats of its level 0 counterpart") doit être atteint ou
 * dépassé par la valeur COURANTE (formule + boosts déjà absorbés, voir
 * merge() : la fusion seule ne comble jamais cet écart automatiquement).
 */
function idleAdventureObjetPleinementMaxeV1(o){
  if(!idleAdventureNiveauEstMaxV1(o?.level))return false;
  const d=defById(o?.definitionId);
  if(d?.kind!=="set")return true;
  const{baseP,baseT}=idleAdventureBaseStatsV1(d.set,d.slot);
  return N(o.power)>=baseP*2&&N(o.toughness)>=baseT*2;
}
function record(s,o){if(!o?.definitionId)return;const old=s.itemList[o.definitionId]||{maxLevel:-1};old.maxLevel=Math.max(I(old.maxLevel,-1),I(o.level));old.seen=true;s.itemList[o.definitionId]=old;const d=defById(o.definitionId);if(d?.kind==="special"&&SPECIALS[d.id]?.maxFlag&&idleAdventureNiveauEstMaxV1(old.maxLevel))s.unlockFlags[SPECIALS[d.id].maxFlag]=true;if(o.definitionId==="tutorialCube"&&idleAdventureNiveauEstMaxV1(old.maxLevel)&&!s.unlockFlags.tutorialCubeMaxed){s.cube.unlocked=true;s.unlockFlags.tutorialCubeMaxed=true;s.setRewards.ap=N(s.setRewards.ap)+10000;
/*
 * Le Tutorial Cube (accessoire équipable jusqu'ici) se TRANSFORME en Cube
 * de l'infini à ce seuil (wiki : la fusion/le boost du même objet devient
 * le Cube, qui n'est alors plus jamais équipé/déplacé). Retire toute
 * copie de l'inventaire ET de l'équipement plutôt que de la laisser
 * traîner, inéquipable et sans usage, dans le sac.
 */
s.equipment.accessories=(Array.isArray(s.equipment.accessories)?s.equipment.accessories:[]).filter(accId=>{const e=s.inventory.find(x=>x.id===accId);return !(e&&e.definitionId==="tutorialCube")});
s.inventory=s.inventory.filter(x=>x.definitionId!=="tutorialCube")}checkSets(s)}
function checkSets(s){for(const [id,d] of Object.entries(SETS)){if(s.completedSets[id])continue;const ok=d.slots.every(slot=>idleAdventureNiveauEstMaxV1(s.itemList[`${id}:${slot}`]?.maxLevel));if(!ok)continue;s.completedSets[id]=true;for(const [k,v] of Object.entries(d.reward)){if(typeof v==="number")s.setRewards[k]=N(s.setRewards[k])+v;else if(v)s.setRewards[k]=true}if(N(d.reward.experience)>0)s.permanent.experience=N(s.permanent.experience)+N(d.reward.experience);if(N(d.reward.ap)>0)s.permanent.ap=N(s.permanent.ap)+N(d.reward.ap);if(N(d.reward.energySpeed)>0)s.permanent.energySpeedFlat=N(s.permanent.energySpeedFlat)+N(d.reward.energySpeed);if(N(d.reward.energyPower)>0)s.permanent.energyPowerFlat=N(s.permanent.energyPowerFlat)+N(d.reward.energyPower);if(N(d.reward.energyBars)>0)s.permanent.energyBarsFlat=N(s.permanent.energyBarsFlat)+N(d.reward.energyBars);if(N(d.reward.magicPower)>0)s.permanent.magicPowerFlat=N(s.permanent.magicPowerFlat)+N(d.reward.magicPower);if(N(d.reward.magicBars)>0)s.permanent.magicBarsFlat=N(s.permanent.magicBarsFlat)+N(d.reward.magicBars);if(N(d.reward.magicCap)>0)s.permanent.magicCapFlat=N(s.permanent.magicCapFlat)+N(d.reward.magicCap)}}
/*
 * Capacité de sac réelle (Norman, 2026-09-10) : "j'ai un inventaire
 * infini alors que dans NGU il est limité." Vrai NGU (wiki, page
 * Inventory) : 24 emplacements gratuits au départ, extensibles jusqu'à
 * 384 via des sources qui n'existent pas encore dans SOREAL (boutique
 * EXP, défis, perks, wishes, quirks) — reprend donc la base réelle (24)
 * sans les extensions pas encore construites. Les objets ÉQUIPÉS
 * n'occupent pas de place dans le sac (vrai NGU : la capacité gouverne
 * la grille du sac, pas les emplacements d'équipement) — seuls les
 * objets non équipés comptent. "Si l'inventaire est plein, les nouveaux
 * objets ne sont pas obtenus" (wiki) : add() renvoie null silencieusement
 * plutôt que d'échouer toute l'action (le kill/la victoire a quand même
 * lieu, seul le butin est perdu).
 */
const INVENTORY_CAPACITY_BASE_V1=24;
function inventoryCapacityAdventureV1(s){return INVENTORY_CAPACITY_BASE_V1}
/*
 * Emplacements accessoires (Norman, 2026-09-11) : "chaque fois que j'ajoute
 * un anneau, il me débloque un emplacement supplémentaire... on en a 2 de
 * base et les autres se gagnent ou s'achètent." Vrai NGU (wiki, page
 * "Builds") : 2 emplacements accessoire de base, jusqu'à 14 de plus via
 * l'boutique EXP, 4G's Sellout Shop (AP, difficulté Evil), les Troll
 * Challenges, les Perks, les Quirks (Evil) et les Wishes (Sadistic) — aucune
 * de ces 6 sources n'existe encore dans SOREAL (comme pour la capacité de
 * sac ci-dessus, difficulté Evil/Sadistic et 4G's Sellout Shop non
 * construits). Reprend donc uniquement la base réelle (2) tant que ces
 * sources ne sont pas bâties, plutôt que d'inventer un mécanisme d'achat qui
 * n'existe pas ou de laisser le tableau illimité comme avant ce correctif.
 */
const ACCESSORY_SLOTS_BASE_V1=2;
function accessorySlotsCapacityAdventureV1(s){return ACCESSORY_SLOTS_BASE_V1}
function equippedIdsAdventureV1(s){
  const ids=new Set();
  ["head","chest","legs","boots","weapon"].forEach(slot=>{if(s.equipment[slot])ids.add(s.equipment[slot])});
  (Array.isArray(s.equipment.accessories)?s.equipment.accessories:[]).forEach(id=>{if(id)ids.add(id)});
  return ids;
}
function inventoryUsedAdventureV1(s){
  const equipped=equippedIdsAdventureV1(s);
  return s.inventory.filter(x=>!equipped.has(x.id)).length;
}
function add(s,o){if(inventoryUsedAdventureV1(s)>=inventoryCapacityAdventureV1(s))return null;o=cleanItem(o);if(!o)throw Error("OBJET_INVALIDE");if(!o.id)o.id=`i${s.serial++}`;s.inventory.push(o);record(s,o);return o}
export function idleAdventureMergeLevelV47(a,b){return C(I(a)+I(b)+1,0,MAX)}
export function idleAdventureItemAtLevelV47(definitionId,level=0,id="preview"){const d=defById(definitionId);if(!d)throw Error("DEFINITION_INVALIDE");return d.kind==="set"?item(id,d.set,d.slot,level):special(d.id,level)}
/*
 * Fidèle au wiki (voir commentaire ci-dessus idleAdventureBaseStatsV1) :
 * niveau = somme+1 (inchangé), chaque stat = MAX entre les deux objets —
 * jamais un recalcul de formule, jamais une perte de boost déjà investi
 * sur A OU B (contrairement à l'ancien remake() qui ignorait B).
 */
function merge(s,a,b){const A=s.inventory.find(x=>x.id===a),B=s.inventory.find(x=>x.id===b);if(!A||!B||A===B||A.definitionId!==B.definitionId)throw Error("FUSION_INVALIDE");A.level=idleAdventureMergeLevelV47(A.level,B.level);A.power=Math.max(N(A.power),N(B.power));A.toughness=Math.max(N(A.toughness),N(B.toughness));A.special=Math.max(N(A.special),N(B.special));s.inventory=s.inventory.filter(x=>x.id!==B.id);record(s,A);return A}
/*
 * Correctif 2026-09-14 — un Tutorial Cube (kind==='cube') s'équipe comme
 * un accessoire normal TANT QUE le Cube de l'infini n'est pas débloqué
 * (wiki : Type Accessory). Une fois débloqué (s.cube.unlocked), record()
 * retire déjà tous les Tutorial Cube de l'inventaire/équipement (voir
 * plus bas) — cette garde reste une sécurité défensive, pas le mécanisme
 * principal.
 */
function equip(s,id,slot){const o=s.inventory.find(x=>x.id===id);if(!o||o.kind==="boost"||(o.kind==="cube"&&s.cube.unlocked))throw Error("EQUIPEMENT_INVALIDE");if(slot==="accessory"){if(!s.equipment.accessories.includes(id)){
  /*
   * UUG's Rings (set) reste l'exception déjà documentée plus haut (V144) :
   * ses 5 anneaux sont COÉQUIPABLES simultanément et ne consomment jamais
   * les emplacements accessoire "généraux" (exactement comme dans le vrai
   * NGU, où un joueur atteint UUG — boss 100+ — a de toute façon déjà
   * débloqué bien plus que 2 emplacements). Seuls les accessoires HORS uug
   * sont comptés contre le plafond général.
   */
  if(o.set!=="uug"){
    const generaux=s.equipment.accessories.filter(existingId=>{const e=s.inventory.find(x=>x.id===existingId);return !e||e.set!=="uug"}).length;
    if(generaux>=accessorySlotsCapacityAdventureV1(s))throw Error("EMPLACEMENT_ACCESSOIRE_PLEIN");
  }
  s.equipment.accessories.push(id)
}return}if(!["head","chest","legs","boots","weapon"].includes(slot)||o.slot!==slot)throw Error("SLOT_INVALIDE");s.equipment[slot]=id}
/*
 * Norman (2026-09-11) : "je n'arrive plus à jeter des items ni à déséquiper
 * des items." Confirmé : aucune action "unequip" n'a jamais existé côté
 * serveur — un objet des slots head/chest/legs/boots/weapon ne se libère
 * qu'implicitement en équipant un AUTRE objet dans le même slot, mais un
 * accessoire (tableau, pas un slot unique) n'avait strictement AUCUN moyen
 * d'en sortir une fois entré, et discard() refuse justement tout objet
 * équipé ("il faut d'abord le déséquiper", commentaire ci-dessous) sans
 * qu'aucun chemin ne permette de le faire. Avec le plafond de 2 emplacements
 * accessoire ajouté le même jour, ce trou bloquait définitivement le joueur
 * dès 2 anneaux équipés. unequip() retire l'objet de quelque équipement
 * qu'il occupe (slot unique remis à "", ou retiré du tableau accessories)
 * sans jamais le supprimer de l'inventaire.
 */
function unequip(s,id){const o=s.inventory.find(x=>x.id===id);if(!o)throw Error("OBJET_INTROUVABLE");let trouve=false;for(const slot of ["head","chest","legs","boots","weapon"]){if(s.equipment[slot]===id){s.equipment[slot]="";trouve=true}}if(s.equipment.accessories.includes(id)){s.equipment.accessories=s.equipment.accessories.filter(x=>x!==id);trouve=true}if(!trouve)throw Error("OBJET_NON_EQUIPE");return{id}}
/*
 * Norman (2026-09-10) : "Les boost s'appliquent manuellement. Une fois
 * niveau 100, on ne peut plus en ajouter sur l'item." Implémenté à
 * l'époque en bloquant tout boost dès que level>=100, en assimilant le
 * niveau à l'"actual stat"/"maximum potential" du vrai NGU.
 *
 * RÉVISÉ 2026-09-13 (même Norman, re-audit : "une arme à 3/3 en force
 * passera 3/4 en fusionnant. Il faudra ajouter un boost power pour
 * atteindre le 4/4... regarde bien le wiki NGU") : cette hypothèse était
 * fausse. Vérifié directement sur ngu-idle.fandom.com/wiki/Inventory :
 * la fusion ne recalcule jamais la stat via une formule, elle prend le
 * MAX entre les deux objets (voir merge() ci-dessus) — le niveau peut
 * donc atteindre 100 alors que Power/Toughness restent SOUS leur plafond
 * réel (basePower×2). Bloquer le boost au niveau 100 empêchait alors
 * exactement le geste qui devrait être possible : combler cet écart.
 * Le niveau (0-100) n'est PLUS traité comme un proxy de la
 * "maximum potential" — seul idleAdventureObjetPleinementMaxeV1 (Coffre)
 * vérifie désormais le vrai plafond par stat. Le boost n'a donc plus
 * aucune raison d'être bloqué par le niveau.
 */
/*
 * V143 — badly (Badly Drawn Set, boss 116) : "Boosts are 20% more
 * effective" (wiki, sourcé). boostEffectiveness s'accumule déjà via le
 * chemin générique checkSets() (aucun code dédié nécessaire là-bas) ;
 * seul son USAGE doit être branché ici, sur la force réellement ajoutée.
 */
/*
 * Norman (2026-09-14) : "je peux mettre des boost même si la somme
 * maximal est déjà atteinte... mes bottes actuelles me donnent Power
 * 4/1 alors que le maximum est 1/1." Cause confirmée : rien ne plafonnait
 * jamais le résultat d'un boost Power/Toughness — un plafond devait
 * exister pour empêcher un boost de dépasser le "maximum potential"
 * affiché (wiki, page Boost : "the actual stat can never exceed the
 * maximum potential shown").
 *
 * Correctif 2026-09-16 (re-audit, Norman : "la fusion d'objet augmente
 * la quantité de power. Mais dans NGU si un objet est 1/3 et que je le
 * fusionne il passe à 1/4. La seule manière de le faire monter à 2/4
 * sera de lui mettre des boosts") — un précédent correctif du 2026-09-14
 * avait changé ce plafond de basePower×(1+niveau/100) (le plafond
 * CORRECT, celui qui grandit avec le niveau) vers basePower×2 (le
 * plafond ABSOLU, atteint seulement au niveau 100), en partant du
 * constat qu'un objet FRAÎCHEMENT CRÉÉ a déjà power=basePower×(1+niveau/100)
 * dès sa création (item()/special() ci-dessus) et qu'un boost n'aurait
 * donc "jamais d'effet" avec le plafond niveau-par-niveau. C'était une
 * fausse alerte : c'est exactement le comportement voulu par le wiki
 * (ngu-idle.fandom.com/wiki/Inventory, section Leveling-up Items :
 * "Each time an item levels-up, its maximum potential will go up and
 * require to be boosted") — un objet neuf est TOUJOURS déjà à son
 * plafond du moment (aucun boost utile tant qu'il n'a pas encore été
 * fusionné) ; ce n'est qu'APRÈS une fusion (qui augmente le niveau —
 * donc le plafond — sans jamais toucher la stat courante, voir merge()
 * ci-dessus) qu'un écart apparaît, comblable uniquement par des boosts.
 * Revient donc au plafond niveau-par-niveau, la même formule "q" que
 * item()/special(). Le "X/Y" affiché au joueur (Soreal_Idle_UI.html,
 * afficherDetailsObjetAdventureIdleV138_) doit suivre ce même plafond,
 * jamais rester fixé à basePower×2. "Special" reste volontairement sans
 * plafond (aucune formule/donnée sourcée du wiki n'existe pour lui, cf.
 * commentaire dans idle-adventure-stat-max-display.test.mjs côté APP).
 */
function applyBoost(s,boostId,targetId){
  const b=s.inventory.find(x=>x.id===boostId),o=s.inventory.find(x=>x.id===targetId);
  if(!b||b.kind!=="boost"||!o||o.kind==="boost")throw Error("BOOST_INVALIDE");
  const type=b.boostType;
  /*
   * Norman (2026-09-16) : "Sébastien a toujours le boost spécial qui est
   * ajouté à son épée alors que c'est impossible normalement." Confirmé :
   * "special" est volontairement sans plafond/formule (voir commentaire
   * ci-dessus) parce qu'AUCUN objet d'équipement (arme/armure d'un set)
   * n'est censé porter de vrai bonus "special" — seuls les objets du
   * catalogue SPECIALS (accessoires/cube) en ont un. Rien ne vérifiait
   * jamais que la cible d'un boost "special" était réellement un objet
   * de ce type, laissant n'importe quelle arme/armure accumuler un
   * "special" sans aucune formule ni effet de jeu réel.
   */
  if(type==="special"&&defById(o.definitionId)?.kind!=="special"){
    throw Error("BOOST_SPECIAL_CIBLE_INVALIDE");
  }
  const added=N(b.strength)*(1+N(s.setRewards.boostEffectiveness));
  if(type==="power"||type==="toughness"){
    const d=defById(o.definitionId);
    const base=d?.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):(d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):null);
    const cap=base?(type==="power"?base.baseP:base.baseT)*(1+C(N(o.level),0,MAX)/100):null;
    o[type]=cap!=null?Math.min(cap,N(o[type])+added):N(o[type])+added;
  }else{
    o[type]=N(o[type])+added;
  }
  s.inventory=s.inventory.filter(x=>x.id!==b.id);
  record(s,o);
  return o;
}
/*
 * Audit 2026-09-13 (wiki NGU, page Infinity Cube) : "A Power and Toughness
 * Boosts will award you 1% of its stats. A Special boost will be split
 * equally between Power and Toughness (0.5% each)." Deux écarts corrigés
 * ici : (1) le code ajoutait la force BRUTE du boost (b.strength) au lieu
 * de 1% de cette force — 100x trop généreux ; (2) les boosts "special"
 * étaient rejetés (CUBE_BOOST_INVALIDE) alors qu'ils doivent être acceptés
 * et répartis 0,5%/0,5%.
 */
function cube(s,boostId){const b=s.inventory.find(x=>x.id===boostId);if(!b||b.kind!=="boost"||!["power","toughness","special"].includes(b.boostType))throw Error("CUBE_BOOST_INVALIDE");if(b.boostType==="special"){s.cube.power+=b.strength*0.005;s.cube.toughness+=b.strength*0.005}else{s.cube[b.boostType]+=b.strength*0.01}s.inventory=s.inventory.filter(x=>x.id!==b.id);return X(s.cube)}
/*
 * Audit 2026-09-13 (wiki NGU, page Infinity Cube, section Softcap) : "When
 * your Infinity Cube's Power and Toughness stats exceeds your equipment +
 * base stats (softcap), you'll still get the full stat up to that softcap,
 * but the excess amount will give only a square root of that surplus."
 * Exemple du wiki vérifié : base 1000 + cube 1100 => 1000 + sqrt(100) = 1010
 * de contribution du cube, jamais 1100 en direct. Le cube n'avait aucun
 * plafond avant ce correctif (ligne idleAdventureEquipmentStatsV47).
 */
function idleAdventureCubeSoftcapV1(cubeStat,base){const b=Math.max(0,N(base)),c=Math.max(0,N(cubeStat));return Math.min(c,b)+Math.sqrt(Math.max(0,c-b))}
/*
 * Audit 2026-09-13 (Norman) : "on doit ranger nous-même dans la case
 * appropriée. Le coffre doit posséder tous les emplacements nécessaires
 * pour tous les équipements du jeu... chaque objet doit avoir un
 * emplacement fixe correspondant à son ordre de progression/déblocage...
 * les autres cases restent vides... le joueur doit pouvoir visualiser les
 * trous." Une case par entrée "equipment" du catalogue (déjà dans l'ordre
 * de progression wiki-vérifié), jamais une liste reconstruite depuis les
 * seuls objets déjà obtenus — les trous et les cases jamais découvertes
 * ("?") restent visibles et distincts.
 */
function idleAdventureCoffreSlotsV1(s){
  return Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)
    .filter(([,def])=>def.kind==="equipment")
    .map(([definitionId,def])=>{
      const occupant=s.coffre[definitionId]||null;
      const connu=Boolean(s.itemList[definitionId]?.seen);
      return{
        definitionId,
        set:def.set,setName:def.setName,slot:def.slot,name:def.name,
        decouvert:connu,
        occupe:Boolean(occupant),
        item:occupant?{...occupant,maxed:true,basePower:def.basePower,baseToughness:def.baseToughness}:null
      };
    });
}
/*
 * Case Trash (Norman, 2026-09-10) : "dans l'inventaire, on doit pouvoir
 * jeter les items aussi... il y a une case Trash dans NGU." Un objet
 * ÉQUIPÉ ne peut pas être jeté directement (comme le vrai NGU : il faut
 * d'abord le déséquiper) — évite de perdre discrètement l'équipement
 * porté via un mauvais glisser-déposer.
 */
function discard(s,id){const o=s.inventory.find(x=>x.id===id);if(!o)throw Error("OBJET_INTROUVABLE");if(equippedIdsAdventureV1(s).has(o.id))throw Error("OBJET_EQUIPE");s.inventory=s.inventory.filter(x=>x.id!==o.id);return{id:o.id}}
/*
 * Coffre (Phase 12, 2026-09-13) — Norman : "pouvoir conserver les objets
 * farmés qui sont complètement terminés sans devoir les jeter lorsque
 * l'inventaire est plein." Stockage séparé de l'inventaire (comme
 * equipment.accessories, jamais compté dans inventoryUsedAdventureV1),
 * réutilisant les mêmes objets/le même cleanItem — pas un système de
 * stockage parallèle. Seuls les objets d'ÉQUIPEMENT (armes/armures/
 * anneaux/amulettes — kind==="equipment", jamais boost/special/cube)
 * réellement PLEINEMENT maxés (idleAdventureObjetPleinementMaxeV1 —
 * niveau 100 ET Power/Toughness au plafond réel, plus strict que le
 * badge MAXXED général level-only utilisé par Collection) sont acceptés ;
 * un objet équipé doit d'abord être déséquipé, comme pour discard().
 */
function coffreDeposer(s,id){
  const idx=s.inventory.findIndex(x=>x.id===id);
  if(idx<0)throw Error("OBJET_INTROUVABLE");
  const o=s.inventory[idx];
  if(equippedIdsAdventureV1(s).has(o.id))throw Error("OBJET_EQUIPE");
  if(o.kind!=="equipment")throw Error("OBJET_NON_ELIGIBLE_COFFRE");
  if(!idleAdventureObjetPleinementMaxeV1(o))throw Error("OBJET_NON_MAXE");
  const def=IDLE_ADVENTURE_ITEM_CATALOG_V1[o.definitionId];
  if(!def||def.kind!=="equipment")throw Error("OBJET_NON_ELIGIBLE_COFFRE");
  if(s.coffre[o.definitionId])throw Error("CASE_DEJA_OCCUPEE");
  s.inventory.splice(idx,1);
  s.coffre[o.definitionId]=o;
  return{id:o.id,definitionId:o.definitionId};
}
function coffreRetirer(s,id){
  const entry=Object.entries(s.coffre).find(([,item])=>item.id===id);
  if(!entry)throw Error("OBJET_INTROUVABLE");
  if(inventoryUsedAdventureV1(s)>=inventoryCapacityAdventureV1(s))throw Error("SAC_PLEIN");
  const[defId,o]=entry;
  delete s.coffre[defId];
  s.inventory.push(o);
  return{id:o.id};
}
function unlockedZone(z,bosses){return I(bosses)>=I(z.boss)}
function setDrop(s,setId,lv=0){const d=SETS[setId],slot=d.slots[I(Math.random()*d.slots.length)];return item(`i${s.serial++}`,setId,slot,lv)}
/*
 * Or d'Aventure (Norman, 2026-09-11, "ça doit être identique à NGU IDLE" +
 * "il faut aussi regarder ce que les mobs sont supposés looter... des
 * golds aussi") : sourcé exactement du wiki NGU, chaque zone visitée page
 * par page (pas seulement le tableau récapitulatif "Gold" — chaque zone y
 * donne SES DEUX plages exactes, normal ET boss, ex. Tutorial Zone "Gold
 * 400-500" (normal) / "Gold 800-1,000" (boss)). Un premier passage plus tôt
 * aujourd'hui n'avait que le max de zone (page Gold) et approximait le
 * ratio normal/boss à 1:3 — remplacé ici par les vraies plages [min,max]
 * de chacune des 15 zones du monde Normal déjà présentes dans
 * IDLE_ADVENTURE_ZONES (au-delà, zones Evil/Sadistic non construites,
 * aucune valeur inventée).
 */
const ZONE_GOLD_RANGES_V1={
  tutorial:{normal:[400,500],boss:[800,1000]},
  sewers:{normal:[800,1000],boss:[1600,2000]},
  forest:{normal:[3600,4500],boss:[6000,7500]},
  cave:{normal:[8800,11000],boss:[12000,15000]},
  sky:{normal:[16000,20000],boss:[24000,30000]},
  hsb:{normal:[40000,50000],boss:[64000,80000]},
  clock:{normal:[120000,150000],boss:[160000,200000]},
  "2d":{normal:[260000,325000],boss:[360000,450000]},
  ancient:{normal:[400000,500000],boss:[560000,700000]},
  avsp:{normal:[720000,900000],boss:[960000,1200000]},
  mega:{normal:[880000,1100000],boss:[1160000,1450000]},
  beardverse:{normal:[880000,1100000],boss:[1600000,2000000]},
  badly:{normal:[880000,1100000],boss:[2000000,2500000]},
  boring:{normal:[1120000,1400000],boss:[2400000,3000000]},
  chocolate:{normal:[2400000,3000000],boss:[3600000,4500000]}
};
/*
 * EXP de boss d'Aventure (Norman, 2026-09-16, "les boss d'Aventure doivent
 * looter de l'EXP comme le reste") : sourcé exactement de la section
 * Loot > Boss de la page wiki NGU DE CHAQUE ZONE du monde Normal (les 15
 * zones d'IDLE_ADVENTURE_ZONES au-dessus), vérifié en direct au navigateur
 * le 2026-09-16 — le wiki documente une ligne "Exp N (X% base chance, up to
 * Y% max)" par zone, jamais un pourcentage universel. `chance` est le "base
 * chance" (le "up to" est un maximum sous condition externe — bonus non
 * implémenté ici, cohérent avec le reste du fichier qui ignore déjà ces
 * plafonds pour les autres taux, ex. les SPECIALS bossOnly avec dropChance
 * ci-dessous). `amount` est le nombre exact d'EXP de la ligne "Exp N" —
 * PAS toujours 1 : ça grimpe avec la zone (Exp 1 en early game jusqu'à Exp
 * 30 à Boring-Ass Earth/Chocolate World). Aucune zone du monde Normal n'est
 * dépourvue de ce drop sur le wiki — les 15 lignes ci-dessous sont donc
 * complètes, aucune valeur devinée.
 */
const ZONE_BOSS_EXP_CHANCE_V1={
  tutorial:{chance:.07,amount:1},
  sewers:{chance:.085,amount:1},
  forest:{chance:.10,amount:1},
  cave:{chance:.12,amount:1},
  sky:{chance:.16,amount:1},
  hsb:{chance:.09,amount:2},
  clock:{chance:.10,amount:2},
  "2d":{chance:.05,amount:3},
  ancient:{chance:.03,amount:5},
  avsp:{chance:.01,amount:10},
  mega:{chance:.005,amount:15},
  beardverse:{chance:.002,amount:20},
  badly:{chance:.0005,amount:25},
  boring:{chance:.0003,amount:30},
  chocolate:{chance:.0002,amount:30}
};
/*
 * Norman (2026-09-14, urgent) : "les combats ne démarrent plus en
 * aventure." Cause : le correctif du même jour (adventurePower/
 * Toughness ne fuitent plus depuis le Basic Training) a fait
 * brutalement chuter le Power/Toughness réel du joueur à sa vraie
 * valeur (quasi nulle sans équipement d'Aventure) — le blocage dur
 * AVENTURE_TROP_FAIBLE (stats sous le "Power/Toughness conseillé" de la
 * zone) empêchait alors tout combat, y compris dans la toute première
 * zone. Vérifié sur le wiki NGU (page Adventure Mode, forum "recommended
 * power") : ces valeurs sont un CONSEIL de confort pour idler
 * automatiquement sans risque ("you can idle zones way earlier than the
 * recommendation... not absolute barriers"), jamais une condition
 * bloquante pour combattre manuellement. Le blocage dur n'aurait donc
 * jamais dû exister — retiré ici et dans startZoneFight ci-dessous,
 * "Power/Toughness conseillé" reste un simple affichage informatif.
 */
/*
 * Correctif 2026-09-14 — boss n'est plus déduit ici d'un modulo sur les
 * victoires confirmées (kills%10), qui divergeait désormais du VRAI
 * combat mené (startZoneFight tire boss aléatoirement à 25%, cf. plus
 * bas) : un combat affiché comme "🐉 Boss de zone" (PV ×3) aurait pu
 * distribuer un butin de monstre normal, ou l'inverse. ctx.forceBoss
 * (passé par resolveZoneFight, depuis s.fight.boss AVANT sa remise à
 * zéro) fait autorité quand fourni ; le modulo reste un repli pour
 * l'ancien chemin zoneKill (kill instantané, plus appelé par l'écran
 * actuel mais gardé pour compatibilité).
 */
function rollKill(s,ctx){const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===s.selectedZone)||IDLE_ADVENTURE_ZONES[0];if(!unlockedZone(z,ctx.bosses))throw Error("ZONE_VERROUILLEE");const kills=(s.zone.kills[z.id]||0)+1;s.zone.kills[z.id]=kills;const boss=ctx.forceBoss!=null?Boolean(ctx.forceBoss):kills%10===0;if(boss)s.zone.bossKills[z.id]=(s.zone.bossKills[z.id]||0)+1;const dropMult=Math.max(.1,N(ctx.dropMultiplier,1)*(1+N(s.setRewards.drop)+idleAdventureCubeTierV1(s.cube).dropChancePct/100)),out=[];if(z.set&&Math.random()<C(.22*dropMult,0,.95)){let lv=I(z.dropLevel);if(lv>=1&&Math.random()<N(s.setRewards.extraDropLevelChance))lv++;out.push(add(s,setDrop(s,z.set,lv)))}if(Math.random()<C(.12*dropMult,0,.85))out.push(add(s,boost(["power","toughness","special"][I(Math.random()*3)],BOOSTS[Math.min(BOOSTS.length-1,I(Math.log2(1+Math.max(0,I(ctx.bosses))/10)))])));const candidates=Object.entries(SPECIALS).filter(([,d])=>d.zone===z.id&&!d.bossOnly&&I(ctx.bosses)>=I(d.requiresBoss));if(candidates.length&&Math.random()<C(.04*dropMult,0,.5)){const [id,d]=candidates[I(Math.random()*candidates.length)];out.push(add(s,special(id,d.dropLevel||0)))}
/*
 * Correctif 2026-09-16 (Norman, wiki NGU exact) : les SPECIALS bossOnly
 * PORTANT un dropChance sourcé du wiki (ex. tutorialCube, 10% sur le
 * boss de Sewers) obtiennent chacun leur PROPRE roll indépendant à leur
 * propre pourcentage, uniquement sur un kill de boss — jamais mélangés
 * au pool générique 4% ci-dessus (partagé par les SPECIALS sans donnée
 * de taux propre), ni transformés en déblocage garanti (réservé aux
 * SPECIALS bossOnly SANS dropChance, ex. pissedOffKey ci-dessous).
 */
if(boss){for(const [id,d] of Object.entries(SPECIALS)){if(d.zone===z.id&&d.bossOnly&&d.dropChance!=null&&I(ctx.bosses)>=I(d.requiresBoss)&&Math.random()<C(N(d.dropChance)*dropMult,0,1)){out.push(add(s,special(id,d.dropLevel||0)))}}}
/*
 * Correctif 2026-09-16 (wiki réel vérifié en direct) : "The Lonely
 * Flubber" a sa PROPRE formule (0,82% dès boss 59, +0,41%/boss, 100% au
 * boss 300 -- basée sur le plus haut boss de la RUN EN COURS, ctx.bosses)
 * -- ni le pool générique 4% (mauvais taux), ni le roll bossOnly
 * ci-dessus (tombe aussi sur les mobs normaux), et JAMAIS multipliée par
 * dropMult (précisé explicitement par le wiki).
 */
if(z.id==="tutorial"){const flubberBoss=I(ctx.bosses);if(flubberBoss>=59&&Math.random()<C(.0082+.0041*(flubberBoss-59),0,1)){out.push(add(s,special("flubber",0)))}}
if(boss&&z.id==="sky"&&!s.unlockItems.pissedOffKey){s.unlockItems.pissedOffKey=true;out.push(add(s,special("pissedOffKey")))}const goldRange=ZONE_GOLD_RANGES_V1[z.id];let gold=0;if(goldRange){const [lo,hi]=boss?goldRange.boss:goldRange.normal;const goldDropsMult=1+N(idleAdventureCubeTierV1(s.cube).goldDropsPct)/100;gold=Math.max(1,Math.round((lo+Math.random()*(hi-lo))*goldDropsMult));s.permanent.gold=N(s.permanent.gold)+gold}
/*
 * EXP de boss d'Aventure (voir ZONE_BOSS_EXP_CHANCE_V1 plus haut, sourcé
 * page par page du wiki NGU le 2026-09-16) : roll indépendant, uniquement
 * sur un kill de boss (jamais un monstre normal — le wiki ne documente ce
 * drop QUE sur la ligne "Boss" de chaque zone), au "base chance" exact de
 * la zone (0 par repli si la zone est absente de l'objet, ex. "safe" qui
 * n'a de toute façon aucun combat). Même dropMult que les autres rolls à
 * pourcentage propre de cette fonction (ex. les SPECIALS bossOnly juste
 * au-dessus) — jamais appliqué au pool générique 4%/22%/12%, seulement aux
 * taux individuels sourcés du wiki, par cohérence avec ce que ce fichier
 * fait déjà. Stocké dans s.permanent.experience, EXACTEMENT le même champ
 * que checkSets() (reward.experience des sets) utilise déjà plus haut dans
 * ce fichier — jamais un second système d'EXP parallèle. Ce champ est
 * ensuite diffé vers la vraie monnaie state.currencies.experience par
 * applyIdleNguAction (idle-ngu-progression.js), même schéma que gold/ap
 * juste au-dessus dans ce même fichier.
 */
let experience=0;if(boss){const expDef=ZONE_BOSS_EXP_CHANCE_V1[z.id];const expChance=N(expDef?.chance,0);if(expChance>0&&Math.random()<C(expChance*dropMult,0,1)){experience=I(expDef.amount,0);s.permanent.experience=N(s.permanent.experience)+experience}}
return{zone:z.id,boss,drops:out.filter(Boolean),gold,experience}}
/*
 * Combat de zone réel (demande Norman 2026-09-09) : "on voit l'ennemi, on
 * voit les barres de vie qui descendent à chaque coup. Comme pour les
 * boss." zoneKill (ci-dessus) reste inchangée et disponible, mais le
 * client ne l'appelle plus directement en un clic — il démarre un combat
 * (monstre avec de vrais PV), simule les coups localement comme pour le
 * Combat de boss (même architecture : le serveur ne fait qu'ouvrir et
 * clôturer le combat, jamais un aller-retour réseau par coup), puis
 * clôture avec resolveZoneFight quand les PV du monstre atteignent 0 —
 * qui réutilise rollKill telle quelle (mêmes drops, même compteur de
 * kills, aucune duplication de logique).
 */
/*
 * Échelle des PV (Norman, 2026-09-09 puis 2026-09-10, puis re-signalé
 * 2026-09-14 : "les mobs n'ont pas les mêmes PV. Nous non plus
 * d'ailleurs.") — exigence de valeurs RÉELLEMENT sourcées (Norman : "tu
 * ne dois jamais inventer de valeurs toi-même, tu dois toujours copier
 * les valeurs directement du wiki").
 *
 * Versions précédentes : z.p (n'a plus rien à voir avec la vraie échelle
 * une fois stats.power gonflé) ; un plancher inventé (10+rang×8) ;
 * z.t (la Toughness Manuelle, MAL choisie — c'est le seuil de SURVIE du
 * JOUEUR pour entrer dans la zone, pas les PV du monstre, d'où l'écart
 * signalé : Tutorial t=10 alors que le vrai seuil "one-hit-kill" du wiki
 * est 129,5, plus de 10x d'écart, et l'écart ne fait que grandir avec
 * chaque zone).
 *
 * Cette version utilise z.oneHitP — sourcé de
 * https://ngu-idle.fandom.com/wiki/Adventure_Mode, colonne "One Hit P" du
 * tableau de zones (vérifiée en direct au navigateur 2026-09-14) :
 * littéralement "le Power exact nécessaire pour tuer un ennemi normal de
 * cette zone en un seul coup" — la vraie valeur de PV/Toughness d'un
 * monstre normal, définie sans ambiguïté par le wiki lui-même (voir
 * commentaire détaillé au-dessus de IDLE_ADVENTURE_ZONES). Le vrai NGU
 * n'affiche pas de barre de vie pour l'Aventure de cette façon (Power/
 * Toughness y déterminent un système à seuil), mais Norman a
 * explicitement choisi de garder une vraie barre de vie qui s'échange
 * coup par coup ("Comme pour les boss") tout en voulant des nombres
 * réellement sourcés plutôt qu'une échelle inventée : cette version
 * répond aux deux en réutilisant la vraie donnée NGU la plus proche
 * (le seuil one-hit-kill du wiki), au lieu d'un proxy qui mesure autre
 * chose. Les dégâts par coup (côté client, Soreal_Idle_UI.html) restent
 * une fraction fixe de ce pool plutôt que la valeur brute de
 * stats.power — un combat reste donc un vrai échange de plusieurs coups
 * quel que soit à quel point stats.power est déjà énorme.
 *
 * Côté JOUEUR ("nous non plus") : playerHpMaxForAdventureV1 lui-même
 * (10+stats.hp) était DÉJÀ correct — le vrai bug était en amont, dans
 * idle-ngu-progression.js. Ce fichier (idle-adventure-v47.js) ne connaît
 * pas Attack/Defense (propriété de la progression NGU globale, hors de
 * son périmètre volontairement isolé) ; c'est idle-ngu-progression.js qui
 * doit lui fournir un stats.hp déjà enrichi (Attack×10, sourcé
 * wiki NGU page Fight Boss, audit 2026-09-13) AVANT de l'y passer. Ce
 * calcul existait déjà mais UNIQUEMENT pour l'aperçu affiché au joueur
 * (idleNguSnapshot) — le chemin RÉELLEMENT utilisé pour lancer un combat
 * (applyIdleNguAction, action "adventure" → ctx.adventureStats) ne
 * reprenait jamais cette même formule, ne corrigeant que power/toughness
 * et laissant hp/regen à leur seul bonus d'équipement brut (0 par
 * défaut). Le joueur voyait donc "Max HP: 1010" à l'écran mais un combat
 * réel démarrait avec seulement ~10 PV — corrigé dans
 * idle-ngu-progression.js (idleAdventureCombatStatsV1), pas ici.
 */
function monsterHpMaxForZoneV1(z,boss){const base=Math.max(1,I(N(z.oneHitP||z.t)));return boss?base*3:base}
/*
 * Norman (2026-09-17) : "il y a une version boss fight et une version
 * adventure pour chaque mobs. Tu dois connaitre les 2" — suite du
 * correctif z.oneHitP (2026-09-14) : ce dernier ne connaissait que la
 * MOYENNE de zone, jamais le mob RÉELLEMENT tiré par startZoneFight
 * (monsterIndex). Reprend maintenant IDLE_ADVENTURE_MOB_BESTIARY_V1 (onglet
 * "Adventure" de chaque fiche wiki) quand une entrée réelle existe pour ce
 * monsterIndex précis ; retombe sur l'ancien calcul zone-plat sinon
 * (zone jamais vérifiée, ou index tiré au-delà des entrées connues) —
 * jamais un plantage, jamais une extrapolation inventée au-delà de ce qui
 * est réellement sourcé.
 */
export function idleAdventureMobBestiaryEntryV1(z,boss,monsterIndex){
  const bestiaryZone=IDLE_ADVENTURE_MOB_BESTIARY_V1[z.id];
  if(!bestiaryZone||!(monsterIndex>=0))return null;
  const pool=boss?bestiaryZone.boss:bestiaryZone.normal;
  if(!pool||!pool.length)return null;
  return pool[monsterIndex%pool.length];
}
export function monsterHpMaxForZoneV1WithMob(z,boss,monsterIndex){
  const entry=idleAdventureMobBestiaryEntryV1(z,boss,monsterIndex);
  if(entry){
    const bestiaryZone=IDLE_ADVENTURE_MOB_BESTIARY_V1[z.id];
    const scale=idleAdventureMobScaleV1(z,bestiaryZone);
    if(scale>0)return Math.max(1,I(N(entry.maxHp)*scale));
  }
  return monsterHpMaxForZoneV1(z,boss);
}
/*
 * Facteur de dégâts relatif du mob réellement rencontré, dérivé de SES
 * propres Power/Attack Rate réels (wiki, onglet Adventure) comparés à la
 * moyenne des mobs normaux de sa zone — jamais un second calcul de PV
 * (qui reste monsterHpMaxForZoneV1WithMob ci-dessus), seulement le rythme/
 * la force de sa riposte. Un Power supérieur à la moyenne de zone tape
 * plus fort ; un Attack Rate plus petit que la moyenne (le mob agit plus
 * vite, cf. wiki : Goblin/rapid=0.9 contre Skeleton/normal=1.1 à Forêt)
 * tape plus souvent — combinés en un seul multiplicateur pour rester
 * simple côté client (Soreal_Idle_UI.html), qui n'a accès à aucune de ces
 * données brutes et ne doit jamais dupliquer ce calcul. Repli à 1 (aucun
 * ajustement, comportement identique à avant) si le mob réel est inconnu.
 */
export function idleAdventureMobAttackFactorV1(z,boss,monsterIndex){
  const entry=idleAdventureMobBestiaryEntryV1(z,boss,monsterIndex);
  if(!entry)return 1;
  const bestiaryZone=IDLE_ADVENTURE_MOB_BESTIARY_V1[z.id];
  const avgPower=idleAdventureBestiaryAverageV1(bestiaryZone&&bestiaryZone.normal,"power");
  const avgAttackRate=idleAdventureBestiaryAverageV1(bestiaryZone&&bestiaryZone.normal,"attackRate");
  if(!avgPower||!avgAttackRate||!N(entry.attackRate))return 1;
  const facteur=(N(entry.power)/avgPower)*(avgAttackRate/N(entry.attackRate));
  return C(facteur,.2,3);
}
export function idleAdventureMobTypeV1(z,boss,monsterIndex){
  const entry=idleAdventureMobBestiaryEntryV1(z,boss,monsterIndex);
  return entry?String(entry.type||"normal"):"";
}
function playerHpMaxForAdventureV1(stats){return 10+Math.max(0,N(stats&&stats.hp))}
/*
 * Correctif 2026-09-14 (Norman) :
 * 1) "quand on clique sur combattre dans la safety zone, le journal
 *    spam 'Vous avez vaincu l'ennemi'" — Safety Zone n'a jamais eu de
 *    combat (voir commentaire IDLE_ADVENTURE_ZONES ci-dessus), mais rien
 *    ne l'empêchait ici : un "monstre" à 1 PV (repli Math.max(1,...) de
 *    monsterHpMaxForZoneV1) se faisait one-shot à chaque clic. Bloqué
 *    explicitement.
 * 2) "je tombe constamment sur le boss de la zone tutoriel mais je ne
 *    peux pas le battre" — vérifié en direct sur le wiki NGU (pages
 *    Tutorial Zone et Sewers) : "Boss Chance 1/4", un vrai tirage
 *    ALÉATOIRE à chaque combat, jamais "tous les 10 kills CONFIRMÉS".
 *    L'ancien nextKill%10===0 se basait sur s.zone.kills (incrémenté
 *    seulement en cas de VICTOIRE) : un joueur qui perd contre un boss
 *    reste bloqué à nextKill=10 pour TOUJOURS — impossible de refarmer
 *    des monstres normaux pour progresser, exactement le symptôme
 *    signalé. Remplacé par un vrai tirage par combat, indépendant d'une
 *    tentative à l'autre, à hauteur du z.bossChance PROPRE À LA ZONE
 *    (voir le commentaire 2026-09-15 sur IDLE_ADVENTURE_ZONES : ce n'est
 *    PAS 25% partout — un premier correctif avait à tort figé une seule
 *    valeur universelle, retirée ici).
 * 3) "on doit regen sa vie progressivement... pas tout d'un coup" — les
 *    PV ne repartent plus toujours pleins : ctx.restHp (calculé côté
 *    client à partir du même regen affiché, cf. Soreal_Idle_UI.html)
 *    sert de PV de départ quand fourni, plafonné au vrai max.
 */
function startZoneFight(s,ctx){const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===s.selectedZone)||IDLE_ADVENTURE_ZONES[0];if(z.id==="safe")throw Error("ZONE_SANS_COMBAT");if(!unlockedZone(z,ctx.bosses))throw Error("ZONE_VERROUILLEE");const stats=ctx.stats||{};const boss=Math.random()<(z.bossChance!=null?z.bossChance:0.25);
/*
 * Norman (2026-09-17) : le tirage du mob réellement rencontré (déjà fait
 * plus bas pour le reskin/nom, cf. commentaire 2026-09-16) doit être
 * connu AVANT de calculer les PV du monstre, pas après — sinon impossible
 * d'utiliser ses vraies stats (IDLE_ADVENTURE_MOB_BESTIARY_V1). Avancé ici
 * SANS changer le tirage lui-même (même pool reskin, même Math.random()),
 * seul l'ORDRE des opérations change.
 */
const catalogueZoneV1=IDLE_ADVENTURE_MOB_CATALOG_V1[z.id]||{normal:[],boss:[]};
const poolIndexV1=boss?catalogueZoneV1.boss:catalogueZoneV1.normal;
/*
 * Correctif 2026-09-17 (extension bestiaire V2 aux 15 zones, cf.
 * IDLE_ADVENTURE_MOB_BESTIARY_V1 ci-dessus) : ce tirage sert à la fois à
 * choisir l'image Collection (poolIndexV1, catalogue d'art R2) ET le mob
 * du bestiaire (idleAdventureMobBestiaryEntryV1 fait modulo sur SA
 * PROPRE longueur, donc tolère déjà un monsterIndex plus grand que son
 * propre pool ; choisirCleMobR2_ côté APP fait de même sur son propre
 * pool d'images). La taille du tirage doit donc venir du BESTIAIRE réel
 * (le vrai roster NGU, qui définit qui peut apparaître), jamais du
 * nombre d'images R2 disponibles.
 *
 * Audit externe (2026-09-17, confirmé en lisant le code) : l'ordre
 * précédent (poolIndexV1.length en premier) faisait l'inverse — dès que
 * la zone avait NE SERAIT-CE QU'UNE image R2, ce nombre primait sur la
 * vraie taille du bestiaire. Exemple concret : Cave a 13 vrais mobs NGU
 * normaux mais seulement 8 images R2 normales -> les index 8 à 12 du
 * roster réel n'étaient JAMAIS tirables en combat, malgré des stats
 * réelles disponibles pour eux. Un nombre d'images inférieur au
 * bestiaire doit seulement faire RÉUTILISER un visuel (modulo côté
 * choisirCleMobR2_), jamais réduire la population réelle de monstres.
 *
 * Le pool d'images ne sert donc plus que de repli pour les 4 zones sans
 * bestiaire connu (beardverse/badly/boring/chocolate) — jamais de
 * plantage ni de zone supplémentaire inventée dans ce cas.
 */
const bestiaryZoneForIndexV1=IDLE_ADVENTURE_MOB_BESTIARY_V1[z.id];
const bestiaryPoolForIndexV1=bestiaryZoneForIndexV1?(boss?bestiaryZoneForIndexV1.boss:bestiaryZoneForIndexV1.normal):null;
const monsterIndexPoolLenV1=(bestiaryPoolForIndexV1&&bestiaryPoolForIndexV1.length)||poolIndexV1.length||0;
const monsterIndex=monsterIndexPoolLenV1?Math.floor(Math.random()*monsterIndexPoolLenV1):-1;
const hpMax=monsterHpMaxForZoneV1WithMob(z,boss,monsterIndex),playerHpMax=playerHpMaxForAdventureV1(stats);const playerHp=ctx.restHp!=null?C(N(ctx.restHp),0,playerHpMax):playerHpMax;
const mobAttackFactor=idleAdventureMobAttackFactorV1(z,boss,monsterIndex),mobType=idleAdventureMobTypeV1(z,boss,monsterIndex);
s.fight={active:true,zone:z.id,monsterHp:hpMax,monsterHpMax:hpMax,boss,playerHp,playerHpMax,monsterIndex,mobAttackFactor,mobType};
/*
 * Norman (2026-09-15) : "tous les ennemis rencontrés en aventure
 * n'apparaissent pas dans collection. J'ai juste le boss et un mob alors
 * que j'ai rencontré au moins 1 boss et 2 mobs." Cause confirmée :
 * construireBestiaireSorealIdle_ (idle-sqlite-runtime.js) affiche une
 * entrée "découverte" dès que s.zone.kills/bossKills>0 — un compteur qui
 * n'incrémente qu'en cas de VICTOIRE (voir rollKill plus bas), jamais une
 * simple rencontre. Un combat perdu ou fui n'était donc jamais compté,
 * malgré le libellé "👁️ rencontre(s)" de l'écran Collection. Nouveaux
 * compteurs dédiés, incrémentés ICI (au tout début du combat, la vraie
 * rencontre), jamais mêlés à kills/bossKills qui gardent leur rôle
 * existant (tirage du boss, etc.).
 */
if(!s.zone.encounters)s.zone.encounters={};
if(!s.zone.bossEncounters)s.zone.bossEncounters={};
if(boss)s.zone.bossEncounters[z.id]=(s.zone.bossEncounters[z.id]||0)+1;
else s.zone.encounters[z.id]=(s.zone.encounters[z.id]||0)+1;
/*
 * Norman (2026-09-16) : "Chacune des image doit être reliée à un
 * ennemi." Compteurs ADDITIFS par INDEX de catalogue (jamais un
 * remplacement des compteurs globaux ci-dessus, qui gardent leur rôle
 * existant) — chaque image individuelle de IDLE_ADVENTURE_MOB_CATALOG_V1
 * obtient son propre suivi de rencontres, au lieu d'un seul compteur
 * partagé par toute la zone. L'index est tiré au même moment que "boss"
 * ci-dessus (la vraie rencontre), jamais recalculé à la résolution.
 */
if(!s.zone.mobEncountersByIndex)s.zone.mobEncountersByIndex={};
if(!s.zone.bossEncountersByIndex)s.zone.bossEncountersByIndex={};
/*
 * Audit 2026-09-16 (Norman : "tous les mobs s'appellent Monster Box dans
 * le journal de combat") : cet index tiré au hasard (catalogueZoneV1/
 * poolIndexV1/monsterIndex, déjà calculés plus haut — Norman 2026-09-17 :
 * avancés pour aussi servir au calcul des PV réels du mob, jamais un
 * second tirage) sert ici de compteur de rencontres par image. Le client
 * (libelleEnnemiAdventureIdleV1_, Soreal_Idle_UI.html) résolvait avant ça
 * le nom/l'image via monsterHpMax comme "seed" -- une valeur constante
 * pour TOUTE la zone, résolvant donc TOUJOURS vers le même mob du pool.
 * s.fight.monsterIndex (posé plus haut) permet au client de résoudre le
 * VRAI mob rencontré.
 */
if(poolIndexV1.length){
  const store=boss?s.zone.bossEncountersByIndex:s.zone.mobEncountersByIndex;
  if(!store[z.id])store[z.id]={};
  store[z.id][monsterIndex]=(store[z.id][monsterIndex]||0)+1;
}
return X(s.fight)}
/*
 * BUG CORRIGÉ (2026-09-10) : une garde "if(s.fight.monsterHp>0)throw" avait
 * été ajoutée ici en pensant vérifier une vraie victoire côté serveur —
 * mais monsterHp n'est JAMAIS décrémenté côté serveur (exactement comme
 * bossPv pour le Combat de boss) : seul le client simule les coups en
 * temps réel, le serveur ne fait qu'ouvrir/fermer le combat. Cette garde
 * rendait donc resolveZoneFight impossible à réussir POUR TOUJOURS (elle
 * comparait le PV de départ, jamais mis à jour, systématiquement > 0) —
 * symptôme observé en direct : PV figés à l'écran, requêtes resolveZoneFight
 * en boucle rejetées "COMBAT_NON_TERMINE". Le serveur doit faire confiance
 * au timing du client ici, exactement comme pour le Combat de boss.
 */
function resolveZoneFight(s,ctx){if(!s.fight?.active)throw Error("AUCUN_COMBAT_ACTIF");if(s.fight.zone!==s.selectedZone)throw Error("ZONE_CHANGEE_PENDANT_COMBAT");const wasBoss=Boolean(s.fight.boss);s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};return rollKill(s,Object.assign({},ctx,{forceBoss:wasBoss}))}
/*
 * Défaite en Aventure (Norman, 2026-09-09) : "en aventure, on doit être
 * renvoyé à la safe zone." Contrairement au Combat de boss (qui reste
 * sur place, juste K.O. le temps de regen), une défaite en zone renvoie
 * explicitement le joueur à la zone "safe" — il doit re-choisir une
 * zone et relancer un combat volontairement après une défaite.
 *
 * Pas de garde sur playerHp ici non plus, pour la même raison que
 * resolveZoneFight juste au-dessus (playerHp n'est jamais mis à jour
 * côté serveur) — le client est seul juge du moment où le combat se
 * termine, exactement comme pour le Combat de boss.
 */
function loseZoneFight(s,ctx){if(!s.fight?.active)throw Error("AUCUN_COMBAT_ACTIF");if(s.fight.zone!==s.selectedZone)throw Error("ZONE_CHANGEE_PENDANT_COMBAT");const zone=s.fight.zone;s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};s.selectedZone="safe";return{defeated:true,zone}}
function titanGate(s,d){const own=s.titans[d.id]||{};if(I(own.kills)>0)return true;if(d.requiresUnlock&&!s.unlockFlags[d.requiresUnlock])return false;if(d.requiresTitan&&I(s.titans[d.requiresTitan]?.kills)<I(d.requiresKills))return false;return true}
/*
 * V145 — The Beast (t6) est le premier titan avec plusieurs paliers de
 * difficulté réels (Norman, 2026-09-11 : confirmé que ce n'est "pas un
 * minijeu", juste un choix de seuil). d.difficulties, quand présent,
 * porte les jeux de seuils {p,t} par palier ; difficulty (paramètre,
 * envoyé par le client) choisit lequel, avec repli sur "easy" si absent/
 * invalide — jamais d'erreur pour un titan qui n'a pas encore de palier
 * choisi côté client. Les titans sans d.difficulties (t1-t5) utilisent
 * directement d.p/d.t comme avant, comportement inchangé.
 */
/*
 * V147 — Walderp (t5) : cache-cache réel entre les 5 formes. Un panneau
 * de l'app est tiré au sort à chaque forme intermédiaire vaincue (1-4) ;
 * le combat suivant reste bloqué (TITAN_CACHE) tant que titanFound()
 * n'a pas été appelée depuis CE panneau précis côté client. Liste
 * volontairement restreinte à des pages toujours accessibles (jamais
 * Aventure elle-même, où on le combat).
 */
/*
 * V147bis — "boutique"/"magie"/"personnage" existent encore comme routes
 * de rendu (contenuMenuIdleV28_) mais ne sont PLUS dans la navigation
 * visible (retirés en parité NGU, cf. le test "Menu maison interdit en
 * parité NGU") : y cacher Walderp l'aurait rendu introuvable pour de
 * vrai. Liste corrigée aux seuls menus RÉELLEMENT navigables et déjà
 * débloqués bien avant boss 116 (navigationIdleV28_, Soreal_Idle_UI.html).
 */
/*
 * V148 — trouvé en auditant l'intégration après Walderp (2026-09-11,
 * suite du "Continue" de Norman) : idle-ngu-progression.js (le vrai
 * système de méta-progression NGU, perks/challenges/macguffins/etc.)
 * conditionne MacGuffins à `unlock:{flag:"walderpFinalDefeated"}`
 * (unlockSatisfied lit state.adventure.unlockFlags[flag]) — mais RIEN
 * dans ce fichier ne posait jamais ce flag. MacGuffins était donc
 * structurellement impossible à débloquer, même en battant réellement
 * Walderp jusqu'au bout. Corrigé : posé dès que la forme finale tombe,
 * exactement comme les autres unlockFlags déjà posés ailleurs
 * (ringOfApathyMaxed, tutorialCubeMaxed).
 */
export const WALDERP_HIDE_PANELS_V147=Object.freeze(["combat","entrainement","inventaire","bestiaire","parametres"]);
function titan(s,id,ctx,t,difficulty){const aliases={titan1:"t1",titan2:"t2",titan3:"t3",titan4:"t4",titan5:"t5",titan6:"t6"};id=aliases[id]||id;const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===id);if(!d||I(ctx.bosses)<d.boss)throw Error("TITAN_VERROUILLE");if(d.flag&&!s.unlockFlags[d.flag])throw Error("PROTECTION_TITAN_REQUISE");if(!titanGate(s,d))throw Error("PROGRESSION_TITAN_REQUISE");const st=s.titans[id]||{kills:0,nextAt:0,hiddenPanel:""};if(d.forms&&st.hiddenPanel)throw Error("TITAN_CACHE");if(t<N(st.nextAt))throw Error("TITAN_EN_REAPPARITION");const formIndex=d.forms?Math.min(I(st.kills),d.forms.length-1):-1;const tier=formIndex>=0?d.forms[formIndex]:(d.difficulties?(d.difficulties[difficulty]?d.difficulties[difficulty]:d.difficulties.easy):d);const tierKey=d.difficulties?(d.difficulties[difficulty]?difficulty:"easy"):"";const q=ctx.stats||{};if(N(q.power)<tier.p||N(q.toughness)<tier.t)throw Error("PUISSANCE_INSUFFISANTE");st.kills++;const challengeRespawnReduction=Math.max(0,N(ctx.titanCooldownReductionMs,0));if(d.forms&&st.kills<d.forms.length){st.hiddenPanel=WALDERP_HIDE_PANELS_V147[I(Math.random()*WALDERP_HIDE_PANELS_V147.length)];st.hiddenSince=t;st.nextAt=Infinity}else{st.hiddenPanel="";st.hiddenSince=0;st.nextAt=t+Math.max(0,d.cooldown-challengeRespawnReduction)}s.titans[id]=st;let firstDrop="";if(st.kills===1&&!s.unlockItems[d.drop]){s.unlockItems[d.drop]=true;firstDrop=d.drop}const drops=[];const challengeTitanLootLevel=Math.max(0,I(ctx.titanLootLevelBonus,0));if(id==="t1"){drops.push(add(s,setDrop(s,"grb",challengeTitanLootLevel)));if(!s.unlockItems.wandoos98){s.unlockItems.wandoos98=true;drops.push(add(s,special("wandoos98",1)))}}if(id==="t3")drops.push(add(s,setDrop(s,"jake",challengeTitanLootLevel)));if(id==="t4")drops.push(add(s,setDrop(s,"uug",challengeTitanLootLevel)));if(id==="t5"&&st.kills>=d.forms.length){s.unlockFlags.walderpFinalDefeated=true;drops.push(add(s,special("wanderersCane",10)));drops.push(add(s,setDrop(s,"wanderer",challengeTitanLootLevel)));drops.push(add(s,setDrop(s,"rerednaw",challengeTitanLootLevel)))}if(id==="t6"){drops.push(add(s,setDrop(s,"slimy",challengeTitanLootLevel)));if(tierKey==="normal"||tierKey==="hard"||tierKey==="brutal")drops.push(add(s,special("shrunkenVoodooDoll",0)));if(tierKey==="hard"||tierKey==="brutal")drops.push(add(s,special("pricelessVanGoghPainting",0)));if(tierKey==="brutal")drops.push(add(s,special("smallGerbil",0)))}return{id,kills:st.kills,nextAt:st.nextAt,hiddenPanel:st.hiddenPanel||undefined,firstDrop,difficulty:tierKey||undefined,drops:drops.filter(Boolean)}}
/*
 * V147 — retrouver Walderp caché. Purement déclaratif côté serveur (le
 * client sait déjà où il se cache via le snapshot — il ne "devine" rien,
 * il confirme juste avoir cliqué au bon endroit) : vide hiddenPanel et
 * démarre ALORS le vrai cooldown avant la forme suivante.
 */
function titanFound(s,id,t){const aliases={titan1:"t1",titan2:"t2",titan3:"t3",titan4:"t4",titan5:"t5",titan6:"t6"};id=aliases[id]||id;const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===id);const st=s.titans[id];if(!d||!st||!st.hiddenPanel)throw Error("TITAN_PAS_CACHE");st.hiddenPanel="";st.hiddenSince=0;st.nextAt=t+Math.max(0,N(d.cooldown));s.titans[id]=st;return{id,nextAt:st.nextAt}}
const unlockMap={aNumber:"ngu",giantSeed:"yggdrasil",scrapPaper:"diggers",uugHair:"beards",pissedOffKey:"tower",wandoos98:"wandoos"};
function consume(s,id){const flag=unlockMap[id];if(!flag||!s.unlockItems[id])throw Error("OBJET_DEBLOCAGE_ABSENT");s.unlockFlags[flag]=true;s.unlockItems[id]=false;return{flag}}
/*
 * Cube Tiers (2026-09-11) — sourcé directement de la page wiki
 * "Infinity Cube" (ngu-idle.fandom.com, vérifiée au navigateur) :
 * "Cube tiers bonuses are permanently unlocked and automatically
 * applied upon reaching a specific amount of total stats (cube's Power
 * + Toughness)." Seuils et pourcentages copiés tels quels du tableau
 * du wiki — jamais arrondis ni approximés. dropChancePct/goldDropsPct/
 * hackSpeedPct/wishSpeedPct sont les VRAIS bonus du tier ; seul
 * dropChancePct a un mécanisme SOREAL existant pour le recevoir
 * (specials.dropChancePct ci-dessous, déjà utilisé par le drop
 * d'Aventure) — goldDrops/hackSpeed/wishSpeed sont exposés pour
 * affichage réel (jamais inventés) mais pas encore câblés à une
 * mécanique SOREAL correspondante (pas de multiplicateur d'or, pas de
 * système Hacks/Wishes construit côté Aventure).
 */
export const IDLE_ADVENTURE_CUBE_TIERS_V1=Object.freeze([
  {tier:0,seuil:0,dropChancePct:0,goldDropsPct:0,hackSpeedPct:0,wishSpeedPct:0},
  {tier:1,seuil:100,dropChancePct:50,goldDropsPct:0,hackSpeedPct:0,wishSpeedPct:0},
  {tier:2,seuil:1000,dropChancePct:70,goldDropsPct:50,hackSpeedPct:0,wishSpeedPct:0},
  {tier:3,seuil:10000,dropChancePct:90,goldDropsPct:123.11,hackSpeedPct:0,wishSpeedPct:0},
  {tier:4,seuil:100000,dropChancePct:110,goldDropsPct:208.56,hackSpeedPct:0,wishSpeedPct:0},
  {tier:5,seuil:1000000,dropChancePct:130,goldDropsPct:303.14,hackSpeedPct:0,wishSpeedPct:0},
  {tier:6,seuil:10000000,dropChancePct:150,goldDropsPct:405.16,hackSpeedPct:0,wishSpeedPct:0},
  {tier:7,seuil:100000000,dropChancePct:170,goldDropsPct:513.53,hackSpeedPct:0,wishSpeedPct:0},
  {tier:8,seuil:1000000000,dropChancePct:190,goldDropsPct:627.48,hackSpeedPct:10,wishSpeedPct:0},
  {tier:9,seuil:10000000000,dropChancePct:210,goldDropsPct:746.43,hackSpeedPct:15,wishSpeedPct:10},
  {tier:10,seuil:100000000000,dropChancePct:230,goldDropsPct:869.93,hackSpeedPct:20,wishSpeedPct:20}
]);
export function idleAdventureCubeTierV1(cube){
  const total=N(cube&&cube.power)+N(cube&&cube.toughness);
  let actuel=IDLE_ADVENTURE_CUBE_TIERS_V1[0];
  for(const t of IDLE_ADVENTURE_CUBE_TIERS_V1){if(total>=t.seuil)actuel=t}
  const suivant=IDLE_ADVENTURE_CUBE_TIERS_V1[actuel.tier+1]||null;
  return{...actuel,totalStats:total,suivant}
}
export function idleAdventureEquipmentStatsV47(raw){
  const s=normalizeIdleAdventureStateV47(raw);
  const ids=[s.equipment.head,s.equipment.chest,s.equipment.legs,s.equipment.boots,s.equipment.weapon,...(s.equipment.accessories||[])].filter(Boolean);
  const equipped=s.inventory.filter(x=>ids.includes(x.id));
  const basePower=equipped.reduce((a,x)=>a+N(x.power),0)+N(s.setRewards.adventurePower);
  const baseToughness=equipped.reduce((a,x)=>a+N(x.toughness),0)+N(s.setRewards.adventureToughness);
  /*
   * hp/regen par objet (2026-09-15, Norman : "les items qu'on loot...
   * doivent procurer de la regen de vie") — dérivés directement de
   * x.power/x.toughness (×3/×0.03, règle du moteur NGU vérifiée sur ~90
   * objets, voir SET_ITEM_STATS_V1) plutôt que lus depuis x.hp/x.regen :
   * ainsi TOUT objet déjà en inventaire (créé avant ce correctif, donc
   * sans ces champs) en bénéficie immédiatement, sans migration de save.
   */
  const equippedHp=equipped.reduce((a,x)=>a+N(x.power)*3,0);
  const equippedRegen=equipped.reduce((a,x)=>a+N(x.toughness)*.03,0);
  /*
   * Multiplicateur Safe Zone sur la regen d'équipement (2026-09-18,
   * Norman, confirmé en jouant au vrai jeu) : le wiki NGU (page locale
   * "Adventure Mode", tableau Zones, ligne "1. Safe Zone: Awakening
   * Site" : "5x HP Regeneration in zone / 10x with GRB's set bonus")
   * documente un multiplicateur ×5 (×10 avec le bonus de set GRB, déjà
   * stocké dans setRewards.safeZoneRegen10x via checkSets mais jamais lu
   * jusqu'ici) appliqué SEULEMENT dans la Safe Zone. Norman : ce
   * multiplicateur ne s'applique qu'au bonus fourni par l'équipement —
   * le plancher de base à 1/s (safe zone, combat, zone tutoriel...) est
   * déjà géré séparément et correctement dans idleAdventureCombatStatsV1
   * (idle-ngu-progression.js, correctif 2026-09-16, plancher appliqué
   * APRÈS multiplication sur le terme context.adventureToughness) : ne
   * pas dupliquer cette base ici, seulement multiplier la part
   * équipement (equippedRegen+setRewards.adventureRegen) qui s'ADDITIONNE
   * ensuite à ce plancher.
   */
  const safeZoneRegenMultiplierV1=s.selectedZone==="safe"?(s.setRewards.safeZoneRegen10x?10:5):1;
  return{
    power:basePower+idleAdventureCubeSoftcapV1(s.cube.power,basePower),
    toughness:baseToughness+idleAdventureCubeSoftcapV1(s.cube.toughness,baseToughness),
    hp:equippedHp+N(s.setRewards.adventureHp),
    regen:(equippedRegen+N(s.setRewards.adventureRegen))*safeZoneRegenMultiplierV1,
    special:equipped.reduce((a,x)=>a+N(x.special),0),
    specials:{
      dropChancePct:N(s.setRewards.drop)*100+idleAdventureCubeTierV1(s.cube).dropChancePct,
      respawnReductionPct:N(s.setRewards.respawn)*100,
      chargeMultiplier:Math.max(1,N(s.setRewards.chargeMultiplier,1)),
      idleAttack:Boolean(s.setRewards.idleAttack),
      wandoosMeh:Boolean(s.setRewards.wandoosMeh),
      noEquipmentChallenge:Boolean(s.setRewards.noEquipmentChallenge)
    },
    setRewards:X(s.setRewards),
    permanent:X(s.permanent)
  }
}
export function idleAdventureSnapshotV47(raw,bosses=0){const s=normalizeIdleAdventureStateV47(raw);return{version:s.version,visualSource:"avatar-level",selectedZone:s.selectedZone,zones:IDLE_ADVENTURE_ZONES.map(z=>({...z,unlocked:unlockedZone(z,bosses),visual:{source:"avatar-level",level:I(z.avatarLevel,1),fallback:"emoji"}})),/*
 * Bug trouvé en vérifiant le vrai NGU (Norman, 2026-09-10) : "je ne
 * pense pas qu'ils soient visibles dans un menu dès le début" —
 * progressionUnlocked ne vérifiait QUE la chaîne de prérequis entre
 * titans (titanGate), jamais le vrai seuil "boss #X requis" du wiki NGU
 * (ex. GRB=boss 58) — un joueur niveau 1 voyait donc GRB avec un bouton
 * "Affronter" actif, qui échouait ensuite avec TITAN_VERROUILLE côté
 * serveur au clic. Un titan n'est réellement accessible que si les DEUX
 * conditions sont vraies.
 */
titans:IDLE_ADVENTURE_TITANS.map(t=>({...t,progressionUnlocked:I(bosses)>=I(t.boss)&&titanGate(s,t),visual:{source:"avatar-level",level:I(t.avatarLevel,1),fallback:"emoji"},state:X(s.titans[t.id]||{kills:0,nextAt:0})})),inventory:X(s.inventory).map(o=>{const d=defById(o.definitionId);const base=d?.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):(d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):{baseP:0,baseT:0});return{...o,maxed:idleAdventureNiveauEstMaxV1(o.level),basePower:base.baseP,baseToughness:base.baseT,baseHp:base.baseP*3,baseRegen:base.baseT*.03};}),coffreSlots:idleAdventureCoffreSlotsV1(s),equipment:X(s.equipment),itemList:Object.fromEntries(Object.entries(X(s.itemList)).map(([k,v])=>[k,{...v,maxed:idleAdventureNiveauEstMaxV1(v?.maxLevel)}])),itemCatalog:IDLE_ADVENTURE_ITEM_CATALOG_V1,completedSets:X(s.completedSets),setRewards:X(s.setRewards),unlockItems:X(s.unlockItems),unlockFlags:X(s.unlockFlags),cube:X(s.cube),cubeTier:idleAdventureCubeTierV1(s.cube),fight:X(s.fight),inventoryCapacity:inventoryCapacityAdventureV1(s),inventoryUsed:inventoryUsedAdventureV1(s),accessorySlotsCapacity:accessorySlotsCapacityAdventureV1(s),stats:idleAdventureEquipmentStatsV47(s)}}
export function applyIdleAdventureActionV47(raw,p={},ctx={},t=Date.now()){const s=normalizeIdleAdventureStateV47(raw),a=String(p.action||p.mode||"");let result;if(a==="selectZone"){const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===p.zone);if(!z||!unlockedZone(z,ctx.bosses))throw Error("ZONE_VERROUILLEE");if(s.fight.active&&s.fight.zone!==z.id){s.fight=X(base().fight)}s.selectedZone=z.id;result={zone:z.id}}else if(a==="addItem"){const d=defById(p.definitionId);if(!d)throw Error("DEFINITION_INVALIDE");result=add(s,d.kind==="set"?item(`i${s.serial++}`,d.set,d.slot,p.level):special(d.id,p.level))}else if(a==="merge")result=merge(s,String(p.a),String(p.b));else if(a==="equip")result=equip(s,String(p.id),String(p.slot));else if(a==="unequip")result=unequip(s,String(p.id));else if(a==="boost")result=applyBoost(s,String(p.boostId),String(p.targetId));else if(a==="cube")result=cube(s,String(p.boostId));else if(a==="discard")result=discard(s,String(p.id||p.itemId));else if(a==="coffreDeposer")result=coffreDeposer(s,String(p.id||p.itemId));else if(a==="coffreRetirer")result=coffreRetirer(s,String(p.id||p.itemId));else if(a==="zoneKill")result=rollKill(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="startZoneFight")result=startZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats,restHp:p.restHp}));else if(a==="resolveZoneFight")result=resolveZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="loseZoneFight")result=loseZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="titan")result=titan(s,String(p.titan||p.titanId),Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}),t,String(p.difficulty||""));else if(a==="titanFound")result=titanFound(s,String(p.titan||p.titanId),t);else if(a==="consumeUnlock")result=consume(s,String(p.item||p.itemId));else throw Error("ACTION_AVENTURE_INCONNUE");return{state:s,result}}
