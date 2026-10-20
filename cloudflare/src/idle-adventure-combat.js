/*
 * Aventure : combats de zone, Titans et récompenses (audit d'architecture, 2026-10-16 : découpage de idle-adventure-v47.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { IDLE_TITAN_COMBAT_V1, idleTitanCombatV1 } from "./idle-titans-combat-v1.js";
import { idleTheEndHasV1, idleTheEndGrantV1 } from "./idle-the-end-v1.js";
import { IDLE_ADVENTURE_MOB_BESTIARY_V1, IDLE_ADVENTURE_MOB_CATALOG_V1, IDLE_ADVENTURE_TITANS, IDLE_ADVENTURE_ZONES } from "./idle-adventure-zones.js";
import { definitionEquipmentDropAdventureV2, idleAdventureDropChanceV2, idleAdventureMobAttackFactorV1, idleAdventureMobBestiaryEntryV1, idleAdventureMobTypeV1, monsterHpMaxForZoneV1WithMob, playerHpMaxForAdventureV1, rollKill, unlockedZone, versZoneSureV1 } from "./idle-adventure-butin.js";
import { C, I, MAX, N, UNLOCK_PAR_OBJET_V1, X, unlockMap } from "./idle-adventure-base.js";
import { add, cube, equip, inventoryCapacityAdventureV1, inventoryUsedAdventureV1, syncInventorySlotsAdventureV2 } from "./idle-adventure-inventaire.js";
import { boost, idleAdventureNiveauEstMaxV1, idleAdventureSpecialsListV1, special } from "./idle-adventure-objets.js";
import { ITEM_EVOLUTIONS_V1, SETS, SETS_OBJETS_V1 } from "./idle-adventure-sets.js";

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
export function startZoneFight(s,ctx){const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===s.selectedZone)||IDLE_ADVENTURE_ZONES[0];if(z.id==="safe")throw Error("ZONE_SANS_COMBAT");if(!unlockedZone(z,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks))throw Error("ZONE_VERROUILLEE");const stats=ctx.stats||{};const boss=Math.random()<(z.bossChance!=null?z.bossChance:0.25);
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
if(monsterIndex>=0){
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
/*
 * Combat de titan dans la scène d'Aventure (Norman, 2026-10-02) : le titan apparaît comme un ennemi avec SES statistiques du wiki (HP, Power, Toughness,
 * regen, Attack Rate -- idle-titans-combat-v1.js), combattu avec le même moteur que les ennemis de zone (attaques manuelles, mode Idle). Mêmes conditions
 * d'accès que l'ancienne résolution instantanée (déblocage, difficulté, protection, délai de réapparition), mais plus de seuil de puissance : on peut
 * perdre. La victoire est ensuite validée par resolveZoneFight (récompenses du titan, délai relancé) ; la défaite renvoie en Safe Zone sans toucher au délai.
 */
/* Un titan réservé à Evil / Sadistic n'est montré (ni nom ni stats) qu'à partir de cette difficulté : même condition que titan() (anti-spoil, règle n°2). */
export function titanDifficulteOkV1(t,difficulty){const d=String(difficulty||"");return(!t.evilOnly||d==="difficile"||d==="extreme")&&(!t.sadisticOnly||d==="extreme")}

/* Statistiques de combat d'un titan pour l'affichage (variantes par forme ou difficulté), jamais pour un titan encore verrouillé. */
export function titanCombatSnapshotV1(id){const c=IDLE_TITAN_COMBAT_V1[id];return c?X(c.variantes):null}

export function startTitanFight(s,ctx,t,id,difficulty){
  const pre=titan(s,id,ctx,t,difficulty,{preview:true,fromFight:true});
  const c=idleTitanCombatV1(pre.id,pre.tierKey,pre.formIndex);
  if(!c)throw Error("TITAN_SANS_STATS");
  const nomBase=IDLE_TITAN_COMBAT_V1[pre.id]?.nom||pre.d.name||pre.id;
  const stats=ctx.stats||{};
  /* Norman (2026-10-13) : « on ne doit pas pouvoir affronter un titan quand notre puissance en manuel n'est pas atteinte » : le combat exige les stats Manuel (Power / Toughness) de la page Adventure_Mode du wiki pour ce titan (ce palier ou cette forme). Avant (2026-10-02) on pouvait perdre sans seuil. */
  if(pre.tier&&(Number(pre.tier.p)>0||Number(pre.tier.t)>0)&&(N(stats.power)<N(pre.tier.p)||N(stats.toughness)<N(pre.tier.t)))throw Error("PUISSANCE_INSUFFISANTE");
  const playerHpMax=playerHpMaxForAdventureV1(stats);
  const playerHp=ctx.restHp!=null?C(N(ctx.restHp),0,playerHpMax):playerHpMax;
  versZoneSureV1(s,"titan","Un titan t'attend : le combat se déroule en Zone sûre");
  s.fight={active:true,zone:"safe",monsterHp:c.hp,monsterHpMax:c.hp,boss:true,playerHp,playerHpMax,monsterIndex:-1,mobAttackFactor:1,mobType:"titan",mobName:pre.formIndex>=0?nomBase+" (forme "+(pre.formIndex+1)+")":nomBase,mobPower:c.power,mobToughness:c.toughness,mobHpRegen:c.regen,mobAttackRate:c.attackRate,titanId:pre.id,titanTier:pre.tierKey||"",titanForm:pre.formIndex,titanStartedAt:t};/* « En direct » (Norman, 2026-10-04) : combats de titan lancés / perdus, lus par idle-flux-v1.js (la victoire vient du compteur de kills). */fluxTitanV1(s,"starts",pre.id);
  return{titanStarted:pre.id,tier:pre.tierKey||"",form:pre.formIndex,hp:c.hp};
}

export function resolveZoneFight(s,ctx,t=Date.now()){if(!s.fight?.active)throw Error("AUCUN_COMBAT_ACTIF");if(s.fight.zone!==s.selectedZone)throw Error("ZONE_CHANGEE_PENDANT_COMBAT");if(s.fight.titanId){const f=s.fight;/*
 * Un titan ne se gagne que par SON combat (Norman, 2026-10-04 : « j'ai tué un titan via un bug : je ne l'ai pas vu apparaître, j'ai mis un coup et il était mort, alors que je n'ai pas les stats »). Cause : le client
 * terminait un combat de zone ordinaire presque fini au moment où le serveur démarrait le titan ; sa victoire arrivait alors que le combat actif était celui du titan, et comptait comme une victoire contre lui
 * (garde de 2 s dépassée). Le client dit désormais QUEL titan il a vaincu (id + heure de départ du combat) ; sans correspondance exacte, la résolution est refusée et le combat du titan continue.
 */if(String(ctx.fightTitanId||"")!==String(f.titanId)||N(ctx.fightTitanStartedAt)!==N(f.titanStartedAt))throw Error("COMBAT_TITAN_AUTRE");if(t-N(f.titanStartedAt)<2000)throw Error("COMBAT_TITAN_TROP_COURT");s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};return titan(s,f.titanId,ctx,t,f.titanTier||"",{fromFight:true})}const wasBoss=Boolean(s.fight.boss),mobName=String(s.fight.mobName||""),mobSeed=Math.floor(N(s.fight.monsterIndex,-1));s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};/* mobName et mobSeed : le mob qui vient de tomber (écran de la Machine temporelle) */return Object.assign(rollKill(s,Object.assign({},ctx,{forceBoss:wasBoss,forceMobName:mobName})),{mobName,mobSeed})}

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
/* Annule UNE victoire de titan obtenue par erreur (bug du 2026-10-04, voir COMBAT_TITAN_AUTRE) : compteurs, attente de réapparition et objet de déblocage de la première victoire (seulement s'il n'a pas encore été utilisé). Les récompenses déjà versées ne sont pas reprises. */
export function annulerVictoireTitanV1(s,id){const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===id);const st=s&&s.titans&&s.titans[id];if(!d||!st||I(st.kills)<=0)throw Error("TITAN_SANS_VICTOIRE");st.kills=I(st.kills)-1;st.rebirthKills=Math.max(0,I(st.rebirthKills)-1);st.nextAt=0;st.hiddenPanel="";st.hiddenSince=0;let objetRetire="";const retires=[];if(st.kills===0&&d.drop&&s.unlockItems&&s.unlockItems[d.drop]){s.unlockItems[d.drop]=false;objetRetire=d.drop}
/* Première victoire de GRB : copie de Wandoos 98 (drapeau et objet du sac) et A Number, seulement si le système correspondant n'est pas déjà débloqué ; un seul exemplaire (le plus bas niveau) de chaque. */
if(st.kills===0&&id==="t1"){for(const [defId,cle] of [["aNumber","aNumber"],["wandoos98","wandoos98"]]){if(s.unlockFlags&&s.unlockFlags[unlockMap[cle]])continue;if(s.unlockItems&&s.unlockItems[cle]){s.unlockItems[cle]=false;retires.push(cle+":drapeau")}const copies=(s.inventory||[]).filter(x=>x&&x.definitionId===defId&&!x.locked).sort((a,b)=>I(a.level)-I(b.level));if(copies.length){retirerObjetAdventureV1(s,copies[0].id);retires.push(defId+":objet")}}}if(st.kills===0)s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};return{id,kills:st.kills,objetRetire,retires}}

