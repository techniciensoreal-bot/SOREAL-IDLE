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
{id:"tutorial",name:"Tutoriel",boss:4,p:10,t:10,oneHitP:129.5,idleP:13,idleT:13,bossChance:1/4,set:"training",dropLevel:10,avatarLevel:1},
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
 * d'équipement dédié en suivi séparé). bossChance omis (repli 0.25 déjà
 * en place dans startZoneFight, jamais vérifié individuellement zone par
 * zone pour cette nouvelle plage). avatarLevel:6 (palier max déjà utilisé,
 * aucun visuel de palier 7+ n'existe -- même raison que les zones Normal
 * tardives ci-dessus).
 */
{id:"evilverse",name:"The Evilverse",boss:58,p:1e13,t:4.7e12,oneHitP:4.40e14,idleP:2.4e13,idleT:1.6e13,bossChance:2/9,set:"edgy",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"pinkprincess",name:"Pretty Pink Princess Land",boss:100,p:5.4e13,t:2.4e13,oneHitP:2.27e15,idleP:1.3e14,idleT:9.7e13,set:"pinkprincess",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"metaland",name:"Meta Land",boss:158,p:2.6e16,t:1.2e16,oneHitP:1.05e18,idleP:4.5e16,idleT:3.1e16,set:"meta",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"interdimensional",name:"Interdimensional Party",boss:166,p:2.5e17,t:1.1e17,oneHitP:1.05e19,idleP:4.8e17,idleT:3.1e17,set:"party",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
/*
 * typozone : idleP omis -- ambiguïté >25% entre "370 Qi" et son repli
 * scientifique "(2.7E20)" sur la table agrégée, voir commentaire détaillé
 * au-dessus de IDLE_ADVENTURE_ZONES. idleT (240 Qi/2.4E20, accord parfait)
 * conservé.
 */
{id:"typozone",name:"Typo Zonw",boss:174,p:1.5e20,t:6.8e19,idleT:2.4e20,set:"typo",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"fadlands",name:"The Fad-lands",boss:182,p:7e20,t:4e20,idleP:1.5e21,idleT:1.1e21,set:"fad",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"jrpgville",name:"JRPGVille",boss:190,p:3e21,t:2.1e21,oneHitP:1.89e23,idleP:8e21,idleT:6e21,set:"jrpg",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"radlands",name:"The Rad-Lands",boss:200,p:3.2e24,t:1.4e24,idleP:9.1e24,idleT:5.6e24,bossChance:1/5,set:"rad",dropLevel:1,avatarLevel:6,requiredDifficulty:"difficile"},
{id:"backtoschool",name:"Back To School",boss:125,p:5e26,t:2.5e26,idleP:1.7e27,idleT:8.5e26,set:"backtoschool",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"westworld",name:"The West World",boss:150,p:2.65e27,t:8.3e26,idleP:8e27,idleT:3.5e27,set:"western",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"breadverse",name:"The Breadverse",boss:208,p:1.4e29,t:2.4e28,idleP:4.31e29,idleT:2.43e29,set:"bread",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"seventies",name:"That 70's Zone",boss:216,p:5.1e29,t:7.6e28,idleP:1.5e30,idleT:6.5e29,set:"disco",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"halloweenies",name:"The Halloweenies",boss:224,p:1.52e30,t:3.83e29,idleP:3.2e30,idleT:2.4e30,set:"halloweenie",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
/*
 * construction : idleP/idleT omis entièrement -- trois sources wiki
 * (table agrégée en texte, sa propre parenthèse scientifique, et la page
 * dédiée Construction_Zone) donnent trois valeurs différentes pour Idle
 * Power ("113 No" / "1.45E32" / "125.90 No"), voir commentaire détaillé
 * au-dessus de IDLE_ADVENTURE_ZONES. Jamais tranché arbitrairement.
 */
{id:"construction",name:"Construction Zone",boss:232,p:5.24e31,t:2.01e31,set:"construction",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"duckduck",name:"DUCK DUCK ZONE",boss:240,p:1.28e32,t:3.2e31,idleP:3.5e32,idleT:2.3e32,set:"duck",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"netherregions",name:"The Nether Regions",boss:248,p:3.15e32,t:8.42e31,idleP:6.9e32,idleT:5e32,set:"dutch",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"},
{id:"aethereansea",name:"The Aethereal Sea",boss:269,p:1.72e34,t:6.1e33,idleP:4.76e34,idleT:3.4e34,bossChance:4/21,set:"pirate",dropLevel:1,avatarLevel:6,requiredDifficulty:"extreme"}
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
  "chocolate":{normal:[{name:"Chocolate Mouse",type:"normal",attackRate:1,power:30000000000,toughness:30000000000,hpRegen:3000000000,maxHp:3000000000000},{name:"Chocolate Mimic",type:"rapid",attackRate:1,power:30100000000,toughness:30100000000,hpRegen:3010000000,maxHp:3050000000000},{name:"Chocolate Crowbar (Enemy)",type:"poison",attackRate:1.1,power:30100000000,toughness:30100000000,hpRegen:3010000000,maxHp:3050000000000},{name:"Chocolate Freeman",type:"rapid",attackRate:1.2,power:30200000000,toughness:30200000000,hpRegen:3020000000,maxHp:3100000000000},{name:"Chocolate Fondue",type:"exploder",attackRate:12,power:30200000000,toughness:30200000000,hpRegen:3020000000,maxHp:3100000000000},{name:"Chocolate Slime",type:"poison",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Dark Chocolate",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Chocolate Salty Balls",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"Screaming Chocolate Fish",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000},{name:"A Mighty Lump of Poo",type:"rapid",attackRate:1.2,power:30300000000,toughness:30300000000,hpRegen:3030000000,maxHp:3150000000000}],boss:[{name:"Melted Chocolate Blob (?)",type:"grower",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000},{name:"Choco Golem",type:"rapid",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000},{name:"Type 2 Diabetes",type:"charger",attackRate:1.2,power:30500000000,toughness:30500000000,hpRegen:3050000000,maxHp:3250000000000}]},
  "evilverse":{normal:[{name:"Evil Brown Slime",type:"poison",attackRate:1.2,power:5030000000000,toughness:5030000000000,hpRegen:503000000000,maxHp:515000000000000},{name:"Evil Goblin",type:"rapid",attackRate:1,power:5010000000000,toughness:5010000000000,hpRegen:501000000000,maxHp:505000000000000},{name:"Evil Gorgon",type:"poison",attackRate:1.1,power:5010000000000,toughness:5010000000000,hpRegen:501000000000,maxHp:505000000000000},{name:"Evil Icarus Proudbottom",type:"exploder",attackRate:12,power:5020000000000,toughness:5020000000000,hpRegen:502000000000,maxHp:510000000000000},{name:"Evil Mole",type:"rapid",attackRate:1.2,power:5020000000000,toughness:5020000000000,hpRegen:502000000000,maxHp:510000000000000},{name:"Evil Mouse",type:"normal",attackRate:1,power:5000000000000,toughness:5000000000000,hpRegen:500000000000,maxHp:500000000000000},{name:"Flock of Canada Geese",type:"rapid",attackRate:1.2,power:5030000000000,toughness:5030000000000,hpRegen:503000000000,maxHp:515000000000000}],boss:[{name:"EVIL CHAD(BOSS)",type:"charger",attackRate:1.2,power:5050000000000,toughness:5050000000000,hpRegen:505000000000,maxHp:525000000000000},{name:"EVIL SPIKY HAIRED GUY (BOSS)",type:"rapid",attackRate:1.2,power:5050000000000,toughness:5050000000000,hpRegen:505000000000,maxHp:525000000000000}]},
  "pinkprincess":{normal:[{name:"'The More You Know' Star",type:"charger",attackRate:1.1,power:25100000000000,toughness:25100000000000,hpRegen:2510000000000,maxHp:2550000000000000},{name:"A Fabulous Leprechaun",type:"grower",attackRate:1.2,power:25200000000000,toughness:25200000000000,hpRegen:2520000000000,maxHp:2600000000000000},{name:"An Ordinary Possum",type:"poison",attackRate:1.2,power:25200000000000,toughness:25200000000000,hpRegen:2520000000000,maxHp:2600000000000000},{name:"Barry, the Beer Fairy",type:"exploder",attackRate:12,power:25300000000000,toughness:25300000000000,hpRegen:2530000000000,maxHp:2650000000000000},{name:"Pooky The Bunny",type:"rapid",attackRate:1,power:25100000000000,toughness:25100000000000,hpRegen:2510000000000,maxHp:2550000000000000},{name:"The Humkeycorn",type:"normal",attackRate:1,power:25000000000000,toughness:25000000000000,hpRegen:2500000000000,maxHp:2500000000000000}],boss:[{name:"AN ASSHOLE SWAN (BOSS)",type:"rapid",attackRate:1.2,power:25300000000000,toughness:25300000000000,hpRegen:2530000000000,maxHp:2650000000000000},{name:"TINKLES (BOSS)",type:"charger",attackRate:1.2,power:25500000000000,toughness:25500000000000,hpRegen:2550000000000,maxHp:2700000000000000}]},
  "metaland":{normal:[{name:"A Half-eaten Cookie",type:"normal",attackRate:1,power:10000000000000000,toughness:10000000000000000,hpRegen:1000000000000000,maxHp:1000000000000000000},{name:"A Rusty Crank",type:"poison",attackRate:1,power:10200000000000000,toughness:10200000000000000,hpRegen:1020000000000000,maxHp:1050000000000000000},{name:"Ahh!! A Shark!!",type:"charger",attackRate:1.1,power:10400000000000000,toughness:10400000000000000,hpRegen:1040000000000000,maxHp:1100000000000000000},{name:"The number 1.8 x 10^308",type:"normal",attackRate:1.2,power:10600000000000000,toughness:10600000000000000,hpRegen:1060000000000000,maxHp:1150000000000000000},{name:"A Weird Goblin-Demon-Thing",type:"rapid",attackRate:1.2,power:10800000000000000,toughness:10800000000000000,hpRegen:1080000000000000,maxHp:1200000000000000000},{name:"A Cute Kitten",type:"exploder",attackRate:12,power:11000000000000000,toughness:11000000000000000,hpRegen:1100000000000000,maxHp:1200000000000000000}],boss:[{name:"THE DRAGON OF WISDOM",type:"grower",attackRate:1.2,power:11200000000000000,toughness:11200000000000000,hpRegen:1120000000000000,maxHp:1250000000000000000},{name:"THE DRAGON OF DILDO",type:"grower",attackRate:1.2,power:11500000000000000,toughness:11500000000000000,hpRegen:1150000000000000,maxHp:1250000000000000000}]},
  "interdimensional":{normal:[{name:"The Bouncer, Part 2",type:"normal",attackRate:1,power:100000000000000000,toughness:100000000000000000,hpRegen:10000000000000000,maxHp:11000000000000000000},{name:"Jambi",type:"rapid",attackRate:1,power:102000000000000000,toughness:102000000000000000,hpRegen:10200000000000000,maxHp:11000000000000000000},{name:"God of Thunder",type:"charger",attackRate:1.1,power:104000000000000000,toughness:104000000000000000,hpRegen:10400000000000000,maxHp:11500000000000000000},{name:"The Entire State of South Dakota",type:"normal",attackRate:1.2,power:106000000000000000,toughness:106000000000000000,hpRegen:10600000000000000,maxHp:11500000000000000000},{name:"A Huge Stack of Pogs",type:"poison",attackRate:1.2,power:108000000000000000,toughness:108000000000000000,hpRegen:10800000000000000,maxHp:12000000000000000000},{name:"Three Guys Shouting out 'Ed'",type:"exploder",attackRate:12,power:110000000000000000,toughness:110000000000000000,hpRegen:11000000000000000,maxHp:12000000000000000000}],boss:[{name:"Mr. Chow",type:"normal",attackRate:1.2,power:112000000000000000,toughness:112000000000000000,hpRegen:11200000000000000,maxHp:12500000000000000000},{name:"The Life Of The Party",type:"grower",attackRate:1.2,power:115000000000000000,toughness:115000000000000000,hpRegen:11500000000000000,maxHp:12500000000000000000}]},
  "typozone":{normal:[{name:"Permanenet",type:"normal",attackRate:1,power:80000000000000000000,toughness:80000000000000000000,hpRegen:8000000000000000000,maxHp:8.1e+21},{name:"Coudl",type:"rapid",attackRate:1,power:80200000000000000000,toughness:80200000000000000000,hpRegen:8020000000000000000,maxHp:8.1e+21},{name:"Liek",type:"charger",attackRate:1.1,power:80400000000000000000,toughness:80400000000000000000,hpRegen:8040000000000000000,maxHp:8.15e+21},{name:"Blodo",type:"poison",attackRate:1.2,power:80800000000000000000,toughness:80800000000000000000,hpRegen:8080000000000000000,maxHp:8.2e+21},{name:"Brian",type:"normal",attackRate:1.2,power:80600000000000000000,toughness:80600000000000000000,hpRegen:8060000000000000000,maxHp:8.15e+21},{name:"Odign",type:"rapid",attackRate:0.8,power:81000000000000000000,toughness:81000000000000000000,hpRegen:8100000000000000000,maxHp:8.2e+21}],boss:[{name:"Horus",type:"normal",attackRate:1.2,power:81200000000000000000,toughness:81200000000000000000,hpRegen:8120000000000000000,maxHp:8.25e+21},{name:"ELDER TYPO GOD, ELXU",type:"grower",attackRate:1.2,power:81500000000000000000,toughness:81500000000000000000,hpRegen:8150000000000000000,maxHp:8.25e+21}]},
  "fadlands":{normal:[{name:"A Very Sad Slinky :c",type:"normal",attackRate:1,power:400000000000000000000,toughness:400000000000000000000,hpRegen:40000000000000000000,maxHp:4.1e+22},{name:"Giant Metal Spinning Top",type:"rapid",attackRate:1,power:402000000000000000000,toughness:402000000000000000000,hpRegen:40200000000000000000,maxHp:4.1e+22},{name:"A Stack of Krazy Bonez",type:"charger",attackRate:1.1,power:404000000000000000000,toughness:404000000000000000000,hpRegen:40400000000000000000,maxHp:4.15e+22},{name:"Rare Foil Pokeyman Card (Enemy)",type:"normal",attackRate:1.2,power:406000000000000000000,toughness:406000000000000000000,hpRegen:40600000000000000000,maxHp:4.15e+22},{name:"A Busted Gameboy",type:"poison",attackRate:1.2,power:408000000000000000000,toughness:408000000000000000000,hpRegen:40800000000000000000,maxHp:4.2e+22},{name:"A Worthless Bean-y Baby",type:"rapid",attackRate:0.8,power:410000000000000000000,toughness:410000000000000000000,hpRegen:41000000000000000000,maxHp:4.2e+22}],boss:[]},
  "jrpgville":{normal:[{name:"Sentient Pile of Belts",type:"normal",attackRate:1,power:2e+21,toughness:2e+21,hpRegen:200000000000000000000,maxHp:2.1e+23},{name:"Mimic 'Mimic Chest' Chest",type:"paralyze",attackRate:1,power:2.02e+21,toughness:2.02e+21,hpRegen:202000000000000000000,maxHp:2.1e+23},{name:"A Suplexing Train",type:"charger",attackRate:1.1,power:2.04e+21,toughness:2.04e+21,hpRegen:204000000000000000000,maxHp:2.15e+23},{name:"The Annoying Fan",type:"normal",attackRate:1.2,power:2.06e+21,toughness:2.06e+21,hpRegen:206000000000000000000,maxHp:2.15e+23},{name:"The Infinity+1 Sword",type:"poison",attackRate:1.2,power:2.08e+21,toughness:2.08e+21,hpRegen:208000000000000000000,maxHp:2.2e+23},{name:"The Damage Cap",type:"grower",attackRate:1.1,power:2.1e+21,toughness:2.1e+21,hpRegen:210000000000000000000,maxHp:2.2e+23}],boss:[{name:"FINAL BOSS",type:"normal",attackRate:1.2,power:2.12e+21,toughness:2.12e+21,hpRegen:212000000000000000000,maxHp:2.25e+23},{name:"TRUE FINAL BOSS",type:"grower",attackRate:1.2,power:2.15e+21,toughness:2.15e+21,hpRegen:215000000000000000000,maxHp:2.25e+23}]},
  "radlands":{normal:[{name:"Small Bart",type:"normal",attackRate:0,power:2e+24,toughness:2e+24,hpRegen:2e+23,maxHp:2.1e+26},{name:"Nuclear Power Pants",type:"poison",attackRate:0,power:2.08e+24,toughness:2.08e+24,hpRegen:2.08e+23,maxHp:2.2e+26},{name:"Lame Security Guard",type:"normal",attackRate:0,power:2e+24,toughness:2e+24,hpRegen:2e+23,maxHp:2.1e+26},{name:"A Giant Vat of Plutonium-238",type:"charger",attackRate:0,power:2.04e+24,toughness:2.04e+24,hpRegen:2.04e+23,maxHp:2.15e+26},{name:"Mutant Zombie Marie Curie",type:"normal",attackRate:0,power:2.06e+24,toughness:2.06e+24,hpRegen:2.06e+23,maxHp:2.15e+26},{name:"Pair of Shades Wearing Shades",type:"paralyze",attackRate:0,power:2.02e+24,toughness:2.02e+24,hpRegen:2.02e+23,maxHp:2.1e+26},{name:"A Wandering Gamma Ray",type:"grower",attackRate:1,power:2.1e+24,toughness:2.1e+24,hpRegen:2.1e+23,maxHp:2.2e+26},{name:"A Massive Sealed Vault",type:"normal",attackRate:0,power:2.12e+24,toughness:2.12e+24,hpRegen:2.12e+23,maxHp:2.25e+26}],boss:[{name:"A.C SKATER",type:"normal",attackRate:1,power:2e+24,toughness:2e+24,hpRegen:2e+23,maxHp:2.1e+26},{name:"RADIOACTIVE MACGUFFIN",type:"grower",attackRate:1.2,power:2.15e+24,toughness:2.15e+24,hpRegen:2.15e+23,maxHp:2.25e+26}]},
  "backtoschool":{normal:[{name:"A Different Greasy Nerd",type:"normal",attackRate:1,power:6e+26,toughness:6e+26,hpRegen:6e+25,maxHp:6.1e+28},{name:"A Really Strict Nun",type:"normal",attackRate:1,power:6.06e+26,toughness:6.06e+26,hpRegen:6.06e+25,maxHp:6.15e+28},{name:"Sentient Jock Strap",type:"paralyze",attackRate:1,power:6.02e+26,toughness:6.02e+26,hpRegen:6.02e+25,maxHp:6.1e+28},{name:"The Flying Spinelli Monster",type:"charger",attackRate:1,power:6.04e+26,toughness:6.04e+26,hpRegen:6.04e+25,maxHp:6.15e+28},{name:"The Mystery Meat",type:"grower",attackRate:1.1,power:6.1e+26,toughness:6.1e+26,hpRegen:6.1e+25,maxHp:6.2e+28},{name:"The Nun's Ruler",type:"poison",attackRate:1,power:6.08e+26,toughness:6.08e+26,hpRegen:6.08e+25,maxHp:6.2e+28}],boss:[{name:"BELDING",type:"grower",attackRate:1.2,power:6.15e+26,toughness:6.15e+26,hpRegen:6.15e+25,maxHp:6.25e+28},{name:"WILLY",type:"normal",attackRate:1.2,power:6.12e+26,toughness:6.12e+26,hpRegen:6.12e+25,maxHp:6.25e+28}]},
  "westworld":{normal:[{name:"A Stickman Cowboy",type:"normal",attackRate:1,power:1.5e+27,toughness:1.5e+27,hpRegen:1.5e+26,maxHp:1.5e+29},{name:"A Giant Cannon",type:"paralyze",attackRate:1,power:1.52e+27,toughness:1.52e+27,hpRegen:1.52e+26,maxHp:1.5e+29},{name:"A Pathetic Tumbleweed",type:"poison",attackRate:1.1,power:1.56e+27,toughness:1.56e+27,hpRegen:1.56e+26,maxHp:1.55e+29},{name:"A Single Cow",type:"charger",attackRate:1.1,power:1.58e+27,toughness:1.58e+27,hpRegen:1.58e+26,maxHp:1.6e+29},{name:"Herd of Pissed Off Cows",type:"grower",attackRate:1.1,power:1.6e+27,toughness:1.6e+27,hpRegen:1.6e+26,maxHp:1.6e+29},{name:"The Entire Bar",type:"rapid",attackRate:1,power:1.54e+27,toughness:1.54e+27,hpRegen:1.54e+26,maxHp:1.55e+29},{name:"THE OUTLAW",type:"normal",attackRate:1.2,power:1.62e+27,toughness:1.62e+27,hpRegen:1.62e+26,maxHp:1.65e+29},{name:"THE SHERIFF",type:"grower",attackRate:1.2,power:1.65e+27,toughness:1.65e+27,hpRegen:1.65e+26,maxHp:1.65e+29}],boss:[]},
  "breadverse":{normal:[{name:"Grandma's 'Brownies'",type:"normal",attackRate:1,power:1e+29,toughness:1.2e+29,hpRegen:1.2e+28,maxHp:5.5e+30},{name:"Angry Raw Cookie Dough",type:"paralyze",attackRate:1,power:1.02e+29,toughness:1.22e+29,hpRegen:1.22e+28,maxHp:5.4e+30},{name:"A Bearded Breaded Braid",type:"normal",attackRate:1.1,power:1e+29,toughness:1.2e+29,hpRegen:1.2e+28,maxHp:5.6e+30},{name:"Butcher & Candlestick Maker",type:"normal",attackRate:1,power:1e+29,toughness:1.2e+29,hpRegen:1.2e+28,maxHp:5.7e+30},{name:"The Ex-Greatest Thing",type:"charger",attackRate:1.1,power:1.04e+29,toughness:1.24e+29,hpRegen:1.24e+28,maxHp:5.8e+30},{name:"Moldy Slice Of Bread",type:"normal",attackRate:1.2,power:1.06e+29,toughness:1.26e+29,hpRegen:1.26e+28,maxHp:5.9e+30}],boss:[{name:"THE YEAST BEAST",type:"poison",attackRate:1.2,power:1.08e+29,toughness:1.28e+29,hpRegen:1.28e+28,maxHp:6e+30},{name:"A DAY-OLD BAGUETTE",type:"grower",attackRate:1.2,power:1.1e+29,toughness:1.3e+29,hpRegen:1.35e+28,maxHp:6e+30}]},
  "seventies":{normal:[{name:"A Groovy Saxophone",type:"normal",attackRate:1,power:3e+29,toughness:4e+29,hpRegen:4e+28,maxHp:2.02e+31},{name:"A Giant Pair Of Roller Skates",type:"paralyze",attackRate:1,power:3.02e+29,toughness:4.02e+29,hpRegen:4.02e+28,maxHp:2.02e+31},{name:"A 70's Porn Mustasche",type:"normal",attackRate:1,power:3e+29,toughness:4e+29,hpRegen:4e+28,maxHp:2.03e+31},{name:"A Disgusting Bong",type:"normal",attackRate:1,power:3e+29,toughness:4e+29,hpRegen:4e+28,maxHp:2.03e+31},{name:"A Hippie with a Hip",type:"charger",attackRate:1.1,power:3.04e+29,toughness:4.04e+29,hpRegen:4.04e+28,maxHp:2.04e+31},{name:"Holy Crap It's Another Shark",type:"rapid",attackRate:1.2,power:3.06e+29,toughness:4.06e+29,hpRegen:4.06e+28,maxHp:2.04e+31}],boss:[{name:"THE WORST VINYL RECORD",type:"poison",attackRate:1.2,power:3.08e+29,toughness:4.08e+29,hpRegen:4.08e+28,maxHp:2.05e+31},{name:"THE 'FRO",type:"grower",attackRate:1.2,power:3.15e+29,toughness:4.1e+29,hpRegen:4.15e+28,maxHp:2.06e+31}]},
  "halloweenies":{normal:[{name:"Ultra Instinct Stoner",type:"normal",attackRate:1,power:1e+30,toughness:1.2e+30,hpRegen:1.2e+29,maxHp:6e+31},{name:"A Skeleton Inside a Body",type:"paralzye",attackRate:1,power:1e+30,toughness:1.22e+30,hpRegen:1.22e+29,maxHp:6e+31},{name:"A Badly Made Sexy Florida Costume",type:"normal",attackRate:1,power:1e+30,toughness:1.2e+30,hpRegen:1.2e+29,maxHp:6e+31},{name:"An Unnecessary Sequel",type:"normal",attackRate:1,power:1e+30,toughness:1.2e+30,hpRegen:1.2e+29,maxHp:6e+31},{name:"An Elevator Full of Blood",type:"charger",attackRate:1,power:1.04e+30,toughness:1.24e+30,hpRegen:1.24e+29,maxHp:6.5e+31},{name:"Candy Corn",type:"normal",attackRate:1,power:1.06e+30,toughness:1.26e+30,hpRegen:1.26e+29,maxHp:6.5e+31}],boss:[{name:"TEXAS CHAINSAW MASCARA",type:"normal",attackRate:1,power:1.08e+30,toughness:1.28e+30,hpRegen:1.28e+29,maxHp:6e+31},{name:"JIGSAW",type:"charger",attackRate:1,power:1.12e+30,toughness:1.3e+30,hpRegen:1.25e+29,maxHp:6.5e+31}]},
  "construction":{normal:[{name:"A Construction Slob",type:"poison",attackRate:1,power:4e+31,toughness:4.2e+31,hpRegen:4.2e+30,maxHp:2.05e+33},{name:"Quicksand Cement",type:"rapid",attackRate:1,power:4.02e+31,toughness:4.22e+31,hpRegen:4.22e+30,maxHp:2.04e+33},{name:"A Cement Truck",type:"normal",attackRate:1,power:4e+31,toughness:4.2e+31,hpRegen:4.2e+30,maxHp:2.06e+33},{name:"A Bulldozer",type:"normal",attackRate:1,power:4e+31,toughness:4.2e+31,hpRegen:4.2e+30,maxHp:2.7e+33},{name:"3 Guys Carrying a Beam",type:"poison",attackRate:1,power:4e+31,toughness:4.2e+31,hpRegen:4.2e+30,maxHp:2.05e+33},{name:"A Piano-Safe",type:"exploder",attackRate:1,power:4.06e+31,toughness:4.26e+31,hpRegen:4.26e+30,maxHp:2.09e+33}],boss:[{name:"7 GUYS TAKING A BREAK",type:"normal",attackRate:1.2,power:4.08e+31,toughness:4.28e+31,hpRegen:4.28e+30,maxHp:2.1e+33},{name:"THE CRANE",type:"charger",attackRate:1.2,power:4.1e+31,toughness:4.3e+31,hpRegen:4.35e+30,maxHp:2.1e+33}]},
  "duckduck":{normal:[{name:"A Duck",type:"normal",attackRate:1,power:1e+32,toughness:1e+32,hpRegen:1e+30,maxHp:5.02e+33},{name:"Another Duck",type:"normal",attackRate:1,power:1.02e+32,toughness:1.02e+32,hpRegen:1.02e+30,maxHp:5.02e+33},{name:"...Goose!",type:"normal",attackRate:1,power:1e+32,toughness:1e+32,hpRegen:1e+30,maxHp:5.03e+33},{name:"Scientifically Accurate Duck",type:"paralyze",attackRate:1,power:1e+32,toughness:1e+32,hpRegen:1e+30,maxHp:5.03e+33},{name:"A MotherDucker",type:"charger",attackRate:1,power:1.04e+32,toughness:1.04e+32,hpRegen:1.04e+30,maxHp:5.04e+33},{name:"Totally A Duck",type:"rapid",attackRate:1,power:1.06e+32,toughness:1.06e+32,hpRegen:1.06e+30,maxHp:5.04e+33}],boss:[{name:"THE DOG",type:"grower",attackRate:1.2,power:1.08e+32,toughness:1.08e+32,hpRegen:1.08e+30,maxHp:5.05e+33},{name:"A SINGLE GRAPE",type:"poison",attackRate:1.2,power:1e+32,toughness:1.1e+32,hpRegen:1e+30,maxHp:5.06e+33}]},
  "netherregions":{normal:[],boss:[]}
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
{id:"t1",name:"GRB",boss:58,cooldown:H,p:1300,t:1300,idleP:2300,idleT:2100,drop:"aNumber",unlock:"ngu",avatarLevel:3},
{id:"t2",name:"Grand Corrupted Tree",boss:66,cooldown:H,p:5000,t:4000,idleP:6000,idleT:5000,drop:"giantSeed",unlock:"yggdrasil",avatarLevel:4,requiresTitan:"t1",requiresKills:24,requiresUnlock:"ngu"},
{id:"t3",name:"Jake From Accounting",boss:82,cooldown:2*H,p:14000,t:12000,idleP:22000,idleT:14000,drop:"scrapPaper",unlock:"diggers",avatarLevel:5,requiresTitan:"t2",requiresKills:24,requiresUnlock:"yggdrasil"},
{id:"t4",name:"UUG",boss:100,cooldown:2*H,p:400000,t:300000,idleP:600000,idleT:400000,drop:"uugHair",unlock:"beards",flag:"ringOfApathyMaxed",avatarLevel:6,requiresTitan:"t3",requiresKills:28,requiresUnlock:"diggers"},
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
  easy:{p:700000000,t:500000000,idleP:1e9,idleT:7e8},
  normal:{p:7000000000,t:5000000000,idleP:1e10,idleT:7e9},
  hard:{p:70000000000,t:50000000000,idleP:1e11,idleT:7e10},
  brutal:{p:700000000000,t:500000000000,idleP:1e12,idleT:7e11}
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
 * ci-dessus, pas les stats AutoKill). drop="stillBeatingHeart" (guaranteed
 * lvl 4, débloque Cards -- wiki : "guaranteed to drop A Still-Beating
 * Heart, which unlocks Cards"). Butin complet (Exile (set), Hat of Greed,
 * Blue Eyes White Chestplate, etc.) volontairement HORS périmètre de ce
 * correctif -- seul le combat/tracking "v4 vaincu" est nécessaire pour la
 * condition de déblocage Sadistic ; le butin sera une passe séparée.
 */
{id:"t7",name:"The Exile",boss:190,cooldown:5.5*H,drop:"stillBeatingHeart",avatarLevel:6,difficulties:{
  easy:{p:2.3e22,t:1.2e22},
  normal:{p:3.72e23,t:1.56e23},
  hard:{p:7.45e24,t:3.55e24},
  brutal:{p:2.2e26,t:1.0e26}
}}
]);
const SETS={
/*
 * Wiki Training (set), dernière mise à jour 2026-05-28 :
 * completion = +2 Energy Speed et 10 EXP. La FAQ conserve encore une
 * ancienne valeur de 20 EXP ; la page dédiée au set est la source la plus
 * récente et la plus spécifique.
 */
training:{name:"Training Set",source:"tutorial",slots:["head","chest","legs","boots","weapon"],p:6,t:8,reward:{experience:10,energySpeed:2}},
sewers:{name:"Sewers Set",source:"sewers",slots:["head","chest","legs","boots","weapon","ring","amulet"],p:52,t:52,reward:{experience:20,adventurePower:5,adventureToughness:5,adventureHp:15,adventureRegen:.2}},
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
jake:{name:"Jake Set",source:"t3",slots:["head","chest","legs","boots","weapon","tie","paperweight"],p:26540,t:13561,reward:{experience:7000,wandoosMeh:true}},
/*
 * 2026-09-23 (audit NGU) : wiki "Gold Diggers" > Digger Slot Locations :
 * "1 from Scrap of Paper Set" ; page "Scrap of Paper (set)" : un seul objet
 * (A Scrap of Paper), "Bonus for Completion: Gain a Digger Slot!". Jake
 * From Accounting le laisse tomber à coup sûr (lvl 0). Ce Digger Slot était
 * jusqu'ici attaché à tort à la complétion du set Jake (dont le bonus réel
 * est 7 000 EXP + Wandoos MEH).
 */
scrap:{name:"Scrap of Paper Set",source:"t3",slots:["paper"],p:0,t:0,reward:{diggerSlot:1}},
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
slimy:{name:"Slimy Set",source:"t6",slots:["head","chest","legs","boots","weapon"],p:4484000,t:2154000,reward:{experience:100000,ap:10000}},
/*
 * Evilverse (2026-09-18, Norman : "il faut tout faire" -- extension aux 17
 * zones Evil/Sadistic). Wiki NGU en direct (ngu-idle.fandom.com, le mirroir
 * local n'a pas les templates Item_data qui résolvent les stats -- même
 * méthode que les 16 sets déjà audités le 2026-09-15/16, cf. commentaire
 * SET_ITEM_STATS_V1 ci-dessus) :
 * - "Edgy (set)" (Helmet/Chest/Pants/Jaw Axe/A Cheap Plastic Amulet) :
 *   "Bonus for Completion: 250k EXP! Gain a MacGuffin slot!" -- MacGuffins
 *   non construit chez SOREAL (même statut que "choco" ci-dessus), reward
 *   limité à experience:250000.
 * - "Edgy Boots (set)" (Left+Right Edgy Boot) complète séparément et
 *   débloque uniquement l'objet fusionné "BOTH Edgy Boots" (pas de bonus
 *   numérique propre) -- SOREAL n'a qu'UN slot "boots" par set (pas de
 *   Left/Right distincts) : slot "boots" ci-dessous = les stats de "BOTH
 *   Edgy Boots" directement (Power 120 000 / Toughness 1 080 000 au
 *   niveau 100, vérifié sur sa fiche dédiée), la modélisation la plus
 *   fidèle disponible sans construire un système Left/Right inexistant.
 * Total p/t = somme des 6 pièces (Helmet+Chest+Pants+Jaw Axe+BOTH Boots+
 * Amulet) = 11 820 000 / 5 174 000.
 */
edgy:{name:"Edgy Set",source:"evilverse",slots:["head","chest","legs","boots","weapon","amulet"],p:11820000,t:5174000,reward:{experience:250000}},
/*
 * Pretty Pink Princess Land (2026-09-18, même passe Evil/Sadistic). Wiki
 * NGU en direct, page "Pretty Pink Princess (set)" : 6 pièces (Clown Hat/
 * Fabulous Super Chest/A Crappy Tutu/Pretty Pink Slippers/Giant Sticky
 * Foot/A Pretty Pink Bow), "Bonus for Completion: Gain 10% more PP."
 * "PP" = Perk Points ITOPOD (glossaire wiki) : ce bonus EST câblable chez
 * SOREAL puisque le calcul ITOPOD existe déjà (idle-ngu-progression.js,
 * itopodPpBase) -- nouveau champ setRewards.itopodPpPct branché comme
 * multiplicateur sur tower.data.ppProgress, même pont cross-système que
 * setRewards.diggerSlot (déjà utilisé par availableDiggerSlots).
 * Total p/t = 16 400 000 / 7 614 000 (somme des 6 pièces "Stats Max").
 */
pinkprincess:{name:"Pretty Pink Princess Set",source:"pinkprincess",slots:["head","chest","legs","boots","weapon","amulet"],p:16400000,t:7614000,reward:{itopodPpPct:.10}},
/*
 * Meta Land (2026-09-18, même passe). Wiki NGU en direct, page
 * "Meta (set)" : 7 pièces (Numerical Head/Chest/Legs/Boots + The Number 7
 * [arme] + Infinity Charm + 69 Charm, 2 accessoires distincts -- même
 * schéma que sewers/cave/hsb qui ont déjà 2 slots accessoires nommés).
 * "Bonus for Completion: +20% NGU Speed!" -- correction du 2026-09-18 :
 * le système "ngu" (trainers Attack/Defense/Adventure/Drop/etc., wiki
 * NGU "NGU" track) EST déjà construit chez SOREAL (state.systems.ngu,
 * IDLE_NGU_TRACKS.ngu, advanceTrackSystem) -- le déni initial de ce
 * bonus était une erreur, corrigée ci-dessous via setRewards.nguSpeedPct
 * (idle-ngu-progression.js, advanceTrackSystem). Total p/t =
 * 54 371 714 / 23 171 714 (somme des 7 pièces "Stats Max").
 */
meta:{name:"Meta Set",source:"metaland",slots:["head","chest","legs","boots","weapon","charmInfinity","charm69"],p:54371714,t:23171714,reward:{nguSpeedPct:.20}},
/*
 * Interdimensional Party (2026-09-18, même passe). Wiki NGU en direct,
 * page "Party (set)" : 7 pièces (Party Hat/Pogmail Chest/Tear Away Pants/
 * Pizza Boots/The God of Thunder's Hammer [arme]/Plastic Red Cup/Party
 * Whistle, 2 accessoires distincts). "Bonus for Completion: +5% Total
 * Diggers Level Bonus" -- câblé ci-dessus dans diggerGlobalBonus()
 * (idle-ngu-progression.js), qui référençait déjà ce bonus par son nom
 * exact ("Party (set) Bonus") sans jamais pouvoir le calculer faute
 * d'équipement Party construit. Total p/t = 109 000 000 / 46 000 000
 * (somme des 7 pièces "Stats Max").
 */
party:{name:"Party Set",source:"interdimensional",slots:["head","chest","legs","boots","weapon","cup","whistle"],p:109000000,t:46000000,reward:{diggerGlobalBonusPct:5}},
/*
 * Typo Zonw (2026-09-18, même passe). Wiki NGU en direct, page
 * "Typo (set)" : 7 pièces (Hamlet/Chess Plate/Logs/Booms/Wee pin [arme]/
 * The Ass-cessory/Eye of ELXU, 2 accessoires). "Bonus for Completion:
 * +20% Wish Speed!" -- le système Wishes est absent de SOREAL (statut
 * "Wishes" non construit, cf. audit wiki-parity) : reward volontairement
 * vide, jamais approximé. Total p/t = 362 133 332 / 172 333 332 (somme
 * des 7 pièces "Stats Max").
 */
typo:{name:"Typo Set",source:"typozone",slots:["head","chest","legs","boots","weapon","asscessory","eyeElxu"],p:362133332,t:172333332,reward:{wishSpeedPct:.20}},
/*
 * The Fad-lands (2026-09-18, même passe). Wiki NGU en direct, page
 * "Fad (set)" : 7 pièces (Spinning Tophat/Demonic Flurbie Chestplate/AAA
 * Battery Legs/Slinky Boots/THE MALF SLAMMER [arme]/Rare Foil Pokeyman
 * Card/A handful of Krazy Bonez, 2 accessoires). "Bonus for Completion:
 * 10% Faster Major Quests! + 3 Beast Butters" -- Questing (statut :
 * documenté mais jamais implémenté en mécanique jouable) et Beast Mode
 * (jamais construit chez SOREAL) sont tous deux hors périmètre : reward
 * volontairement vide. Total p/t = 585 200 000 / 278 000 000 (somme des
 * 7 pièces "Stats Max").
 */
fad:{name:"Fad Set",source:"fadlands",slots:["head","chest","legs","boots","weapon","pokeymanCard","krazyBonez"],p:585200000,t:278000000,reward:{}},
/*
 * JRPGVille (2026-09-18, même passe). Wiki NGU en direct, page
 * "JRPG (set)" : gag JRPG -- l'épée "Buster Sword" est démembrée en 4
 * pièces d'ARMURE (Top/Upper/Lower/Bottom = head/chest/legs/boots) tandis
 * que "Gift Shop Buster Sword Replica" est la vraie arme (800M Power,
 * de loin la plus grosse valeur du set) ; + 2 accessoires (A Gigantic
 * Zipper, Anime Hero Wig). "Bonus for Completion: A better Ultimate
 * Attack! (5.01x -> 7.01x)" -- "Ultimate Attack" est une compétence
 * ITOPOD/combat discrète qui n'existe pas dans le modèle de combat
 * SOREAL (attaque/défense continues, jamais de multiplicateur d'attaque
 * spéciale) : reward volontairement vide. Total p/t = 913 800 000 /
 * 442 000 000 (somme des 7 pièces "Stats Max").
 */
jrpg:{name:"JRPG Set",source:"jrpgville",slots:["head","chest","legs","boots","weapon","zipper","wig"],p:913800000,t:442000000,reward:{}},
/*
 * The Rad-Lands (2026-09-18, même passe -- dernière zone Evil, "Higher
 * zones continue only in SADISTIC difficulty"). Wiki NGU en direct, page
 * "Rad (set)" : 7 pièces (Cool Shades/Leather Jacket/Flamin' Hot Shorts/
 * A Skateboard/Nunchuks [arme]/Not Drugs/The Glove of Power, 2
 * accessoires). "Bonus for Completion: +5 Max Deck Size" -- système
 * Cards (débloqué par "A Still-Beating Heart", drop garanti de l'Exile,
 * cf. commentaire IDLE_ADVENTURE_TITANS ci-dessus) jamais construit chez
 * SOREAL : reward volontairement vide. Total p/t = 2 227 200 000 /
 * 1 100 000 000 (somme des 7 pièces "Stats Max").
 */
rad:{name:"Rad Set",source:"radlands",slots:["head","chest","legs","boots","weapon","notDrugs","gloveOfPower"],p:2227200000,t:1100000000,reward:{}},
/*
 * Back To School (2026-09-18, passe SADISTIC -- 9 zones restantes). Wiki
 * NGU en direct, page "Back To School (set)" : 7 pièces (Dunce Cap/School
 * Jersey/ULTRAWIDE Pants/Shoes With Wheels/Floppy Elastic Ruler [arme]/
 * THE S/A Walkman, 2 accessoires). "Bonus for Completion: +15% NGU
 * Speed!" -- même setRewards.nguSpeedPct que Meta Land ci-dessus (le
 * système "ngu" existe chez SOREAL, correction du déni initial). Total
 * p/t = 2 928 800 000 / 1 606 000 000 (somme des 7 pièces "Stats Max").
 */
backtoschool:{name:"Back To School Set",source:"backtoschool",slots:["head","chest","legs","boots","weapon","theS","walkman"],p:2928800000,t:1606000000,reward:{nguSpeedPct:.15}},
/*
 * The West World (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Western (set)" : 7 pièces (A 10 Litre Hat/Asslest Vest/Assful
 * Chaps/Extra Spiky Spurs/The Six Shooter [arme]/A Battle Corgi/A Pink
 * Bandana, 2 accessoires). "Bonus for Completion: An Extra Drop in this
 * zone!" -- formulation qualitative sans mécanique ni magnitude précisée
 * (double tirage complet ? un item garanti en plus ? le wiki ne le
 * détaille pas) : jamais implémenté sur une supposition, reward
 * volontairement vide (règle n°1, AGENTS.md). Le bonus post-complétion
 * "A 9mm Beretta" (drop supplémentaire "if Western (set) complete") est
 * un 8e objet de loot hors des 7 pièces de complétion -- même statut que
 * les autres rares multi-zones (Ascended Pendant, Sir Looty) déjà
 * laissés hors de IDLE_ADVENTURE_SETS pour toutes les zones précédentes,
 * jamais un oubli. Total p/t = 3 788 000 000 / 2 174 000 000 (somme des
 * 7 pièces "Stats Max").
 */
western:{name:"Western Set",source:"westworld",slots:["head","chest","legs","boots","weapon","corgi","bandana"],p:3788000000,t:2174000000,reward:{}},
/*
 * The Breadverse (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Bread (set)" : 8 pièces, PAS 7 -- "Without accessories" (le
 * bloc qui isole l'armure+arme(s) des accessoires) additionne À LA FOIS
 * "1 Day-Old Baguette" ET "A Rolling Pin" comme 2 objets à arme distincts
 * (confirmé par la somme exacte du total officiel de la page), en plus
 * des 4 pièces d'armure et de 2 accessoires (A Cream Pie, A Spoonful of
 * Yeast). SOREAL n'a qu'UN slot "weapon" par set : "weapon" porte A
 * Rolling Pin (la plus grosse Power), "baguette" porte 1 Day-Old
 * Baguette comme second slot arme distinct -- déjà le même principe que
 * les 2 slots accessoires des sets précédents, juste appliqué à une arme
 * au lieu d'un bijou. "Bonus for Completion: Faster Cooks!!" -- le
 * système Cooking n'existe pas du tout chez SOREAL : reward
 * volontairement vide. Total p/t = 16 524 000 000 / 5 080 000 000
 * (somme des 8 pièces "Stats Max").
 */
bread:{name:"Bread Set",source:"breadverse",slots:["head","chest","legs","boots","weapon","baguette","creamPie","yeast"],p:16524000000,t:5080000000,reward:{}},
/*
 * That 70's Zone (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Disco (set)" : même structure à 8 pièces que Bread ci-dessus --
 * "Without accessories" additionne "A Rusty Old Sabre" ET "A Vinyl
 * Record Shard" comme 2 armes distinctes, + 4 pièces d'armure + 2
 * accessoires (A Bit of White Powder, Some Rolling Paper). "weapon" =
 * A Rusty Old Sabre, "vinylShard" = second slot arme (même principe que
 * "baguette" pour Bread). "Bonus for Completion: Less crappy cards!" --
 * système Cards non construit chez SOREAL : reward volontairement vide.
 * Total p/t = 22 076 601 000 / 6 820 000 000 (somme des 8 pièces
 * "Stats Max").
 */
disco:{name:"Disco Set",source:"seventies",slots:["head","chest","legs","boots","weapon","vinylShard","whitePowder","rollingPaper"],p:22076601000,t:6820000000,reward:{}},
/*
 * The Halloweenies (2026-09-18, même passe SADISTIC). Wiki NGU en
 * direct, page "Halloweenie (set)" : même structure à 8 pièces que
 * Bread/Disco -- "Without accessories" additionne "An Ordinary Apple" ET
 * "A Giant Scythe" comme 2 armes distinctes, + 4 pièces d'armure (Neck
 * Bolts/Skeleton Shirt/A Broomstick/Fuzzy Boots) + 2 accessoires (A Roll
 * of Toilet Paper, Pandora's Box). "weapon" = A Giant Scythe (la plus
 * grosse Power), "apple" = second slot arme. "Bonus for Completion: +45%
 * PP gain!" -- ITOPOD, même pont setRewards.itopodPpPct que Pretty Pink
 * Princess ci-dessus (les deux s'additionnent naturellement via
 * checkSets, jamais un plafond artificiel). Total p/t = 31 331 600 000 /
 * 9 226 000 000 (somme des 8 pièces "Stats Max").
 */
halloweenie:{name:"Halloweenie Set",source:"halloweenies",slots:["head","chest","legs","boots","weapon","apple","toiletPaper","pandora"],p:31331600000,t:9226000000,reward:{itopodPpPct:.45}},
/*
 * Construction Zone (2026-09-18, même passe SADISTIC). Wiki NGU en
 * direct, page "Construction (set)" : même structure à 8 pièces --
 * "Without accessories" additionne "A Wooden Hammer" ET "A Giant
 * Wrecking Ball" comme 2 armes distinctes, + 4 pièces d'armure (A
 * Hardhat/High Visibility Vest/Yet Another Generic Pair Of Jeans/Steel
 * Toed Boots) + 2 accessoires (The Toolbox, A Level Level). "weapon" =
 * A Giant Wrecking Ball (la plus grosse Power), "hammer" = second slot
 * arme. "Bonus for Completion: 20% Boostier Boosts!" -- réutilise
 * exactement setRewards.boostEffectiveness, déjà câblé dans applyBoost()
 * depuis le set "badly" (Badly Drawn World, V143) : s'additionne
 * naturellement avec lui via checkSets, jamais un nouveau champ. Total
 * p/t = 87 119 800 000 / 23 276 000 000 (somme des 8 pièces
 * "Stats Max").
 */
construction:{name:"Construction Set",source:"construction",slots:["head","chest","legs","boots","weapon","hammer","toolbox","levelLevel"],p:87119800000,t:23276000000,reward:{boostEffectiveness:.20}},
/*
 * DUCK DUCK ZONE (2026-09-18, même passe SADISTIC). Wiki NGU en direct,
 * page "Duck (set)" : même structure à 8 pièces -- "Without accessories"
 * additionne "A shotgun" ET "The Zapper" comme 2 armes distinctes, + 4
 * pièces d'armure (A Fake Duckbill/An Inflatable Ducky Innertube/Duck
 * Duck Shorts/Duck Slippers) + 2 accessoires (Some Duck-t Tape, A Duck
 * Caller). "weapon" = The Zapper (la plus grosse Power), "shotgun" =
 * second slot arme. "Bonus for Completion: +6% Mayo and Card Speed!" --
 * Mayo et Cards n'existent ni l'un ni l'autre chez SOREAL : reward
 * volontairement vide. Total p/t = 123 080 000 000 / 32 100 000 000
 * (somme des 8 pièces "Stats Max").
 */
duck:{name:"Duck Set",source:"duckduck",slots:["head","chest","legs","boots","weapon","shotgun","ducktTape","duckCaller"],p:123080000000,t:32100000000,reward:{}},
/*
 * The Nether Regions (2026-09-18, même passe SADISTIC). Wiki NGU en
 * direct, page "Dutch (set)" : même structure à 8 pièces -- "Without
 * accessories" additionne "Black Tulip" ET "Weaponized Hollandaise
 * sauce" comme 2 armes distinctes, + 4 pièces d'armure (A Dutch Hat/
 * Windmill Shirt/Stroopwaffel Pants/Clogs) + 2 accessoires (Pocket
 * Netherlands, Rest of the Combat Cheese). "weapon" = Weaponized
 * Hollandaise sauce (la plus grosse Power), "tulip" = second slot arme.
 * "Bonus for Completion: +25% Faster Blood Magic Rituals!" -- câblé
 * ci-dessus dans advanceBloodMagic() via le nouveau
 * setRewards.bloodMagicSpeedPct, système déjà entièrement construit chez
 * SOREAL. Total p/t = 166 160 000 000 / 45 680 000 000 (somme des 8
 * pièces "Stats Max").
 */
dutch:{name:"Dutch Set",source:"netherregions",slots:["head","chest","legs","boots","weapon","tulip","netherlands","cheese"],p:166160000000,t:45680000000,reward:{bloodMagicSpeedPct:.25}},
/*
 * The Aethereal Sea (2026-09-18, dernière zone -- "It was formerly named
 * The Aethereal Sea Part 1 but apparently an intended Part 2 got
 * cancelled"). Wiki NGU en direct, page "Pirate (set)" : même structure
 * à 8 pièces -- "Without accessories" additionne "The Cutlass" ET "The
 * Flintlock" comme 2 armes distinctes, + 4 pièces d'armure (Pirate Hat/
 * Swashbuckler Chest/Piratey Pants/Piratey Peglegs) + 2 accessoires (A
 * Giant's Eyepatch, A Compass!). "weapon" = The Flintlock (la plus
 * grosse Power), "cutlass" = second slot arme. "Bonus for Completion:
 * \"Pride and Accomplishment.\"" -- texte d'ambiance littéral, PAS un
 * bonus chiffré (blague NGU habituelle sur les sets de fin de contenu) :
 * reward vide à raison, rien à câbler. Total p/t = 289 540 000 000 /
 * 72 200 000 000 (somme des 8 pièces "Stats Max").
 */
pirate:{name:"Pirate Set",source:"aethereansea",slots:["head","chest","legs","boots","weapon","cutlass","eyepatch","compass"],p:289540000000,t:72200000000,reward:{}}
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
  "forest:weapon":{p:160,t:0},"forest:head":{p:0,t:40},"forest:chest":{p:0,t:40},"forest:legs":{p:0,t:40},"forest:boots":{p:0,t:40},"forest:ring":{p:16,t:16},"forest:pendant":{p:0,t:0},
  "cave:weapon":{p:400,t:0},"cave:head":{p:0,t:100},"cave:chest":{p:0,t:100},"cave:legs":{p:0,t:100},"cave:boots":{p:0,t:100},"cave:ring":{p:8,t:8},"cave:amulet":{p:2,t:2},"cave:combat":{p:60,t:60},
  "hsb:weapon":{p:1000,t:0},"hsb:head":{p:0,t:250},"hsb:chest":{p:0,t:250},"hsb:legs":{p:0,t:250},"hsb:boots":{p:0,t:250},"hsb:ring":{p:90,t:90},"hsb:amulet":{p:0,t:0},
  "grb:weapon":{p:2000,t:160},"grb:head":{p:500,t:500},"grb:chest":{p:40,t:500},"grb:legs":{p:40,t:500},"grb:boots":{p:40,t:500},"grb:necklace":{p:500,t:500},"grb:meat":{p:0,t:0},
  "clock:weapon":{p:5000,t:160},"clock:head":{p:60,t:860},"clock:chest":{p:40,t:890},"clock:legs":{p:40,t:1000},"clock:boots":{p:40,t:1030},"clock:alarm":{p:900,t:900},"clock:sands":{p:0,t:0},
  "spoopy:weapon":{p:17776,t:600},"spoopy:head":{p:100,t:2000},"spoopy:chest":{p:160,t:2070},"spoopy:legs":{p:140,t:2120},"spoopy:boots":{p:120,t:2180},"spoopy:ring":{p:2100,t:2100},"spoopy:amulet":{p:0,t:0},
  "jake:weapon":{p:23000,t:0},"jake:head":{p:160,t:2600},"jake:chest":{p:160,t:2500},"jake:legs":{p:160,t:2798},"jake:boots":{p:160,t:2600},"scrap:paper":{p:0,t:0},"jake:tie":{p:0,t:163},"jake:paperweight":{p:2900,t:2900},
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
  "rerednaw:head":{p:2000,t:42000},"rerednaw:chest":{p:2000,t:44000},"rerednaw:legs":{p:2000,t:46000},"rerednaw:boots":{p:2000,t:48000},
  "edgy:weapon":{p:11200000,t:600000},"edgy:head":{p:80000,t:1004000},"edgy:chest":{p:60000,t:1080000},"edgy:legs":{p:60000,t:1110000},"edgy:boots":{p:120000,t:1080000},"edgy:amulet":{p:300000,t:300000},
  "pinkprincess:weapon":{p:15200000,t:880000},"pinkprincess:head":{p:120000,t:1484000},"pinkprincess:chest":{p:120000,t:1480000},"pinkprincess:legs":{p:100000,t:1510000},"pinkprincess:boots":{p:60000,t:1460000},"pinkprincess:amulet":{p:800000,t:800000},
  "meta:weapon":{p:50000000,t:2400000},"meta:head":{p:300000,t:4400000},"meta:chest":{p:300000,t:4400000},"meta:legs":{p:300000,t:4400000},"meta:boots":{p:300000,t:4400000},"meta:charmInfinity":{p:1777776,t:1777776},"meta:charm69":{p:1393938,t:1393938},
  "party:weapon":{p:100000000,t:4000000},"party:head":{p:500000,t:9000000},"party:chest":{p:500000,t:9000000},"party:legs":{p:500000,t:9000000},"party:boots":{p:500000,t:9000000},"party:cup":{p:3000000,t:2000000},"party:whistle":{p:4000000,t:4000000},
  "typo:weapon":{p:320000000,t:12000000},"typo:head":{p:1200000,t:30000000},"typo:chest":{p:1200000,t:32000000},"typo:legs":{p:1200000,t:31000000},"typo:boots":{p:1200000,t:30000000},"typo:asscessory":{p:24000000,t:24000000},"typo:eyeElxu":{p:13333332,t:13333332},
  "fad:weapon":{p:500000000,t:20000000},"fad:head":{p:1800000,t:44000000},"fad:chest":{p:1800000,t:48000000},"fad:legs":{p:1800000,t:46000000},"fad:boots":{p:1800000,t:42000000},"fad:pokeymanCard":{p:38000000,t:38000000},"fad:krazyBonez":{p:40000000,t:40000000},
  "jrpg:weapon":{p:800000000,t:32000000},"jrpg:head":{p:2800000,t:76000000},"jrpg:chest":{p:3000000,t:74000000},"jrpg:legs":{p:3000000,t:78000000},"jrpg:boots":{p:3000000,t:76000000},"jrpg:zipper":{p:42000000,t:46000000},"jrpg:wig":{p:60000000,t:60000000},
  "rad:weapon":{p:1760000000,t:70000000},"rad:head":{p:6600000,t:174000000},"rad:chest":{p:6800000,t:172000000},"rad:legs":{p:7000000,t:172000000},"rad:boots":{p:6800000,t:172000000},"rad:notDrugs":{p:180000000,t:180000000},"rad:gloveOfPower":{p:260000000,t:160000000},
  "backtoschool:weapon":{p:2280000000,t:90000000},"backtoschool:head":{p:9200000,t:244000000},"backtoschool:chest":{p:9200000,t:244000000},"backtoschool:legs":{p:9200000,t:244000000},"backtoschool:boots":{p:9200000,t:244000000},"backtoschool:theS":{p:360000000,t:360000000},"backtoschool:walkman":{p:252000000,t:180000000},
  "western:weapon":{p:2960000000,t:116000000},"western:head":{p:12000000,t:318000000},"western:chest":{p:12000000,t:320000000},"western:legs":{p:12000000,t:316000000},"western:boots":{p:12000000,t:324000000},"western:corgi":{p:440000000,t:440000000},"western:bandana":{p:340000000,t:340000000},
  "bread:weapon":{p:7640000000,t:180000000},"bread:baguette":{p:7200000000,t:274000000},"bread:head":{p:26000000,t:760000000},"bread:chest":{p:26000000,t:764000000},"bread:legs":{p:26000000,t:766000000},"bread:boots":{p:26000000,t:756000000},"bread:creamPie":{p:820000000,t:820000000},"bread:yeast":{p:760000000,t:760000000},
  "disco:weapon":{p:9720001000,t:274000000},"disco:vinylShard":{p:10000000000,t:220000000},"disco:head":{p:35000000,t:1026000000},"disco:chest":{p:35200000,t:1024000000},"disco:legs":{p:35200000,t:1028000000},"disco:boots":{p:35200000,t:1032000000},"disco:whitePowder":{p:1106000000,t:1106000000},"disco:rollingPaper":{p:1110000000,t:1110000000},
  "halloweenie:weapon":{p:14500000000,t:420000000},"halloweenie:apple":{p:14040000000,t:274000000},"halloweenie:head":{p:50600000,t:1486000000},"halloweenie:chest":{p:51000000,t:1480000000},"halloweenie:legs":{p:51000000,t:1490000000},"halloweenie:boots":{p:51000000,t:1488000000},"halloweenie:toiletPaper":{p:1286000000,t:1286000000},"halloweenie:pandora":{p:1302000000,t:1302000000},
  "construction:weapon":{p:41020000000,t:600000000},"construction:hammer":{p:40000000000,t:800000000},"construction:head":{p:145200000,t:4110000000},"construction:chest":{p:144800000,t:4080000000},"construction:legs":{p:151800000,t:4060000000},"construction:boots":{p:152000000,t:4120000000},"construction:toolbox":{p:3640000000,t:3640000000},"construction:levelLevel":{p:1866000000,t:1866000000},
  "duck:weapon":{p:57800000000,t:840000000},"duck:shotgun":{p:57000000000,t:1100000000},"duck:head":{p:200000000,t:5640000000},"duck:chest":{p:200000000,t:5620000000},"duck:legs":{p:200000000,t:5740000000},"duck:boots":{p:200000000,t:5680000000},"duck:ducktTape":{p:5080000000,t:5080000000},"duck:duckCaller":{p:2400000000,t:2400000000},
  "dutch:weapon":{p:76400000000,t:1200000000},"dutch:tulip":{p:76000000000,t:1200000000},"dutch:head":{p:280000000,t:7700000000},"dutch:chest":{p:280000000,t:7640000000},"dutch:legs":{p:280000000,t:7600000000},"dutch:boots":{p:280000000,t:7700000000},"dutch:netherlands":{p:5620000000,t:5620000000},"dutch:cheese":{p:7020000000,t:7020000000},
  "pirate:weapon":{p:138000000000,t:2000000000},"pirate:cutlass":{p:126000000000,t:2000000000},"pirate:head":{p:480000000,t:11200000000},"pirate:chest":{p:500000000,t:11400000000},"pirate:legs":{p:480000000,t:11000000000},"pirate:boots":{p:480000000,t:11000000000},"pirate:eyepatch":{p:11800000000,t:11800000000},"pirate:compass":{p:11800000000,t:11800000000}
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
 * Cap/Power/Speed, Drop Chance) : `p`/`t` valent alors bien 0 ci-dessous —
 * valeur réelle et vérifiée du wiki, pas un oubli.
 *
 * PISTE 2 (audit 2026-09-18, Norman : "Est-ce que tu as bien intégré chacune
 * des statistiques special etc ?") — chaque fiche "Specials" a été revérifiée
 * en direct au navigateur pour les ~17 objets SPECIALS restants (au-delà de
 * tutorialCube, déjà fait PISTE 1). `sType`/`sBase`/`sMax` portent désormais
 * le PREMIER bonus Special listé par la fiche (celui qui reste le seul
 * boostable/plafonné via le mécanisme existant `special()`/`applyBoost`/
 * `cleanItem` — inchangé, un seul scalaire `o.special` par objet). Quand une
 * fiche en liste D'AUTRES (2e/3e/4e/5e bonus, ex. Cheese Grater : Drop
 * Chance + Energy Speed + Magic Speed), ils sont portés par `sExtra`
 * ([{type,base,max0,max100}]) : leur "Base value" wiki (valeur garantie par
 * le simple fait d'équiper l'objet, SANS boost) alimente l'agrégat
 * `specialsByType`/`specials` ci-dessous (idleAdventureEquipmentStatsV47).
 * Ces bonus `sExtra` ne sont PAS individuellement boostables : le wiki NGU
 * ne documente nulle part de mécanisme choisissant QUEL Special d'un objet
 * multi-bonus reçoit un Boost donné, et SOREAL n'a qu'un unique boostType
 * "special" par objet — inventer une UI de ciblage par sous-stat serait une
 * nouvelle mécanique non demandée. Signalé comme choix de conception dans le
 * rapport final, pas un oubli.
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
/*
 * PISTE 1 de l'audit wiki 2026-09-18 : page ngu-idle.fandom.com/wiki/
 * 4G%27s_Merge_and_Boost_Tutorial_Cube vérifiée en direct (navigateur,
 * section "Specials") -- "Energy Speed -- Base value: 5% -- Max stat at
 * lvl 0: 15% -- Max stat at max lvl: 30% -- Base Points: 5 -- Max Points
 * at lvl 0: 15 -- Max Points at max lvl: 30". Aucun champ ne portait cette
 * magnitude avant ce correctif (SPECIALS.tutorialCube n'avait que p/t).
 * sBase:5 (valeur de départ SANS aucun boost -- seule stat de cet objet
 * dont le "Base value" wiki n'est PAS 0, contrairement à Power/Toughness/
 * HP Max/HP regen ci-dessus dont "Base value" vaut bien 0 chacun -- donc
 * PAS soumis au principe "démarre à 0" du commentaire special() plus bas,
 * la fiche wiki documente explicitement un plancher non nul pour ce
 * Special précis) ; sMax:15 (plafond au niveau 0, doublant à 30 au niveau
 * 100 via le même q=1+niveau/100 déjà utilisé pour p/t -- vérifié sur la
 * fiche que "Max stat at max lvl" = 2×"Max stat at lvl 0", identique à la
 * convention Power/Toughness). Câblé dans special()/idleAdventure
 * SpecialBaseStatsV1/applyBoost/cleanItem (voir ces fonctions). Le
 * multiplicateur Energy Speed réel (appliquer ce % à la vitesse Energy
 * effective) reste HORS PÉRIMÈTRE de ce correctif : stats.special (agrégat
 * idleAdventureEquipmentStatsV47, ligne ~2123) somme déjà TOUS les objets
 * SPECIALS équipés dans un seul nombre sans distinguer leur TYPE réel de
 * bonus (Energy Speed pour ce cube, mais Magic Cap/Power pour "A Dragon's
 * Left Ball", Energy/Magic Cap pour "A Sinusoidal Wave", etc. -- voir
 * commentaires "Specials seulement" plus bas, aucun avec magnitude vérifiée
 * pour l'instant) : câbler l'agrégat tel quel en "+X% Energy Speed"
 * mélangerait à tort des bonus de types différents. Nécessite d'abord un
 * audit par-objet du TYPE + magnitude de chaque Special (tâche séparée,
 * signalée dans le rapport final, pas un simple oubli).
 */
