/*
 * Aventure : capacité d'inventaire, fusion, équipement, boosts, Cube, Coffre et corbeille (audit d'architecture, 2026-10-16 : découpage de idle-adventure-v47.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { SET_ITEM_SPECIALS_V1 } from "./idle-adventure-set-specials-v1.js";
import { C, I, MAX, N, X } from "./idle-adventure-base.js";
import { base, cleanItem, idleAdventureApplySpecialPointsV1, idleAdventureBaseStatsV1, idleAdventureNiveauEstMaxV1, idleAdventureObjetPleinementMaxeV1, idleAdventureSetSpecialsV1, idleAdventureSpecialBaseStatsV1, idleAdventureSpecialsCappedV1, idleAdventureSpecialsRoomPointsV1, item, rafraichirAutoPortraitSetV1, record, special } from "./idle-adventure-objets.js";
import { IDLE_ADVENTURE_ITEM_CATALOG_V1, IDLE_ADVENTURE_SPECIAL_ORDRE_V1, NOMS_SETS_EN_V1, SET_ITEM_NAMES_EN_V1, SPECIALS_EN_V1, defById, idleAdventureSlotRankV1 } from "./idle-adventure-sets.js";
import { fluxBoostV1 } from "./idle-adventure-combat.js";
import { IDLE_ADVENTURE_COFFRE_PLACE_V1, snapshotItemAdventureV1 } from "./idle-adventure-v47.js";

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

export function inventoryCapacityAdventureV1(s){return INVENTORY_CAPACITY_BASE_V1+Math.max(0,I(s&&s.bonusSlots&&s.bonusSlots.inventory))}

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

/*
 * Seconde arme (Dual Wielding, 2026-09-25) : pages Wishes (28 et 45), Builds (« You gain access to a 2nd weapon slot thanks to the Dual Wielding
 * Wish ») et Evil Troll Challenge 4 / 6. « Each level will yield +5% of the 2nd weapon's stats to your overall equipment bonus » (souhait 28) et
 * « an additional 5% effectiveness to the 2nd weapon slot » (souhait 45) : ratio = 0,05 x (niveau 28 + niveau 45), maximum 1 (source tierce
 * player.ts, identique), synchronisé dans state.dualWieldRatio par le moteur NGU. Le ratio s'applique à toutes les stats de l'objet (Power,
 * Toughness, HP, Regen, Special, Specials). Les 9 secondes armes des sets tardifs (type Weapon sur le wiki, slot propre dans SOREAL) ne
 * s'équipent QUE dans ce slot ; n'importe quelle arme y va aussi. Le Bloody Cleaver / les set bonus ne comptent que l'arme principale.
 */
export const IDLE_SECOND_WEAPON_SLOTS_V1=Object.freeze(["baguette","vinylShard","apple","hammer","shotgun","tulip","cutlass","rocket","deathstick"]);

function estArmeAdventureV1(o){return Boolean(o)&&(o.slot==="weapon"||IDLE_SECOND_WEAPON_SLOTS_V1.includes(o.slot))}

export function secondeArmeDebloqueeAdventureV1(s){return N(s&&s.dualWieldRatio)>0}

export function accessorySlotsCapacityAdventureV1(s){return ACCESSORY_SLOTS_BASE_V1+Math.max(0,I(s&&s.bonusSlots&&s.bonusSlots.accessory))}

function equippedIdsAdventureV1(s){
  const ids=new Set();
  ["head","chest","legs","boots","weapon","weapon2"].forEach(slot=>{if(s.equipment[slot])ids.add(s.equipment[slot])});
  (Array.isArray(s.equipment.accessories)?s.equipment.accessories:[]).forEach(id=>{if(id)ids.add(id)});
  return ids;
}

export function inventoryUsedAdventureV1(s){
  const equipped=equippedIdsAdventureV1(s);
  return s.inventory.filter(x=>!equipped.has(x.id)).length;
}

/*
 * Inventory layout V162 — l'ordre visuel du sac est une donnée persistée.
 * Les trous sont conservés et deux cases occupées peuvent être échangées.
 */