/* « En direct » : boosts versés dans une pièce ou dans le Cube de l'infini (compteurs seuls, lus par idle-flux-v1.js). */
export function fluxBoostV1(s,cle,id){const f=s.boostFlux&&typeof s.boostFlux==='object'?s.boostFlux:{cube:0,piece:0,last:''};f[cle]=Math.max(0,I(f[cle],0))+1;if(cle==='piece')f.last=String(id||'');s.boostFlux=f}

/* « En direct » : objet transformé (ascension). Compteur + objet de départ + objet obtenu, jamais le détail. */
function fluxTransformV1(s,de,vers){const f=s.boostFlux&&typeof s.boostFlux==='object'?s.boostFlux:{cube:0,piece:0,last:''};f.transform=Math.max(0,I(f.transform,0))+1;f.transformDe=String(de||'');f.transformVers=String(vers||'');s.boostFlux=f}

export function fluxTitanV1(s,cle,id){const f=s.titanFlux&&typeof s.titanFlux==="object"?s.titanFlux:{starts:0,losses:0,last:""};f[cle]=Math.max(0,I(f[cle],0))+1;f.last=String(id);s.titanFlux=f}

export function loseZoneFight(s,ctx){if(!s.fight?.active)throw Error("AUCUN_COMBAT_ACTIF");if(s.fight.zone!==s.selectedZone)throw Error("ZONE_CHANGEE_PENDANT_COMBAT");/* Même identité que pour la victoire : la défaite d'un autre combat n'interrompt pas celui du titan. */if(s.fight.titanId&&(String(ctx.fightTitanId||"")!==String(s.fight.titanId)||N(ctx.fightTitanStartedAt)!==N(s.fight.titanStartedAt)))throw Error("COMBAT_TITAN_AUTRE");if(s.fight.titanId)fluxTitanV1(s,"losses",s.fight.titanId);const zone=s.fight.zone;s.lastCombatZone=zone||s.lastCombatZone||"tutorial";s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};versZoneSureV1(s,"defaite","Tu as été mis K.O. dans cette zone");return{defeated:true,zone}}

export function titanGate(s,d){const own=s.titans[d.id]||{};if(I(own.kills)>0)return true;if(d.requiresUnlock&&!s.unlockFlags[d.requiresUnlock])return false;if(d.requiresTitan&&I(s.titans[d.requiresTitan]?.kills)<I(d.requiresKills))return false;return true}

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
  t7:{gold:[4000000000000,5000000000000],exp:2500,ppProgress:400000},
  nerd:{gold:[4e10,5e10],exp:1100,ppProgress:250000},
  godmother:{gold:[4e11,5e11],exp:1500,ppProgress:300000},
  hungers:{gold:[8e15,1e16],exp:4000,ppProgress:500000},
  lobster:{gold:[8e16,1e17],exp:6000,ppProgress:700000},
  amalgamate:{gold:[6e17,7.5e17],exp:8000,ppProgress:1000000}
});

/*
 * Souhait 3 "I wish V2/3/4 Titans had better rewards" (wiki, pages The Beast /
 * The Exile) : EXP, PP et QP x1,1 (Normal+, niveau 1), x1,2 (Hard+, niveau 2),
 * x1,3 (Brutal, niveau 3). Lu ici comme 1 + 0,1 x min(niveau du souhait, rang
 * du palier). QP de base : The Beast 1 (souhait 73), The Exile 3 (souhait 41).
 */
const TITAN_TIER_RANK_V1=Object.freeze({easy:0,normal:1,hard:2,brutal:3});

const TITAN_QP_V1=Object.freeze({t6:{wish:73,qp:1},t7:{wish:41,qp:3},nerd:{wish:74,qp:1},godmother:{wish:40,qp:2},hungers:{wish:100,qp:4},lobster:{wish:187,qp:5},amalgamate:{wish:204,qp:6}});