// PISTE 2 : sType ajouté (energySpeedPct) -- même magnitude PISTE 1, voir commentaire au-dessus de SPECIALS.
tutorialCube:{name:"Tutorial Cube",zone:"sewers",slot:"special",cube:true,dropLevel:4,p:7,t:7,sBase:5,sMax:15,sType:"energySpeedPct",bossOnly:true,dropChance:0.10},
// wiki : "The Tuba of Time" — Power/Toughness Max stat at lvl 0 = 10/10. Specials : Energy Power -- Base 5%, Max lvl0 15%, Max lvl100 30%.
tubaTime:{name:"Tuba of Time",zone:"forest",slot:"accessory",dropLevel:1,p:10,t:10,sBase:5,sMax:15,sType:"energyPowerPct"},
// wiki : "Cheese Grater" — Power Max at lvl 0 = 15 ; aucune stat Toughness listée. Specials : Drop Chance (1/2/4%), Energy Speed (20/40/80%), Magic Speed (15/30/60%).
cheeseGrater:{name:"Cheese Grater",zone:"cave",slot:"accessory",dropLevel:1,p:15,t:0,sBase:1,sMax:2,sType:"dropChancePct",sExtra:[{type:"energySpeedPct",base:20,max0:40,max100:80},{type:"magicSpeedPct",base:15,max0:30,max100:60}]},
// wiki : "A Dragon's Left Ball" — aucune stat Power/Toughness. Specials : Magic Cap (2/3/6%), Magic Power (20/50/100%).
skyBall:{name:"A Dragon's Left Ball",zone:"sky",slot:"accessory",dropLevel:1,p:0,t:0,sBase:2,sMax:3,sType:"magicCapPct",sExtra:[{type:"magicPowerPct",base:20,max0:50,max100:100}]},
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
/*
 * Correctif 2026-09-18 (wiki réel : "Id: 120... Item Drop Level / Drop
 * Zone(s): lvl 10 in Tutorial Zone") : dropLevel corrigé de 0 à 10 --
 * l'objet apparaît déjà au niveau 10 quand il tombe, comme documenté,
 * jamais niveau 0.
 */
