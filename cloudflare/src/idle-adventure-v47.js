import { NOMS_SPECIALS_FR_V1, NOMS_SETS_FR_V1, NOMS_SETS_OBJETS_FR_V1, NOMS_PIECES_FR_V1 } from "./idle-noms-fr-v1.js";
import { SET_ITEM_SPECIALS_V1 } from "./idle-adventure-set-specials-v1.js";
import { idleSpecialPointsRatioV1 } from "./idle-adventure-special-points-v1.js";
import { idleTitanCombatV1, IDLE_TITAN_COMBAT_V1 } from "./idle-titans-combat-v1.js";
import { idleTheEndNormalizeV1, idleTheEndGrantV1, idleTheEndHasV1, idleTheEndSnapshotV1, idleTheEndPlayV1 } from "./idle-the-end-v1.js";
import { IDLE_ADVENTURE_TITANS, IDLE_ADVENTURE_ZONES } from "./idle-adventure-zones.js";
import { I, N, X, __perfCompteursV1 } from "./idle-adventure-base.js";
import { IDLE_ADVENTURE_COFFRE_COEURS_V1, IDLE_ADVENTURE_COFFRE_LOOTY_V1, IDLE_ADVENTURE_COFFRE_PENDENTIFS_V1, IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1, accessorySlotsCapacityAdventureV1, add, applyBoost, coffreDeposer, coffreRetirer, cube, discard, equip, idleAdventureCoffreSlotsV1, idleAdventureCubeSoftcapV1, inventoryCapacityAdventureV1, inventoryUsedAdventureV1, merge, reorderInventoryAdventureV2, secondeArmeDebloqueeAdventureV1, setLockAdventureV1, syncInventorySlotsAdventureV2, trashPutAdventureV1, trashRecoverAdventureV1, unequip } from "./idle-adventure-inventaire.js";
import { IDLE_ADVENTURE_ITEM_CATALOG_V1, SETS, SPECIALS, defById } from "./idle-adventure-sets.js";
import { base, idleAdventureBaseStatsV1, idleAdventureBoostManquantV1, idleAdventureNiveauEstMaxV1, idleAdventureObjetPleinementMaxeV1, idleAdventureSpecialBaseStatsV1, idleAdventureSpecialsListV1, item, normalizeIdleAdventureStateV47, special } from "./idle-adventure-objets.js";
import { consume, consumeAdventureSkillItemV1, fluxTitanV1, idleAdventureCubeTierV1, idleAdventureSpecialsByTypeV1, loseZoneFight, resolveZoneFight, setAutoKillTitanV1, setAutoKillTitansV1, setBeastModeAdventureV1, startTitanFight, startZoneFight, titan, titanCombatSnapshotV1, titanDifficulteOkV1, titanFound, titanGate, transformAdventureItemV1, useMove69AdventureV1, useUnlockItem } from "./idle-adventure-combat.js";
import { repliZonesFermeesV1, rollKill, unlockedZone } from "./idle-adventure-butin.js";
export { IDLE_ADVENTURE_MOB_BESTIARY_V1, IDLE_ADVENTURE_MOB_CATALOG_V1, IDLE_ADVENTURE_TITANS, IDLE_ADVENTURE_ZONES, idleAdventureBestiaryAverageV1 } from "./idle-adventure-zones.js";
export { IDLE_ADVENTURE_BOOSTS, IDLE_ADVENTURE_ITEM_CATALOG_V1, IDLE_ADVENTURE_ITEM_EVOLUTIONS_V1, IDLE_ADVENTURE_ITEM_SETS_V1, IDLE_ADVENTURE_SETS, IDLE_ADVENTURE_SPECIALS, IDLE_ADVENTURE_WIKI_ITEM_IDS_V1, NOMS_SETS_EN_V1, NOMS_SETS_OBJETS_EN_V1, SET_ITEM_NAMES_EN_V1, SET_ITEM_NAMES_V1, SPECIALS_EN_V1, idleAdventureItemStatsMaxV1 } from "./idle-adventure-sets.js";
export { createIdleAdventureStateV47, idleAdventureAddItemV1, idleAdventureApplyBoostItemV1, idleAdventureBoostRoomV1, idleAdventureBoostV1, idleAdventureCubeBoostItemV1, idleAdventureEquipItemV1, idleAdventureInventoryCapacityV1, idleAdventureInventoryUsedV1, idleAdventureItemBaseValueV1, idleAdventureMergeItemsV1, idleAdventureNiveauEstMaxV1, idleAdventureRecordItemV1, idleAdventureSpecialItemV1, idleAdventureSyncInventorySlotsV1, idleAdventureUnequipItemV1, normalizeIdleAdventureStateV47 } from "./idle-adventure-objets.js";
export { IDLE_SECOND_WEAPON_SLOTS_V1, idleAdventureItemAtLevelV47, idleAdventureMergeLevelV47 } from "./idle-adventure-inventaire.js";
export { IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2, idleAdventureDropChanceV2, idleAdventureMobAttackFactorV1, idleAdventureMobBestiaryEntryV1, idleAdventureMobTypeV1, monsterHpMaxForZoneV1WithMob, versZoneSureV1, zoneNormalePlusAvanceeV1 } from "./idle-adventure-butin.js";
export { IDLE_ADVENTURE_CUBE_TIERS_V1, WALDERP_HIDE_PANELS_V147, advanceAdventureZoneAutoFarmOfflineV1, advanceTitanAutoKillV1, annulerVictoireTitanV1, idleAdventureCubeTierV1, idleAdventureSetRewardProductV1, idleAdventureTitanCooldownMsV1, titanAutoKillPossibleV1 } from "./idle-adventure-combat.js";
export const IDLE_ADVENTURE_V47="ADVENTURE-V47-NGU-EARLY";