function creditTitanRewardsV1(s,id,ctx,tierKey,rebirthKills=0){
  const r=TITAN_REWARDS_V1[id];
  const out={gold:0,experience:0,ap:0,ppProgress:0,qp:0};
  if(!r)return out;
  const wishes=ctx&&ctx.wishLevels&&typeof ctx.wishLevels==="object"?ctx.wishLevels:{};
  const rewardMult=1+.1*Math.min(Math.max(0,I(wishes[3])),TITAN_TIER_RANK_V1[tierKey]||0);
  const goldDropsMult=1+N(idleAdventureCubeTierV1(s.cube).goldDropsPct)/100;
  out.gold=Math.max(1,Math.round((r.gold[0]+Math.random()*(r.gold[1]-r.gold[0]))*goldDropsMult*Math.max(0,N(ctx&&ctx.goldMultiplier,1))));
  /*
   * Perk 34 « Bonus Titan EXP! » (page Experience) : « +50% EXP from Titans. +3 kill per level that will benefit
   * from this Perk » : +50 % fixe sur les 3 x niveau premiers kills de chaque titan par Rebirth. La composition
   * avec le souhait « V2/3/4 Titans had better rewards » n'est pas publiée : facteurs multiplicatifs (choix SOREAL).
   */
  const perkTitanExp=I(rebirthKills)>0&&I(rebirthKills)<=Math.max(0,I(ctx&&ctx.titanExpBonusKills,0))?1.5:1;
  /*
   * 24 Hour Challenge (page Challenges) : « +10% EXP whenever you defeat boss 24 or higher (rounded down) (bonus also
   * applies to Titans) » (+4 % Evil, +2 % Sadistic par complétion) ; guide du nouveau joueur : « completing make bosses
   * and Titans give more exp ». Facteur multiplicatif avec les précédents (composition non publiée), arrondi inférieur.
   */
  out.experience=Math.round(I(r.exp,0)*rewardMult*perkTitanExp);
  const challengeExp=Math.max(0,N(ctx&&ctx.titanExpChallengePct,0));
  if(challengeExp>0)out.experience=Math.floor(out.experience*(1+challengeExp));
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
 * Auto-Kill des Titans, en ligne ET hors ligne (Norman, 2026-09-27 -- correctif 1/4 de docs/HORS-LIGNE.md, wiki NGU
 * page "Titans" : « Once you have the minimum required strength to auto-kill them, you can turn on "Automatically
 * Kill Titans" in the settings. This will enable to automatically fight them while online and offline as soon as
 * the cooldown period is over » ; « no items drop while you are offline »). Appelée à CHAQUE syncIdleNguState
 * (idle-ngu-progression.js), donc au même rythme que la partie est en ligne (poll régulier) ou après une longue
 * absence (rattrapage) -- même code, même comportement, comme le décrit le wiki.
 *
 * Seuils autoKillP/autoKillT/autoKillKills : voir le commentaire de chaque titan plus haut dans ce fichier (source
 * = section "Recommended stats"/tableau de sa page wiki, ligne "AutoKill"). Titans sans seuil publié (TIPPI, THE
 * TRAITOR) ou sans seuil sur le palier concerné (Walderp, formes 1 à 4) : jamais éligibles, ignorés ci-dessous.
 *
 * Simplifications assumées (documentées, pas des manques accidentels) :
 *  - le gain de force de 1 % par attaque du titan ("All titans grow in strength by 1% per attack") n'est pas
 *    modélisé -- SOREAL ne modélise déjà pas cette croissance pour les combats Manual/Idle non plus (aucune
 *    régression propre à ce correctif) ;
 *  - le "Health Regen" listé à côté de certains seuils AutoKill n'est jamais vérifié -- SOREAL ne modélise le
 *    combat de titan que par un seuil Power/Toughness statique (fonction titan() ci-dessus), jamais par une
 *    simulation dans la durée ; ce champ est donc sans effet ici, pour la même raison qu'il l'est déjà pour les
 *    seuils Manual/Idle existants ;
 *  - Walderp : réservé au joueur ayant déjà vaincu sa forme finale au moins une fois manuellement
 *    (unlockFlags.walderpFinalDefeated) -- le butin garanti de cette 1re victoire (la canne, le déblocage
 *    MacGuffins) n'est jamais accordé par Auto-Kill, uniquement par un combat manuel.
 *
 * Aucun objet ne tombe (ni butin garanti, ni tirage aléatoire) : seuls l'or, l'EXP, l'AP, la PP-progress et le QP
 * sont crédités, via creditTitanRewardsV1 -- jamais rollTitanLootV1 ni les objets garantis spéciaux (Wandoos 98,
 * canne de Walderp) que titan() (combat manuel) accorde en plus.
 */
export function advanceTitanAutoKillV1(s,ctx,seconds,t){
  if(!s||!(seconds>0))return{kills:0};
  const debut=t-seconds*1000;
  const stats=ctx&&ctx.stats||{};
  let totalKills=0;
  for(const d of IDLE_ADVENTURE_TITANS){
    if(I(ctx.bosses)<d.boss)continue;
    if(d.evilOnly&&!["difficile","extreme"].includes(String(ctx.difficulty||"")))continue;
    if(d.sadisticOnly&&String(ctx.difficulty||"")!=="extreme")continue;
    if(d.flag&&!s.unlockFlags[d.flag])continue;
    if(!titanGate(s,d))continue;
    const st=s.titans[d.id]||{kills:0,nextAt:0};
    /* Case à cocher PAR TITAN (Norman, 2026-10-10) : cochée = auto-kill ; le vieux réglage global reste valable pour les titans jamais réglés. */
    if(!(st.autoKill===true||(s.autoKillTitansEnabled&&st.autoKill!==false)))continue;
    /*
     * Le palier (Easy/Normal/Hard/Brutal) n'est PAS le même concept que ctx.difficulty (Normal/Evil/Sadistic, le
     * mode de difficulté du run) -- confusion corrigée le 2026-09-27 (le premier jet réutilisait ctx.difficulty à
     * tort, ce qui bloquait l'alternative "N kills" pour tout palier autre que Normal/Evil/Sadistic pris au pied
     * de la lettre). Auto-Kill choisit lui-même le palier le plus élevé auquel le joueur est déjà éligible
     * (stats OU kills), comme un combat manuel choisirait toujours le palier le plus payant -- cohérent avec le
     * wiki ("to maximize the EXP gain").
     */
    let tier=null,tierKey="";
    if(d.forms){
      if(st.kills<d.forms.length||!s.unlockFlags.walderpFinalDefeated)continue;
      const essai=d.forms[d.forms.length-1];
      if(N(essai.autoKillP)>0&&N(stats.power)>=essai.autoKillP&&N(stats.toughness)>=essai.autoKillT)tier=essai;
    }else if(d.difficulties){
      for(const cle of ["brutal","hard","normal","easy"]){
        const essai=d.difficulties[cle];
        if(!essai||!(N(essai.autoKillP)>0))continue;
        const dejaKills=Math.max(0,I((st.difficultyKills||{})[cle],0));
        const statsOk=N(stats.power)>=essai.autoKillP&&N(stats.toughness)>=essai.autoKillT;
        const killsOk=essai.autoKillKills&&dejaKills>=essai.autoKillKills;
        if(statsOk||killsOk){tier=essai;tierKey=cle;break;}
      }
    }else if(N(d.autoKillP)>0&&N(stats.power)>=d.autoKillP&&N(stats.toughness)>=d.autoKillT){
      tier=d;
    }
    if(!tier)continue;
    let cursor=Math.max(debut,N(st.nextAt,0));
    let cycles=0;
    while(cursor<=t&&cycles<2000){
      cycles+=1;
      st.kills=I(st.kills,0)+1;
      st.rebirthKills=I(st.rebirthKills,0)+1;
      if(tierKey){
        if(!st.difficultyKills||typeof st.difficultyKills!=="object")st.difficultyKills={};
        st.difficultyKills[tierKey]=I(st.difficultyKills[tierKey],0)+1;
      }
      creditTitanRewardsV1(s,d.id,ctx,tierKey,st.rebirthKills);
      /*
       * BUTIN EN LIGNE (Norman, 2026-10-11 : « on garde l'auto kill hors ligne comme celui du Wiki (EXP, Or, AP, PP, QP), mais l'auto kill EN LIGNE doit donner les loots ») : quand le joueur est connecté (ctx.enLigne : synchro courte), chaque
       * kill tire le même butin qu'un combat manuel (rollTitanLootV1, même bonus de drop, même premier objet de déblocage) ; hors ligne, jamais aucun objet (wiki : « no items drop while you are offline »).
       */
      if(ctx.enLigne&&(!d.forms||st.kills>=d.forms.length)){
        if(d.drop&&st.kills===1&&!s.unlockItems[d.drop])s.unlockItems[d.drop]=true;
        const butin=[];
        const multButin=Math.max(.1,N(ctx.dropMultiplier,1)*(ctx.dropMultiplierIncludesGear?1:1+N(s.setRewards.drop)+idleAdventureCubeTierV1(s.cube).dropChancePct/100));
        rollTitanLootV1(s,d.id,tierKey,Math.max(0,I(ctx.titanLootLevelBonus,0)),multButin,butin);
        s.dernierButinAutoKill={id:d.id,at:t,objets:butin.filter(Boolean).map(o=>({id:o.id,definitionId:o.definitionId,name:o.name}))};
      }
      const cooldown=idleAdventureTitanCooldownMsV1(d.id,ctx,st.kills);
      cursor+=Math.max(TITAN_COOLDOWN_FLOOR_MS_V1,N(cooldown,d.cooldown));
    }
    if(cycles>0){
      st.nextAt=cursor;
      s.titans[d.id]=st;
      totalKills+=cycles;
      /* Mêmes drapeaux permanents que titan() (combat manuel), posés indépendamment du butin (achievements, déblocages Evil/Sadistic). */
      if(d.id==="hungers")s.unlockFlags.itHungersDefeated=true;
      if(d.id==="t6"&&tierKey)s.unlockFlags["beastDefeated_"+tierKey]=true;
      if(d.id==="t6"&&tierKey==="brutal")s.unlockFlags.beastBrutalDefeated=true;
      if(d.id==="t7"&&tierKey==="brutal")s.unlockFlags.exileBrutalDefeated=true;
    }
  }
  return{kills:totalKills};
}

/*
 * Farm automatique d'Aventure hors ligne (Norman, 2026-09-29) : « à la reconnexion... que le jeu
 * calcule ce qu'on aurait dû looter... le mode aventure tourne même le jeu fermé... 12h », précisé
 * ensuite en 3 contraintes fermes : 8h maximum hors ligne ; (la limite « jamais plus de 70% de l'inventaire » a été supprimée le 2026-10-19)
 * (toujours une place pour le butin de titan etc.) ; « le combat doit être calculé comme s'il avait
 * eu lieu » -- un vrai risque de mort, avec le monstre et la zone lisibles dans le journal. Zone
 * ciblée = lastCombatZone (Norman : « La dernière zone de combat active et la zone actuellement
 * sélectionnée revient exactement au même. C'est donc bien la dernière zone de combat active. »),
 * PAS s.selectedZone seul -- ce dernier retombe à "safe" après une défaite (loseZoneFight) alors que
 * lastCombatZone survit, exactement le cas où il ne faut pas perdre la zone à refarmer.
 *
 * Premier essai (2026-09-29, Beta 6.3) : construit à tort sur le simulateur LEGACY
 * (idle-sqlite-runtime.js, j.aventure, zones à ID NUMÉRIQUE table IDLE_ZONES) -- un système
 * entièrement différent, jamais utilisé par aucun joueur réel (le sélecteur de zone réel, vérifié
 * dans Soreal_Idle_UI.html, lit partout j.systemes.adventure.selectedZone, CE fichier). Son
 * déclencheur (statsAuto.autoAventure/autoAventureZone) n'est d'ailleurs jamais mis à vrai nulle
 * part -- switch mort depuis le premier jour, jamais exécuté. Cette version cible directement le
 * VRAI système (state.adventure, IDLE_ADVENTURE_ZONES, rollKill) et se déclenche sur lastCombatZone
 * -- « Dès qu'une zone est sélectionnée, l'auto combat est toujours actif », donc aucun interrupteur
 * séparé à vérifier.
 *
 * Combat de zone réel = client-autoritaire pour le TIMING (cf. resolveZoneFight plus haut : "seul le
 * client simule les coups en temps réel, le serveur ne fait qu'ouvrir/fermer le combat"). Hors ligne,
 * aucun client ne tourne : les fonctions ci-dessous reproduisent donc les MÊMES formules que
 * Soreal_Idle_UI.html (degatsJoueurAdventureIdleV2_/degatsEnnemiAdventureIdleV2_/intervalles/regen de
 * combat), copiées ici car normalement propres au client. Simplification assumée et documentée
 * (même principe que la croissance de force des titans non modélisée par advanceTitanAutoKillV1
 * ci-dessus) : le facteur aléatoire par coup (0.8-1.2, facteurAleatoireDegatsAdventureIdleV2_) est
 * remplacé par sa moyenne (1.0) -- chaque combat est résolu analytiquement (temps jusqu'à 0 PV des
 * deux côtés, régén comprise) plutôt que coup par coup, pour rester borné en CPU face à
 * potentiellement des centaines de combats simulés en une seule reconnexion.
 */
function degatsJoueurMoyenAdventureAutoV1(power,toughness,idleBonus){
  return Math.max(0,Math.max(0,N(power)-N(toughness)/2)*Math.max(0,N(idleBonus)||1));
}

function degatsEnnemiMoyenAdventureAutoV1(power,toughness){
  const p=Math.max(0,N(power));
  return Math.max(p*.1,p-N(toughness)/2);
}

function idleAttackMultiplierAdventureAutoV1(stats){
  const sp=stats&&stats.specials;
  const serveur=sp&&Number(sp.idleAttackMultiplier);
  if(serveur>0)return serveur;
  return sp&&sp.idleAttack?1.5:1.2;
}

export function advanceAdventureZoneAutoFarmOfflineV1(s,ctx,seconds,t){
  const AUCUN={kills:0,gold:0,experience:0,drops:0,derniereDefaite:null};
  if(!s||!(seconds>0))return AUCUN;
  /*
   * Seulement depuis une zone de combat (Norman, 2026-10-08 : il était en Zone sûre, a rejoint la base haute sécurité et a reçu d'un coup plein de boosts de niveau 1 : le farm simulé de la
   * DERNIÈRE zone avait tourné pendant qu'il était en Zone sûre). Choix de Norman : en Zone sûre (K.O., Titan ou choix volontaire), aucun farm automatique ; la zone farmée est celle qui est
   * réellement sélectionnée, jamais une ancienne zone gardée dans lastCombatZone.
   */
  const zoneId=String(s.selectedZone||"");
  if(!zoneId||zoneId==="safe")return AUCUN;
  const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===zoneId);
  if(!z||z.id==="safe")return AUCUN;
  if(!unlockedZone(z,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks))return AUCUN;
  /*
   * lastCombatZone vaut TOUJOURS "tutorial" par défaut (base()/normalizeIdleAdventureStateV47, y
   * compris pour un joueur qui n'a jamais ouvert l'onglet Aventure) -- un simple `bosses>=4` (tutorial
   * débloqué) ne suffit donc pas à savoir si le joueur a RÉELLEMENT déjà combattu là-bas. Sans cette
   * garde, un joueur qui n'a jamais touché l'Aventure se retrouverait à la farmer tout seul dès qu'il
   * atteint le boss 4 -- confirmé en pratique : plusieurs tests indépendants (idle-boss-ap,
   * idle-drop-chance-no-double-count, idle-itopod-boost-drops) construisent un état frais puis
   * avancent l'horloge de plus de 5 minutes avant la première vraie action, ce qui suffisait à
   * déclencher un farm fantôme et fausser leurs compteurs. zone.kills/zone.encounters ne sont peuplés
   * QUE par un vrai combat (rollKill/startZoneFight) : la présence d'AU MOINS une entrée est le signal
   * le plus proche de « ce joueur a déjà vraiment combattu en Aventure ».
   */
  const aDejaCombattuEnAventure=s.zone&&((s.zone.kills&&Object.keys(s.zone.kills).length>0)||(s.zone.encounters&&Object.keys(s.zone.encounters).length>0));
  if(!aDejaCombattuEnAventure)return AUCUN;

  /* Un combat déjà en cours au moment de la mise hors-ligne n'a aucune issue connue côté serveur (seul le client simule les coups) : abandonné sans butin ni pénalité plutôt que deviné. */
  if(s.fight&&s.fight.active)s.fight={active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0};
  s.selectedZone=zoneId;

  const stats=ctx.stats||{};
  const playerHpMax=Math.max(0,N(stats.hp));
  if(!(playerHpMax>0))return AUCUN;
  const playerRegenSec=Math.max(0,N(stats.regen))*1.2;
  const attackIntervalSec=(s.unlockFlags&&s.unlockFlags.redLiquidMaxed?800:1000)/1000;
  const idleBonus=idleAttackMultiplierAdventureAutoV1(stats);
  /* Plafond de 70 % SUPPRIMÉ (Norman, 2026-10-19 : « il faut supprimer la limite de 70% de loot hors ligne. On peut remplir l'inventaire désormais. ») : le farm hors ligne remplit désormais jusqu'à 100 % de la capacité. */
   const capaciteFarm=inventoryCapacityAdventureV1(s);
  const RESPAWN_SEC=4000/1000;

  const capSec=Math.min(seconds,8*60*60);
  let elapsed=0,playerHp=playerHpMax;
  let kills=0,gold=0,experience=0,drops=0,derniereDefaite=null,cycles=0;

  while(elapsed<capSec&&cycles<4000){
    cycles+=1;
    if(inventoryUsedAdventureV1(s)>=capaciteFarm)break;

    const boss=Math.random()<(z.bossChance!=null?z.bossChance:.25);
    const bestiaryZone=IDLE_ADVENTURE_MOB_BESTIARY_V1[z.id];
    const catalogueZone=IDLE_ADVENTURE_MOB_CATALOG_V1[z.id]||{normal:[],boss:[]};
    const poolIndex=boss?catalogueZone.boss:catalogueZone.normal;
    const bestiaryPool=bestiaryZone?(boss?bestiaryZone.boss:bestiaryZone.normal):null;
    const poolLen=(bestiaryPool&&bestiaryPool.length)||(poolIndex&&poolIndex.length)||0;
    const monsterIndex=poolLen?Math.floor(Math.random()*poolLen):-1;
    const mobEntry=idleAdventureMobBestiaryEntryV1(z,boss,monsterIndex);
    const monsterHpMax=monsterHpMaxForZoneV1WithMob(z,boss,monsterIndex);
    const mobPower=mobEntry?N(mobEntry.power):0;
    const mobToughness=mobEntry?N(mobEntry.toughness):0;
    const mobHpRegen=mobEntry?N(mobEntry.hpRegen):0;
    const mobName=mobEntry?String(mobEntry.name||""):"";
    const ennemiIntervalSec=Math.max(.1,N(mobEntry&&mobEntry.attackRate)||1);

    const playerDps=degatsJoueurMoyenAdventureAutoV1(stats.power,mobToughness,idleBonus)/attackIntervalSec;
    const monsterDps=degatsEnnemiMoyenAdventureAutoV1(mobPower,stats.toughness)/ennemiIntervalSec;
    const netVersMonstre=playerDps-mobHpRegen;
    const netVersJoueur=monsterDps-playerRegenSec;
    const tempsTuerMonstre=netVersMonstre>0?monsterHpMax/netVersMonstre:Infinity;
    const tempsTuerJoueur=netVersJoueur>0?playerHp/netVersJoueur:Infinity;

    if(!Number.isFinite(tempsTuerMonstre)&&!Number.isFinite(tempsTuerJoueur)){
      /* Ni le joueur ni le monstre ne peuvent l'emporter (régén >= dégâts des deux côtés) : farm à l'arrêt, rien de plus à simuler. */
      break;
    }

    if(tempsTuerJoueur<=tempsTuerMonstre){
      derniereDefaite={monstre:mobName,zone:String(z.name||z.id||""),boss,ko:true};
      versZoneSureV1(s,"ko_hors_ligne","Pendant ton absence, "+(mobName||"un ennemi")+" t'a mis K.O. (simulation du farm hors ligne)");
      break;
    }

    elapsed+=tempsTuerMonstre+RESPAWN_SEC;
    playerHp=netVersJoueur>0
      ?Math.max(0,playerHp-netVersJoueur*tempsTuerMonstre)
      :Math.min(playerHpMax,playerHp-netVersJoueur*tempsTuerMonstre);

    const avantOr=N(s.permanent.gold),avantExp=N(s.permanent.experience);
    const resultat=rollKill(s,Object.assign({},ctx,{forceBoss:boss,forceMobName:mobName}));
    kills+=1;
    gold+=Math.max(0,N(s.permanent.gold)-avantOr);
    experience+=Math.max(0,N(s.permanent.experience)-avantExp);
    drops+=Array.isArray(resultat.drops)?resultat.drops.length:0;
  }

  return{kills,gold,experience,drops,derniereDefaite};
}