flubber:{name:"The Lonely Flubber",zone:"tutorial",slot:"accessory",set:"training",dropLevel:10,p:0,t:0,customDropRoll:true},
// wiki : "A busted copy of Wandoos 98" — consommable de déblocage d'OS, aucune stat.
wandoos98:{name:"Wandoos 98",zone:"sky",slot:"special",unlock:"wandoos",dropLevel:0,p:0,t:0},
// wiki : "Magicite Crystal" — Power/Toughness Max at lvl 0 = 50/50. Specials : Magic Cap (4/6/12%), Magic Speed (25/50/100%).
magicite:{name:"Magicite Crystal",zone:"hsb",slot:"accessory",dropLevel:1,p:50,t:50,sBase:4,sMax:6,sType:"magicCapPct",sExtra:[{type:"magicSpeedPct",base:25,max0:50,max100:100}]},
// wiki : "Giant Windup Gear" — Power/Toughness Max at lvl 0 = 150/150. Specials : Drop Chance (4/8/16%), Energy Cap (3/5/10%), Magic Cap (3/5/10%).
windupGear:{name:"Giant Windup Gear",zone:"clock",slot:"accessory",dropLevel:1,p:150,t:150,sBase:4,sMax:8,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:3,max0:5,max100:10},{type:"magicCapPct",base:3,max0:5,max100:10}]},
// wiki : "A Sinusoidal Wave" — aucune stat Power/Toughness. Specials : Energy Cap (2.5/7/14%), Magic Cap (2.5/7/14%).
sinusoidalWave:{name:"A Sinusoidal Wave",zone:"2d",slot:"accessory",dropLevel:1,p:0,t:0,sBase:2.5,sMax:7,sType:"energyCapPct",sExtra:[{type:"magicCapPct",base:2.5,max0:7,max100:14}]},
// wiki : "Ghost Typewriter" — Power/Toughness Max at lvl 0 = 600/600. Specials : Drop Chance (9/18/36%), Energy Cap (8/16/32%), Magic Power (30/60/120%).
ghostTypewriter:{name:"Ghost Typewriter",zone:"ancient",slot:"accessory",dropLevel:1,p:600,t:600,sBase:9,sMax:18,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:8,max0:16,max100:32},{type:"magicPowerPct",base:30,max0:60,max100:120}]},
// wiki : "Gaudy Epaulettes" — Power/Toughness Max at lvl 0 = 900/900. Specials : Energy Bars (60/100/200%), Energy Cap (12/24/48%), Energy Power (50/90/180%).
gaudyShoulders:{name:"Gaudy Epaulettes",zone:"avsp",slot:"accessory",dropLevel:1,p:900,t:900,sBase:60,sMax:100,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:12,max0:24,max100:48},{type:"energyPowerPct",base:50,max0:90,max100:180}]},
// wiki : "The F Tank" — Power/Toughness Max at lvl 0 = 4 000/4 000. Specials : Energy Bars (100/100/200%), Energy Cap (50/50/100%), Energy Power (100/160/320%).
fTank:{name:"The F Tank",zone:"mega",slot:"accessory",dropLevel:1,p:4000,t:4000,sBase:100,sMax:100,sType:"energyBarsPct",sExtra:[{type:"energyCapPct",base:50,max0:50,max100:100},{type:"energyPowerPct",base:100,max0:160,max100:320}]},
// wiki : "Ring of Apathy" — pas de section Stats du tout, aucune stat Power/Toughness, aucun Special (son seul effet réel est un mécanisme de parité de niveau pour UUG, pas un bonus chiffré).
ringOfApathy:{name:"Ring of Apathy",zone:"forest",slot:"accessory",dropLevel:1,maxFlag:"ringOfApathyMaxed",requiresBoss:100,p:0,t:0},
// wiki : "A Beard Comb" — aucune stat Power/Toughness. Specials : Beard Speed (6/12/24%), Energy Cap (40/60/120%), Magic Power (350/450/900%).
beardComb:{name:"Beard Comb",zone:"beardverse",slot:"accessory",dropLevel:1,p:0,t:0,sBase:6,sMax:12,sType:"beardSpeedPct",sExtra:[{type:"energyCapPct",base:40,max0:60,max100:120},{type:"magicPowerPct",base:350,max0:450,max100:900}]},
// wiki : "Random Crayons" — aucune stat Power/Toughness. Specials : Drop Chance (40/40/80%), Energy Cap (40/40/80%), Energy Power (400/400/800%), Magic Cap (40/40/80%), Magic Power (400/400/800%).
randomCrayons:{name:"Random Crayons",zone:"badly",slot:"accessory",dropLevel:1,p:0,t:0,sBase:40,sMax:40,sType:"dropChancePct",sExtra:[{type:"energyCapPct",base:40,max0:40,max100:80},{type:"energyPowerPct",base:400,max0:400,max100:800},{type:"magicCapPct",base:40,max0:40,max100:80},{type:"magicPowerPct",base:400,max0:400,max100:800}]},
// wiki : "Red Lipstick" — aucune stat Power/Toughness. Specials : Beard Speed (25/25/50%), Energy Power (1000/1000/2000%), Magic Cap (150/150/300%), Magic Power (1000/1000/2000%).
redLipstick:{name:"Red Lipstick",zone:"boring",slot:"accessory",dropLevel:1,p:0,t:0,sBase:25,sMax:25,sType:"beardSpeedPct",sExtra:[{type:"energyPowerPct",base:1000,max0:1000,max100:2000},{type:"magicCapPct",base:150,max0:150,max100:300},{type:"magicPowerPct",base:1000,max0:1000,max100:2000}]},
// wiki : "Candy Corn Necklace" — aucune stat Power/Toughness. Specials : Energy Bars (2000/2000/4000%), Magic Bars (2000/2000/4000%), NGU Speed (200/200/400%), Seed Gain (50/50/100%).
candyCornNecklace:{name:"Candy Corn Necklace",zone:"chocolate",slot:"accessory",dropLevel:1,p:0,t:0,sBase:2000,sMax:2000,sType:"energyBarsPct",sExtra:[{type:"magicBarsPct",base:2000,max0:2000,max100:4000},{type:"nguSpeedPct",base:200,max0:200,max100:400},{type:"seedGainPct",base:50,max0:50,max100:100}]},
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
// PISTE 2 (2026-09-18) : fiche revérifiée -- aucune section "Specials", seulement Power/Toughness ci-dessus. Pas d'oubli.
wanderersCane:{name:"Wanderer's Cane",zone:"",slot:"weapon",dropLevel:10,p:170000,t:12000},
/*
 * V145 — butin exclusif aux paliers Normal+/Hard+/Brutal de The Beast
 * (t6), garanti au kill plutôt que le jet aléatoire à % du wiki (voir
 * commentaire sur IDLE_ADVENTURE_TITANS). zone:"" volontairement : ce
 * ne sont pas des butins de zone (jamais sélectionnés par rollKill),
 * uniquement distribués depuis titan().
 */
// wiki : "A Shrunken Voodoo Doll" (lvl 4, Titan The Beast Normal+) — Power/Toughness Max at lvl 0 = 66 666/66 666. Specials : Beard Speed (200/200/400%), NGU Speed (200/200/400%).
shrunkenVoodooDoll:{name:"Shrunken Voodoo Doll",zone:"",slot:"accessory",dropLevel:4,p:66666,t:66666,sBase:200,sMax:200,sType:"beardSpeedPct",sExtra:[{type:"nguSpeedPct",base:200,max0:200,max100:400}]},
// wiki : "A Priceless Van-Gogh Painting" (lvl 4, Titan The Beast Hard+) — Power/Toughness Max at lvl 0 = 30 000/30 000. Specials : Energy Cap (200/200/400%), Gold Drops (3000/3000/6000%), Magic Cap (200/200/400%).
pricelessVanGoghPainting:{name:"A Priceless Van-Gogh Painting",zone:"",slot:"accessory",dropLevel:4,p:30000,t:30000,sBase:200,sMax:200,sType:"energyCapPct",sExtra:[{type:"goldDropsPct",base:3000,max0:3000,max100:6000},{type:"magicCapPct",base:200,max0:200,max100:400}]},
// wiki : "A Small Gerbil" (lvl 4, Titan The Beast Brutal) — Power/Toughness Max at lvl 0 = 100 000/100 000. Specials : Energy Power (2000/6000/12000%), Magic Cap (200/600/1200%), Magic Power (2000/6000/12000%).
smallGerbil:{name:"A Small Gerbil",zone:"",slot:"accessory",dropLevel:4,p:100000,t:100000,sBase:2000,sMax:6000,sType:"energyPowerPct",sExtra:[{type:"magicCapPct",base:200,max0:600,max100:1200},{type:"magicPowerPct",base:2000,max0:6000,max100:12000}]},
/*
 * Compétences Adventure avancées — objets de déblocage NGU.
 * - Red Liquid : lvl 5, rare drop du Grand Corrupted Tree, consommé pour
 *   Hyper Regen ; niveau 100 = Red Liquid Set.
 * - Purple Liquid : lvl 1, rare drop The Beast Normal+, consommé pour
 *   Beast Mode ; niveau 100 = Purple Liquid Set.
 * - Grey Liquid : transformation d'un Small Gerbil lvl 100 en Sadistic,
 *   consommé pour MOVE 69.
 * Ce sont des consommables, jamais des accessoires équipables.
 */
mysteriousRedLiquid:{name:"Mysterious Red Liquid",zone:"",slot:"consumable",dropLevel:5,p:0,t:0,consumable:true,maxFlag:"redLiquidMaxed"},
mysteriousPurpleLiquid:{name:"Mysterious Purple Liquid",zone:"",slot:"consumable",dropLevel:1,p:0,t:0,consumable:true,maxFlag:"purpleLiquidMaxed"},
mysteriousGreyLiquid:{name:"Mysterious Grey Liquid",zone:"",slot:"consumable",dropLevel:0,p:0,t:0,consumable:true}
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
/*
 * Identifiants d'items officiels NGU (2026-09-18).
 *
 * Source de vérité média : les fichiers R2 suivent exactement la convention
 * `idle/items/Item_<ID wiki sur 4 chiffres>_<nom NGU>.<ext>`.
 * Les 241 pièces de sets ci-dessous ont été recoupées par nom NGU exact
 * avec le listing R2 réel. Les 22 SPECIALS sont couverts aussi ; cinq ont
 * un libellé SOREAL abrégé/différent du fichier R2 et sont explicitement
 * verrouillés : Tutorial Cube=77, Tuba=432, Wandoos 98=66,
 * Beard Comb=441, Shrunken Voodoo Doll=190.
 *
 * Cette table vit côté moteur IDLE : APP ne doit plus maintenir une copie
 * géante des noms/IDs. Le client transporte wikiItemId et le Worker média
 * résout d'abord l'ID exact, puis conserve le nom comme compatibilité.
 */