/* État partagé du module (variables « let » d'origine), converti en objet pour que les fichiers du découpage puissent le lire ET l'écrire. */
export const __advCtx = {
  SETS_ENTREES_V1: null,
  SETS_OBJETS_ENTREES_V1: null,
  SETS_TOUTES_ENTREES_V1: null
};



/* groupe + rang d'un objet : { groupe, rang (zone ou titan), titanId, zoneNom } */
export const IDLE_ADVENTURE_COFFRE_PLACE_V1=Object.freeze((()=>{
  const titans=[...IDLE_ADVENTURE_TITANS].sort((a,b)=>N(a.boss)-N(b.boss));
  const rangTitan={};
  titans.forEach((t,i)=>{rangTitan[t.id]=i;});
  const titanDe={};
  for(const t of titans)for(const id of(IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1[t.id]||[]))if(!(id in titanDe))titanDe[id]=t.id;
  const zoneParId=Object.fromEntries(IDLE_ADVENTURE_ZONES.map((z,i)=>[z.id,{i,nom:z.name}]));
  const zoneParSet={};
  IDLE_ADVENTURE_ZONES.forEach((z,i)=>{if(z.set&&!(z.set in zoneParSet))zoneParSet[z.set]={i,nom:z.name};});
  const place={};
  for(const[id,def]of Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)){
    let groupe="autre",rang=0,titanId="",zoneNom="";
    if(def.kind==="equipment"){
      const z=zoneParSet[def.set];
      const src=SETS[def.set]&&SETS[def.set].source;
      if(z){groupe="zone";rang=z.i;zoneNom=z.nom;}
      else if(src&&src in rangTitan){groupe="titan";rang=rangTitan[src];titanId=src;}
    }else if(def.kind==="special"){
      if(id in titanDe){groupe="titan";titanId=titanDe[id];rang=rangTitan[titanId];}
      else if(def.zone&&zoneParId[def.zone]){groupe="zone";rang=zoneParId[def.zone].i;zoneNom=zoneParId[def.zone].nom;}
      else if(IDLE_ADVENTURE_COFFRE_COEURS_V1.includes(id)){groupe="coeur";rang=IDLE_ADVENTURE_COFFRE_COEURS_V1.indexOf(id);}
      else if(IDLE_ADVENTURE_COFFRE_LOOTY_V1.includes(id)){groupe="looty";rang=IDLE_ADVENTURE_COFFRE_LOOTY_V1.indexOf(id);}
      else if(IDLE_ADVENTURE_COFFRE_PENDENTIFS_V1.includes(id)){groupe="pendentif";rang=IDLE_ADVENTURE_COFFRE_PENDENTIFS_V1.indexOf(id);}
    }
    place[id]=Object.freeze({groupe,rang,titanId,zoneNom});
  }
  return place;
})());


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
 * Perf (Norman, 2026-10-02) : cette fonction normalise l'état d'Aventure ENTIER (copie profonde, nettoyage de chaque objet du sac, vérification des sets) alors
 * qu'elle n'en lit que l'équipement ; une synchro l'appelait ~460 fois (coût proportionnel au sac : ~3 s avec 450 objets). Mémo EXACT : la clé est le contenu
 * complet de l'état reçu (JSON) -- identique => même résultat (fonction pure de cet état), le moindre octet de différence => recalcul. Réutilisation limitée
 * à une opération du moteur (5 s au plus hors moteur), et une COPIE est renvoyée (les appelants peuvent modifier l'objet). SOREAL_IDLE_VERIF_BONUS=1 recalcule à chaque réutilisation et échoue si les
 * deux diffèrent (voir idle-bonus-memo-v1.test.mjs).
 */
const __equipStatsMemoV1={cle:"",valeur:null,at:0};
export function idleAdventurePerfCompteursV1(){return{...__perfCompteursV1}}
export function idleAdventurePerfRazV1(){__perfCompteursV1.normalisations=0;__perfCompteursV1.calculsEquipement=0}
/* Durée de vie du mémo = UNE opération du moteur : remis à zéro au début de chaque opération (voir runSorealIdleOperation). Le délai ci-dessous n'est qu'un filet pour les appels hors moteur. */
export function idleAdventureMemoNouvelleRequeteV1(){__equipStatsMemoV1.valeur=null}
export function idleAdventureEquipmentStatsV47(raw){
  let cle=null;
  try{cle=raw&&typeof raw==="object"?JSON.stringify(raw):null}catch(_e){cle=null}
  const maintenant=Date.now();
  if(cle!==null&&__equipStatsMemoV1.valeur!==null&&__equipStatsMemoV1.cle===cle&&maintenant-__equipStatsMemoV1.at<=5000){
    const copie=structuredClone(__equipStatsMemoV1.valeur);
    if(typeof process!=="undefined"&&process.env&&process.env.SOREAL_IDLE_VERIF_BONUS==="1"){
      if(JSON.stringify(idleAdventureEquipmentStatsCalculV47(raw))!==JSON.stringify(copie))throw new Error("SOREAL_IDLE_EQUIP_MEMO_DIVERGENT");
    }
    return copie;
  }
  const valeur=idleAdventureEquipmentStatsCalculV47(raw);
  if(cle!==null){
    try{__equipStatsMemoV1.valeur=structuredClone(valeur);__equipStatsMemoV1.cle=cle;__equipStatsMemoV1.at=maintenant}catch(_e){__equipStatsMemoV1.valeur=null}
  }
  return valeur;
}
/*
 * Équipement EFFECTIF (Norman, 2026-10-17 : « j'ai lancé le défi sans équipement, mais j'ai toujours mes stats d'équipement ») : tant que le No Equipment Challenge est actif, aucune pièce portée ne compte (ni Power, ni
 * Toughness, ni PV, ni Regen, ni spéciaux, ni Cube), nulle part : combat, titans, ITOPOD, quêtes. Un seul point d'entrée pour tout le moteur.
 */
export function idleEquipementEffectifV1(state){
  if(state&&state.challenge&&state.challenge.active==="noEquipment")return{power:0,toughness:0,hp:0,regen:0,specials:{},specialsByType:{},cubePowerContribution:0,cubeToughnessContribution:0};
  return idleAdventureEquipmentStatsV47(state&&state.adventure);
}
function idleAdventureEquipmentStatsCalculV47(raw){
  __perfCompteursV1.calculsEquipement+=1;
  const s=normalizeIdleAdventureStateV47(raw);
  const ids=[s.equipment.head,s.equipment.chest,s.equipment.legs,s.equipment.boots,s.equipment.weapon,...(s.equipment.accessories||[])].filter(Boolean);
  const equipped=s.inventory.filter(x=>ids.includes(x.id));
  /* Seconde arme : ses stats comptent à hauteur de dualWieldRatio (0,05 x niveaux des souhaits 28 et 45). */
  const arme2=s.equipment.weapon2&&!ids.includes(s.equipment.weapon2)?s.inventory.find(x=>x.id===s.equipment.weapon2):null;
  const ratio2=arme2?Math.min(1,Math.max(0,N(s.dualWieldRatio))):0;
  const basePower=equipped.reduce((a,x)=>a+N(x.power),0)+ratio2*N(arme2&&arme2.power)+N(s.setRewards.adventurePower);
  const baseToughness=equipped.reduce((a,x)=>a+N(x.toughness),0)+ratio2*N(arme2&&arme2.toughness)+N(s.setRewards.adventureToughness);
  /*
   * hp/regen par objet (2026-09-15, Norman : "les items qu'on loot...
   * doivent procurer de la regen de vie") — dérivés directement de
   * x.power/x.toughness (×3/×0.03, règle du moteur NGU vérifiée sur ~90
   * objets, voir SET_ITEM_STATS_V1) plutôt que lus depuis x.hp/x.regen :
   * ainsi TOUT objet déjà en inventaire (créé avant ce correctif, donc
   * sans ces champs) en bénéficie immédiatement, sans migration de save.
   */
  const equippedHp=equipped.reduce((a,x)=>a+N(x.power)*3,0)+ratio2*N(arme2&&arme2.power)*3;
  const equippedRegen=equipped.reduce((a,x)=>a+N(x.toughness)*.03,0)+ratio2*N(arme2&&arme2.toughness)*.03;
  /*
   * La stat d'équipement doit rester canonique et indépendante de la zone.
   * Exemple réel signalé : un pantalon +0,03 HP Regen affichait +0,15 en
   * Safe Zone parce que le ×5 était appliqué ici AVANT la construction de
   * la fiche. Le multiplicateur de repos est un effet de zone, pas une
   * propriété de l'équipement : il est désormais appliqué uniquement par
   * le tick client de repos.
   */
  const specialsByType=idleAdventureSpecialsByTypeV1(equipped);
  if(ratio2>0)for(const [type,value] of Object.entries(idleAdventureSpecialsByTypeV1([arme2])))specialsByType[type]=N(specialsByType[type])+ratio2*N(value);
  const cubePowerContribution=idleAdventureCubeSoftcapV1(s.cube.power,basePower);
  const cubeToughnessContribution=idleAdventureCubeSoftcapV1(s.cube.toughness,baseToughness);
  return{
    power:basePower+cubePowerContribution,
    toughness:baseToughness+cubeToughnessContribution,
    cubePowerContribution,
    cubeToughnessContribution,
    hp:equippedHp+N(s.setRewards.adventureHp),
    regen:equippedRegen+N(s.setRewards.adventureRegen),
    special:equipped.reduce((a,x)=>a+N(x.special),0)+ratio2*N(arme2&&arme2.special),
    specialsByType,
    specials:{
      /* 2026-09-23 : tous les types agrégés (Resource 3, Wish/Hack/Wandoos/Augment Speed, Move Cooldowns...) sont exposés, pas seulement la liste historique ci-dessous. */
      ...specialsByType,
      dropChancePct:N(s.setRewards.drop)*100+idleAdventureCubeTierV1(s.cube).dropChancePct+N(specialsByType.dropChancePct),
      respawnReductionPct:N(s.setRewards.respawn)*100+N(specialsByType.respawnReductionPct),
      chargeMultiplier:Math.max(1,N(s.setRewards.chargeMultiplier,1)),
      idleAttack:Boolean(s.setRewards.idleAttack),
      /* Skills > Idle Mode : x1,2 (x1,5 avec le set Spoopy), majoré par les No Equipment Challenges Sadistic (x1,2 au total : 1,5 -> 1,8). */
      idleAttackMultiplier:(s.setRewards.idleAttack?1.5:1.2)*(1+Math.max(0,N(s.idleAttackBonus))),
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
export function snapshotItemAdventureV1(o){
  const d=defById(o&&o.definitionId);
  const base=d?.kind==="set"
    ?idleAdventureBaseStatsV1(d.set,d.slot)
    :(d?.kind==="special"
      ?idleAdventureSpecialBaseStatsV1(d.id)
      :{baseP:0,baseT:0,baseS:0});
  const specialsPiece=d?.kind==="set"||d?.kind==="special"?idleAdventureSpecialsListV1(o).map(({type,value,max})=>({type,value,max})):[];
  const specialType=d?.kind==="special"?SPECIALS[d.id]?.sType:(specialsPiece.length?specialsPiece[0].type:undefined);
  return{
    ...o,
    specialsAll:specialsPiece.length?specialsPiece:undefined,
    maxed:idleAdventureNiveauEstMaxV1(o&&o.level),
    fullyMaxed:idleAdventureObjetPleinementMaxeV1(o),
    boostManque:idleAdventureBoostManquantV1(o),
    basePower:base.baseP,
    baseToughness:base.baseT,
    baseHp:base.baseP*3,
    baseRegen:base.baseT*.03,
    specialType:specialType||undefined,
    baseSpecial:base.baseS||0,
    locked:Boolean(o&&o.locked)
  };
}
export function idleAdventureSnapshotV47(raw,bosses=0,difficulty,difficultyPeaks){const s=normalizeIdleAdventureStateV47(raw);repliZonesFermeesV1(s,bosses,difficulty,difficultyPeaks);return{version:s.version,revision:Math.max(0,I(s.revision)),visualSource:"avatar-level",selectedZone:s.selectedZone,retourSafe:s.retourSafe,lastCombatZone:s.lastCombatZone,zones:IDLE_ADVENTURE_ZONES.map(z=>({...z,unlocked:unlockedZone(z,bosses,difficulty,difficultyPeaks),visual:{source:"avatar-level",level:I(z.avatarLevel,1),fallback:"emoji"}})),/*
 * Bug trouvé en vérifiant le vrai NGU (Norman, 2026-09-10) : "je ne
 * pense pas qu'ils soient visibles dans un menu dès le début" —
 * progressionUnlocked ne vérifiait QUE la chaîne de prérequis entre
 * titans (titanGate), jamais le vrai seuil "boss #X requis" du wiki NGU
 * (ex. GRB=boss 58) — un joueur niveau 1 voyait donc GRB avec un bouton
 * "Affronter" actif, qui échouait ensuite avec TITAN_VERROUILLE côté
 * serveur au clic. Un titan n'est réellement accessible que si les DEUX
 * conditions sont vraies.
 */
titans:IDLE_ADVENTURE_TITANS.filter(t=>!t.secret||I(s.titans[t.id]?.kills)>0||(I(bosses)>=I(t.boss)&&titanGate(s,t))).map(t=>({...t,progressionUnlocked:I(bosses)>=I(t.boss)&&titanGate(s,t)&&titanDifficulteOkV1(t,difficulty),visual:{source:"avatar-level",level:I(t.avatarLevel,1),fallback:"emoji"},state:X(s.titans[t.id]||{kills:0,nextAt:0}),...(I(bosses)>=I(t.boss)&&titanGate(s,t)&&titanDifficulteOkV1(t,difficulty)?{combat:titanCombatSnapshotV1(t.id),capacites:IDLE_TITAN_COMBAT_V1[t.id]?.capacites||[],nomComplet:IDLE_TITAN_COMBAT_V1[t.id]?.nom||t.name}:{})})),/*
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
inventory:X(s.inventory).map(snapshotItemAdventureV1),trash:s.trash?snapshotItemAdventureV1(s.trash):null,coffreSlots:idleAdventureCoffreSlotsV1(s).filter(x=>x&&x.decouvert),equipment:X(s.equipment),itemList:Object.fromEntries(Object.entries(X(s.itemList)).map(([k,v])=>[k,{...v,maxed:idleAdventureNiveauEstMaxV1(v?.maxLevel),fullyMaxed:Boolean(v?.fullyMaxed)}])),itemCatalog:idleAdventureCatalogueObjetsConnusV1(s),setCatalog:idleAdventureCatalogueSetsConnusV1(s),completedSets:X(s.completedSets),setRewards:X(s.setRewards),unlockItems:X(s.unlockItems),unlockFlags:X(s.unlockFlags),skillState:X(s.skillState),cube:X(s.cube),cubeTier:idleAdventureCubeTierV1(s.cube),fight:X(s.fight),inventorySlots:X(syncInventorySlotsAdventureV2(s)),inventoryCapacity:inventoryCapacityAdventureV1(s),inventoryUsed:inventoryUsedAdventureV1(s),accessorySlotsCapacity:accessorySlotsCapacityAdventureV1(s),theEnd:idleTheEndSnapshotV1(s),secondWeaponUnlocked:secondeArmeDebloqueeAdventureV1(s),dualWieldRatio:N(s.dualWieldRatio),stats:idleAdventureEquipmentStatsV47(s)}}
/*
 * Anti-spoil (règle n°2 d'AGENTS.md, audit du 2026-10-10, IDLE-AUDIT-GP-001) : le catalogue d'objets et celui des sets ne contiennent que ce que le joueur connaît : objets déjà vus (itemList), possédés (sac, coffre, corbeille)
 * et les sets dont il a au moins une pièce ou qu'il a complétés. Avant, un joueur neuf recevait les 406 objets et les 47 sets du jeu (noms, statistiques, bonus, récompenses de complétion).
 */
function idleAdventureDefinitionsConnuesV1(s){
  const ids=new Set(Object.keys(X(s.itemList)));
  const ajoute=(it)=>{if(it&&it.definitionId)ids.add(String(it.definitionId));};
  (Array.isArray(s.inventory)?s.inventory:[]).forEach(ajoute);
  ajoute(s.trash);
  (Array.isArray(s.coffreSlots)?s.coffreSlots:[]).forEach((x)=>ajoute(x&&x.item));
  return ids;
}
function idleAdventureCatalogueObjetsConnusV1(s){
  const ids=idleAdventureDefinitionsConnuesV1(s);
  return Object.fromEntries(Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1).filter(([id])=>ids.has(id)));
}
function idleAdventureCatalogueSetsConnusV1(s){
  const ids=idleAdventureDefinitionsConnuesV1(s);
  const sets=new Set(Object.keys(X(s.completedSets)));
  for(const id of ids){const def=IDLE_ADVENTURE_ITEM_CATALOG_V1[id];if(def&&def.set)sets.add(String(def.set));}
  return Object.fromEntries(Object.entries(SETS).filter(([id])=>sets.has(id)).map(([id,d])=>[id,{id,name:d.name,source:d.source,slots:[...d.slots],reward:X(d.reward)}]));
}
export function applyIdleAdventureActionV47(raw,p={},ctx={},t=Date.now()){const s=normalizeIdleAdventureStateV47(raw),a=String(p.action||p.mode||"");if(ctx&&ctx.bosses!==undefined&&a!=="selectZone")repliZonesFermeesV1(s,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks);const clientMutationId=String(p.clientMutationId||"").slice(0,160);if(clientMutationId){const deja=s.recentClientMutations.find(x=>x&&String(x.id)===clientMutationId);if(deja){syncInventorySlotsAdventureV2(s);return{state:s,result:deja.result==null?deja.result:X(deja.result),duplicate:true}}}let result;if(a==="selectZone"){const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===p.zone);if(!z||!unlockedZone(z,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks))throw Error("ZONE_VERROUILLEE");/* Un combat de TITAN se livre en Zone sûre : choisir une zone, Zone sûre comprise, l'arrête (Norman, 2026-10-12 : « j'ai choisi Zone sûre et le combat contre le titan continuait »). Le délai du titan n'est pas touché, comme pour une défaite. */if(s.fight.active&&(s.fight.zone!==z.id||s.fight.titanId)){/* Fuite devant un titan (bouton Aventure, Zone sûre…) : annoncée dans « En direct » (Norman, 2026-10-14). */if(s.fight.titanId)fluxTitanV1(s,"flees",s.fight.titanId);s.fight=X(base().fight)}s.selectedZone=z.id;result={zone:z.id}}else if(a==="addItem"){const d=defById(p.definitionId);if(!d)throw Error("DEFINITION_INVALIDE");result=add(s,d.kind==="set"?item(`i${s.serial++}`,d.set,d.slot,p.level):special(d.id,p.level))}else if(a==="merge")result=merge(s,String(p.a),String(p.b));else if(a==="equip"){/* No Equipment Challenge (page Challenges) : « No equipment bonuses for you! » -- pendant le défi on ne peut rien équiper. *//* Norman (2026-10-17) : pendant le défi on PEUT mettre et enlever des pièces ; elles ne comptent simplement pas (voir idleEquipementEffectifV1). */result=equip(s,String(p.id),String(p.slot))}else if(a==="unequip")result=unequip(s,String(p.id),p.targetIndex);else if(a==="boost"&&p.toCube===true)result=cube(s,String(p.boostId),ctx);else if(a==="boost")result=applyBoost(s,String(p.boostId),String(p.targetId),ctx);else if(a==="cube")result=cube(s,String(p.boostId),ctx);else if(a==="discard")result=discard(s,String(p.id||p.itemId));else if(a==="setLock")result=setLockAdventureV1(s,String(p.id||p.itemId),p.locked);else if(a==="trashPut")result=trashPutAdventureV1(s,String(p.id||p.itemId));else if(a==="trashRecover")result=trashRecoverAdventureV1(s);else if(a==="coffreDeposer")result=coffreDeposer(s,String(p.id||p.itemId));else if(a==="coffreRetirer")result=coffreRetirer(s,String(p.id||p.itemId));else if(a==="reorderInventory")result=reorderInventoryAdventureV2(s,String(p.sourceId||p.id),String(p.targetId||""),p.targetIndex);else if(a==="zoneKill")result=rollKill(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="startZoneFight")result=startZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats,restHp:p.restHp}));else if(a==="startTitanFight")result=startTitanFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats,restHp:p.restHp}),t,String(p.titan||p.titanId),String(p.difficulty||""));else if(a==="resolveZoneFight")result=resolveZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats,fightTitanId:p.titanId,fightTitanStartedAt:p.titanStartedAt}),t);else if(a==="loseZoneFight")result=loseZoneFight(s,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats,fightTitanId:p.titanId,fightTitanStartedAt:p.titanStartedAt}));else if(a==="titan")result=titan(s,String(p.titan||p.titanId),Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}),t,String(p.difficulty||""));else if(a==="titanFound")result=titanFound(s,String(p.titan||p.titanId),t);else if(a==="consumeUnlock")result=consume(s,String(p.item||p.itemId));else if(a==="useUnlockItem")result=useUnlockItem(s,String(p.itemId||p.id||""));else if(a==="consumeSkillItem")result=consumeAdventureSkillItemV1(s,String(p.id||p.itemId));else if(a==="transformAdventureItem")result=transformAdventureItemV1(s,String(p.id||p.itemId),ctx);else if(a==="setBeastMode")result=setBeastModeAdventureV1(s,p.enabled);else if(a==="setAutoKillTitans")result=setAutoKillTitansV1(s,p.enabled);else if(a==="setAutoKillTitan")result=setAutoKillTitanV1(s,p.id||p.titan,p.enabled,Object.assign({},ctx,{stats:p.stats||ctx.stats||ctx.adventureStats}));else if(a==="useMove69")result=useMove69AdventureV1(s);else if(a==="theEndPlay")result={endings:idleTheEndPlayV1(s,t).endings};else throw Error("ACTION_AVENTURE_INCONNUE");s.revision=Math.max(0,I(s.revision))+1;if(clientMutationId){s.recentClientMutations.push({id:clientMutationId,result:result==null?result:X(result),revision:s.revision});if(s.recentClientMutations.length>64)s.recentClientMutations=s.recentClientMutations.slice(-64)}syncInventorySlotsAdventureV2(s);return{state:s,result}}