/*
 * Butin des titans -- sections "Loot" des pages wiki (miroir local NGU-Wiki,
 * 2026-09-23). Les taux "base chance" sont multipliés par le multiplicateur de
 * drop comme partout ailleurs. "lvl a-b" = niveau tiré uniformément entre a et
 * b (lecture de la notation du wiki). Le bonus de niveau des défis No Rebirth
 * s'ajoute aux pièces de set, pas au Forest Pendant (le wiki précise qu'il ne
 * s'y applique pas) ; les objets SPECIALS gardent leur niveau wiki (même
 * convention que Wanderer's Cane / Mysterious Red Liquid / Beast ci-dessous).
 *
 * Titans Evil/Sadistic (Greasy Nerd, Godmother, Exile, IT HUNGERS, ROCK
 * LOBSTER, AMALGAMATE) : "Only cube root of loot chance bonus applies" (en
 * tête de leur section Loot) -> chanceEvil() applique le cube root comme
 * pour les zones Evil, avec le plafond "up to 25% max" de chaque ligne.
 * "Normal+" / "Hard+" / "Brutal" = paliers normal-hard-brutal / hard-brutal /
 * brutal (même lecture que The Beast).
 *
 * Objets du wiki volontairement NON tirés (système absent ou taux inconnu,
 * jamais remplacés par une valeur de repli) : Heroic Sigil (déjà débloqué via
 * d.drop), A busted copy of Wandoos XL, The First/Second/Third Clue,
 * MacGuffin Fragments, Sack/Face of the Exile, Blue Eyes Ultimate Chestplate
 * ("secret unlock" sans condition publiée), les morceaux de THE END.
 */