export const IDLE_ADVENTURE_WIKI_ITEM_IDS_V1=Object.freeze({
  "training:weapon":75,
  "training:head":62,
  "training:chest":63,
  "training:legs":64,
  "training:boots":65,
  "sewers:weapon":44,
  "sewers:head":40,
  "sewers:chest":41,
  "sewers:legs":42,
  "sewers:boots":43,
  "sewers:ring":45,
  "sewers:amulet":46,
  "forest:weapon":51,
  "forest:head":47,
  "forest:chest":48,
  "forest:legs":49,
  "forest:boots":50,
  "forest:ring":52,
  "forest:pendant":53,
  "cave:weapon":58,
  "cave:head":54,
  "cave:chest":55,
  "cave:legs":56,
  "cave:boots":57,
  "cave:ring":59,
  "cave:amulet":60,
  "cave:combat":61,
  "hsb:weapon":72,
  "hsb:head":68,
  "hsb:chest":69,
  "hsb:legs":70,
  "hsb:boots":71,
  "hsb:ring":73,
  "hsb:amulet":74,
  "grb:weapon":82,
  "grb:head":78,
  "grb:chest":79,
  "grb:legs":80,
  "grb:boots":81,
  "grb:necklace":83,
  "grb:meat":84,
  "clock:weapon":89,
  "clock:head":85,
  "clock:chest":86,
  "clock:legs":87,
  "clock:boots":88,
  "clock:alarm":90,
  "clock:sands":91,
  "2d:weapon":99,
  "2d:head":95,
  "2d:chest":96,
  "2d:legs":97,
  "2d:boots":98,
  "2d:cube":100,
  "2d:amulet":101,
  "spoopy:weapon":107,
  "spoopy:head":103,
  "spoopy:chest":104,
  "spoopy:legs":105,
  "spoopy:boots":106,
  "spoopy:ring":108,
  "spoopy:amulet":109,
  "jake:weapon":115,
  "jake:head":111,
  "jake:chest":112,
  "jake:legs":113,
  "jake:boots":114,
  "jake:tie":116,
  "jake:paperweight":117,
  "scrap:paper":197,
  "gaudy:weapon":126,
  "gaudy:head":122,
  "gaudy:chest":123,
  "gaudy:legs":124,
  "gaudy:boots":125,
  "mega:weapon":134,
  "mega:head":130,
  "mega:chest":131,
  "mega:legs":132,
  "mega:boots":133,
  "beardverse:weapon":147,
  "beardverse:head":143,
  "beardverse:chest":144,
  "beardverse:legs":145,
  "beardverse:boots":146,
  "badly:weapon":168,
  "badly:head":164,
  "badly:chest":165,
  "badly:legs":166,
  "badly:boots":167,
  "stealth:weapon":177,
  "stealth:head":173,
  "stealth:chest":174,
  "stealth:legs":175,
  "stealth:boots":176,
  "choco:weapon":225,
  "choco:head":221,
  "choco:chest":222,
  "choco:legs":223,
  "choco:boots":224,
  "uug:ringGreed":136,
  "uug:ringMight":137,
  "uug:ringUtility":138,
  "uug:ringEnergy":139,
  "uug:ringMagic":140,
  "wanderer:head":150,
  "wanderer:chest":151,
  "wanderer:legs":152,
  "wanderer:boots":153,
  "rerednaw:head":155,
  "rerednaw:chest":156,
  "rerednaw:legs":157,
  "rerednaw:boots":158,
  "slimy:weapon":188,
  "slimy:head":184,
  "slimy:chest":185,
  "slimy:legs":186,
  "slimy:boots":187,
  "edgy:head":213,
  "edgy:chest":214,
  "edgy:legs":215,
  "edgy:boots":220,
  "edgy:weapon":217,
  "edgy:amulet":218,
  "pinkprincess:head":231,
  "pinkprincess:chest":232,
  "pinkprincess:legs":233,
  "pinkprincess:boots":234,
  "pinkprincess:weapon":235,
  "pinkprincess:amulet":236,
  "meta:weapon":255,
  "meta:head":251,
  "meta:chest":252,
  "meta:legs":253,
  "meta:boots":254,
  "meta:charmInfinity":256,
  "meta:charm69":257,
  "party:weapon":262,
  "party:head":258,
  "party:chest":259,
  "party:legs":260,
  "party:boots":261,
  "party:cup":263,
  "party:whistle":264,
  "typo:head":301,
  "typo:chest":302,
  "typo:legs":303,
  "typo:boots":304,
  "typo:weapon":305,
  "typo:asscessory":306,
  "typo:eyeElxu":307,
  "fad:head":308,
  "fad:chest":309,
  "fad:legs":310,
  "fad:boots":311,
  "fad:weapon":312,
  "fad:pokeymanCard":313,
  "fad:krazyBonez":314,
  "jrpg:head":315,
  "jrpg:chest":316,
  "jrpg:legs":317,
  "jrpg:boots":318,
  "jrpg:weapon":319,
  "jrpg:zipper":320,
  "jrpg:wig":321,
  "rad:head":345,
  "rad:chest":346,
  "rad:legs":347,
  "rad:boots":348,
  "rad:weapon":349,
  "rad:notDrugs":350,
  "rad:gloveOfPower":351,
  "backtoschool:head":352,
  "backtoschool:chest":353,
  "backtoschool:legs":354,
  "backtoschool:boots":355,
  "backtoschool:weapon":356,
  "backtoschool:theS":357,
  "backtoschool:walkman":358,
  "western:head":359,
  "western:chest":360,
  "western:legs":361,
  "western:boots":362,
  "western:weapon":363,
  "western:corgi":364,
  "western:bandana":365,
  "bread:head":392,
  "bread:chest":393,
  "bread:legs":394,
  "bread:boots":395,
  "bread:weapon":399,
  "bread:baguette":396,
  "bread:creamPie":397,
  "bread:yeast":398,
  "disco:head":400,
  "disco:chest":401,
  "disco:legs":402,
  "disco:boots":403,
  "disco:weapon":404,
  "disco:vinylShard":407,
  "disco:whitePowder":405,
  "disco:rollingPaper":406,
  "halloweenie:head":408,
  "halloweenie:chest":409,
  "halloweenie:legs":410,
  "halloweenie:boots":411,
  "halloweenie:weapon":415,
  "halloweenie:apple":412,
  "halloweenie:toiletPaper":413,
  "halloweenie:pandora":414,
  "construction:head":453,
  "construction:chest":454,
  "construction:legs":455,
  "construction:boots":456,
  "construction:weapon":460,
  "construction:hammer":457,
  "construction:toolbox":458,
  "construction:levelLevel":459,
  "duck:head":496,
  "duck:chest":497,
  "duck:legs":498,
  "duck:boots":499,
  "duck:weapon":503,
  "duck:shotgun":500,
  "duck:ducktTape":501,
  "duck:duckCaller":502,
  "dutch:head":461,
  "dutch:chest":462,
  "dutch:legs":463,
  "dutch:boots":464,
  "dutch:weapon":468,
  "dutch:tulip":465,
  "dutch:netherlands":466,
  "dutch:cheese":467,
  "pirate:head":507,
  "pirate:chest":508,
  "pirate:legs":509,
  "pirate:boots":510,
  "pirate:weapon":514,
  "pirate:cutlass":511,
  "pirate:eyepatch":512,
  "pirate:compass":513,
  "tutorialCube":77,
  "tubaTime":432,
  "cheeseGrater":433,
  "skyBall":434,
  "pissedOffKey":172,
  "flubber":120,
  "wandoos98":66,
  "magicite":435,
  "windupGear":436,
  "sinusoidalWave":437,
  "ghostTypewriter":438,
  "gaudyShoulders":439,
  "fTank":440,
  "ringOfApathy":135,
  "beardComb":441,
  "randomCrayons":442,
  "redLipstick":443,
  "candyCornNecklace":444,
  "wanderersCane":154,
  "shrunkenVoodooDoll":190,
  "pricelessVanGoghPainting":192,
  "smallGerbil":195,
  "mysteriousRedLiquid":93,
  "mysteriousPurpleLiquid":191,
  "mysteriousGreyLiquid":506
});
function wikiItemIdAdventureV1(definitionId){
  return Number(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1[String(definitionId||"")])||0;
}

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
        wikiItemId:wikiItemIdAdventureV1(`${setId}:${slot}`),
        basePower:baseP,baseToughness:baseT,baseHp:baseP*3,baseRegen:baseT*.03
      });
    }
  }
  for(const[id,d]of Object.entries(SPECIALS)){
    catalog[id]=Object.freeze({kind:d.cube?"cube":"special",set:"",setName:"",slot:d.slot,name:d.name,wikiItemId:wikiItemIdAdventureV1(id),basePower:N(d.p),baseToughness:N(d.t),baseHp:N(d.p)*3,baseRegen:N(d.t)*.03});
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
const IDLE_ADVENTURE_BOOST_WIKI_ID_BASE_V1=Object.freeze({power:1,toughness:14,special:27});
function wikiItemIdBoostV1(type,strength){
  const idx=BOOSTS.indexOf(Number(strength));
  const base=Number(IDLE_ADVENTURE_BOOST_WIKI_ID_BASE_V1[String(type||"")])||0;
  return idx>=0&&base?base+idx:0;
}
export const IDLE_ADVENTURE_BOOSTS=BOOSTS;
/*
 * hp/regen (2026-09-15) : dérivés de power/toughness (HP Max=Power×3,
 * HP Regen=Toughness×0.03), une règle du moteur NGU vérifiée sans
 * exception sur les ~90 objets audités (voir SET_ITEM_STATS_V1
 * ci-dessus) — jamais une donnée par objet à stocker séparément.
 */
/*
 * Correctif 2026-09-18 (Norman, capture d'écran du vrai NGU en direct :
 * "Power 0/7... Use the boosts you find to improve this item's stats!")
 * -- un objet fraîchement créé (drop ou addItem) doit démarrer à 0/0,
 * JAMAIS déjà à son plafond du moment. Le correctif du 2026-09-16
 * ci-dessous (applyBoost) avait conclu l'inverse ("un objet neuf est
 * TOUJOURS déjà à son plafond") en interprétant le texte du wiki
 * ("maximum potential will go up and require to be boosted" à chaque
 * fusion) comme si l'état INITIAL était déjà maxé -- la capture d'écran
 * du jeu réel (Tutorial Cube jamais fusionné, Power 0/7, Toughness 0/7,
 * Max Health 0/21, Health Regen 0/0,21) contredit directement cette
 * lecture : le plafond grandit avec le niveau (via fusion), mais la
 * valeur COURANTE part toujours de 0 et ne monte QUE par boost, y
 * compris pour un objet jamais encore fusionné. hp/regen restent
 * dérivés de power/toughness (0 tant que non boosté).
 */
/*
 * PISTE 2 de l'audit wiki 2026-09-18 : pages ngu-idle.fandom.com/wiki/
 * Tutorial_Zone et .../Training_(set) vérifiées en direct (navigateur) --
 * "Items in Training (set): A Stick, Cloth Hat, Cloth Shirt, Cloth
 * Leggings, Cloth Boots". Sans entrée dans SET_ITEM_NAMES_V1, item()
 * retombait sur un nom générique inventé ("Training Set head", "Training
 * Set weapon", ...) au lieu du vrai nom wiki par pièce -- les STATS par
 * pièce (SET_ITEM_STATS_V1 plus haut) étaient déjà correctes, seul le nom
 * était un reskin SOREAL. Seul le set "training" était couvert par cette
 * piste (portée initiale).
 *
 * Round 2 (2026-09-18, sweep "renommage des sets d'équipement") : les 35
 * sets restants de IDLE_ADVENTURE_ZONES/SETS (sewers -> pirate, la totalité
 * du catalogue mode Normal) sont maintenant couverts, sourcés depuis le
 * miroir wiki local (C:\Users\n0rma\Documents\NGU-Wiki\pages\<Nom> (set).json,
 * un export MediaWiki réel -- même source que build-idle-boss-fight-real-
 * names-v1.mjs). Méthode : chaque page {{Set}} liste ses N objets dans un
 * ORDRE CONSTANT par page (soit arme-en-tête puis tête/torse/jambes/
 * bottes/accessoires, soit tête/torse/jambes/bottes/arme/accessoires selon
 * la page -- jamais mélangé au sein d'une même page) ; le slot de chaque
 * objet est identifié par sa position dans cette énumération recoupée avec
 * son nom (casque/chapeau=head, plastron/chemise/veste=chest, pantalon/
 * jambières=legs, bottes/chaussures=boots) et, quand le nom seul est
 * ambigu (ex. Pretty Pink Princess, où "Giant Sticky Foot" n'a rien d'une
 * arme au premier regard), vérifié via la catégorie de la fiche objet
 * individuelle ([[Category:Weapon]]/[[Category:Accessory]] -- cf.
 * "Giant Sticky Foot.json" = Category:Weapon, "A Pretty Pink Bow.json" =
 * Category:Accessory, confirmant le slot malgré l'ordre de page atypique).
 * Les slots à nom explicite (necklace/meat, alarm/sands, cube, tie/
 * paperweight, ringGreed.../charmInfinity/charm69, cup/whistle,
 * asscessory/eyeElxu, pokeymanCard/krazyBonez, zipper/wig, notDrugs/
 * gloveOfPower, theS/walkman, corgi/bandana, baguette/creamPie/yeast,
 * vinylShard/whitePowder/rollingPaper, apple/toiletPaper/pandora, hammer/
 * toolbox/levelLevel, shotgun/ducktTape/duckCaller, tulip/netherlands/
 * cheese, cutlass/eyepatch/compass) se recoupent directement avec le nom
 * de l'objet correspondant sur sa page wiki (ex. slot "hammer" du set
 * Construction = l'objet "A Wooden Hammer", séparé du VRAI slot weapon
 * de ce set = "A Giant Wrecking Ball" -- la blague récurrente NGU où
 * l'accessoire "thématique" n'est pas l'arme réellement équipée).
 *
 * edgy (Evilverse) : le wiki documente Left/Right/BOTH Edgy Boots comme
 * trois objets distincts qui fusionnent (aucun équivalent Left/Right côté
 * SOREAL, un seul slot "boots") -- "BOTH Edgy Boots" retenu comme nom du
 * slot boots, déjà la modélisation actée dans le commentaire "Evilverse"
 * au-dessus de la définition SETS.edgy (2026-09-18, avant ce round).
 *
 * wanderer/rerednaw : 4 pièces seulement (head/chest/legs/boots), pas de
 * slot weapon défini dans SETS -- cohérent avec le commentaire déjà en
 * place au-dessus de SETS.uug ("le Cane/Candy Cane sont des objets à
 * part, pas repris ici").
 *
 * Portée : les 36 sets de SETS (training -> pirate) sont maintenant tous
 * couverts -- ce qui inclut, en réalité, les 17 zones marquées
 * requiredDifficulty ("difficile"/"extreme", cf. IDLE_ADVENTURE_ZONES :
 * evilverse -> aethereansea) : contrairement à une première lecture, il
 * n'existe PAS de table de noms séparée pour l'équipement Evil/Sadistic --
 * z.set pointe vers le même SETS/SET_ITEM_NAMES_V1 que les zones Normal
 * (vérifié en relisant unlockedZone()/rollKill() : requiredDifficulty ne
 * change que le déverrouillage et le diviseur de drop, jamais l'identité
 * de l'objet). Ces 17 zones sont donc déjà couvertes par ce round, pas
 * seulement les 19 zones "Normal" au sens strict.
 */
const SET_ITEM_NAMES_V1=Object.freeze({
  "training:weapon":"Un bâton","training:head":"Chapeau en tissu","training:chest":"Chemise en tissu","training:legs":"Jambières en tissu","training:boots":"Bottes en tissu",

  // Sewers (set) -- ngu-idle.fandom.com/wiki/Sewers_(set)
  "sewers:weapon":"Épée rouillée","sewers:head":"Casque pourri","sewers:chest":"Plastron pourri","sewers:legs":"Jambières pourries","sewers:boots":"Bottes pourries","sewers:ring":"Anneau dégoûtant","sewers:amulet":"Amulette fissurée",

  // Forest (set) -- ngu-idle.fandom.com/wiki/Forest_(set) (pendant = objet de base "Forest Pendant", pas une variante Ascended)
  "forest:weapon":"Kokiri Blade","forest:head":"Forest Helmet","forest:chest":"Forest Chestplate","forest:legs":"Forest Leggings","forest:boots":"Forest Boots","forest:ring":"Mossy Ring","forest:pendant":"Forest Pendant",

  // Cave (set) -- ngu-idle.fandom.com/wiki/Cave_(set)
  "cave:weapon":"Mole Hammer","cave:head":"Blue Cheese Helmet","cave:chest":"Gouda Chestplate","cave:legs":"Swiss Leggings","cave:boots":"Limburger Boots","cave:ring":"Havarti Ring","cave:amulet":"Cheddar Amulet","cave:combat":"Combat Cheese",

  // HSB (set) -- ngu-idle.fandom.com/wiki/HSB_(set)
  "hsb:weapon":"Magitech Blade","hsb:head":"Magitech Helmet","hsb:chest":"Magitech Chestplate","hsb:legs":"Magitech Leggings","hsb:boots":"Magitech Boots","hsb:ring":"Magitech Ring","hsb:amulet":"Magitech Amulet",

  // GRB (set) -- ngu-idle.fandom.com/wiki/GRB_(set)
  "grb:weapon":"Bloody Cleaver","grb:head":"Chef's Hat","grb:chest":"Chef's Apron","grb:legs":"Regular Pants","grb:boots":"Non Slip Shoes","grb:necklace":"Suspicious Sausage Necklace","grb:meat":"Raw Slab of Meat",

  // Clock (set) -- ngu-idle.fandom.com/wiki/Clock_(set)
  "clock:weapon":"A Comically Oversized Minute-Hand","clock:head":"Clockwork Hat","clock:chest":"Clockwork Chest","clock:legs":"Clockwork Pants","clock:boots":"Clockwork Boots","clock:alarm":"Alarm Clock","clock:sands":"The Sands of Time",

  // 2D (set) -- ngu-idle.fandom.com/wiki/2D_(set)
  "2d:weapon":"A Triangle","2d:head":"Circle Helmet","2d:chest":"Square Chestpiece","2d:legs":"Rectangle Pants","2d:boots":"Polygon Boots","2d:cube":"THE CUBE","2d:amulet":"King Circle's Amulet of Helping Random Stuff",

  // Spoopy (set) (Ancient Battlefield) -- ngu-idle.fandom.com/wiki/Spoopy_(set)
  "spoopy:weapon":"Spooky Sword","spoopy:head":"Spoopy Helmet","spoopy:chest":"Ghostly Chest","spoopy:legs":"Pants of Horror","spoopy:boots":"Spectral Boots","spoopy:ring":"Cursed Ring","spoopy:amulet":"Amulet of Sunshine, Sparkles, and Gore",

  // Jake (set) (titan Jake From Accounting) -- ngu-idle.fandom.com/wiki/Jake_(set)
  "jake:weapon":"The Pen-Is","jake:head":"Office Hat","jake:chest":"Office Shirt","jake:legs":"Office Pants","jake:boots":"Office Shoes","jake:tie":"A Regular Tie","scrap:paper":"A Scrap of Paper","jake:paperweight":"Generic Paperweight",

  // Gaudy (set) (A Very Special Place) -- ngu-idle.fandom.com/wiki/Gaudy_(set), pas d'accessoires publiés
  "gaudy:weapon":"Paper Fan","gaudy:head":"Gaudy Hat","gaudy:chest":"Gaudy Shirt","gaudy:legs":"Gaudy Pants","gaudy:boots":"Gaudy Boots",

  // Mega (set) (Mega Lands) -- ngu-idle.fandom.com/wiki/Mega_(set)
  "mega:weapon":"Beam Laser Sword","mega:head":"Mega Helmet","mega:chest":"Mega Chest","mega:legs":"Mega Blue Jeans","mega:boots":"Mega Boots",

  // Beardverse (set) -- ngu-idle.fandom.com/wiki/Beardverse_(set)
  "beardverse:weapon":"Bearded Axe","beardverse:head":"Groucho Marx Disguise","beardverse:chest":"Gossamer Chest","beardverse:legs":"Braided Beard Legs","beardverse:boots":"Fuzzy Orange Cheeto Slippers!",

  // Badly Drawn (set) -- ngu-idle.fandom.com/wiki/Badly_Drawn_(set)
  "badly:weapon":"Badly Drawn Gun","badly:head":"Badly Drawn Smiley Face","badly:chest":"Badly Drawn Chest","badly:legs":"Badly Drawn Pants","badly:boots":"Badly Drawn Foot",

  // Stealth (set) (Boring/Stealth World) -- ngu-idle.fandom.com/wiki/Stealth_(set)
  "stealth:weapon":"A Giant Bazooka","stealth:head":"Stealthy Hat","stealth:chest":"Stealthy Chest","stealth:legs":"No Pants","stealth:boots":"High Heeled Boots",

  // Choco (set) (Chocolate World) -- ngu-idle.fandom.com/wiki/Choco_(set)
  "choco:weapon":"Chocolate Crowbar","choco:head":"Chocolate Helmet","choco:chest":"Chocolate Chest","choco:legs":"Chocolate Pants","choco:boots":"Chocolate Boots",

  // UUG's rings (set) (titan UUG) -- ngu-idle.fandom.com/wiki/UUG's_rings_(set) -- 5 anneaux, pas de slots corps
  "uug:ringGreed":"Ring of Greed","uug:ringMight":"Ring of Might","uug:ringUtility":"Ring of Utility","uug:ringEnergy":"Ring of Way Too Much Energy","uug:ringMagic":"Ring of Way Too Much Magic",

  // Wanderer's (set) (titan Wanderer, mode Normal) -- ngu-idle.fandom.com/wiki/Wanderer's_(set) -- pas de weapon (Cane à part)
  "wanderer:head":"Wanderer's Hat","wanderer:chest":"Wanderer's Chest","wanderer:legs":"Wanderer's Pants","wanderer:boots":"Wanderer's Boots",

  // S'rerednaW (set) (même titan, mode Evil -- texte inversé, blague NGU) -- ngu-idle.fandom.com/wiki/S'rerednaW_(set)
  "rerednaw:head":"taH s'rerednaW","rerednaw:chest":"tsehC s'rerednaW","rerednaw:legs":"stnaP s'rerednaW","rerednaw:boots":"stooB s'rerednaW",

  // Slimy (set) (titan Slimy) -- ngu-idle.fandom.com/wiki/Slimy_(set)
  "slimy:weapon":"The Fists of Flubber","slimy:head":"Slimy Helmet","slimy:chest":"Slimy Chest","slimy:legs":"Slimy Pants","slimy:boots":"Slimy Boots",

  // Edgy (set) (Evilverse) -- ngu-idle.fandom.com/wiki/Edgy_(set) -- boots="BOTH Edgy Boots" (fusion Left+Right, cf. commentaire SETS.edgy)
  "edgy:head":"Edgy Helmet","edgy:chest":"Edgy Chest","edgy:legs":"Edgy Pants","edgy:boots":"BOTH Edgy Boots","edgy:weapon":"Edgy Jaw Axe","edgy:amulet":"A Cheap Plastic Amulet",

  // Pretty Pink Princess (set) -- ngu-idle.fandom.com/wiki/Pretty_Pink_Princess_(set) -- slot confirmé via catégorie objet (Giant Sticky Foot=Weapon, A Pretty Pink Bow=Accessory)
  "pinkprincess:head":"Clown Hat","pinkprincess:chest":"Fabulous Super Chest","pinkprincess:legs":"A Crappy Tutu","pinkprincess:boots":"Pretty Pink Slippers","pinkprincess:weapon":"Giant Sticky Foot","pinkprincess:amulet":"A Pretty Pink Bow",

  // Meta (set) (Metaland) -- ngu-idle.fandom.com/wiki/Meta_(set)
  "meta:weapon":"The Number 7","meta:head":"Numerical Head","meta:chest":"Numerical Chest","meta:legs":"Numerical Legs","meta:boots":"Numerical Boots","meta:charmInfinity":"Infinity Charm","meta:charm69":"69 Charm",

  // Party (set) (Interdimensional Party) -- ngu-idle.fandom.com/wiki/Party_(set)
  "party:weapon":"The God of Thunder's Hammer","party:head":"Party Hat","party:chest":"Pogmail Chest","party:legs":"Tear Away Pants","party:boots":"Pizza Boots","party:cup":"Plastic Red Cup","party:whistle":"Party Whistle",

  // Typo (set) (Typo Zone) -- ngu-idle.fandom.com/wiki/Typo_(set) -- noms tous des jeux de mots (Hamlet=Helmet, Chess Plate=Chestplate, Logs=Legs, Booms=Boots, Wee pin=Weapon)
  "typo:head":"Hamlet","typo:chest":"Chess Plate","typo:legs":"Logs","typo:boots":"Booms","typo:weapon":"Wee pin","typo:asscessory":"The Ass-cessory","typo:eyeElxu":"Eye of ELXU",

  // Fad (set) (Fadlands) -- ngu-idle.fandom.com/wiki/Fad_(set)
  "fad:head":"Spinning Tophat","fad:chest":"Demonic Flurbie Chestplate","fad:legs":"AAA Battery Legs","fad:boots":"Slinky Boots","fad:weapon":"THE MALF SLAMMER","fad:pokeymanCard":"Rare Foil Pokeyman Card","fad:krazyBonez":"A handful of Krazy Bonez",

  // JRPG (set) (JRPGVille) -- ngu-idle.fandom.com/wiki/JRPG_(set) -- 4 pièces "Buster Sword Top/Upper/Lower/Bottom" (armure), arme réelle = "...Replica"
  "jrpg:head":"Buster Sword Top","jrpg:chest":"Buster Sword Upper","jrpg:legs":"Buster Sword Lower","jrpg:boots":"Buster Sword Bottom","jrpg:weapon":"Gift Shop Buster Sword Replica","jrpg:zipper":"A Gigantic Zipper","jrpg:wig":"Anime Hero Wig",

  // Rad (set) (Radlands) -- ngu-idle.fandom.com/wiki/Rad_(set)
  "rad:head":"Cool Shades","rad:chest":"Leather Jacket","rad:legs":"Flamin' Hot Shorts","rad:boots":"A Skateboard","rad:weapon":"Nunchuks","rad:notDrugs":"Not Drugs","rad:gloveOfPower":"The Glove of Power",

  // Back To School (set) -- ngu-idle.fandom.com/wiki/Back_To_School_(set)
  "backtoschool:head":"Dunce Cap","backtoschool:chest":"School Jersey","backtoschool:legs":"ULTRAWIDE Pants","backtoschool:boots":"Shoes With Wheels","backtoschool:weapon":"Floppy Elastic Ruler","backtoschool:theS":"THE S","backtoschool:walkman":"A Walkman",

  // Western (set) (Westworld) -- ngu-idle.fandom.com/wiki/Western_(set)
  "western:head":"A 10 Litre Hat","western:chest":"Asslest Vest","western:legs":"Assful Chaps","western:boots":"Extra Spiky Spurs","western:weapon":"The Six Shooter","western:corgi":"A Battle Corgi","western:bandana":"A Pink Bandana",

  // Bread (set) (Breadverse) -- ngu-idle.fandom.com/wiki/Bread_(set) -- slot "baguette" = objet "1 Day-Old Baguette" (arme réelle = A Rolling Pin)
  "bread:head":"Bread Bowl Helmet","bread:chest":"Paper Thin Crepe Cape","bread:legs":"Flour Sack Pants","bread:boots":"Gingerbread Boots","bread:weapon":"A Rolling Pin","bread:baguette":"1 Day-Old Baguette","bread:creamPie":"A Cream Pie","bread:yeast":"A Spoonful of Yeast",

  // Disco (set) (Seventies) -- ngu-idle.fandom.com/wiki/Disco_(set)
  "disco:head":"Disco Ball Helmet","disco:chest":"Disco Shirt","disco:legs":"Bell Bottoms","disco:boots":"Roller Skates","disco:weapon":"A Rusty Old Sabre","disco:vinylShard":"A Vinyl Record Shard","disco:whitePowder":"A Bit of White Powder","disco:rollingPaper":"Some Rolling Paper",

  // Halloweenie (set) -- ngu-idle.fandom.com/wiki/Halloweenie_(set) -- legs="A Broomstick" (blague sorcière), weapon="A Giant Scythe"
  "halloweenie:head":"Neck Bolts","halloweenie:chest":"Skeleton Shirt","halloweenie:legs":"A Broomstick","halloweenie:boots":"Fuzzy Boots","halloweenie:weapon":"A Giant Scythe","halloweenie:apple":"An Ordinary Apple","halloweenie:toiletPaper":"A Roll of Toilet Paper","halloweenie:pandora":"Pandora's Box",

  // Construction (set) -- ngu-idle.fandom.com/wiki/Construction_(set) -- slot "hammer" = objet "A Wooden Hammer" (arme réelle = A Giant Wrecking Ball)
  "construction:head":"A Hardhat","construction:chest":"High Visibility Vest","construction:legs":"Yet Another Generic Pair Of Jeans","construction:boots":"Steel Toed Boots","construction:weapon":"A Giant Wrecking Ball","construction:hammer":"A Wooden Hammer","construction:toolbox":"The Toolbox","construction:levelLevel":"A Level Level",

  // Duck (set) (DuckDuckGoose) -- ngu-idle.fandom.com/wiki/Duck_(set) -- slot "shotgun" = objet "A shotgun" (arme réelle = The Zapper)
  "duck:head":"A Fake Duckbill","duck:chest":"An Inflatable Ducky Innertube","duck:legs":"Duck Duck Shorts","duck:boots":"Duck Slippers","duck:weapon":"The Zapper","duck:shotgun":"A shotgun","duck:ducktTape":"Some Duck-t Tape","duck:duckCaller":"A Duck Caller",

  // Dutch (set) (Netherregions) -- ngu-idle.fandom.com/wiki/Dutch_(set)
  "dutch:head":"A Dutch Hat","dutch:chest":"Windmill Shirt","dutch:legs":"Stroopwaffel Pants","dutch:boots":"Clogs","dutch:weapon":"Weaponized Hollandaise sauce","dutch:tulip":"Black Tulip","dutch:netherlands":"Pocket Netherlands","dutch:cheese":"Rest of the Combat Cheese",

  // Pirate (set) (Aetherean Sea) -- ngu-idle.fandom.com/wiki/Pirate_(set) -- slot "cutlass" = objet "The Cutlass" (arme réelle = The Flintlock)
  "pirate:head":"Pirate Hat","pirate:chest":"Swashbuckler Chest","pirate:legs":"Piratey Pants","pirate:boots":"Piratey Peglegs","pirate:weapon":"The Flintlock","pirate:cutlass":"The Cutlass","pirate:eyepatch":"A Giant's Eyepatch","pirate:compass":"A Compass!"
});
function item(id,set,slot,lv=0){const s=SETS[set];const definitionId=`${set}:${slot}`;const realName=SET_ITEM_NAMES_V1[definitionId];return{id,definitionId,wikiItemId:wikiItemIdAdventureV1(definitionId),name:realName||`${s.name} ${slot}`,kind:"equipment",set,slot,level:C(lv,0,MAX),power:0,toughness:0,hp:0,regen:0,special:0}}
function rollFreshEquipmentStatsV1(o){
  if(!o||o.kind!=="equipment")return o;
  /*
   * SET_ITEM_STATS_V1 contient les MAX du niveau 100. Le plafond niveau 0
   * est donc /2, puis +1% de ce plafond par niveau (wiki Inventory).
   * L'ancien tirage utilisait directement le max niveau 100 puis remultipliait
   * par q, avant d'être re-clampé par cleanItem(). Résultat : beaucoup de
   * drops étaient artificiellement collés au plafond. On tire désormais
   * directement dans le vrai plafond du niveau courant.
   */
  const base=idleAdventureBaseStatsV1(o.set,o.slot);
  const q=1+C(o.level,0,MAX)/100;
  const pMax=Math.max(0,N(base&&base.baseP)*q);
  const tMax=Math.max(0,N(base&&base.baseT)*q);
  function roll(seed,max){
    if(!(max>0))return 0;
    let h=2166136261;
    const txt=String(seed||"");
    for(let i=0;i<txt.length;i+=1){
      h^=txt.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return Math.floor(((h>>>0)/4294967296)*(Math.floor(max)+1));
  }
  o.power=roll(String(o.id)+":p",pMax);
  o.toughness=roll(String(o.id)+":t",tMax);
  o.hp=o.power*3;
  o.regen=o.toughness*.03;
  return o;
}
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
/*
 * Correctif 2026-09-18 (Norman, capture d'écran du vrai NGU en direct :
 * Tutorial Cube jamais fusionné -- Power 0/7, Toughness 0/7, Max Health
 * 0/21, Health Regen 0/0,21) : même correctif que item() ci-dessus -- un
 * objet SPECIALS fraîchement créé démarre à 0/0, JAMAIS déjà à son
 * plafond (d.p/d.t reste la vraie base sourcée du wiki, utilisée
 * ailleurs -- idleAdventureSpecialBaseStatsV1 -- comme plafond, jamais
 * comme valeur de départ).
 */
/*
 * PISTE 1 (2026-09-18) : d.sBase -- quand défini (ex. tutorialCube:5, wiki
 * "Energy Speed Base value: 5%") -- initialise `special` à cette valeur
 * plancher réelle, PAS 0. Ne change rien pour les SPECIALS sans sBase
 * (undefined -> N(undefined)=0, comportement identique à avant).
 */
function special(id,lv=0){const d=SPECIALS[id];if(!d)throw Error("SPECIAL_INVALIDE");return{id,definitionId:id,wikiItemId:wikiItemIdAdventureV1(id),name:d.name,kind:d.cube?"cube":"special",slot:d.slot,zone:d.zone,set:d.set||"",consumable:Boolean(d.consumable),level:C(lv,0,MAX),power:0,toughness:0,hp:0,regen:0,special:N(d.sBase)}}
function boost(type,strength){if(!["power","toughness","special"].includes(type)||!BOOSTS.includes(+strength))throw Error("BOOST_INVALIDE");return{id:`boost:${type}:${strength}:${Math.random()}`,definitionId:`boost:${type}:${strength}`,wikiItemId:wikiItemIdBoostV1(type,strength),name:`Boost ${type} ${strength}`,kind:"boost",boostType:type,strength:+strength,level:0}}
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
/*
 * Correctif 2026-09-18 (Norman, en direct, marqué URGENT : "le cube
 * tutorial n'est toujours pas présent quand on ouvre l'inventaire.
 * Normalement, il doit déjà s'y trouver à la première fois où on accède
 * à notre inventaire.") Vérifié sur le wiki (4G's Merge and Boost
 * Tutorial Cube) : le joueur POSSÈDE déjà cet objet dès le début, jamais
 * besoin de le faire tomber une première fois -- seules des copies
 * SUPPLÉMENTAIRES (à fusionner pour monter jusqu'au niveau 100) tombent
 * ensuite en Sewers (SPECIALS.tutorialCube, bossOnly, 10%, déjà
 * implémenté plus haut, inchangé). base() est le seul point de
 * construction d'un état Aventure neuf (nouveau joueur ET migration
 * d'une sauvegarde legacy sans état V47, voir migrateLegacyMetaToV47
 * dans idle-ngu-progression.js) -- y semer l'objet ici garantit qu'il
 * est déjà là au tout premier accès à l'inventaire, sans jamais toucher
 * au reste de la construction de l'état. Déposé dans le SAC (inventory),
 * PAS pré-équipé : Norman a été explicite ("il est juste là sans l'avoir
 * drop. Ensuite on peut l'équiper") -- le joueur l'équipe lui-même,
 * exactement comme n'importe quel autre accessoire trouvé.
 */
function base(){
  const s={version:IDLE_ADVENTURE_V47,revision:0,recentClientMutations:[],selectedZone:"safe",lastCombatZone:"tutorial",inventory:[],inventorySlots:[],coffre:{},trash:null,equipment:{head:"",chest:"",legs:"",boots:"",weapon:"",accessories:[]},itemList:{},completedSets:{},setRewards:{experience:0,ap:0,energySpeed:0,energyBars:0,energyPower:0,magicPower:0,magicBars:0,magicCap:0,adventurePower:0,adventureToughness:0,adventureHp:0,adventureRegen:0,respawn:0,drop:0,chargeMultiplier:1,idleAttack:false,noEquipmentChallenge:false,wandoosMeh:false,diggerSlot:0,luckyCharms:0,extraDropLevelChance:0,boostEffectiveness:0,boostCompletions:0,itopodPpPct:0,diggerGlobalBonusPct:0,bloodMagicSpeedPct:0,nguSpeedPct:0,wishSpeedPct:0},permanent:{experience:0,ap:0,gold:0,ppProgress:0,qp:0,energySpeedFlat:0,energyPowerFlat:0,energyBarsFlat:0,magicPowerFlat:0,magicBarsFlat:0,magicCapFlat:0},unlockItems:{},unlockFlags:{},skillState:{beastMode:false,move69Uses:0,endPiece481:false},cube:{power:0,toughness:0,unlocked:false},zone:{kills:{},bossKills:{},encounters:{},bossEncounters:{}},titans:{},fight:{active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0},serial:1};
  const cubeDepart=special("tutorialCube",0);
  cubeDepart.id=`i${s.serial++}`;
  s.inventory.push(cubeDepart);
  s.inventorySlots=[cubeDepart.id];
  record(s,cubeDepart);
  return s;
}
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
function cleanItem(o){if(!o||typeof o!=="object")return null;const z=X(o);z.id=String(z.id||"");z.definitionId=String(z.definitionId||"");z.wikiItemId=wikiItemIdAdventureV1(z.definitionId)||Number(z.wikiItemId)||0;z.level=C(z.level,0,MAX);z.power=Math.max(0,N(z.power));z.toughness=Math.max(0,N(z.toughness));z.special=Math.max(0,N(z.special));z.locked=Boolean(z.locked);const d=defById(z.definitionId);const base=d?.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):(d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):null);if(base){const q=1+z.level/100;z.power=Math.min(z.power,base.baseP*q);z.toughness=Math.min(z.toughness,base.baseT*q);
// PISTE 1 (2026-09-18) : même plafond que power/toughness pour le Special Bonus chiffré (baseS>0 uniquement -- ex. tutorialCube) ; les autres SPECIALS (baseS=0) restent non plafonnés, comportement inchangé.
if(base.baseS>0)z.special=Math.min(z.special,base.baseS*q);}
/*
 * Norman (2026-09-18, en direct, capture d'écran de son propre Tutorial
 * Cube) : "je vois que mon tutorial cube n'a toujours pas de stats
 * special." Cause confirmée : le plancher sBase (special:N(d.sBase),
 * fonction special() ci-dessus, PISTE 1) ne s'applique qu'À LA CRÉATION
 * d'un nouvel objet -- un Tutorial Cube déjà en inventaire AVANT ce
 * correctif garde .special=0 pour toujours, cleanItem() ne l'ayant
 * jusqu'ici QUE plafonné vers le bas (Math.min ci-dessus), jamais
 * remonté. Toujours un plancher VERS LE HAUT jamais inventé : sBase est
 * la valeur de départ garantie par le wiki (aucun boost ne peut faire
 * descendre .special en dessous), donc un objet dont .special<sBase ne
 * peut être qu'une donnée antérieure à ce correctif, jamais un vrai état
 * de jeu à respecter.
 */
if(d?.kind==="special"){
  const def=SPECIALS[d.id];
  if(def&&N(def.sBase)>0)z.special=Math.max(z.special,N(def.sBase));
}
/*
 * Norman (2026-09-18, en direct) : "le set que tu vois n'est pas le set
 * du tuto. Je t'ai donné son nom tout à l'heure." Même classe de bug que
 * le plancher sBase juste au-dessus : item() n'applique SET_ITEM_NAMES_V1
 * (les vrais noms wiki, "Cloth Hat"/"Cloth Shirt"/"Cloth Boots"...) qu'À
 * LA CRÉATION d'un objet -- un Training Set chest/boots déjà en
 * inventaire AVANT le correctif de renommage (audit Round 2, même jour)
 * garde son ancien nom générique "Training Set chest" pour toujours,
 * jamais remis à jour. Confirmé en direct : sur le compte de Norman,
 * "head" (Cloth Hat, créé après le correctif) était déjà correct, mais
 * "chest"/"boots" (créés avant) montraient encore le nom générique --
 * et urlImageObjetAdventureIdleV138_ (Soreal_Idle_UI.html) construit
 * l'URL d'image R2 à partir de CE nom, donc une image générique/absente
 * au lieu de la vraie photo Cloth Shirt/Cloth Boots. Resynchronisé ici à
 * chaque chargement -- toujours sans risque : le nom n'a aucune
 * incidence sur les stats, resynchroniser vers le nom RÉEL (jamais
 * inventé, SET_ITEM_NAMES_V1 est la même table déjà utilisée par item())
 * ne peut jamais être qu'une correction.
 */
if(d?.kind==="set"){
  const realName=SET_ITEM_NAMES_V1[`${d.set}:${d.slot}`];
  if(realName)z.name=realName;
}
return z}
export function normalizeIdleAdventureStateV47(raw){if(raw?.version!==IDLE_ADVENTURE_V47)return base();const s=Object.assign(base(),X(raw));s.revision=Math.max(0,I(s.revision));s.recentClientMutations=(Array.isArray(s.recentClientMutations)?s.recentClientMutations:[]).filter(x=>x&&x.id).slice(-64);s.inventory=(Array.isArray(s.inventory)?s.inventory:[]).map(cleanItem).filter(Boolean);s.trash=cleanItem(s.trash);
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
s.itemList=s.itemList&&typeof s.itemList==="object"?s.itemList:{};s.completedSets=s.completedSets&&typeof s.completedSets==="object"?s.completedSets:{};s.setRewards=Object.assign(base().setRewards,s.setRewards||{});synchroniserCompletionsBoostAdventureV183_(s);s.permanent=Object.assign(base().permanent,s.permanent||{});s.unlockItems=s.unlockItems&&typeof s.unlockItems==="object"?s.unlockItems:{};s.unlockFlags=s.unlockFlags&&typeof s.unlockFlags==="object"?s.unlockFlags:{};s.skillState=Object.assign(base().skillState,s.skillState&&typeof s.skillState==="object"?s.skillState:{});s.skillState.move69Uses=C(I(s.skillState.move69Uses),0,69);s.skillState.endPiece481=Boolean(s.skillState.endPiece481||s.skillState.move69Uses>=69);s.cube=Object.assign(base().cube,s.cube||{});s.titans=s.titans&&typeof s.titans==="object"?s.titans:{};s.fight=Object.assign(base().fight,s.fight&&typeof s.fight==="object"?s.fight:{});const lastCombatCandidate=String(s.lastCombatZone||(s.selectedZone!=="safe"?s.selectedZone:"tutorial"));s.lastCombatZone=IDLE_ADVENTURE_ZONES.some(z=>z.id===lastCombatCandidate&&z.id!=="safe")?lastCombatCandidate:"tutorial";
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
/*
 * Auto-réparation des sauvegardes déjà en cours :
 * - une pièce actuellement verte/pleinement boostée doit immédiatement
 *   apparaître comme 100% dans Collection ;
 * - un set dont toutes les pièces ont déjà atteint le niveau 100 doit
 *   déclencher son vrai bonus même si un ancien build avait oublié
 *   d'appeler checkSets après chargement.
 */
for(const o of s.inventory){
  if(o&&o.definitionId&&idleAdventureObjetPleinementMaxeV1(o)){
    const info=s.itemList[o.definitionId]||{maxLevel:I(o.level,-1),seen:true};
    info.seen=true;
    info.maxLevel=Math.max(I(info.maxLevel,-1),I(o.level));
    info.fullyMaxed=true;
    s.itemList[o.definitionId]=info;
  }
}
for(const o of Object.values(s.coffre||{})){
  if(o&&o.definitionId&&idleAdventureObjetPleinementMaxeV1(o)){
    const info=s.itemList[o.definitionId]||{maxLevel:I(o.level,-1),seen:true};
    info.seen=true;
    info.maxLevel=Math.max(I(info.maxLevel,-1),I(o.level));
    info.fullyMaxed=true;
    s.itemList[o.definitionId]=info;
  }
}
checkSets(s);
/*
 * Migration unique : les anciennes sauvegardes avaient reçu 10 EXP pour
 * le Training Set alors que la récompense NGU est 20 EXP. Une complétion
 * faite sous le nouveau catalogue pose trainingSetExp20V1 directement
 * dans checkSets(), donc seul un ancien completedSets.training reçoit ici
 * le complément de +10. Le moteur NGU partagé crédite la vraie monnaie
 * via le drapeau pending ci-dessous.
 */
if(
  s.completedSets.training&&
  !s.unlockFlags.trainingSetExp20V1
){
  s.setRewards.experience=N(s.setRewards.experience)+10;
  s.permanent.experience=N(s.permanent.experience)+10;
  s.unlockFlags.trainingSetExp20V1=true;
  s.unlockFlags.trainingSetExp20CurrencyPendingV1=true;
}
syncInventorySlotsAdventureV2(s);
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
// PISTE 1 (2026-09-18) : baseS = d.sMax (plafond du Special Bonus au niveau 0, wiki, ex. tutorialCube sMax:15) -- 0 quand l'objet n'a pas de Special Bonus chiffré.
function idleAdventureSpecialBaseStatsV1(id){const d=SPECIALS[id];return d?{baseP:N(d.p),baseT:N(d.t),baseS:N(d.sMax)}:{baseP:0,baseT:0,baseS:0}}
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
  if(!d)return false;
  const base=d.kind==="set"
    ?idleAdventureBaseStatsV1(d.set,d.slot)
    :d.kind==="special"
      ?idleAdventureSpecialBaseStatsV1(d.id)
      :{baseP:0,baseT:0,baseS:0};
  const pOk=!(N(base.baseP)>0)||N(o.power)+1e-9>=N(base.baseP)*2;
  const tOk=!(N(base.baseT)>0)||N(o.toughness)+1e-9>=N(base.baseT)*2;
  const sOk=!(N(base.baseS)>0)||N(o.special)+1e-9>=N(base.baseS)*2;
  return pOk&&tOk&&sOk;
}
function estDefinitionBoostAdventureV183_(definitionId){
  const parts=String(definitionId||"").split(":");
  return parts.length===3&&
    parts[0]==="boost"&&
    ["power","toughness","special"].includes(parts[1])&&
    BOOSTS.includes(Number(parts[2]));
}
function attribuerCompletionBoostAdventureV183_(s,definitionId,info){
  if(
    !estDefinitionBoostAdventureV183_(definitionId)||
    !idleAdventureNiveauEstMaxV1(info&&info.maxLevel)||
    info.boostCompletionRewardV183
  ){
    return false;
  }
  info.boostCompletionRewardV183=true;
  s.setRewards.boostEffectiveness=N(s.setRewards.boostEffectiveness)+.02;
  s.setRewards.boostCompletions=I(s.setRewards.boostCompletions)+1;
  return true;
}
function synchroniserCompletionsBoostAdventureV183_(s){
  for(const[definitionId,info]of Object.entries(s.itemList||{})){
    attribuerCompletionBoostAdventureV183_(s,definitionId,info);
  }
}
function record(s,o){if(!o?.definitionId)return;const old=s.itemList[o.definitionId]||{maxLevel:-1};old.maxLevel=Math.max(I(old.maxLevel,-1),I(o.level));old.seen=true;old.fullyMaxed=Boolean(old.fullyMaxed||idleAdventureObjetPleinementMaxeV1(o));s.itemList[o.definitionId]=old;attribuerCompletionBoostAdventureV183_(s,o.definitionId,old);const d=defById(o.definitionId);if(d?.kind==="special"&&SPECIALS[d.id]?.maxFlag&&idleAdventureNiveauEstMaxV1(old.maxLevel))s.unlockFlags[SPECIALS[d.id].maxFlag]=true;if(o.definitionId==="tutorialCube"&&idleAdventureNiveauEstMaxV1(old.maxLevel)&&!s.unlockFlags.tutorialCubeMaxed){s.cube.unlocked=true;s.unlockFlags.tutorialCubeMaxed=true;s.setRewards.ap=N(s.setRewards.ap)+10000;
/*
 * Le Tutorial Cube (accessoire équipable jusqu'ici) se TRANSFORME en Cube
 * de l'infini à ce seuil (wiki : la fusion/le boost du même objet devient
 * le Cube, qui n'est alors plus jamais équipé/déplacé). Retire toute
 * copie de l'inventaire ET de l'équipement plutôt que de la laisser
 * traîner, inéquipable et sans usage, dans le sac.
 */
s.equipment.accessories=(Array.isArray(s.equipment.accessories)?s.equipment.accessories:[]).filter(accId=>{const e=s.inventory.find(x=>x.id===accId);return !(e&&e.definitionId==="tutorialCube")});
s.inventory=s.inventory.filter(x=>x.definitionId!=="tutorialCube")}checkSets(s)}
function checkSets(s){for(const [id,d] of Object.entries(SETS)){if(s.completedSets[id])continue;const ok=d.slots.every(slot=>idleAdventureNiveauEstMaxV1(s.itemList[`${id}:${slot}`]?.maxLevel));if(!ok)continue;s.completedSets[id]=true;for(const [k,v] of Object.entries(d.reward)){if(typeof v==="number")s.setRewards[k]=N(s.setRewards[k])+v;else if(v)s.setRewards[k]=true}if(N(d.reward.experience)>0)s.permanent.experience=N(s.permanent.experience)+N(d.reward.experience);if(N(d.reward.ap)>0)s.permanent.ap=N(s.permanent.ap)+N(d.reward.ap);if(N(d.reward.energySpeed)>0)s.permanent.energySpeedFlat=N(s.permanent.energySpeedFlat)+N(d.reward.energySpeed);if(N(d.reward.energyPower)>0)s.permanent.energyPowerFlat=N(s.permanent.energyPowerFlat)+N(d.reward.energyPower);if(N(d.reward.energyBars)>0)s.permanent.energyBarsFlat=N(s.permanent.energyBarsFlat)+N(d.reward.energyBars);if(N(d.reward.magicPower)>0)s.permanent.magicPowerFlat=N(s.permanent.magicPowerFlat)+N(d.reward.magicPower);if(N(d.reward.magicBars)>0)s.permanent.magicBarsFlat=N(s.permanent.magicBarsFlat)+N(d.reward.magicBars);if(N(d.reward.magicCap)>0)s.permanent.magicCapFlat=N(s.permanent.magicCapFlat)+N(d.reward.magicCap);if(id==="training")s.unlockFlags.trainingSetExp20V1=true}}
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