export function syncInventorySlotsAdventureV2(s){
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
  /*
   * Slots d'automerge (page Inventory, « Automerge Slots » : « Each new slot
   * uses the next inventory space starting from the top left of page 1 [...]
   * no items will drop in these slots ») : les s.mergeSlots premières cases
   * (nombre calculé par idle-inventory-auto-v1.js) ne reçoivent un nouvel
   * objet qu'en dernier recours ; le joueur y dépose lui-même ce qu'il veut.
   */
  const mergeSlots=Math.max(0,Math.min(cap,I(s.mergeSlots)));
  for(const id of bagIds){
    if(vus.has(id))continue;
    let libre=slots.indexOf("",mergeSlots);
    if(libre<0)libre=slots.indexOf("");
    if(libre<0)break;
    slots[libre]=id;
    vus.add(id);
  }
  s.inventorySlots=slots;
  return slots;
}

export function reorderInventoryAdventureV2(s,sourceId,targetId,targetIndex){
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

/* Slots d'automerge encore vides : un nouvel objet ne peut jamais y tomber (voir syncInventorySlotsAdventureV2). */
function mergeSlotsVidesAdventureV1(s){
  const k=Math.max(0,I(s&&s.mergeSlots));
  if(!k)return 0;
  const equipped=equippedIdsAdventureV1(s);
  const sac=new Set(s.inventory.filter(x=>x&&!equipped.has(x.id)).map(x=>String(x.id)));
  const cases=Array.isArray(s.inventorySlots)?s.inventorySlots.slice(0,k):[];
  return Math.max(0,k-cases.filter(id=>id&&sac.has(String(id))).length);
}

export function add(s,o){if(inventoryUsedAdventureV1(s)>=inventoryCapacityAdventureV1(s)-mergeSlotsVidesAdventureV1(s))return null;o=cleanItem(o);if(!o)throw Error("OBJET_INVALIDE");if(!o.id||s.inventory.some(x=>x.id===o.id))o.id=`i${s.serial++}`;s.inventory.push(o);record(s,o);return o}

export function idleAdventureMergeLevelV47(a,b){return C(I(a)+I(b)+1,0,MAX)}

export function idleAdventureItemAtLevelV47(definitionId,level=0,id="preview"){const d=defById(definitionId);if(!d)throw Error("DEFINITION_INVALIDE");return d.kind==="set"?item(id,d.set,d.slot,level):special(d.id,level)}

/*
 * Fidèle au wiki (voir commentaire ci-dessus idleAdventureBaseStatsV1) :
 * niveau = somme+1 (inchangé), chaque stat = MAX entre les deux objets —
 * jamais un recalcul de formule, jamais une perte de boost déjà investi
 * sur A OU B (contrairement à l'ancien remake() qui ignorait B).
 */
export function merge(s,a,b){
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

  for(const slot of ["head","chest","legs","boots","weapon","weapon2"]){
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
  if(Array.isArray(A.specialExtra)||Array.isArray(B.specialExtra)){const n=Math.max(A.specialExtra?.length||0,B.specialExtra?.length||0);A.specialExtra=Array.from({length:n},(_,i)=>Math.max(N(A.specialExtra?.[i]),N(B.specialExtra?.[i])))}
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
export function equip(s,id,slot){const o=s.inventory.find(x=>x.id===id);if(!o||o.kind==="boost"||o.consumable||(o.kind==="cube"&&s.cube.unlocked))throw Error("EQUIPEMENT_INVALIDE");if(slot==="accessory"){if(IDLE_SECOND_WEAPON_SLOTS_V1.includes(o.slot))throw Error("SLOT_INVALIDE");if(!s.equipment.accessories.includes(id)){
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
}return}
if(slot==="weapon2"){if(!secondeArmeDebloqueeAdventureV1(s))throw Error("SECONDE_ARME_VERROUILLEE");if(!estArmeAdventureV1(o))throw Error("SLOT_INVALIDE");if(s.equipment.weapon===id)s.equipment.weapon="";s.equipment.weapon2=id;return}
if(!["head","chest","legs","boots","weapon"].includes(slot)||o.slot!==slot)throw Error("SLOT_INVALIDE");if(s.equipment.weapon2===id)s.equipment.weapon2="";s.equipment[slot]=id;rafraichirAutoPortraitSetV1(s)}

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
export function unequip(s,id,targetIndex){
  const o=s.inventory.find(x=>x.id===id);
  if(!o)throw Error("OBJET_INTROUVABLE");

  let trouve=false;

  for(const slot of ["head","chest","legs","boots","weapon","weapon2"]){
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
/*
 * Page Boost : puissance d'un boost = complétions (additives, +2 % par boost maxé, 1,78 au maximum) x perks x quirks x
 * 1,2 (set Badly Drawn) x 1,2 (set Construction) -- les deux sets sont MULTIPLICATIFS, pas additifs aux complétions.
 */
function boostEffectivenessFactorV1(s){
  const completions=Math.min(39,I(s.setRewards.boostCompletions))*.02;
  return(1+completions)*(s.completedSets.badly?1.2:1)*(s.completedSets.construction?1.2:1);
}

export function applyBoost(s,boostId,targetId,ctx){
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
  if(type==="special"){
    const cible=defById(o.definitionId);
    const specialPiece=cible?.kind==="set"&&Boolean(idleAdventureSetSpecialsV1(cible.set,cible.slot));
    if(cible?.kind!=="special"&&!specialPiece)throw Error("BOOST_SPECIAL_CIBLE_INVALIDE");
  }
  /*
   * V210 — un objet réellement terminé ne doit jamais avaler un boost
   * inutile. Avant ce garde, Math.min(cap, actuel+boost) gardait la même
   * valeur mais le boost était quand même supprimé de l'inventaire.
   */
  if(idleAdventureObjetPleinementMaxeV1(o)){
    throw Error("OBJET_DEJA_MAXE");
  }
  /* 2026-09-23 (audit) : perks/quirks "Boosted Boosts" / "Beasted Boosts" (boostPowerMultiplier), calculés mais jamais lus. */
  const added=N(b.strength)*boostEffectivenessFactorV1(s)*Math.max(1,N(ctx&&ctx.boostPowerMultiplier,1));
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
    /* Special Boost (2026-09-25) : des POINTS, versés dans les Specials de l'objet dans l'ordre de la fiche (voir idleAdventureSpecialsDefsV1). */
    if(idleAdventureSpecialsCappedV1(o)){
      if(!(idleAdventureSpecialsRoomPointsV1(o)>1e-9))throw Error("BOOST_STAT_DEJA_MAX");
      idleAdventureApplySpecialPointsV1(o,added);
    }else{
      o[type]=N(o[type])+added;
    }
  }
  s.inventory=s.inventory.filter(x=>x.id!==b.id);
  record(s,o);
  fluxBoostV1(s,"piece",o.definitionId);
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
export function cube(s,boostId,ctx){
  const b=s.inventory.find(x=>x.id===boostId);
  if(!b||b.kind!=="boost"||!["power","toughness","special"].includes(b.boostType))throw Error("CUBE_BOOST_INVALIDE");
  /*
   * V183 — le wiki définit le gain Cube à partir de la valeur TOTALE du
   * boost. Le +2% de chaque boost maxé fait partie de cette valeur totale,
   * au même titre que Badly Drawn/Construction déjà stockés dans le même
   * multiplicateur boostEffectiveness.
   */
  /* Perk « Improved Cube Boosting! » : conversion à 2 % au lieu de 1 % ; souhait 110 : +5 % d'efficacité par niveau (x2 au niveau 20). */
  const taux=Math.max(.01,N(ctx&&ctx.cubeBoostRate,.01));
  /*
   * Seconde passe 2026-09-24 : page Boost, « The total value of a boost item is calculated as the product of : completion
   * bonus, Boosted Boosts perks I-V, Beasted Boosts quirks I-IV, Badly Drawn, Construction » ; page Infinity Cube :
   * « A Power and Toughness Boost will award you 1% of its stats ». Les perks/quirks (ctx.boostPowerMultiplier) manquaient
   * ici alors que la valeur totale les contient (jusqu'a x15 perdu).
   */
  const valeur=N(b.strength)*boostEffectivenessFactorV1(s)*Math.max(1,N(ctx&&ctx.boostPowerMultiplier,1))*Math.max(1,N(ctx&&ctx.cubeBoostEffectiveness,1));
  if(b.boostType==="special"){
    s.cube.power+=valeur*taux/2;
    s.cube.toughness+=valeur*taux/2;
  }else{
    s.cube[b.boostType]+=valeur*taux;
  }
  s.inventory=s.inventory.filter(x=>x.id!==b.id);
  fluxBoostV1(s,"cube","");
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
export function idleAdventureCubeSoftcapV1(cubeStat,base){const b=Math.max(0,N(base)),c=Math.max(0,N(cubeStat));return Math.min(c,b)+Math.sqrt(Math.max(0,c-b))}

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
/*
 * 2026-09-25 (Norman : « dans le Coffre au trésor, il faut un emplacement pour le Tutorial Cube quand il est maxxé ») : le Tutorial Cube avait
 * sa propre case, après les cases d'équipement. Retiré le 2026-09-27 (Norman revient sur ce choix : « il ne doit même pas y avoir la place pour
 * le tutorial cube ») -- IDLE_ADVENTURE_COFFRE_SPECIAUX_V1 (et la case dédiée qu'elle générait) a été retirée ; le Coffre n'accepte plus que les
 * objets « equipment » du catalogue, comme avant le 2026-09-25.
 */
/*
 * Norman (2026-10-01) : « On ne peut pas ranger Tuba of Time dans le coffre. Chaque objet qui peut être monté level 100 doit y avoir sa
 * place. Rangé par zone. » Le Coffre accepte donc aussi les objets « special » qui se portent (accessoires, armes, têtes, torses...) :
 * Tuba of Time, Cheese Grater, Looty, pendentifs... Restent exclus : le Tutorial Cube (kind "cube", retiré à la demande de Norman),
 * les consommables et les objets de quête (slot "special" / "consumable"), qui ne se montent pas au niveau 100.
 */
function idleAdventureCoffreAccepteV1(definitionId){
  const def=IDLE_ADVENTURE_ITEM_CATALOG_V1[definitionId];
  if(!def)return false;
  if(def.kind==="equipment")return true;
  /* Tout objet qui peut être monté au niveau 100 a sa place (Norman, 2026-10-25 : « je ne vois pas l'emplacement pour le Mysterious Red Liquid ») : les consommables à drapeau de niveau max (Red Liquid, Purple Liquid) y entrent aussi. */
  return def.kind==="special"&&(def.slot!=="consumable"||Boolean(SPECIALS_EN_V1[definitionId]?.maxFlag));   /* maxFlag vit dans SPECIALS, pas dans le catalogue d'objets (le Liquide rouge n'avait donc jamais sa case) */
}

/*
 * Norman (2026-10-01, suite) : « Chaque objet doit avoir une place. Regroupe les objets des titans ensemble, les objets coeur etc. Mais tout
 * doit avoir une place prévue (même si on ne les voit pas tout de suite). Les coeurs doivent apparaître quand on achète le premier coeur,
 * mais pas les autres cases de coeur pour ne pas spoil. » Chaque case porte donc un GROUPE (zone, titan, coeur, looty, pendentif, autre) ;
 * la case existe toujours côté moteur, mais n'est envoyée au client qu'une fois l'objet vu (decouvert), jamais avant.
 *
 * Butins de titans : liste lue dans rollTitanLootV1 (objet("...") et listes de butin de chaque titan) ; le test
 * idle-coffre-specials-v1 vérifie qu'aucun objet distribué par un titan n'est absent de cette table.
 */
export const IDLE_ADVENTURE_COFFRE_TITAN_OBJETS_V1=Object.freeze({
  t1:["aNumber","wandoos98"],
  t2:["giantSeed","mysteriousRedLiquid"],
  t3:["stapler","ascendedForestPendant"],
  t4:["uugHair","uugSpecialRing"],
  t5:["wanderersCane","wandoosXl","fannyPack","dorkyGlasses"],
  t6:["heroicSigil","ascendedX3Pendant","baldEgg","shrunkenVoodooDoll","pricelessVanGoghPainting","giantApple","powerPill","smallGerbil","mysteriousPurpleLiquid"],
  nerd:["incriminatingEvidence","ordinaryCalculator","animeFigurine","ascendedX4Pendant","theD20","theD8","animeBodypillow","redMeeple","bagOfTrash","heartShapedPanties"],
  godmother:["severedUnicornHead","kingLooty","violinCase","molotovCocktail","godmothersRing","godmothersWand","leftFairyWing","rightFairyWing"],
  t7:["stillBeatingHeart","theJoker","antlersExile","creditCard","tentacleExile","skipCard","antennaeExile","blackLotus","busterExile"],
  hungers:["theCricket","ascendedX5Pendant","emperorLooty","evilRubberDucky","gasGiant","carbonRod","kleinBottle","alienBugNest","theKey"],
  lobster:["ascendedX6Pendant","galacticHeraldLooty","skippingStone","bedRock","rockCandy","brokenScissors","portableStairway","amplifier"],
  amalgamate:["ascendedX7Pendant","supremeIntelligenceLooty","rawSlabOfWood","tieOfApathy","titanEffigy"]
});

export const IDLE_ADVENTURE_COFFRE_COEURS_V1=Object.freeze(["heartRed","heartYellow","heartBrown","heartGreen","heartBlue","heartPurple","heartOrange","heartGrey","heartPink","heartRainbow"]);

export const IDLE_ADVENTURE_COFFRE_LOOTY_V1=Object.freeze(["lootyMcLootFace","sirLooty","grandDemonLootzifer","glitchyLooty"]);

export const IDLE_ADVENTURE_COFFRE_PENDENTIFS_V1=Object.freeze(["ascendedAscendedForestPendant","ascendedX8Pendant","ascendedX9Pendant"]);

const IDLE_ADVENTURE_COFFRE_GROUPES_V1=Object.freeze([
  {id:"zone",nom:""},
  {id:"titan",nom:"👹 Objets des titans"},
  {id:"coeur",nom:"💗 Cœurs"},
  {id:"looty",nom:"🐱 Looty"},
  {id:"pendentif",nom:"🏅 Pendentifs ascendés"},
  {id:"autre",nom:"📦 Autres objets"}
]);

/* Types de statistiques d'un objet (Spécial et extras) pour la recherche du coffre : jamais une valeur de jeu, seulement les intitulés concernés. */
function idleAdventureStatsTypesCoffreV1(definitionId,def){
  const types=[];
  if(def.kind==="equipment"){
    for(const x of SET_ITEM_SPECIALS_V1[definitionId]||[])if(x&&x[0]&&!types.includes(x[0]))types.push(x[0]);
  }else{
    const sp=SPECIALS_EN_V1[definitionId];
    if(sp){
      if(sp.sType)types.push(sp.sType);
      for(const e of sp.sExtra||[])if(e&&e.type&&!types.includes(e.type))types.push(e.type);
    }
  }
  return types;
}

export function idleAdventureCoffreSlotsV1(s){
  const ordreGroupe=Object.fromEntries(IDLE_ADVENTURE_COFFRE_GROUPES_V1.map((g,i)=>[g.id,i]));
  return Object.entries(IDLE_ADVENTURE_ITEM_CATALOG_V1)
    .filter(([definitionId])=>idleAdventureCoffreAccepteV1(definitionId))
    .sort(([a,da],[b,db])=>{
      const pa=IDLE_ADVENTURE_COFFRE_PLACE_V1[a],pb=IDLE_ADVENTURE_COFFRE_PLACE_V1[b];
      if(pa.groupe!==pb.groupe)return ordreGroupe[pa.groupe]-ordreGroupe[pb.groupe];
      if(pa.rang!==pb.rang)return pa.rang-pb.rang;
      /* Dans une zone ou chez un titan : l'équipement du set d'abord (arme, tête, torse...), puis les objets spéciaux dans l'ordre du catalogue. */
      const specialA=da.kind==="special"?1:0,specialB=db.kind==="special"?1:0;
      if(specialA!==specialB)return specialA-specialB;
      if(specialA){
        const oA=IDLE_ADVENTURE_SPECIAL_ORDRE_V1[a],oB=IDLE_ADVENTURE_SPECIAL_ORDRE_V1[b];
        if(oA!==oB)return oA-oB;
      }
      const slotA=idleAdventureSlotRankV1(da.slot),slotB=idleAdventureSlotRankV1(db.slot);
      if(slotA!==slotB)return slotA-slotB;
      return a<b?-1:a>b?1:0;
    })
    .map(([definitionId,def])=>{
      const occupant=s.coffre[definitionId]||null;
      const connu=Boolean(s.itemList[definitionId]?.seen);
      const place=IDLE_ADVENTURE_COFFRE_PLACE_V1[definitionId];
      const groupe=IDLE_ADVENTURE_COFFRE_GROUPES_V1.find(g=>g.id===place.groupe);
      return{
        definitionId,
        set:def.set,setName:def.setName,slot:def.slot,name:def.name,wikiItemId:def.wikiItemId||0,
        /* Recherche du coffre (Norman, 2026-10-03 : « si je tape magic ou forest, il ne trouve rien ») : noms d'origine (anglais, jamais traduits par le choix de langue) et types de statistiques de l'objet. */
        nameEn:def.kind==="equipment"?(SET_ITEM_NAMES_EN_V1[definitionId]||def.name):(SPECIALS_EN_V1[definitionId]?.name||def.name),
        setNameEn:def.kind==="equipment"?(NOMS_SETS_EN_V1[def.set]||def.setName):"",
        statsTypes:idleAdventureStatsTypesCoffreV1(definitionId,def),
        groupe:place.groupe,
        /* Titre de section : nom de la zone (équipement et butins de zone) ou du groupe ; le client ne l'affiche qu'avec une case découverte. */
        groupeNom:place.groupe==="zone"?place.zoneNom:groupe.nom,
        decouvert:connu,
        occupe:Boolean(occupant),
        item:occupant?{...snapshotItemAdventureV1(occupant),maxed:true,basePower:def.basePower,baseToughness:def.baseToughness}:null
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
export function discard(s,id){
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
export function setLockAdventureV1(s,id,locked){
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
export function trashPutAdventureV1(s,id){
  const o=s.inventory.find(x=>x.id===id);
  if(!o)throw Error("OBJET_INTROUVABLE");
  if(o.locked)throw Error("OBJET_VERROUILLE");

  /*
   * V180 — le bouton Supprimer du popup signifie "envoyer dans Trash".
   * Il doit donc fonctionner aussi depuis le popup d'un objet équipé :
   * on le déséquipe atomiquement avant de le déplacer vers la Trash.
   */
  for(const slot of ["head","chest","legs","boots","weapon","weapon2"]){
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

export function trashRecoverAdventureV1(s){
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
export function coffreDeposer(s,id){
  const idx=s.inventory.findIndex(x=>x.id===id);
  if(idx<0)throw Error("OBJET_INTROUVABLE");
  const o=s.inventory[idx];
  if(equippedIdsAdventureV1(s).has(o.id))throw Error("OBJET_EQUIPE");
  if(!idleAdventureCoffreAccepteV1(o.definitionId))throw Error("OBJET_NON_ELIGIBLE_COFFRE");
  if(!idleAdventureObjetPleinementMaxeV1(o))throw Error("OBJET_NON_MAXE");
  if(s.coffre[o.definitionId])throw Error("CASE_DEJA_OCCUPEE");
  s.inventory.splice(idx,1);
  s.coffre[o.definitionId]=o;
  return{id:o.id,definitionId:o.definitionId};
}

export function coffreRetirer(s,id){
  const entry=Object.entries(s.coffre).find(([,item])=>item.id===id);
  if(!entry)throw Error("OBJET_INTROUVABLE");
  if(inventoryUsedAdventureV1(s)>=inventoryCapacityAdventureV1(s))throw Error("SAC_PLEIN");
  const[defId,o]=entry;
  delete s.coffre[defId];
  s.inventory.push(o);
  return{id:o.id};
}