function rollTitanLootV1(s,id,tierKey,bonus,dropMult,out){
  const chance=p=>Math.random()<idleAdventureDropChanceV2(p,1,dropMult,null);
  const chanceEvil=(p,cap)=>Math.random()<idleAdventureDropChanceV2(p,cap,dropMult,TITAN_LOOT_CUBE_ROOT_V1);
  const pick=liste=>liste[I(Math.random()*liste.length)];
  const niveau=(lo,hi)=>Math.min(MAX,lo+I(Math.random()*(hi-lo+1))+bonus);
  const equip=(setId,slot,lvl)=>{
    const o=definitionEquipmentDropAdventureV2(s,setId+":"+slot,lvl);
    const a=o?add(s,o):null;
    if(a)out.push(a);
  };
  const objet=(defId,lvl)=>{const a=add(s,special(defId,lvl));if(a)out.push(a)};
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
  const palierNormal=tierKey==="normal"||tierKey==="hard"||tierKey==="brutal";
  const palierDur=tierKey==="hard"||tierKey==="brutal";
  const palierBrutal=tierKey==="brutal";
  /*
   * Lignes communes des titans Evil/Sadistic : pièces du set ("x% base chance,
   * up to 25% max for each of"), objets de tous paliers, puis objets
   * Normal+/Hard+/Brutal ; [defId, niveau, taux, plafond].
   */
  const titanEvil=(setId,tauxPiece,tous,normal,dur,brutal)=>{
    for(const slot of SETS[setId].slots)if(chanceEvil(tauxPiece,.25))equip(setId,slot,Math.min(MAX,4+bonus));
    const tirer=liste=>{for(const [defId,lvl,p,cap] of liste)if(chanceEvil(p,cap))objet(defId,lvl)};
    tirer(tous);
    if(palierNormal)tirer(normal);
    if(palierDur)tirer(dur);
    if(palierBrutal)tirer(brutal);
  };
  if(id==="t1"){
    // wiki GRB, Loot : "A Number lvl 0 (guaranteed)" -- objet fusionnable du Number (set).
    objet("aNumber",Math.min(MAX,bonus));
    equip("grb",pick(cinq),Math.min(MAX,bonus));
    if(chance(.5))equip("grb",pick(cinq),niveau(0,2));
    for(const slot of [...cinq,"necklace","meat"])if(chance(.15))equip("grb",slot,niveau(0,4));
    pendantForet(20,.1);
    /*
     * 2026-09-24 (audit des pages-guides) : wiki GRB, Loot : « A busted copy of Wandoos 98 -
     * guaranteed, 20% base chance for lvl 2-4, 80% for lvl 1 » (bonus de niveau No Rebirth
     * non appliqué, note du wiki) ; infobox « guaranteed », New Player Guide (Truth) « a
     * guaranteed drop from the first two Titans ». Avant : une seule copie au 1er kill.
     */
    objet("wandoos98",chance(.2)?2+I(Math.random()*3):1);
  }else if(id==="t2"){
    // wiki Grand Corrupted Tree, Loot : "A Giant Seed lvl 0 (guaranteed)" -- objet fusionnable du Seed (set).
    objet("giantSeed",Math.min(MAX,bonus));
    for(const type of ["power","toughness","special"]){const a=add(s,boost(type,10));if(a)out.push(a)}
    boosts("power",[[10,.1],[20,.08],[50,.05],[100,.05]]);
    boosts("toughness",[[10,.1],[20,.08],[50,.05],[100,.05]]);
    boosts("special",[[10,.1],[20,.08],[50,.08],[100,.05]]);
    if(chance(.01)){const a=add(s,special("mysteriousRedLiquid",5));if(a)out.push(a)}
    pendantForet(50,.1);
    /*
     * 2026-09-24 (audit des pages-guides) : copie de Wandoos 98 garantie à chaque kill, niveau
     * 3-7 (infobox « guaranteed (3-7) », Template:Item data « GClvldrop = 3-7 », Loot « guaranteed »,
     * New Player Guide (Truth) « a guaranteed drop from the first two Titans »). Non modélisé :
     * le « 20% base chance for lvl 4-7 » de la section Loot (copie en plus, ou niveau 4-7 à la
     * place ? le wiki ne tranche pas ; la page Wandoos dit « 4-7 »).
     */
    objet("wandoos98",3+I(Math.random()*5));
  }else if(id==="t3"){
    equip("scrap","paper",Math.min(MAX,bonus));
    equip("jake",pick(cinq),Math.min(MAX,bonus));
    if(chance(.6))equip("jake",pick(cinq),Math.min(MAX,1+bonus));
    for(const slot of cinq)if(chance(.1))equip("jake",slot,Math.min(MAX,2+bonus));
    if(chance(.25))equip("jake",pick(["tie","paperweight"]),Math.min(MAX,2+bonus));
    // wiki : "Stapler lvl 4 (2% base chance)", "Ascended Forest Pendant lvl 1 (10% base chance)"
    if(chance(.02))objet("stapler",4);
    for(const type of ["power","toughness","special"])boosts(type,[[100,.1]]);
    if(chance(.1))objet("ascendedForestPendant",1);
  }else if(id==="t4"){
    // wiki UUG, Loot : "UUG's Armpit Hair lvl 0 (guaranteed)" -- objet fusionnable de l'Armpit (set).
    objet("uugHair",Math.min(MAX,bonus));
    const anneaux=["ringGreed","ringMight","ringUtility","ringEnergy","ringMagic"];
    const premier=!s.itemList["uug:ringGreed"]?.seen;
    for(const slot of anneaux){
      if((premier&&slot==="ringGreed")||chance(.02))equip("uug",slot,Math.min(MAX,4+bonus));
    }
    // wiki : "UUG's 'Special' Ring lvl 4 (UUG's rings (set) completed, 0.1% base chance)"
    if(s.completedSets.uug&&chance(.001))objet("uugSpecialRing",4);
    pendantForet(0,.02);
  }else if(id==="t5"){
    if(chance(.005))objet(...canneWalderpV1());
    for(const slot of ["head","chest","legs","boots"]){
      if(chance(.005))equip("wanderer",slot,Math.min(MAX,4+bonus));
      if(chance(.005))equip("rerednaw",slot,Math.min(MAX,4+bonus));
    }
    // wiki : "Ascended Forest Pendant lvl 50 (0.5% base chance)", "Fanny Pack lvl 10 (if Wanderer's (set) complete, 0.01%)", "Dorky Glasses lvl 10 (if S'rerednaW (set) complete, 0.01%)"
    if(chance(.005))objet("ascendedForestPendant",50);
    // wiki Walderp, Loot : "A busted copy of Wandoos XL lvl 20 (0.5% base chance)".
    if(chance(.005))objet("wandoosXl",20);
    if(s.completedSets.wanderer&&chance(.0001))objet("fannyPack",10);
    if(s.completedSets.rerednaw&&chance(.0001))objet("dorkyGlasses",10);
  }else if(id==="t6"){
    // wiki The Beast, Loot : "Heroic Sigil lvl 4 - guaranteed" -- objet fusionnable du Heroic Sigil (set).
    objet("heroicSigil",Math.min(MAX,4+bonus));
    for(const slot of cinq)if(chance(.0005))equip("slimy",slot,Math.min(MAX,4+bonus));
    // wiki, "All Modes" : "Ascended Ascended Ascended Pendant lvl 1 (0.05% base chance)", "A Bald Egg lvl 4 (0.02% base chance)"
    if(chance(.0005))objet("ascendedX3Pendant",1);
    if(chance(.0002))objet("baldEgg",4);
    const palier=palierNormal;
    const dur=palierDur;
    if(palier&&chance(.00005)){const a=add(s,special("shrunkenVoodooDoll",4));if(a)out.push(a)}
    if(palier&&chance(.00002)){const a=add(s,special("mysteriousPurpleLiquid",1));if(a)out.push(a)}
    if(dur&&chance(.00001)){const a=add(s,special("pricelessVanGoghPainting",4));if(a)out.push(a)}
    // wiki, "Hard+" : "A Giant Apple lvl 4 (0.0005% base chance)" ; "Brutal" : "A Power Pill lvl 4 (0.0002% base chance)"
    if(dur&&chance(.000005))objet("giantApple",4);
    if(tierKey==="brutal"&&chance(.000002))objet("powerPill",4);
    if(tierKey==="brutal"&&chance(.000001)){const a=add(s,special("smallGerbil",4));if(a)out.push(a)}
  }else if(id==="nerd"){
    // wiki Greasy Nerd, Loot : "Incriminating Evidence lvl 1 - guaranteed".
    objet("incriminatingEvidence",Math.min(MAX,1+bonus));
    // wiki : "Guaranteed one of" les 5 pièces du set + An Ordinary Calculator + Anime Figurine, lvl 4
    const garanti=pick([...cinq.map(slot=>"greasynerd:"+slot),"ordinaryCalculator","animeFigurine"]);
    if(garanti.startsWith("greasynerd:"))equip("greasynerd",garanti.slice(11),Math.min(MAX,4+bonus));else objet(garanti,4);
    titanEvil("greasynerd",.00035,
      [["ordinaryCalculator",4,.00035,.25],["animeFigurine",4,.00035,.25],["ascendedX4Pendant",4,.00035,.25]],
      [["theD20",4,.00027,.25],["theD8",4,.00027,.25]],
      [["animeBodypillow",4,.00022,.25],["redMeeple",4,.00022,.25]],
      [["bagOfTrash",4,.00017,.25],["heartShapedPanties",4,.00017,.25]]);
  }else if(id==="godmother"){
    // wiki The Godmother, Loot : "A Severed Unicorn's Head lvl 0 - guaranteed".
    objet("severedUnicornHead",Math.min(MAX,bonus));
    titanEvil("mobster",.0001,
      [["ascendedX4Pendant",8,.0001,.25],["kingLooty",8,.0001,.25]],
      [["violinCase",4,.000075,.25],["molotovCocktail",4,.000075,.25]],
      [["godmothersRing",4,.00006,.25],["godmothersWand",4,.00006,.25]],
      [["leftFairyWing",4,.000045,.25],["rightFairyWing",4,.000045,.25]]);
  }else if(id==="t7"){
    // wiki The Exile, Loot : "A Still-Beating Heart lvl 4 (guaranteed)" -- objet fusionnable du Still-Beating Heart (set).
    objet("stillBeatingHeart",Math.min(MAX,4+bonus));
    titanEvil("exile",.00002,
      [["theJoker",4,.00002,.25],["antlersExile",4,.00002,.25],["ascendedX4Pendant",50,.000015,.25],["kingLooty",50,.000015,.25]],
      [["creditCard",4,.00001,.25],["tentacleExile",4,.00001,.25]],
      [["skipCard",4,.000006,.25],["antennaeExile",4,.000006,.25]],
      [["blackLotus",4,.000004,.25],["busterExile",4,.000004,.25]]);
  }else if(id==="hungers"){
    titanEvil("space",.000001,
      [["theCricket",4,.000001,.25],["ascendedX5Pendant",50,.000001,.25],["emperorLooty",50,.000001,.25]],
      [["evilRubberDucky",4,6e-7,.25],["gasGiant",4,6e-7,.25]],
      [["carbonRod",4,4e-7,.25],["kleinBottle",4,4e-7,.25]],
      [["alienBugNest",4,3e-7,.25],["theKey",4,3e-7,.25]]);
  }else if(id==="lobster"){
    titanEvil("rock",1e-7,
      [["ascendedX6Pendant",10,1e-7,.25],["galacticHeraldLooty",10,1e-7,.25]],
      [["skippingStone",4,6.5e-8,.25],["bedRock",4,6.5e-8,.25]],
      [["rockCandy",4,4e-8,.25],["brokenScissors",4,4e-8,.25]],
      [["portableStairway",4,3e-8,.25],["amplifier",4,3e-8,.25]]);
  }else if(id==="amalgamate"){
    titanEvil("amalgamate",1.4e-8,
      [["ascendedX7Pendant",50,1.4e-8,.25],["supremeIntelligenceLooty",50,1.4e-8,.25]],
      [["rawSlabOfWood",4,1e-8,.25]],
      [["tieOfApathy",4,8e-9,.25]],
      [["titanEffigy",4,6e-9,.25]]);
    /*
     * Pièces de THE END (page THE END : 483 « Random drop from AMALGAMATE (V1+) », 489 (V2+), 493 (V3+), 484 (V4) ; page du titan : « AMALGAMATE also has a
     * chance to drop one of four different pieces of THE END, one for each mode »). Le taux n'est publié nulle part : on reprend celui de l'objet
     * signature du même palier, que le wiki donne (0,0000014 % tous paliers, 0,000001 % Normal+, 0,0000008 % Hard+, 0,0000006 % Brutal).
     */
    const piece=(n,p)=>{if(!idleTheEndHasV1(s,n)&&chanceEvil(p,.25))idleTheEndGrantV1(s,n,Date.now())};
    piece(483,1.4e-8);
    if(palierNormal)piece(489,1e-8);
    if(palierDur)piece(493,8e-9);
    if(palierBrutal)piece(484,6e-9);
  }
}