/*
 * Inventory layout V162 — l'ordre visuel du sac est une donnée persistée.
 * Les trous sont conservés et deux cases occupées peuvent être échangées.
 */
function syncInventorySlotsAdventureV2(s){
  const cap=inventoryCapacityAdventureV1(s);
  const equipped=equippedIdsAdventureV1(s);
  const bagIds=s.inventory
    .filter(o=>o&&o.id&&!equipped.has(o.id))
    .map(o=>String(o.id));
  const valides=new Set(bagIds);
  const vus=new Set();
  const slots=Array(cap).fill("");
  const bruts=Array.isArray(s.inventorySlots)?s.inventorySlots:[];
  for(let i=0;i<Math.min(cap,bruts.length);i++){
    const id=String(bruts[i]||"");
    if(id&&valides.has(id)&&!vus.has(id)){
      slots[i]=id;
      vus.add(id);
    }
  }
  for(const id of bagIds){
    if(vus.has(id))continue;
    const libre=slots.indexOf("");
    if(libre<0)break;
    slots[libre]=id;
    vus.add(id);
  }
  s.inventorySlots=slots;
  return slots;
}

function reorderInventoryAdventureV2(s,sourceId,targetId,targetIndex){
  const slots=syncInventorySlotsAdventureV2(s);
  const source=String(sourceId||"");
  const src=slots.indexOf(source);
  if(src<0)throw Error("OBJET_HORS_SAC");

  let dst=-1;
  const cible=String(targetId||"");
  if(cible)dst=slots.indexOf(cible);
  if(dst<0&&targetIndex!==undefined&&targetIndex!==null&&targetIndex!==""){
    dst=I(targetIndex,-1);
  }
  if(dst<0||dst>=slots.length)throw Error("CASE_INVENTAIRE_INVALIDE");
  if(dst===src)return{sourceId:source,targetIndex:dst,swappedWith:slots[dst]||""};

  const swapped=slots[dst]||"";
  slots[dst]=source;
  slots[src]=swapped;
  s.inventorySlots=slots;
  return{sourceId:source,targetIndex:dst,swappedWith:swapped};
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
function merge(s,a,b){
  const A=s.inventory.find(x=>x.id===a),B=s.inventory.find(x=>x.id===b);
  if(!A||!B||A===B||A.definitionId!==B.definitionId)throw Error("FUSION_INVALIDE");
  /*
   * a est toujours la destination et survit ; b est absorbé. Le client
   * V180 envoie désormais la CIBLE (objet 2) comme a et la SOURCE
   * (objet 1) comme b.
   *
   * Si b était équipé, son emplacement est transféré vers a AVANT sa
   * consommation. On respecte ainsi "objet 2 absorbe objet 1" sans jamais
   * laisser un slot d'équipement pointer vers un id supprimé.
   */
  if(B.locked)throw Error("OBJET_VERROUILLE");
  if(
    A.kind==="boost"&&
    idleAdventureNiveauEstMaxV1(
      s.itemList[A.definitionId]&&s.itemList[A.definitionId].maxLevel
    )
  ){
    throw Error("BOOST_DEJA_COMPLETE");
  }

  for(const slot of ["head","chest","legs","boots","weapon"]){
    if(s.equipment[slot]===B.id)s.equipment[slot]=A.id;
  }
  if(Array.isArray(s.equipment.accessories)&&s.equipment.accessories.includes(B.id)){
    s.equipment.accessories=s.equipment.accessories
      .map(id=>id===B.id?A.id:id)
      .filter((id,index,arr)=>arr.indexOf(id)===index);
  }

  A.level=idleAdventureMergeLevelV47(A.level,B.level);
  A.power=Math.max(N(A.power),N(B.power));
  A.toughness=Math.max(N(A.toughness),N(B.toughness));
  A.special=Math.max(N(A.special),N(B.special));
  s.inventory=s.inventory.filter(x=>x.id!==B.id);
  record(s,A);
  return A;
}
/*
 * Correctif 2026-09-14 — un Tutorial Cube (kind==='cube') s'équipe comme
 * un accessoire normal TANT QUE le Cube de l'infini n'est pas débloqué
 * (wiki : Type Accessory). Une fois débloqué (s.cube.unlocked), record()
 * retire déjà tous les Tutorial Cube de l'inventaire/équipement (voir
 * plus bas) — cette garde reste une sécurité défensive, pas le mécanisme
 * principal.
 */
function equip(s,id,slot){const o=s.inventory.find(x=>x.id===id);if(!o||o.kind==="boost"||o.consumable||(o.kind==="cube"&&s.cube.unlocked))throw Error("EQUIPEMENT_INVALIDE");if(slot==="accessory"){if(!s.equipment.accessories.includes(id)){
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
function unequip(s,id,targetIndex){
  const o=s.inventory.find(x=>x.id===id);
  if(!o)throw Error("OBJET_INTROUVABLE");

  let trouve=false;

  for(const slot of ["head","chest","legs","boots","weapon"]){
    if(s.equipment[slot]===id){
      s.equipment[slot]="";
      trouve=true;
    }
  }

  if(s.equipment.accessories.includes(id)){
    s.equipment.accessories=s.equipment.accessories.filter(x=>x!==id);
    trouve=true;
  }

  if(!trouve)throw Error("OBJET_NON_EQUIPE");

  /*
   * V182 — si le déséquipement vient d'un dépôt direct dans une case du
   * sac, la destination demandée est persistée dans la même mutation.
   * Sans ça, syncInventorySlotsAdventureV2 plaçait l'objet dans le premier
   * trou libre, sans rapport avec la case réellement visée.
   */
  if(targetIndex!==undefined&&targetIndex!==null&&targetIndex!==""){
    const slots=syncInventorySlotsAdventureV2(s);
    const src=slots.indexOf(String(id));
    const dst=I(targetIndex,-1);

    if(dst<0||dst>=slots.length)throw Error("CASE_INVENTAIRE_INVALIDE");

    if(src>=0&&src!==dst){
      const tmp=slots[dst]||"";
      slots[dst]=String(id);
      slots[src]=tmp;
      s.inventorySlots=slots;
    }
  }

  return{id,targetIndex:targetIndex==null?null:I(targetIndex,-1)};
}
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
 *
 * CORRECTIF 2026-09-18 (Norman, capture d'écran du vrai NGU en direct) :
 * le plafond niveau-par-niveau ci-dessus (basePower×(1+niveau/100))
 * reste exact et inchangé -- mais l'affirmation "un objet neuf est
 * TOUJOURS déjà à son plafond du moment" ci-dessus était une mauvaise
 * lecture du wiki. La vraie capture d'écran d'un Tutorial Cube jamais
 * fusionné montre Power 0/7 (pas 7/7) : la valeur COURANTE part
 * toujours de 0 à la création (voir item()/special() plus haut, revenus
 * à power:0/toughness:0), qu'il ait déjà été fusionné ou non -- seul le
 * PLAFOND affiché en "Y" (ce paragraphe) vient de la formule niveau-par-
 * niveau. Un objet frais a donc bien un écart à combler dès le départ
 * (0/basePower), pas seulement après une fusion.
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
  /*
   * V210 — un objet réellement terminé ne doit jamais avaler un boost
   * inutile. Avant ce garde, Math.min(cap, actuel+boost) gardait la même
   * valeur mais le boost était quand même supprimé de l'inventaire.
   */
  if(idleAdventureObjetPleinementMaxeV1(o)){
    throw Error("OBJET_DEJA_MAXE");
  }
  const added=N(b.strength)*(1+N(s.setRewards.boostEffectiveness));
  if(type==="power"||type==="toughness"){
    const d=defById(o.definitionId);
    const base=d?.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):(d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):null);
    const cap=base?(type==="power"?base.baseP:base.baseT)*(1+C(N(o.level),0,MAX)/100):null;
    if(cap!=null&&N(o[type])>=cap-1e-9){
      throw Error("BOOST_STAT_DEJA_MAX");
    }
    o[type]=cap!=null?Math.min(cap,N(o[type])+added):N(o[type])+added;
  }else{
    /*
     * PISTE 1 (2026-09-18) : un Special Bonus AVEC magnitude chiffrée sur le
     * wiki (idleAdventureSpecialBaseStatsV1(d.id).baseS>0 -- ex. tutorialCube,
     * sMax:15) est désormais plafonné exactement comme power/toughness
     * (même formule baseS×(1+niveau/100)). Les SPECIALS sans magnitude
     * chiffrée connue (baseS=0) restent sans plafond -- comportement
     * inchangé, cf. commentaire Norman 2026-09-16 ci-dessus : la cible doit
     * déjà être kind==="special" (vérifié plus haut), donc aucune arme/
     * armure de set ne peut recevoir ce boost, plafonné ou non.
     */
    const d=defById(o.definitionId);
    const base=d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):null;
    const cap=base&&base.baseS>0?base.baseS*(1+C(N(o.level),0,MAX)/100):null;
    if(cap!=null&&N(o[type])>=cap-1e-9){
      throw Error("BOOST_STAT_DEJA_MAX");
    }
    o[type]=cap!=null?Math.min(cap,N(o[type])+added):N(o[type])+added;
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
function cube(s,boostId){
  const b=s.inventory.find(x=>x.id===boostId);
  if(!b||b.kind!=="boost"||!["power","toughness","special"].includes(b.boostType))throw Error("CUBE_BOOST_INVALIDE");
  /*
   * V183 — le wiki définit le gain Cube à partir de la valeur TOTALE du
   * boost. Le +2% de chaque boost maxé fait partie de cette valeur totale,
   * au même titre que Badly Drawn/Construction déjà stockés dans le même
   * multiplicateur boostEffectiveness.
   */
  const valeur=N(b.strength)*(1+N(s.setRewards.boostEffectiveness));
  if(b.boostType==="special"){
    s.cube.power+=valeur*0.005;
    s.cube.toughness+=valeur*0.005;
  }else{
    s.cube[b.boostType]+=valeur*0.01;
  }
  s.inventory=s.inventory.filter(x=>x.id!==b.id);
  return X(s.cube);
}
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
        set:def.set,setName:def.setName,slot:def.slot,name:def.name,wikiItemId:def.wikiItemId||0,
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
function discard(s,id){
  const o=s.inventory.find(x=>x.id===id);
  if(!o)throw Error("OBJET_INTROUVABLE");
  if(o.locked)throw Error("OBJET_VERROUILLE");
  if(equippedIdsAdventureV1(s).has(o.id))throw Error("OBJET_EQUIPE");
  s.inventory=s.inventory.filter(x=>x.id!==o.id);
  return{id:o.id};
}

/*
 * Verrou NGU-like : le flag vit sur l'objet lui-même afin de survivre aux
 * déplacements, à l'équipement et aux sauvegardes. Les opérations
 * destructives consultent ce flag côté moteur, pas seulement dans l'UI.
 */
function setLockAdventureV1(s,id,locked){
  const o=s.inventory.find(x=>x.id===id);
  if(!o)throw Error("OBJET_INTROUVABLE");
  o.locked=Boolean(locked);
  return{id:o.id,locked:o.locked};
}

/*
 * Trash NGU-like : un seul emplacement séparé du sac. Déposer un objet
 * remplace (et détruit) l'ancien contenu ; le contenu courant peut être
 * récupéré tant qu'une place est disponible dans l'inventaire.
 */
function trashPutAdventureV1(s,id){
  const o=s.inventory.find(x=>x.id===id);
  if(!o)throw Error("OBJET_INTROUVABLE");
  if(o.locked)throw Error("OBJET_VERROUILLE");

  /*
   * V180 — le bouton Supprimer du popup signifie "envoyer dans Trash".
   * Il doit donc fonctionner aussi depuis le popup d'un objet équipé :
   * on le déséquipe atomiquement avant de le déplacer vers la Trash.
   */
  for(const slot of ["head","chest","legs","boots","weapon"]){
    if(s.equipment[slot]===o.id)s.equipment[slot]="";
  }
  if(Array.isArray(s.equipment.accessories)){
    s.equipment.accessories=s.equipment.accessories.filter(x=>x!==o.id);
  }

  const previous=s.trash&&typeof s.trash==="object"?s.trash:null;
  s.inventory=s.inventory.filter(x=>x.id!==o.id);
  s.trash=o;
  return{
    id:o.id,
    replacedId:previous?String(previous.id||""):"",
    destroyedPrevious:Boolean(previous)
  };
}
function trashRecoverAdventureV1(s){
  const o=s.trash&&typeof s.trash==="object"?s.trash:null;
  if(!o)throw Error("TRASH_VIDE");
  if(inventoryUsedAdventureV1(s)>=inventoryCapacityAdventureV1(s))throw Error("SAC_PLEIN");
  s.trash=null;
  s.inventory.push(o);
  return{id:o.id};
}
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
/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * z.requiredDifficulty (absent pour les 15 zones Normal existantes,
 * "difficile"/"extreme" pour les nouvelles zones Evil/Sadistic ci-dessous)
 * -- wiki NGU local, page "Evil difficulty" section "Differences" >
 * "Adventure" : "Zones from Evilverse onwards are unlockable by beating
 * their corresponding boss in evil difficulty. Normal zones remain
 * unlocked at all times." Page "SADISTIC difficulty", même section :
 * "Zones from Back to School onwards are unlockable by beating their
 * corresponding boss in Sadistic."
 *
 * Une zone Evil/Sadistic exige donc d'être ACTUELLEMENT dans la bonne
 * difficulté (bosses = compteur DU RUN EN COURS, qui n'a de sens que pour
 * la difficulté active -- cf. commentaire 2026-09-11 sur
 * idleAdventureSnapshotV47 plus bas). Une zone Normal (sans
 * requiredDifficulty) reste accessible "à tout moment" : soit via le
 * compteur du run en cours (si actuellement en Normal), soit via le pic
 * historique déjà atteint un jour en Normal (difficultyPeaks.normal) --
 * jamais reverrouillée simplement parce que le joueur est passé en Evil/
 * Sadistic entre-temps.
 */
function unlockedZone(z,bosses,difficulty,difficultyPeaks){
  if(!z.requiredDifficulty){
    return I(bosses)>=I(z.boss)||I((difficultyPeaks||{}).normal)>=I(z.boss)
  }
  return difficulty===z.requiredDifficulty&&I(bosses)>=I(z.boss)
}
function setDrop(s,setId,lv=0){const d=SETS[setId],slot=d.slots[I(Math.random()*d.slots.length)];return rollFreshEquipmentStatsV1(item(`i${s.serial++}`,setId,slot,lv))}
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
  chocolate:{normal:[2400000,3000000],boss:[3600000,4500000]},
  /*
   * 2026-09-23 (audit NGU, parité wiki) : zones Evil/Sadistic, plages de la
   * section Loot de chaque page de zone (miroir local NGU-Wiki, expansion des
   * modèles incluse). Fad-lands et Back To School : leurs pages ne sont pas
   * dans le miroir (collision de casse Windows avec leur redirection) --
   * wikitexte brut relu via l'API MediaWiki, {{formatnum}}/{{BigNum}} réduits
   * à leur nombre.
   */
  evilverse:{normal:[1120000000,1400000000],boss:[2400000000,3000000000]},
  pinkprincess:{normal:[4000000000,5000000000],boss:[20000000000,25000000000]},
  metaland:{normal:[20000000000,25000000000],boss:[40000000000,50000000000]},
  interdimensional:{normal:[40000000000,50000000000],boss:[120000000000,150000000000]},
  typozone:{normal:[120000000000,150000000000],boss:[200000000000,250000000000]},
  fadlands:{normal:[180000000000,300000000000],boss:[400000000000,500000000000]},
  jrpgville:{normal:[400000000000,500000000000],boss:[520000000000,650000000000]},
  radlands:{normal:[800000000000,1000000000000],boss:[1200000000000,1500000000000]},
  backtoschool:{normal:[600000000000000,750000000000000],boss:[680000000000000,850000000000000]},
  westworld:{normal:[1200000000000000,1500000000000000],boss:[1600000000000000,2000000000000000]},
  breadverse:{normal:[4800000000000000,6000000000000000],boss:[8000000000000000,10000000000000000]},
  seventies:{normal:[10000000000000000,12500000000000000],boss:[12000000000000000,15000000000000000]},
  halloweenies:{normal:[20000000000000000,25000000000000000],boss:[24000000000000000,30000000000000000]},
  construction:{normal:[40000000000000000,50000000000000000],boss:[48000000000000000,60000000000000000]},
  duckduck:{normal:[80000000000000000,100000000000000000],boss:[96000000000000000,120000000000000000]},
  netherregions:{normal:[160000000000000000,200000000000000000],boss:[200000000000000000,250000000000000000]},
  aethereansea:{normal:[320000000000000000,400000000000000000],boss:[640000000000000000,800000000000000000]}
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
  tutorial:{chance:.07,cap:.08,amount:1},
  sewers:{chance:.085,cap:.10,amount:1},
  forest:{chance:.10,cap:.12,amount:1},
  cave:{chance:.12,cap:.15,amount:1},
  sky:{chance:.16,cap:.20,amount:1},
  hsb:{chance:.09,cap:.12,amount:2},
  clock:{chance:.10,cap:.16,amount:2},
  "2d":{chance:.05,cap:.15,amount:3},
  ancient:{chance:.03,cap:.10,amount:5},
  avsp:{chance:.01,cap:.10,amount:10},
  mega:{chance:.005,cap:.10,amount:15},
  beardverse:{chance:.002,cap:.10,amount:20},
  badly:{chance:.0005,cap:.10,amount:25},
  boring:{chance:.0003,cap:.10,amount:30},
  chocolate:{chance:.0002,cap:.03,amount:30},
  /* 2026-09-23 (audit NGU) : zones Evil/Sadistic, ligne "Exp N (x% base chance, up to y% max)"
   * de la section Loot > Boss de chaque page. The Aethereal Sea ("Exp 1,200" sans taux
   * publié) est volontairement absente : jamais de taux inventé. */
  evilverse:{chance:0.0001,cap:0.03,amount:30},
  pinkprincess:{chance:0.0003,cap:0.03,amount:30},
  metaland:{chance:0.00001,cap:0.03,amount:30},
  interdimensional:{chance:0.00003,cap:0.03,amount:30},
  typozone:{chance:0.000022,cap:0.03,amount:35},
  fadlands:{chance:0.0000018,cap:0.03,amount:40},
  jrpgville:{chance:0.000018,cap:0.03,amount:45},
  radlands:{chance:6e-7,cap:0.15,amount:450},
  backtoschool:{chance:4.5e-7,cap:0.15,amount:500},
  westworld:{chance:3e-7,cap:0.15,amount:600},
  breadverse:{chance:1.2e-7,cap:0.15,amount:800},
  seventies:{chance:8e-8,cap:0.15,amount:1000},
  halloweenies:{chance:5e-8,cap:0.15,amount:1200},
  construction:{chance:4e-8,cap:0.15,amount:1200},
  duckduck:{chance:3.3e-8,cap:0.15,amount:1200},
  netherregions:{chance:1.8e-8,cap:0.15,amount:1200}
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
/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wiki NGU local, page "Evil difficulty", section "Differences" > "Drop
 * chance" : "Only cube root of drop chance applies for zones and titans
 * unlocked in evil difficulty." Formule donnée en %
 * (cbrt(dropchance/100)*100) ; en fraction 0-1 (déjà l'unité utilisée par
 * les 3 tirages ci-dessous), c'est mathématiquement Math.cbrt(fraction)
 * directement -- jamais une seconde conversion %/fraction. Appliqué
 * SEULEMENT aux zones Evil (z.requiredDifficulty==="difficile") : la page
 * "SADISTIC difficulty" ne documente aucune règle équivalente, jamais une
 * extrapolation non sourcée aux zones Sadistic. Le cube root AUGMENTE la
 * chance (racine d'une fraction <1 > la fraction elle-même) -- appliqué
 * avant le plafond `cap` pour que celui-ci reste la vraie borne finale.
 */

/*
 * NGU Adventure loot V2 — taux par zone et par type de rencontre.
 * Les anciens 22% / 12% / 4% universels ne sont conservés qu'en fallback
 * pour les zones Evil/Sadistic encore non auditées individuellement.
 */
export const IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2=Object.freeze({
  tutorial:{
    normal:{
      equipment:[{chance:.25,definitions:["training:weapon"],level:10,firstGuaranteed:"training:weapon"}],
      boosts:[{strength:1,chance:.15,requiresUnlockedSet:"training"}]
    },
    boss:{
      equipment:[{chance:1,definitions:["training:head","training:chest","training:legs","training:boots"],level:10}]
    }
  },
  sewers:{
    normal:{boosts:[{strength:1,chance:.15}]},
    boss:{
      equipment:[{chance:.65,set:"sewers",level:4}],
      specials:[{id:"tutorialCube",chance:.10,level:4}]
    }
  },
  forest:{
    normal:{
      boosts:[{strength:1,chance:.12},{strength:2,chance:.08}],
      specials:[{id:"tubaTime",chance:.013,level:1}]
    },
    boss:{
      equipment:[{
        chance:.50,
        definitions:["forest:head","forest:chest","forest:legs","forest:boots","forest:weapon","forest:ring","forest:pendant"],
        level:1,
        levels:{"forest:pendant":0}
      }],
      specials:[{id:"tubaTime",chance:.013,level:1}]
    }
  },
  cave:{
    normal:{
      boosts:[{strength:1,chance:.13},{strength:2,chance:.12}],
      specials:[{id:"cheeseGrater",chance:.0125,level:1}]
    },
    boss:{
      equipment:[{
        chance:.75,
        definitions:["cave:head","cave:chest","cave:legs","cave:boots","cave:weapon","cave:ring","cave:amulet","cave:combat","forest:pendant"],
        level:0,
        levels:{"forest:pendant":1}
      }],
      specials:[{id:"cheeseGrater",chance:.0125,level:1}]
    }
  },
  sky:{
    normal:{
      boosts:[{strength:2,chance:.08},{strength:5,chance:.08}],
      specials:[{id:"skyBall",chance:.01,level:1}]
    },
    boss:{
      equipment:[{chance:.40,definitions:["forest:pendant"],level:2}],
      specials:[
        {id:"wandoos98",chance:.003,level:0},
        {id:"pissedOffKey",chance:.01,level:0,firstGuaranteed:true},
        {id:"skyBall",chance:.01,level:1}
      ]
    }
  },
  hsb:{
    normal:{
      boosts:[{strength:2,chance:.06},{strength:5,chance:.015}],
      specials:[{id:"magicite",chance:.007,level:1}]
    },
    boss:{
      equipment:[{
        chance:.40,
        definitions:["hsb:head","hsb:chest","hsb:legs","hsb:boots","hsb:weapon","hsb:ring","hsb:amulet","forest:pendant"],
        level:0,
        levels:{"forest:pendant":3}
      }],
      specials:[{id:"magicite",chance:.007,level:1}]
    }
  },
  clock:{
    normal:{
      boosts:[{strength:5,chance:.03,cap:.15},{strength:10,chance:.03,cap:.15}],
      specials:[{id:"windupGear",chance:.005,level:1}]
    },
    boss:{
      equipment:[{chance:.30,set:"clock",level:0}],
      specials:[{id:"windupGear",chance:.005,level:1}]
    }
  },
  "2d":{
    normal:{
      boosts:[{strength:10,chance:.07,cap:.15},{strength:20,chance:.07,cap:.15}],
      specials:[{id:"sinusoidalWave",chance:.005,level:1}]
    },
    boss:{
      equipment:[{chance:.32,set:"2d",level:0}],
      specials:[{id:"sinusoidalWave",chance:.005,level:1}]
    }
  },
  ancient:{
    normal:{
      boosts:[{strength:10,chance:.06,cap:.20},{strength:20,chance:.06,cap:.20}],
      specials:[{id:"ghostTypewriter",chance:.0045,level:1}]
    },
    boss:{
      equipment:[{chance:.30,set:"spoopy",level:0}],
      specials:[
        {id:"wandoos98",chance:.002,level:0},
        {id:"ghostTypewriter",chance:.0045,level:1}
      ]
    }
  },
  avsp:{
    normal:{
      boosts:[{strength:20,chance:.03,cap:.25},{strength:50,chance:.03,cap:.25}],
      specials:[{id:"gaudyShoulders",chance:.004,level:1}]
    },
    boss:{
      equipment:[{chance:.20,set:"gaudy",level:0}],
      specials:[
        {id:"wandoos98",chance:.0025,level:1},
        {id:"gaudyShoulders",chance:.004,level:1}
      ]
    }
  },
  mega:{
    normal:{
      boosts:[{strength:50,chance:.011,cap:.15},{strength:100,chance:.011,cap:.15}],
      specials:[{id:"fTank",chance:.002,level:1}]
    },
    boss:{
      equipment:[{chance:.08,set:"mega",level:0}],
      specials:[{id:"fTank",chance:.002,level:1}]
    }
  },
  beardverse:{
    normal:{
      boosts:[{strength:50,chance:.0035,cap:.25},{strength:100,chance:.0035,cap:.25}],
      specials:[{id:"beardComb",chance:.0002,level:1}]
    },
    boss:{
      equipment:[{chance:.01,set:"beardverse",level:1}],
      specials:[{id:"beardComb",chance:.0002,level:1}]
    }
  },
  badly:{
    normal:{
      boosts:[{strength:100,chance:.001,cap:.20},{strength:200,chance:.001,cap:.20}],
      equipment:[{chance:.00006,cap:.05,set:"badly",level:1}],
      specials:[{id:"randomCrayons",chance:.000012,cap:.03,level:1}]
    },
    boss:{
      equipment:[{chance:.00018,cap:.15,set:"badly",level:1}],
      specials:[{id:"randomCrayons",chance:.000012,cap:.03,level:1}]
    }
  },
  boring:{
    normal:{
      boosts:[{strength:200,chance:.00012,cap:.20},{strength:500,chance:.00012,cap:.20}],
      equipment:[{chance:.00003,cap:.04,set:"stealth",level:1}],
      specials:[{id:"redLipstick",chance:.000006,cap:.02,level:1}]
    },
    boss:{
      equipment:[{chance:.00009,cap:.10,set:"stealth",level:1}],
      specials:[{id:"redLipstick",chance:.000006,cap:.02,level:1}]
    }
  },
  chocolate:{
    normal:{
      boosts:[{strength:200,chance:.00055,cap:.10},{strength:500,chance:.00055,cap:.10}],
      equipment:[{chance:.00018,cap:.08,set:"choco",level:1}],
      specials:[{id:"candyCornNecklace",chance:.00008,cap:.016,level:1}]
    },
    boss:{
      equipment:[{chance:.00055,cap:.12,set:"choco",level:1}],
      specials:[{id:"candyCornNecklace",chance:.00008,cap:.016,level:1}]
    }
  },
  /*
   * 2026-09-23 (audit NGU, parité wiki) : profils des 17 zones Evil/Sadistic,
   * remplaçant le repli universel inventé (22% set / 12% boost / 4% spécial,
   * force de boost = log2(1+boss/10)). Taux de base et plafonds ("up to") de la
   * section Loot de chaque page ; le cube root de la chance de drop reste appliqué
   * par idleAdventureDropChanceV2 (zoneUsesCubeRootDropV2). Les accessoires
   * propres à chaque zone (Edgy Magicite Crystal, Creepy Doll...), les Ascended
   * Pendants et les Looties n'existent pas encore côté SOREAL : non tirés ici,
   * jamais remplacés par une valeur de repli.
   */
  evilverse:{
    normal:{
      boosts:[{strength:200,chance:0.00012,cap:0.1},{strength:500,chance:0.00012,cap:0.1}],
      equipment:[{chance:0.00007,cap:0.08,set:"edgy",level:1}]
    },
    boss:{
      equipment:[{chance:0.00021,cap:0.12,set:"edgy",level:1}]
    }
  },
  pinkprincess:{
    normal:{
      boosts:[{strength:500,chance:0.0001,cap:0.08},{strength:1000,chance:0.0001,cap:0.06}],
      equipment:[{chance:0.00003,cap:0.08,set:"pinkprincess",level:1}]
    },
    boss:{
      equipment:[{chance:0.0001,cap:0.12,set:"pinkprincess",level:1}]
    }
  },
  metaland:{
    normal:{
      boosts:[{strength:1000,chance:0.00005,cap:0.07},{strength:2000,chance:0.00005,cap:0.07}],
      equipment:[{chance:0.000015,cap:0.04,set:"meta",level:1}]
    },
    boss:{
      equipment:[{chance:0.00005,cap:0.12,set:"meta",level:1}]
    }
  },
  interdimensional:{
    normal:{
      boosts:[{strength:1000,chance:0.00003,cap:0.08},{strength:2000,chance:0.00003,cap:0.08}],
      equipment:[{chance:0.000011,cap:0.04,set:"party",level:1}]
    },
    boss:{
      equipment:[{chance:0.000035,cap:0.12,set:"party",level:1}]
    }
  },
  typozone:{
    normal:{
      boosts:[{strength:1000,chance:0.000022,cap:0.08},{strength:2000,chance:0.000022,cap:0.08}],
      equipment:[{chance:0.000009,cap:0.04,set:"typo",level:1}]
    },
    boss:{
      equipment:[{chance:0.000025,cap:0.12,set:"typo",level:1}]
    }
  },
  fadlands:{
    normal:{
      boosts:[{strength:2000,chance:0.000018,cap:0.08},{strength:5000,chance:0.000018,cap:0.08}],
      equipment:[{chance:0.000007,cap:0.04,set:"fad",level:1}]
    },
    boss:{
      equipment:[{chance:0.000021,cap:0.12,set:"fad",level:1}]
    }
  },
  jrpgville:{
    normal:{
      boosts:[{strength:2000,chance:0.000015,cap:0.1},{strength:5000,chance:0.000015,cap:0.1}],
      equipment:[{chance:0.0000055,cap:0.04,set:"jrpg",level:1}]
    },
    boss:{
      equipment:[{chance:0.000018,cap:0.12,set:"jrpg",level:1}]
    }
  },
  radlands:{
    normal:{
      boosts:[{strength:2000,chance:6e-7,cap:0.15},{strength:5000,chance:6e-7,cap:0.15}],
      equipment:[{chance:2e-7,cap:0.05,set:"rad",level:1}]
    },
    boss:{
      equipment:[{chance:6e-7,cap:0.15,set:"rad",level:1}]
    }
  },
  backtoschool:{
    normal:{
      boosts:[{strength:5000,chance:4e-7,cap:0.1},{strength:10000,chance:4e-7,cap:0.1}],
      equipment:[{chance:1.5e-7,cap:0.05,set:"backtoschool",level:1}]
    },
    boss:{
      equipment:[{chance:4.5e-7,cap:0.15,set:"backtoschool",level:1}]
    }
  },
  westworld:{
    normal:{
      boosts:[{strength:5000,chance:2.5e-7,cap:0.15},{strength:10000,chance:2.5e-7,cap:0.15}],
      equipment:[{chance:1e-7,cap:0.05,set:"western",level:1}]
    },
    boss:{
      equipment:[{chance:3e-7,cap:0.15,set:"western",level:1}]
    }
  },
  breadverse:{
    normal:{
      boosts:[{strength:5000,chance:1e-7,cap:0.15},{strength:10000,chance:1e-7,cap:0.15}],
      equipment:[{chance:4e-8,cap:0.04,set:"bread",level:1}]
    },
    boss:{
      equipment:[{chance:1.2e-7,cap:0.15,set:"bread",level:1}]
    }
  },
  seventies:{
    normal:{
      boosts:[{strength:10000,chance:6e-8,cap:0.15},{strength:10000,chance:6e-8,cap:0.15}],
      equipment:[{chance:2.5e-8,cap:0.04,set:"disco",level:1}]
    },
    boss:{
      equipment:[{chance:8e-8,cap:0.15,set:"disco",level:1}]
    }
  },
  halloweenies:{
    normal:{
      boosts:[{strength:10000,chance:4e-8,cap:0.15},{strength:10000,chance:4e-8,cap:0.15}],
      equipment:[{chance:1.6e-8,cap:0.04,set:"halloweenie",level:1}]
    },
    boss:{
      equipment:[{chance:5e-8,cap:0.15,set:"halloweenie",level:1}]
    }
  },
  construction:{
    normal:{
      boosts:[{strength:10000,chance:2.5e-8,cap:0.16},{strength:10000,chance:2.5e-8,cap:0.16}],
      equipment:[{chance:1e-8,cap:0.04,set:"construction",level:1}]
    },
    boss:{
      equipment:[{chance:3e-8,cap:0.15,set:"construction",level:1}]
    }
  },
  duckduck:{
    normal:{
      boosts:[{strength:10000,chance:2e-8,cap:0.17},{strength:10000,chance:2e-8,cap:0.17}],
      equipment:[{chance:8e-9,cap:0.05,set:"duck",level:1}]
    },
    boss:{
      equipment:[{chance:2.4e-8,cap:0.15,set:"duck",level:1}]
    }
  },
  netherregions:{
    normal:{
      boosts:[{strength:10000,chance:1.6e-8,cap:0.17},{strength:10000,chance:1.6e-8,cap:0.17}],
      equipment:[{chance:6e-9,cap:0.05,set:"dutch",level:1}]
    },
    boss:{
      equipment:[{chance:1.8e-8,cap:0.15,set:"dutch",level:1}]
    }
  },
  aethereansea:{
    normal:{
      boosts:[{strength:10000,chance:1e-8,cap:0.17},{strength:10000,chance:1e-8,cap:0.17}],
      equipment:[{chance:4e-9,cap:0.05,set:"pirate",level:1}]
    },
    boss:{
      equipment:[{chance:1.2e-8,cap:0.15,set:"pirate",level:1}]
    }
  }
});

function zoneUsesCubeRootDropV2(z){
  return Boolean(z&&(z.id==="chocolate"||z.requiredDifficulty));
}

export function idleAdventureDropChanceV2(baseChance,cap,dropMultiplier,zone){
  const mult=Math.max(0,N(dropMultiplier,1));
  const effectif=zoneUsesCubeRootDropV2(zone)?Math.cbrt(mult):mult;
  return C(N(baseChance)*effectif,0,cap==null?1:N(cap));
}

function dropLevelAdventureV2(s,baseLevel){
  let lv=Math.max(0,I(baseLevel));
  if(lv>=1&&Math.random()<N(s.setRewards.extraDropLevelChance))lv++;
  return lv;
}

function definitionEquipmentDropAdventureV2(s,definitionId,level){
  const d=defById(definitionId);
  if(!d||d.kind!=="set")return null;
  return rollFreshEquipmentStatsV1(item("i"+s.serial++,d.set,d.slot,level));
}

function definitionsEquipmentPoolAdventureV2(pool){
  if(Array.isArray(pool.definitions)&&pool.definitions.length)return pool.definitions;
  const setId=String(pool.set||"");
  const setDef=SETS[setId];
  if(!setDef)return[];
  return setDef.slots.map(slot=>setId+":"+slot);
}

function rollEquipmentAdventureV2(s,z,pool,dropMult){
  const defs=definitionsEquipmentPoolAdventureV2(pool);
  if(!defs.length)return null;
  const firstId=String(pool.firstGuaranteed||"");
  const guaranteed=Boolean(firstId&&!s.itemList[firstId]?.seen);
  if(!guaranteed&&Math.random()>=idleAdventureDropChanceV2(pool.chance,pool.cap,dropMult,z))return null;

  const definitionId=guaranteed?firstId:defs[I(Math.random()*defs.length)];
  if(!definitionId)return null;

  const override=pool.levels&&pool.levels[definitionId];
  const baseLevel=override!=null?override:(pool.level!=null?pool.level:z.dropLevel);
  const obj=definitionEquipmentDropAdventureV2(
    s,
    definitionId,
    dropLevelAdventureV2(s,baseLevel)
  );
  return obj?add(s,obj):null;
}

function idleAdventureSetUnlockedV1(s,setId){
  const id=String(setId||"");
  const set=SETS[id];
  return Boolean(set&&set.slots.every(slot=>Boolean(s.itemList[`${id}:${slot}`]?.seen)));
}
function rollBoostAdventureV2(s,z,def,dropMult){
  /*
   * NGU Tutorial Zone: Boost 1 (15%) is available after "unlocking whole
   * Training (set)". "Unlocked/discovered" is distinct from "completed":
   * completion requires every piece at level 100. Waiting for
   * completedSets.training delayed Tutorial boosts until the set was already
   * maxed. The gate below therefore checks that every Training item has been
   * seen at least once, while preserving requiresCompletedSet for any future
   * drop that genuinely needs set completion.
   */
  if(def.requiresUnlockedSet&&!idleAdventureSetUnlockedV1(s,def.requiresUnlockedSet))return null;
  if(def.requiresCompletedSet&&!s.completedSets[String(def.requiresCompletedSet)])return null;
  if(Math.random()>=idleAdventureDropChanceV2(def.chance,def.cap,dropMult,z))return null;
  const type=["power","toughness","special"][I(Math.random()*3)];
  return add(s,boost(type,def.strength));
}

function rollSpecialAdventureV2(s,z,def,dropMult){
  const id=String(def.id||"");
  const source=SPECIALS[id];
  if(!source)return null;

  const firstGuaranteed=Boolean(def.firstGuaranteed&&!s.itemList[id]?.seen);
  if(!firstGuaranteed&&Math.random()>=idleAdventureDropChanceV2(def.chance,def.cap,dropMult,z))return null;

  const level=def.level!=null?def.level:(source.dropLevel||0);
  return add(s,special(id,dropLevelAdventureV2(s,level)));
}

function rollProfileLootAdventureV2(s,z,boss,dropMult){
  const zoneProfile=IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2[z.id];
  const profile=zoneProfile&&(boss?zoneProfile.boss:zoneProfile.normal);
  if(!profile)return null;

  const out=[];
  for(const pool of profile.equipment||[]){
    const o=rollEquipmentAdventureV2(s,z,pool,dropMult);
    if(o)out.push(o);
  }
  for(const def of profile.boosts||[]){
    const o=rollBoostAdventureV2(s,z,def,dropMult);
    if(o)out.push(o);
  }
  for(const def of profile.specials||[]){
    const o=rollSpecialAdventureV2(s,z,def,dropMult);
    if(o)out.push(o);
  }
  return out;
}

/* Fallback legacy uniquement pour les zones Evil/Sadistic non auditées. */
function rollLegacyZoneLootAdventureV2(s,z,dropMult,ctx){
  const out=[];
  if(z.set&&Math.random()<idleAdventureDropChanceV2(.22,.95,dropMult,z)){
    const o=add(s,setDrop(s,z.set,dropLevelAdventureV2(s,z.dropLevel)));
    if(o)out.push(o);
  }
  if(Math.random()<idleAdventureDropChanceV2(.12,.85,dropMult,z)){
    const o=add(
      s,
      boost(
        ["power","toughness","special"][I(Math.random()*3)],
        BOOSTS[Math.min(BOOSTS.length-1,I(Math.log2(1+Math.max(0,I(ctx.bosses))/10)))]
      )
    );
    if(o)out.push(o);
  }
  const candidates=Object.entries(SPECIALS).filter(([,d])=>
    d.zone===z.id&&!d.bossOnly&&!d.customDropRoll&&I(ctx.bosses)>=I(d.requiresBoss)
  );
  if(candidates.length&&Math.random()<idleAdventureDropChanceV2(.04,.5,dropMult,z)){
    const pair=candidates[I(Math.random()*candidates.length)];
    const o=add(s,special(pair[0],pair[1].dropLevel||0));
    if(o)out.push(o);
  }
  return out;
}

function rollKill(s,ctx){
  const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===s.selectedZone)||IDLE_ADVENTURE_ZONES[0];
  if(!unlockedZone(z,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks))throw Error("ZONE_VERROUILLEE");

  const kills=(s.zone.kills[z.id]||0)+1;
  s.zone.kills[z.id]=kills;
  const boss=ctx.forceBoss!=null?Boolean(ctx.forceBoss):kills%10===0;
  if(boss)s.zone.bossKills[z.id]=(s.zone.bossKills[z.id]||0)+1;

  const dropMult=Math.max(
    .1,
    N(ctx.dropMultiplier,1)*
    (1+N(s.setRewards.drop)+idleAdventureCubeTierV1(s.cube).dropChancePct/100)
  );

  const exact=rollProfileLootAdventureV2(s,z,boss,dropMult);
  const out=exact===null?rollLegacyZoneLootAdventureV2(s,z,dropMult,ctx):exact;

  if(
    !boss&&z.id==="forest"&&String(ctx.forceMobName||"")==="Goblin"&&
    (I(ctx.bosses)>=100||Boolean(s.itemList.ringOfApathy?.seen))&&
    Math.random()<idleAdventureDropChanceV2(.008,1,dropMult,z)
  ){
    const ring=add(s,special("ringOfApathy",1));
    if(ring)out.push(ring);
  }

  if(z.id==="tutorial"){
    const flubberBoss=I(ctx.bosses);
    if(flubberBoss>=59&&Math.random()<C(.0082+.0041*(flubberBoss-59),0,1)){
      const flubber=add(s,special("flubber",SPECIALS.flubber.dropLevel||0));
      if(flubber)out.push(flubber);
    }
  }

  const goldRange=ZONE_GOLD_RANGES_V1[z.id];
  let gold=0;
  if(goldRange){
    const range=boss?goldRange.boss:goldRange.normal;
    const lo=range[0],hi=range[1];
    const goldDropsMult=1+N(idleAdventureCubeTierV1(s.cube).goldDropsPct)/100;
    gold=Math.max(1,Math.round((lo+Math.random()*(hi-lo))*goldDropsMult));
    s.permanent.gold=N(s.permanent.gold)+gold;
  }

  let experience=0;
  if(boss){
    const expDef=ZONE_BOSS_EXP_CHANCE_V1[z.id];
    const expChance=N(expDef?.chance,0);
    if(expChance>0&&Math.random()<idleAdventureDropChanceV2(expChance,expDef?.cap,dropMult,z)){
      experience=I(expDef.amount,0);
      s.permanent.experience=N(s.permanent.experience)+experience;
    }
  }

  return{zone:z.id,boss,drops:out.filter(Boolean),gold,experience};
}

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
 * Côté JOUEUR ("nous non plus") : playerHpMaxForAdventureV1 fournissait
 * (10+stats.hp) — le vrai bug était en amont, dans idle-ngu-progression.js
 * (stats.hp jamais enrichi sur le chemin de combat réel, seulement sur
 * l'aperçu) ; ce point reste corrigé dans idle-ngu-progression.js
 * (idleAdventureCombatStatsV1). Ce fichier (idle-adventure-v47.js) ne
 * connaît pas Attack/Defense (propriété de la progression NGU globale,
 * hors de son périmètre volontairement isolé) ; c'est idle-ngu-
 * progression.js qui lui fournit un stats.hp déjà enrichi (Power×3, sourcé
 * wiki NGU pages Build_Max_HP/Build_HP_Regen, audit 2026-09-14) AVANT de
 * l'y passer.
 *
 * PISTE 3 de l'audit wiki 2026-09-18 : le "+10" lui-même (ci-dessous)
 * N'A JAMAIS EU de citation wiki dans ce fichier — recherché en direct au
 * navigateur (2026-09-18) sur ngu-idle.fandom.com pour une page qui
 * documenterait un "PV du joueur en combat d'Aventure" : aucune page de ce
 * type n'existe. Cause architecturale confirmée : le vrai NGU Idle n'a
 * PAS de barre de vie joueur en Aventure — son "Adventure Mode" est un
 * système à SEUIL (le Power/Toughness du joueur doit dépasser le seuil
 * "One Hit P/T" du mob pour le tuer en un coup, cf. commentaire détaillé
 * plus haut sur monsterHpMaxForZoneV1/z.oneHitP) ; le combat "coup par
 * coup avec vraie barre de vie" est un choix SOREAL délibéré (Norman,
 * 2026-09-09 : "Comme pour les boss"), documenté comme tel, jamais une
 * mécanique NGU réelle à citer. Il n'existe donc structurellement AUCUNE
 * page wiki à citer pour un "+10" côté joueur. Conformément à la règle
 * n°1 d'AGENTS.md ("si une page ne publie pas la magnitude exacte dont on
 * a besoin : ne pas inventer de repli, réduire la fonctionnalité à ce qui
 * est réellement confirmé") : le "+10" est retiré, playerHpMaxForAdventureV1
 * ne reproduit plus que Math.max(0,stats.hp) — la seule partie
 * effectivement sourcée du wiki (Build_Max_HP, Power×3). Un ancien
 * commentaire ici citait "Power 10 → 40 calculé contre 50 observé à
 * l'écran" comme preuve du bug, mais ce "50" venait d'une capture d'écran
 * Norman de l'app SOREAL elle-même, jamais du wiki NGU — pas une source
 * valable pour fixer une nouvelle magnitude (aurait remplacé une valeur
 * inventée par une autre). Tests mis à jour en conséquence :
 * idle-adventure-combat-stats-shared.test.mjs, idle-ngu-starting-stats.
 * test.mjs, idle-adventure-v47.test.mjs.
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
  /*
   * Correctif 2026-09-18 (comparaison côte à côte NGU/SOREAL) :
   * entry.maxHp vient déjà de l'onglet Adventure du vrai bestiaire NGU.
   * Le multiplier encore par oneHitP/moyenneMaxHp gonflait artificiellement
   * tous les PV (ex. Tutorial 40 -> ~111, Sewers 40 -> 145). oneHitP est
   * une recommandation de Power pour one-shot la zone, PAS une échelle de
   * PV ennemis. Quand une entrée réelle existe, ses Max HP sont donc pris
   * tels quels. Le vieux calcul zone-plat reste uniquement en fallback
   * lorsqu'aucune donnée bestiaire n'existe.
   */
  if(entry)return Math.max(1,I(N(entry.maxHp)));
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
function playerHpMaxForAdventureV1(stats){return Math.max(0,N(stats&&stats.hp))}
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
function startZoneFight(s,ctx){const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===s.selectedZone)||IDLE_ADVENTURE_ZONES[0];if(z.id==="safe")throw Error("ZONE_SANS_COMBAT");if(!unlockedZone(z,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks))throw Error("ZONE_VERROUILLEE");const stats=ctx.stats||{};const boss=Math.random()<(z.bossChance!=null?z.bossChance:0.25);
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
/*
 * Les valeurs brutes sont transportées avec le combat. Le client peut ainsi
 * afficher le vrai nom NGU et, à terme, les statistiques sans reconstruire
 * un second catalogue à partir des anciens identifiants d'illustrations.
 */
const mobStatsV1=idleAdventureMobBestiaryEntryV1(z,boss,monsterIndex);
const hpMax=monsterHpMaxForZoneV1WithMob(z,boss,monsterIndex),playerHpMax=playerHpMaxForAdventureV1(stats);const playerHp=ctx.restHp!=null?C(N(ctx.restHp),0,playerHpMax):playerHpMax;
const mobAttackFactor=idleAdventureMobAttackFactorV1(z,boss,monsterIndex),mobType=idleAdventureMobTypeV1(z,boss,monsterIndex);
s.lastCombatZone=z.id;
s.fight={active:true,zone:z.id,monsterHp:hpMax,monsterHpMax:hpMax,boss,playerHp,playerHpMax,monsterIndex,mobAttackFactor,mobType,mobName:mobStatsV1?String(mobStatsV1.name||""):"",mobPower:mobStatsV1?N(mobStatsV1.power):0,mobToughness:mobStatsV1?N(mobStatsV1.toughness):0,mobHpRegen:mobStatsV1?N(mobStatsV1.hpRegen):0,mobAttackRate:mobStatsV1?N(mobStatsV1.attackRate):0};
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
function resolveZoneFight(s,ctx){if(!s.fight?.active)throw Error("AUCUN_COMBAT_ACTIF");if(s.fight.zone!==s.selectedZone)throw Error("ZONE_CHANGEE_PENDANT_COMBAT");const wasBoss=Boolean(s.fight.boss),mobName=String(s.fight.mobName||"");s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};return rollKill(s,Object.assign({},ctx,{forceBoss:wasBoss,forceMobName:mobName}))}
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
function loseZoneFight(s,ctx){if(!s.fight?.active)throw Error("AUCUN_COMBAT_ACTIF");if(s.fight.zone!==s.selectedZone)throw Error("ZONE_CHANGEE_PENDANT_COMBAT");const zone=s.fight.zone;s.lastCombatZone=zone||s.lastCombatZone||"tutorial";s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};s.selectedZone="safe";return{defeated:true,zone}}
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
/*
 * Récompenses de base des titans -- colonne "Base Rewards" de la page Titans
 * et lignes Gold/Exp/AP/PP progress de la section Loot de chaque page de
 * titan (miroir local NGU-Wiki, 2026-09-23). Walderp : Exp/AP lus sur la page
 * Titans (sa section Loot ne donne que l'or), versés à la forme finale comme
 * ses drops. Les multiplicateurs 1.1x/1.2x/1.3x du souhait "I wish V2/3/4
 * Titans had better rewards" et les QP conditionnés par souhait ne sont pas
 * encore branchés (niveau de souhait absent du contexte de l'Aventure).
 */
const TITAN_REWARDS_V1=Object.freeze({
  t1:{gold:[1000000,1250000],exp:35,ap:10},
  t2:{gold:[1600000,2000000],exp:60,ap:15},
  t3:{gold:[1200000,1500000],exp:200,ap:50},
  t4:{gold:[2000000,2500000],exp:300,ap:60},
  t5:{gold:[4000000,5000000],exp:500,ap:70},
  t6:{gold:[20000000,25000000],exp:750,ppProgress:250000},
  t7:{gold:[4000000000000,5000000000000],exp:2500,ppProgress:400000}
});
/*
 * Souhait 3 "I wish V2/3/4 Titans had better rewards" (wiki, pages The Beast /
 * The Exile) : EXP, PP et QP x1,1 (Normal+, niveau 1), x1,2 (Hard+, niveau 2),
 * x1,3 (Brutal, niveau 3). Lu ici comme 1 + 0,1 x min(niveau du souhait, rang
 * du palier). QP de base : The Beast 1 (souhait 73), The Exile 3 (souhait 41).
 */
const TITAN_TIER_RANK_V1=Object.freeze({easy:0,normal:1,hard:2,brutal:3});
const TITAN_QP_V1=Object.freeze({t6:{wish:73,qp:1},t7:{wish:41,qp:3}});
function creditTitanRewardsV1(s,id,ctx,tierKey){
  const r=TITAN_REWARDS_V1[id];
  const out={gold:0,experience:0,ap:0,ppProgress:0,qp:0};
  if(!r)return out;
  const wishes=ctx&&ctx.wishLevels&&typeof ctx.wishLevels==="object"?ctx.wishLevels:{};
  const rewardMult=1+.1*Math.min(Math.max(0,I(wishes[3])),TITAN_TIER_RANK_V1[tierKey]||0);
  const goldDropsMult=1+N(idleAdventureCubeTierV1(s.cube).goldDropsPct)/100;
  out.gold=Math.max(1,Math.round((r.gold[0]+Math.random()*(r.gold[1]-r.gold[0]))*goldDropsMult));
  out.experience=Math.round(I(r.exp,0)*rewardMult);
  out.ap=I(r.ap,0);
  out.ppProgress=Math.round(I(r.ppProgress,0)*rewardMult);
  const qpDef=TITAN_QP_V1[id];
  if(qpDef&&I(wishes[qpDef.wish])>0)out.qp=qpDef.qp*rewardMult;
  s.permanent.gold=N(s.permanent.gold)+out.gold;
  s.permanent.experience=N(s.permanent.experience)+out.experience;
  s.permanent.ap=N(s.permanent.ap)+out.ap;
  s.permanent.ppProgress=N(s.permanent.ppProgress)+out.ppProgress;
  s.permanent.qp=N(s.permanent.qp)+out.qp;
  return out;
}
/*
 * Butin des titans 1 à 6 -- sections "Loot" des pages wiki (miroir local
 * NGU-Wiki, 2026-09-23). Les taux "base chance" sont multipliés par le
 * multiplicateur de drop comme partout ailleurs. "lvl a-b" = niveau tiré
 * uniformément entre a et b (lecture de la notation du wiki). Le bonus de
 * niveau des défis No Rebirth s'ajoute aux pièces de set, pas au Forest
 * Pendant (le wiki précise qu'il ne s'y applique pas). Objets du wiki qui
 * n'existent pas encore dans SOREAL (donc jamais tirés, jamais remplacés par
 * une valeur de repli) : Stapler, Ascended Forest Pendant, Heroic Sigil,
 * Ascended Ascended Ascended Pendant, A Bald Egg, A Giant Apple, A Power
 * Pill, Candy Cane of Destiny, Wandoos XL, Fanny Pack, Dorky Glasses,
 * UUG's 'Special' Ring, The First/Second/Third Clue.
 */
function rollTitanLootV1(s,id,tierKey,bonus,dropMult,out){
  const chance=p=>Math.random()<idleAdventureDropChanceV2(p,1,dropMult,null);
  const pick=liste=>liste[I(Math.random()*liste.length)];
  const niveau=(lo,hi)=>Math.min(MAX,lo+I(Math.random()*(hi-lo+1))+bonus);
  const equip=(setId,slot,lvl)=>{
    const o=definitionEquipmentDropAdventureV2(s,setId+":"+slot,lvl);
    const a=o?add(s,o):null;
    if(a)out.push(a);
  };
  const boosts=(type,liste)=>{
    for(const [force,p] of liste)if(chance(p)){const a=add(s,boost(type,force));if(a)out.push(a)}
  };
  const pendantForet=(lvl,p)=>{
    if(!chance(p))return;
    const o=definitionEquipmentDropAdventureV2(s,"forest:pendant",lvl);
    const a=o?add(s,o):null;
    if(a)out.push(a);
  };
  const cinq=["head","chest","legs","boots","weapon"];
  if(id==="t1"){
    equip("grb",pick(cinq),Math.min(MAX,bonus));
    if(chance(.5))equip("grb",pick(cinq),niveau(0,2));
    for(const slot of [...cinq,"necklace","meat"])if(chance(.15))equip("grb",slot,niveau(0,4));
    pendantForet(20,.1);
  }else if(id==="t2"){
    for(const type of ["power","toughness","special"]){const a=add(s,boost(type,10));if(a)out.push(a)}
    boosts("power",[[10,.1],[20,.08],[50,.05],[100,.05]]);
    boosts("toughness",[[10,.1],[20,.08],[50,.05],[100,.05]]);
    boosts("special",[[10,.1],[20,.08],[50,.08],[100,.05]]);
    if(chance(.01)){const a=add(s,special("mysteriousRedLiquid",5));if(a)out.push(a)}
    pendantForet(50,.1);
  }else if(id==="t3"){
    equip("scrap","paper",Math.min(MAX,bonus));
    equip("jake",pick(cinq),Math.min(MAX,bonus));
    if(chance(.6))equip("jake",pick(cinq),Math.min(MAX,1+bonus));
    for(const slot of cinq)if(chance(.1))equip("jake",slot,Math.min(MAX,2+bonus));
    if(chance(.25))equip("jake",pick(["tie","paperweight"]),Math.min(MAX,2+bonus));
    for(const type of ["power","toughness","special"])boosts(type,[[100,.1]]);
  }else if(id==="t4"){
    const anneaux=["ringGreed","ringMight","ringUtility","ringEnergy","ringMagic"];
    const premier=!s.itemList["uug:ringGreed"]?.seen;
    for(const slot of anneaux){
      if((premier&&slot==="ringGreed")||chance(.02))equip("uug",slot,Math.min(MAX,4+bonus));
    }
    pendantForet(0,.02);
  }else if(id==="t5"){
    if(chance(.005)){const a=add(s,special("wanderersCane",10));if(a)out.push(a)}
    for(const slot of ["head","chest","legs","boots"]){
      if(chance(.005))equip("wanderer",slot,Math.min(MAX,4+bonus));
      if(chance(.005))equip("rerednaw",slot,Math.min(MAX,4+bonus));
    }
  }else if(id==="t6"){
    for(const slot of cinq)if(chance(.0005))equip("slimy",slot,Math.min(MAX,4+bonus));
    const palier=tierKey==="normal"||tierKey==="hard"||tierKey==="brutal";
    const dur=tierKey==="hard"||tierKey==="brutal";
    if(palier&&chance(.00005)){const a=add(s,special("shrunkenVoodooDoll",4));if(a)out.push(a)}
    if(palier&&chance(.00002)){const a=add(s,special("mysteriousPurpleLiquid",1));if(a)out.push(a)}
    if(dur&&chance(.00001)){const a=add(s,special("pricelessVanGoghPainting",4));if(a)out.push(a)}
    if(tierKey==="brutal"&&chance(.000001)){const a=add(s,special("smallGerbil",4));if(a)out.push(a)}
  }
}
function titan(s,id,ctx,t,difficulty){const aliases={titan1:"t1",titan2:"t2",titan3:"t3",titan4:"t4",titan5:"t5",titan6:"t6",titan7:"t7"};id=aliases[id]||id;const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===id);if(!d||I(ctx.bosses)<d.boss)throw Error("TITAN_VERROUILLE");if(d.flag&&!s.unlockFlags[d.flag])throw Error("PROTECTION_TITAN_REQUISE");if(!titanGate(s,d))throw Error("PROGRESSION_TITAN_REQUISE");const st=s.titans[id]||{kills:0,nextAt:0,hiddenPanel:""};if(d.forms&&st.hiddenPanel)throw Error("TITAN_CACHE");if(t<N(st.nextAt))throw Error("TITAN_EN_REAPPARITION");const formIndex=d.forms?Math.min(I(st.kills),d.forms.length-1):-1;const tier=formIndex>=0?d.forms[formIndex]:(d.difficulties?(d.difficulties[difficulty]?d.difficulties[difficulty]:d.difficulties.easy):d);const tierKey=d.difficulties?(d.difficulties[difficulty]?difficulty:"easy"):"";const q=ctx.stats||{};if(N(q.power)<tier.p||N(q.toughness)<tier.t)throw Error("PUISSANCE_INSUFFISANTE");st.kills++;const challengeRespawnReduction=Math.max(0,N(ctx.titanCooldownReductionMs,0));if(d.forms&&st.kills<d.forms.length){st.hiddenPanel=WALDERP_HIDE_PANELS_V147[I(Math.random()*WALDERP_HIDE_PANELS_V147.length)];st.hiddenSince=t;st.nextAt=Infinity}else{st.hiddenPanel="";st.hiddenSince=0;st.nextAt=t+Math.max(0,d.cooldown-challengeRespawnReduction)}s.titans[id]=st;let firstDrop="";if(st.kills===1&&!s.unlockItems[d.drop]){s.unlockItems[d.drop]=true;firstDrop=d.drop}const drops=[];const challengeTitanLootLevel=Math.max(0,I(ctx.titanLootLevelBonus,0));/*
 * 2026-09-23 (audit NGU, parité wiki) : butin et récompenses des titans
 * lus sur la section Loot de leur page (miroir local NGU-Wiki) au lieu
 * d'objets garantis inventés. Voir rollTitanLootV1 / TITAN_REWARDS_V1.
 */
if(id==="t1"&&!s.unlockItems.wandoos98){s.unlockItems.wandoos98=true;drops.push(add(s,special("wandoos98",1)))}
if(id==="t5"&&st.kills>=d.forms.length){s.unlockFlags.walderpFinalDefeated=true;drops.push(add(s,special("wanderersCane",10)))}
const titanFinalisee=id!=="t5"||st.kills>=d.forms.length;
const titanDropMult=Math.max(.1,N(ctx.dropMultiplier,1)*(1+N(s.setRewards.drop)+idleAdventureCubeTierV1(s.cube).dropChancePct/100));
if(titanFinalisee)rollTitanLootV1(s,id,tierKey,challengeTitanLootLevel,titanDropMult,drops);
const recompenses=titanFinalisee?creditTitanRewardsV1(s,id,ctx,tierKey):{gold:0,experience:0,ap:0,ppProgress:0,qp:0};
/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * beastBrutalDefeated/exileBrutalDefeated : flag PERMANENT (jamais remis
 * à false), posé la première fois que le palier Brutal (V4) de ces 2
 * titans est vaincu -- même mécanique que walderpFinalDefeated ci-dessus
 * pour la forme finale de Walderp. Sert exclusivement les conditions de
 * déblocage Evil ("The Beast v4 beaten") et Sadistic ("The Exile v4
 * beaten"), wiki pages "Evil difficulty"/"SADISTIC difficulty" -- voir
 * idleNguDifficultyUnlockRequirementsV1 (idle-ngu-progression.js) côté
 * appelant.
 */
if(id==="t6"&&tierKey==="brutal")s.unlockFlags.beastBrutalDefeated=true;
if(id==="t7"&&tierKey==="brutal")s.unlockFlags.exileBrutalDefeated=true;
return{id,kills:st.kills,nextAt:st.nextAt,hiddenPanel:st.hiddenPanel||undefined,firstDrop,difficulty:tierKey||undefined,drops:drops.filter(Boolean),gold:recompenses.gold,experience:recompenses.experience,ap:recompenses.ap,ppProgress:recompenses.ppProgress,qp:recompenses.qp}}
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
 * Consommables qui déverrouillent les compétences Adventure avancées.
 * Le déblocage est permanent ; l'objet réel est retiré du sac au moment
 * où il est bu, comme dans NGU.
 */
const ADVENTURE_SKILL_CONSUMABLES_V1=Object.freeze({
  mysteriousRedLiquid:"hyperRegenUnlocked",
  mysteriousPurpleLiquid:"beastModeUnlocked",
  mysteriousGreyLiquid:"move69Unlocked"
});
function retirerObjetAdventureV1(s,itemId){
  const id=String(itemId||"");
  const o=s.inventory.find(x=>x.id===id);
  if(!o)throw Error("OBJET_INTROUVABLE");
  for(const slot of ["head","chest","legs","boots","weapon"]){
    if(s.equipment[slot]===id)s.equipment[slot]="";
  }
  s.equipment.accessories=(Array.isArray(s.equipment.accessories)?s.equipment.accessories:[]).filter(x=>x!==id);
  s.inventory=s.inventory.filter(x=>x.id!==id);
  syncInventorySlotsAdventureV2(s);
  return o;
}
function consumeAdventureSkillItemV1(s,itemId){
  const o=s.inventory.find(x=>x.id===String(itemId||""));
  const flag=o&&ADVENTURE_SKILL_CONSUMABLES_V1[o.definitionId];
  if(!o||!o.consumable||!flag)throw Error("CONSOMMABLE_SKILL_INVALIDE");
  retirerObjetAdventureV1(s,o.id);
  s.unlockFlags[flag]=true;
  return{definitionId:o.definitionId,flag};
}
function transformAdventureItemV1(s,itemId,ctx){
  const o=s.inventory.find(x=>x.id===String(itemId||""));
  if(!o||o.definitionId!=="smallGerbil")throw Error("TRANSFORMATION_INVALIDE");
  if(!idleAdventureNiveauEstMaxV1(o.level))throw Error("OBJET_NON_MAXE");
  if(String(ctx&&ctx.difficulty||"")!=="extreme")throw Error("DIFFICULTE_SADISTIC_REQUISE");
  retirerObjetAdventureV1(s,o.id);
  const liquid=special("mysteriousGreyLiquid",0);
  liquid.id=`i${s.serial++}`;
  const added=add(s,liquid);
  if(!added)throw Error("INVENTAIRE_PLEIN");
  return added;
}
function setBeastModeAdventureV1(s,enabled){
  if(!s.unlockFlags.beastModeUnlocked)throw Error("BEAST_MODE_VERROUILLE");
  s.skillState.beastMode=Boolean(enabled);
  return{beastMode:s.skillState.beastMode};
}
function useMove69AdventureV1(s){
  if(!s.unlockFlags.move69Unlocked)throw Error("MOVE_69_VERROUILLE");
  s.skillState.move69Uses=C(I(s.skillState.move69Uses)+1,0,69);
  if(s.skillState.move69Uses>=69)s.skillState.endPiece481=true;
  return{uses:s.skillState.move69Uses,endPiece481:Boolean(s.skillState.endPiece481)};
}
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
/*
 * PISTE 2 (2026-09-18, audit "Est-ce que tu as bien intégré chacune des
 * statistiques special etc ?") -- agrège, PAR TYPE réel de bonus (voir
 * commentaire au-dessus de SPECIALS pour sType/sExtra), les Specials des
 * objets équipés :
 * - sType (le Special "primaire", boostable) : contribue sa valeur COURANTE
 *   o.special (démarre à sBase, plafonnée par applyBoost/cleanItem à
 *   sMax*(1+niveau/100) -- même mécanisme que PISTE 1, inchangé).
 * - sExtra (les Specials additionnels, non boostables individuellement --
 *   voir commentaire au-dessus de SPECIALS) : contribue sa "Base value"
 *   wiki fixe (entry.base), garantie par le simple fait d'équiper l'objet.
 * Exporté séparément (`specialsByType`) ET replié dans `specials` par
 * idleAdventureEquipmentStatsV47 pour que les consommateurs existants
 * (dropMultiplier notamment, déjà câblé sur specials.dropChancePct) captent
 * automatiquement la contribution des objets sans changement de leur côté.
 */
function idleAdventureSpecialsByTypeV1(equipped){
  const out={};
  const add=(type,value)=>{if(!type)return;out[type]=N(out[type])+N(value)};
  for(const o of equipped){
    const def=defById(o.definitionId);
    const d=def?.kind==="special"?SPECIALS[def.id]:null;
    if(!d)continue;
    if(d.sType)add(d.sType,o.special);
    if(Array.isArray(d.sExtra))for(const ex of d.sExtra)add(ex.type,ex.base);
  }
  return out;
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
   * La stat d'équipement doit rester canonique et indépendante de la zone.
   * Exemple réel signalé : un pantalon +0,03 HP Regen affichait +0,15 en
   * Safe Zone parce que le ×5 était appliqué ici AVANT la construction de
   * la fiche. Le multiplicateur de repos est un effet de zone, pas une
   * propriété de l'équipement : il est désormais appliqué uniquement par
   * le tick client de repos.
   */
  const specialsByType=idleAdventureSpecialsByTypeV1(equipped);
  const cubePowerContribution=idleAdventureCubeSoftcapV1(s.cube.power,basePower);
  const cubeToughnessContribution=idleAdventureCubeSoftcapV1(s.cube.toughness,baseToughness);
  return{
    power:basePower+cubePowerContribution,
    toughness:baseToughness+cubeToughnessContribution,
    cubePowerContribution,
    cubeToughnessContribution,
    hp:equippedHp+N(s.setRewards.adventureHp),
    regen:equippedRegen+N(s.setRewards.adventureRegen),
    special:equipped.reduce((a,x)=>a+N(x.special),0),
    specialsByType,
    specials:{
      dropChancePct:N(s.setRewards.drop)*100+idleAdventureCubeTierV1(s.cube).dropChancePct+N(specialsByType.dropChancePct),
      respawnReductionPct:N(s.setRewards.respawn)*100,
      chargeMultiplier:Math.max(1,N(s.setRewards.chargeMultiplier,1)),
      idleAttack:Boolean(s.setRewards.idleAttack),
      wandoosMeh:Boolean(s.setRewards.wandoosMeh),
      noEquipmentChallenge:Boolean(s.setRewards.noEquipmentChallenge),
      // PISTE 2 (2026-09-18) : agrégat typé des SPECIALS équipés (sType/sExtra ci-dessus), voir idleAdventureSpecialsByTypeV1.
      energySpeedPct:N(specialsByType.energySpeedPct),
      energyPowerPct:N(specialsByType.energyPowerPct),
      energyCapPct:N(specialsByType.energyCapPct),
      energyBarsPct:N(specialsByType.energyBarsPct),
      magicSpeedPct:N(specialsByType.magicSpeedPct),
      magicPowerPct:N(specialsByType.magicPowerPct),
      magicCapPct:N(specialsByType.magicCapPct),
      magicBarsPct:N(specialsByType.magicBarsPct),
      goldDropsPct:N(specialsByType.goldDropsPct),
      beardSpeedPct:N(specialsByType.beardSpeedPct),
      nguSpeedPct:N(specialsByType.nguSpeedPct),
      seedGainPct:N(specialsByType.seedGainPct)
    },
    setRewards:X(s.setRewards),
    permanent:X(s.permanent)
  }
}
/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `difficulty`/`difficultyPeaks` (4e/5e paramètres, optionnels) --
 * propagés à unlockedZone ci-dessus pour les nouvelles zones Evil/
 * Sadistic. Seul appelant existant (idle-ngu-progression.js::
 * idleNguSnapshot) mis à jour pour les fournir ; absents = comportement
 * strictement inchangé pour tout autre appelant (une zone Evil/Sadistic
 * resterait alors verrouillée, jamais accessible par erreur).
 */
function snapshotItemAdventureV1(o){
  const d=defById(o&&o.definitionId);
  const base=d?.kind==="set"
    ?idleAdventureBaseStatsV1(d.set,d.slot)
    :(d?.kind==="special"
      ?idleAdventureSpecialBaseStatsV1(d.id)
      :{baseP:0,baseT:0,baseS:0});
  const specialType=d?.kind==="special"?SPECIALS[d.id]?.sType:undefined;
  return{
    ...o,
    maxed:idleAdventureNiveauEstMaxV1(o&&o.level),
    fullyMaxed:idleAdventureObjetPleinementMaxeV1(o),
    basePower:base.baseP,
    baseToughness:base.baseT,
    baseHp:base.baseP*3,
    baseRegen:base.baseT*.03,
    specialType:specialType||undefined,
    baseSpecial:base.baseS||0,
    locked:Boolean(o&&o.locked)
  };
}
export function idleAdventureSnapshotV47(raw,bosses=0,difficulty,difficultyPeaks){const s=normalizeIdleAdventureStateV47(raw);return{version:s.version,revision:Math.max(0,I(s.revision)),visualSource:"avatar-level",selectedZone:s.selectedZone,lastCombatZone:s.lastCombatZone,zones:IDLE_ADVENTURE_ZONES.map(z=>({...z,unlocked:unlockedZone(z,bosses,difficulty,difficultyPeaks),visual:{source:"avatar-level",level:I(z.avatarLevel,1),fallback:"emoji"}})),/*
 * Bug trouvé en vérifiant le vrai NGU (Norman, 2026-09-10) : "je ne
 * pense pas qu'ils soient visibles dans un menu dès le début" —
 * progressionUnlocked ne vérifiait QUE la chaîne de prérequis entre
 * titans (titanGate), jamais le vrai seuil "boss #X requis" du wiki NGU
 * (ex. GRB=boss 58) — un joueur niveau 1 voyait donc GRB avec un bouton
 * "Affronter" actif, qui échouait ensuite avec TITAN_VERROUILLE côté
 * serveur au clic. Un titan n'est réellement accessible que si les DEUX
 * conditions sont vraies.
 */
titans:IDLE_ADVENTURE_TITANS.map(t=>({...t,progressionUnlocked:I(bosses)>=I(t.boss)&&titanGate(s,t),visual:{source:"avatar-level",level:I(t.avatarLevel,1),fallback:"emoji"},state:X(s.titans[t.id]||{kills:0,nextAt:0})})),/*
 * Norman (2026-09-18, en direct, capture d'écran de son propre Tutorial
 * Cube) : "je vois que mon tutorial cube n'a toujours pas de stats
 * special." Cause confirmée (2e partie, côté client cette fois) :
 * basePower/baseToughness sont déjà exposés ici pour que le client
 * calcule lui-même le plafond X/MAX (basePower*q) -- specialType/
 * baseSpecial n'existaient pas du tout, donc afficherDetailsObjetAdventureIdleV138_
 * (Soreal_Idle_UI.html) ne pouvait montrer qu'un nombre brut "Special: X"
 * générique (jamais un vrai plafond, jamais le vrai label wiki comme
 * "Energy Speed"), et seulement quand item.special>0 -- rien du tout pour
 * un Tutorial Cube dont .special valait encore 0 (voir le correctif
 * plancher sBase juste au-dessus dans cleanItem). specialType (d.sType,
 * ex. "energySpeedPct") et baseSpecial (base.baseS, plafond au niveau 0 --
 * même convention que basePower/baseToughness) permettent désormais au
 * client de reproduire EXACTEMENT le même calcul X/MAX que pour Power/
 * Toughness, avec le vrai label.
 */
inventory:X(s.inventory).map(snapshotItemAdventureV1),trash:s.trash?snapshotItemAdventureV1(s.trash):null,coffreSlots:idleAdventureCoffreSlotsV1(s),equipment:X(s.equipment),itemList:Object.fromEntries(Object.entries(X(s.itemList)).map(([k,v])=>[k,{...v,maxed:idleAdventureNiveauEstMaxV1(v?.maxLevel),fullyMaxed:Boolean(v?.fullyMaxed)}])),itemCatalog:IDLE_ADVENTURE_ITEM_CATALOG_V1,setCatalog:Object.fromEntries(Object.entries(SETS).map(([id,d])=>[id,{id,name:d.name,source:d.source,slots:[...d.slots],reward:X(d.reward)}])),completedSets:X(s.completedSets),setRewards:X(s.setRewards),unlockItems:X(s.unlockItems),unlockFlags:X(s.unlockFlags),skillState:X(s.skillState),cube:X(s.cube),cubeTier:idleAdventureCubeTierV1(s.cube),fight:X(s.fight),inventorySlots:X(syncInventorySlotsAdventureV2(s)),inventoryCapacity:inventoryCapacityAdventureV1(s),inventoryUsed:inventoryUsedAdventureV1(s),accessorySlotsCapacity:accessorySlotsCapacityAdventureV1(s),stats:idleAdventureEquipmentStatsV47(s)}}
export function applyIdleAdventureActionV47(raw,p={},ctx={},t=Date.now()){const s=normalizeIdleAdventureStateV47(raw),a=String(p.action||p.mode||"");const clientMutationId=String(p.clientMutationId||"").slice(0,160);if(clientMutationId){const deja=s.recentClientMutations.find(x=>x&&String(x.id)===clientMutationId);if(deja){syncInventorySlotsAdventureV2(s);return{state:s,result:deja.result==null?deja.result:X(deja.result),duplicate:true}}}let result;if(a==="selectZone"){const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===p.zone);if(!z||!unlockedZone(z,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks))throw Error("ZONE_VERROUILLEE");if(s.fight.active&&s.fight.zone!==z.id){s.fight=X(base().fight)}s.selectedZone=z.id;result={zone:z.id}}else if(a==="addItem"){const d=defById(p.definitionId);if(!d)throw Error("DEFINITION_INVALIDE");result=add(s,d.kind==="set"?item(`i${s.serial++}`,d.set,d.slot,p.level):special(d.id,p.level))}else if(a==="merge")result=merge(s,String(p.a),String(p.b));else if(a==="equip")result=equip(s,String(p.id),String(p.slot));else if(a==="unequip")result=unequip(s,String(p.id),p.targetIndex);else if(a==="boost"&&p.toCube===true)result=cube(s,String(p.boostId));else if(a==="boost")result=applyBoost(s,String(p.boostId),String(p.targetId));else if(a==="cube")result=cube(s,String(p.boostId));else if(a==="discard")result=discard(s,String(p.id||p.itemId));else if(a==="setLock")result=setLockAdventureV1(s,String(p.id||p.itemId),p.locked);else if(a==="trashPut")result=trashPutAdventureV1(s,String(p.id||p.itemId));else if(a==="trashRecover")result=trashRecoverAdventureV1(s);else if(a==="coffreDeposer")result=coffreDeposer(s,String(p.id||p.itemId));else if(a==="coffreRetirer")result=coffreRetirer(s,String(p.id||p.itemId));else if(a==="reorderInventory")result=reorderInventoryAdventureV2(s,String(p.sourceId||p.id),String(p.targetId||""),p.targetIndex);else if(a==="zoneKill")result=rollKill(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="startZoneFight")result=startZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats,restHp:p.restHp}));else if(a==="resolveZoneFight")result=resolveZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="loseZoneFight")result=loseZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="titan")result=titan(s,String(p.titan||p.titanId),Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}),t,String(p.difficulty||""));else if(a==="titanFound")result=titanFound(s,String(p.titan||p.titanId),t);else if(a==="consumeUnlock")result=consume(s,String(p.item||p.itemId));else if(a==="consumeSkillItem")result=consumeAdventureSkillItemV1(s,String(p.id||p.itemId));else if(a==="transformAdventureItem")result=transformAdventureItemV1(s,String(p.id||p.itemId),ctx);else if(a==="setBeastMode")result=setBeastModeAdventureV1(s,p.enabled);else if(a==="useMove69")result=useMove69AdventureV1(s);else throw Error("ACTION_AVENTURE_INCONNUE");s.revision=Math.max(0,I(s.revision))+1;if(clientMutationId){s.recentClientMutations.push({id:clientMutationId,result:result==null?result:X(result),revision:s.revision});if(s.recentClientMutations.length>64)s.recentClientMutations=s.recentClientMutations.slice(-64)}syncInventorySlotsAdventureV2(s);return{state:s,result}}