/* Titans Evil/Sadistic : même règle "cube root" que les zones Evil (idleAdventureDropChanceV2 lit requiredDifficulty). */
const TITAN_LOOT_CUBE_ROOT_V1=Object.freeze({id:"titan-evil",requiredDifficulty:"difficile"});

/*
 * Walderp, wiki : "Wanderer's Cane lvl 10 - guaranteed, with 1% flat chance of
 * The Candy Cane of Destiny lvl 0 instead" (idem pour le jet à 0,5 %). "flat" :
 * ce 1 % n'est pas multiplié par le bonus de drop.
 */
function canneWalderpV1(){return Math.random()<.01?["candyCaneDestiny",0]:["wanderersCane",10]}

const TITAN_RANK_V1=Object.freeze({t1:1,t2:2,t3:3,t4:4,t5:5,t6:6,nerd:7,godmother:8,t7:9,hungers:10,lobster:11,amalgamate:12,tippi:13,traitor:14});

/* Page Titans : « a cooldown period ... (with a minimum of 60 minutes) ... won't decrease it below the 60 min minimum ». */
const TITAN_COOLDOWN_FLOOR_MS_V1=3600000;

/*
 * Produit des bonus de complétion de set portant sur une même clé de setRewards (facteurs SÉPARÉS et non additionnés).
 * Page Yggdrasil, Fruit of Rage : « PPBonus is bonus applied to all Perk Points gain : NGU_PP x GreenHeartBonus x
 * ItopodKeyBonus x PrettySetBonus x HalloweenieSetBonus x Digger_PP x Perk x Hacks_PP » : les quatre sets « PP earnings »
 * (page ITOPOD : +20 %, +10 %, +10 %, +45 %) donnent 1,2 x 1,1 x 1,1 x 1,45 et non 1 + 0,85.
 */
export function idleAdventureSetRewardProductV1(adventure,key){
  const done=adventure&&adventure.completedSets&&typeof adventure.completedSets==="object"?adventure.completedSets:{};
  const total=N(adventure&&adventure.setRewards&&adventure.setRewards[key]);
  let product=1;
  let sum=0;
  for(const table of [SETS,SETS_OBJETS_V1]){
    for(const [id,def] of Object.entries(table)){
      const v=N(def&&def.reward&&def.reward[key]);
      if(done[id]&&v>0){product*=1+v;sum+=v}
    }
  }
  /* État cohérent (setRewards = somme des sets complétés) : produit des facteurs ; sinon (injection directe, ancienne sauvegarde) : 1 + somme. */
  return Math.abs(sum-total)<1e-9?product:1+Math.max(0,total);
}

/*
 * Délai de réapparition (ms) d'un titan après un combat ou un Rebirth : délai de base moins 15 min par No Rebirth
 * Challenge (Normal dès le titan 3, Evil dès le 7, Sadistic dès le 10), plancher 60 min. Retourne null tant que
 * Walderp n'a pas fini toutes ses formes (`kills` = nombre de victoires), ou si le titan est inconnu.
 */
export function idleAdventureTitanCooldownMsV1(id,ctx,kills){
  const aliases={titan1:"t1",titan2:"t2",titan3:"t3",titan4:"t4",titan5:"t5",titan6:"t6",titan7:"t7"};
  const key=aliases[id]||id;
  const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===key);
  if(!d)return null;
  if(d.forms&&I(kills)<d.forms.length)return null;
  const rank=TITAN_RANK_V1[key]||0;
  const c=ctx||{};
  const reduction=Math.max(0,(rank>=3?N(c.titanCooldownReductionMs,0):0)+(rank>=7?N(c.titanCooldownReductionEvilMs,0):0)+(rank>=10?N(c.titanCooldownReductionSadisticMs,0):0));
  return Math.max(TITAN_COOLDOWN_FLOOR_MS_V1,N(d.cooldown,0)-reduction);
}

export function titan(s,id,ctx,t,difficulty,opts={}){const aliases={titan1:"t1",titan2:"t2",titan3:"t3",titan4:"t4",titan5:"t5",titan6:"t6",titan7:"t7"};id=aliases[id]||id;const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===id);if(!d||I(ctx.bosses)<d.boss)throw Error("TITAN_VERROUILLE");if(d.evilOnly&&!["difficile","extreme"].includes(String(ctx.difficulty||"")))throw Error("DIFFICULTE_EVIL_REQUISE");if(d.sadisticOnly&&String(ctx.difficulty||"")!=="extreme")throw Error("DIFFICULTE_SADISTIC_REQUISE");if(d.flag&&!s.unlockFlags[d.flag])throw Error("PROTECTION_TITAN_REQUISE");if(!titanGate(s,d))throw Error("PROGRESSION_TITAN_REQUISE");const st=s.titans[id]||{kills:0,nextAt:0,hiddenPanel:""};if(d.forms&&st.hiddenPanel)throw Error("TITAN_CACHE");if(t<N(st.nextAt))throw Error("TITAN_EN_REAPPARITION");const formIndex=d.forms?Math.min(I(st.kills),d.forms.length-1):-1;const tier=formIndex>=0?d.forms[formIndex]:(d.difficulties?(d.difficulties[difficulty]?d.difficulties[difficulty]:d.difficulties.easy):d);const tierKey=d.difficulties?(d.difficulties[difficulty]?difficulty:"easy"):"";const q=ctx.stats||{};if(!opts.fromFight&&(N(q.power)<tier.p||N(q.toughness)<tier.t))throw Error("PUISSANCE_INSUFFISANTE");if(opts.preview)return{id,d,st,tier,tierKey,formIndex};st.kills++;st.rebirthKills=I(st.rebirthKills)+1;if(tierKey){if(!st.difficultyKills||typeof st.difficultyKills!=="object")st.difficultyKills={};st.difficultyKills[tierKey]=I(st.difficultyKills[tierKey],0)+1}/* Défis No Rebirth : -15 min par complétion à partir de Jake (Normal), du Greasy Nerd (Evil), d'IT HUNGERS (Sadistic). */const titanRank=TITAN_RANK_V1[id]||0;const challengeRespawnReduction=Math.max(0,(titanRank>=3?N(ctx.titanCooldownReductionMs,0):0)+(titanRank>=7?N(ctx.titanCooldownReductionEvilMs,0):0)+(titanRank>=10?N(ctx.titanCooldownReductionSadisticMs,0):0));/* Page Titans : le délai ne descend jamais sous 60 minutes (TITAN_COOLDOWN_FLOOR_MS_V1). */if(d.forms&&st.kills<d.forms.length){st.hiddenPanel=WALDERP_HIDE_PANELS_V147[I(Math.random()*WALDERP_HIDE_PANELS_V147.length)];st.hiddenSince=t;st.nextAt=Infinity}else{st.hiddenPanel="";st.hiddenSince=0;st.nextAt=t+Math.max(TITAN_COOLDOWN_FLOOR_MS_V1,d.cooldown-challengeRespawnReduction)}s.titans[id]=st;let firstDrop="";if(d.drop&&st.kills===1&&!s.unlockItems[d.drop]){s.unlockItems[d.drop]=true;firstDrop=d.drop}const drops=[];const challengeTitanLootLevel=Math.max(0,I(ctx.titanLootLevelBonus,0));/*
 * 2026-09-23 (audit NGU, parité wiki) : butin et récompenses des titans
 * lus sur la section Loot de leur page (miroir local NGU-Wiki) au lieu
 * d'objets garantis inventés. Voir rollTitanLootV1 / TITAN_REWARDS_V1.
 */
/* 1er kill de GRB : Wandoos débloqué ; la copie elle-même vient de rollTitanLootV1 (garantie à chaque kill, 2026-09-24). */
if(id==="t1"&&!s.unlockItems.wandoos98)s.unlockItems.wandoos98=true;
if(id==="t5"&&st.kills>=d.forms.length){s.unlockFlags.walderpFinalDefeated=true;const [canne,niveauCanne]=canneWalderpV1();drops.push(add(s,special(canne,niveauCanne)))}
const titanFinalisee=id!=="t5"||st.kills>=d.forms.length;
const titanDropMult=Math.max(.1,N(ctx.dropMultiplier,1)*(ctx.dropMultiplierIncludesGear?1:1+N(s.setRewards.drop)+idleAdventureCubeTierV1(s.cube).dropChancePct/100));
if(titanFinalisee)rollTitanLootV1(s,id,tierKey,challengeTitanLootLevel,titanDropMult,drops);
const recompenses=titanFinalisee?creditTitanRewardsV1(s,id,ctx,tierKey,st.rebirthKills):{gold:0,experience:0,ap:0,ppProgress:0,qp:0};
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
if(id==="hungers")s.unlockFlags.itHungersDefeated=true;
/* Tippi / Traitor (2026-09-25) : le Traitor vaincu pose un flag permanent ; le moteur NGU fixe alors les Rebirths à 10 000 (page THE TRAITOR (titan)). */
if(id==="traitor"){s.unlockFlags.traitorDefeated=true;idleTheEndGrantV1(s,495,t)}
if(id==="t6"&&tierKey==="brutal")s.unlockFlags.beastBrutalDefeated=true;
/* Achievements "Defeat THE BEAST V1..V4!" (2026-09-24) : palier vaincu, permanent (idle-achievements-v1.js). */
if(id==="t6"&&tierKey)s.unlockFlags["beastDefeated_"+tierKey]=true;
if(id==="t7"&&tierKey==="brutal")s.unlockFlags.exileBrutalDefeated=true;
return{id,kills:st.kills,nextAt:st.nextAt,hiddenPanel:st.hiddenPanel||undefined,firstDrop,difficulty:tierKey||undefined,drops:drops.filter(Boolean),gold:recompenses.gold,experience:recompenses.experience,ap:recompenses.ap,ppProgress:recompenses.ppProgress,qp:recompenses.qp}}

/*
 * V147 — retrouver Walderp caché. Purement déclaratif côté serveur (le
 * client sait déjà où il se cache via le snapshot — il ne "devine" rien,
 * il confirme juste avoir cliqué au bon endroit) : vide hiddenPanel et
 * démarre ALORS le vrai cooldown avant la forme suivante.
 */
export function titanFound(s,id,t){const aliases={titan1:"t1",titan2:"t2",titan3:"t3",titan4:"t4",titan5:"t5",titan6:"t6"};id=aliases[id]||id;const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===id);const st=s.titans[id];if(!d||!st||!st.hiddenPanel)throw Error("TITAN_PAS_CACHE");st.hiddenPanel="";st.hiddenSince=0;st.nextAt=t+Math.max(0,N(d.cooldown));s.titans[id]=st;return{id,nextAt:st.nextAt}}

export function consume(s,id){const flag=unlockMap[id];if(!flag)throw Error("OBJET_DEBLOCAGE_ABSENT");/* Depuis 2026-10-04 le déblocage dû est un vrai objet du sac (convertirDeblocagesEnObjetsV1) : l'ancienne action par clé utilise cet objet. */if(!s.unlockItems[id]){const defId=Object.keys(UNLOCK_PAR_OBJET_V1).find(k=>UNLOCK_PAR_OBJET_V1[k]===id);const o=defId&&s.inventory.find(x=>x&&x.definitionId===defId);if(!o)throw Error("OBJET_DEBLOCAGE_ABSENT");return useUnlockItem(s,o.id)}s.unlockFlags[flag]=true;s.unlockItems[id]=false;return{flag}}

export function useUnlockItem(s,itemId){
  const o=s.inventory.find(x=>String(x.id)===String(itemId||""));
  if(!o)throw Error("OBJET_INTROUVABLE");
  const cle=UNLOCK_PAR_OBJET_V1[o.definitionId];
  const flag=cle?unlockMap[cle]:"";
  if(!flag)throw Error("OBJET_NON_DEBLOCAGE");
  if(s.unlockFlags[flag])throw Error("SYSTEME_DEJA_DEBLOQUE");
  s.unlockFlags[flag]=true;
  s.unlockItems[cle]=false;
  retirerObjetAdventureV1(s,o.id);
  s.revision=Math.max(0,I(s.revision,0))+1;
  return{flag,item:cle,definitionId:o.definitionId};
}

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
  for(const slot of ["head","chest","legs","boots","weapon","weapon2"]){
    if(s.equipment[slot]===id)s.equipment[slot]="";
  }
  s.equipment.accessories=(Array.isArray(s.equipment.accessories)?s.equipment.accessories:[]).filter(x=>x!==id);
  s.inventory=s.inventory.filter(x=>x.id!==id);
  syncInventorySlotsAdventureV2(s);
  return o;
}

export function consumeAdventureSkillItemV1(s,itemId){
  const o=s.inventory.find(x=>x.id===String(itemId||""));
  const flag=o&&ADVENTURE_SKILL_CONSUMABLES_V1[o.definitionId];
  if(!o||!o.consumable||!flag)throw Error("CONSOMMABLE_SKILL_INVALIDE");
  retirerObjetAdventureV1(s,o.id);
  s.unlockFlags[flag]=true;
  return{definitionId:o.definitionId,flag};
}

const THE_END_ASCENSIONS_V1=Object.freeze({ascendedX9Pendant:480,glitchyLooty:485});

export function transformAdventureItemV1(s,itemId,ctx){
  const o=s.inventory.find(x=>x.id===String(itemId||""));
  const cible=o?ITEM_EVOLUTIONS_V1[o.definitionId]:"";
  /*
   * Ascension générique (ITEM_EVOLUTIONS_V1) : fiche de chaque objet, "level it to level 100 and
   * CTRL + Click to transform it" ; l'objet obtenu arrive au niveau 0 (page Inventory, voir la
   * table). The Lonely Flubber -> The Triple Flubber passe par ce même chemin (niveau 0 déjà
   * retenu le 2026-09-23). A Small Gerbil -> Mysterious Grey Liquid : en plus, SADISTIC seulement
   * (fiche : "A Small Gerbil can only be transformed in SADISTIC difficulty").
   */
  /* Dernières ascensions (page THE END) : Ascended x9 Pendant -> pièce 480, GLITCHY LOOTY -> pièce 485. L'objet est consommé, la pièce est rangée à part. */
  const piece=o?THE_END_ASCENSIONS_V1[o.definitionId]:0;
  if(piece){
    if(!idleAdventureNiveauEstMaxV1(o.level))throw Error("OBJET_NON_MAXE");
    const defDepart=o.definitionId;
    retirerObjetAdventureV1(s,o.id);
    idleTheEndGrantV1(s,piece,Date.now());
    fluxTransformV1(s,defDepart,"");
    return{transformed:true,theEnd:true};
  }
  if(!o||!cible)throw Error("TRANSFORMATION_INVALIDE");
  if(!idleAdventureNiveauEstMaxV1(o.level))throw Error("OBJET_NON_MAXE");
  if(o.definitionId==="smallGerbil"&&String(ctx&&ctx.difficulty||"")!=="extreme")throw Error("DIFFICULTE_SADISTIC_REQUISE");
  retirerObjetAdventureV1(s,o.id);
  const obtenu=special(cible,0);
  obtenu.id=`i${s.serial++}`;
  const ajoute=add(s,obtenu);
  if(!ajoute)throw Error("INVENTAIRE_PLEIN");
  fluxTransformV1(s,o.definitionId,cible);
  return ajoute;
}

export function setBeastModeAdventureV1(s,enabled){
  if(!s.unlockFlags.beastModeUnlocked)throw Error("BEAST_MODE_VERROUILLE");
  s.skillState.beastMode=Boolean(enabled);
  return{beastMode:s.skillState.beastMode};
}

/*
 * « Automatically Kill Titans » (Norman, 2026-09-27, wiki page Titans) : réglage global, aucun prérequis pour
 * l'activer (il ne se passe simplement rien tant qu'aucun titan n'atteint son seuil AutoKill). L'exécution réelle
 * (vérification des seuils, kills, récompenses) vit dans advanceTitanAutoKillV1, appelée à chaque synchronisation
 * (syncIdleNguState), donc aussi bien en ligne qu'hors ligne -- exactement le comportement décrit par le wiki.
 */
export function setAutoKillTitansV1(s,enabled){
  s.autoKillTitansEnabled=Boolean(enabled);
  return{autoKillTitansEnabled:s.autoKillTitansEnabled};
}

/* Case à cocher « Auto-kill » d'UN titan (Norman, 2026-10-10 : « pour les titans, on doit avoir une case à cocher pour auto kill ou non »). */
/*
 * L'Auto-kill d'un titan ne peut être COCHÉ que si le joueur remplit déjà ses conditions (Norman, 2026-10-14 : « on ne doit pas pouvoir cocher auto kill pour un titan quand on n'a pas les statistiques nécessaires »).
 * Mêmes conditions que advanceTitanAutoKillV1 (qui garde la main sur l'exécution) : forme finale battue et stats de la forme finale (Walderp) ; sinon au moins un palier dont les stats Auto-kill sont atteintes
 * (ou dont le nombre de kills voulu est atteint) ; sinon les stats Auto-kill du titan. Décocher reste toujours possible.
 */
export function titanAutoKillPossibleV1(s,d,stats){
  const st=(s&&s.titans&&s.titans[d.id])||{kills:0,nextAt:0};
  const puissance=N(stats&&stats.power),robustesse=N(stats&&stats.toughness);
  if(d.forms){
    if(I(st.kills)<d.forms.length||!(s.unlockFlags&&s.unlockFlags.walderpFinalDefeated))return false;
    const f=d.forms[d.forms.length-1];
    return N(f.autoKillP)>0&&puissance>=f.autoKillP&&robustesse>=f.autoKillT;
  }
  if(d.difficulties){
    return Object.keys(d.difficulties).some(cle=>{
      const e=d.difficulties[cle];
      if(!e||!(N(e.autoKillP)>0))return false;
      const kills=Math.max(0,I((st.difficultyKills||{})[cle],0));
      return (puissance>=e.autoKillP&&robustesse>=e.autoKillT)||Boolean(e.autoKillKills&&kills>=e.autoKillKills);
    });
  }
  return N(d.autoKillP)>0&&puissance>=d.autoKillP&&robustesse>=d.autoKillT;
}

export function setAutoKillTitanV1(s,id,enabled,ctx){
  const d=IDLE_ADVENTURE_TITANS.find(x=>x.id===String(id));
  if(!d)throw Error("TITAN_INCONNU");
  if(Boolean(enabled)&&!titanAutoKillPossibleV1(s,d,ctx&&ctx.stats))throw Error("AUTOKILL_STATS_INSUFFISANTES");
  const st=s.titans[d.id]||(s.titans[d.id]={kills:0,nextAt:0});
  st.autoKill=Boolean(enabled);
  return{id:d.id,autoKill:st.autoKill};
}

export function useMove69AdventureV1(s){
  if(!s.unlockFlags.move69Unlocked)throw Error("MOVE_69_VERROUILLE");
  s.skillState.move69Uses=C(I(s.skillState.move69Uses)+1,0,69);
  if(s.skillState.move69Uses>=69){s.skillState.endPiece481=true;idleTheEndGrantV1(s,481,Date.now())}
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
export function idleAdventureSpecialsByTypeV1(equipped){
  const out={};
  const add=(type,value)=>{if(!type)return;out[type]=N(out[type])+N(value)};
  for(const o of equipped){
    for(const sv of idleAdventureSpecialsListV1(o))add(sv.type,sv.value);
  }
  return out;
}
