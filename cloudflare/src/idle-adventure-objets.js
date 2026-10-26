/*
 * Aventure : valeur des objets, état, normalisation, spéciaux et sets (audit d'architecture, 2026-10-16 : découpage de idle-adventure-v47.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { SET_ITEM_SPECIALS_V1 } from "./idle-adventure-set-specials-v1.js";
import { idleTheEndNormalizeV1 } from "./idle-the-end-v1.js";
import { idleSpecialPointsRatioV1 } from "./idle-adventure-special-points-v1.js";
import { SETS, SETS_OBJETS_V1, SET_ITEM_NAMES_V1, SPECIALS, defById, idleAdventureItemStatsMaxV1, wikiItemIdAdventureV1, wikiItemIdBoostV1 } from "./idle-adventure-sets.js";
import { BOOSTS, C, I, MAX, N, UNLOCK_PAR_OBJET_V1, X, __perfCompteursV1, unlockMap } from "./idle-adventure-base.js";
import { IDLE_SECOND_WEAPON_SLOTS_V1, add, applyBoost, cube, equip, inventoryCapacityAdventureV1, inventoryUsedAdventureV1, merge, syncInventorySlotsAdventureV2, unequip } from "./idle-adventure-inventaire.js";
import { IDLE_ADVENTURE_V47, __advCtx } from "./idle-adventure-v47.js";
import { IDLE_ADVENTURE_ZONES } from "./idle-adventure-zones.js";

/*
 * "Base value" Power/Toughness des objets (audit des objets, 2026-09-24).
 * Source : champs powervalbase / toughnessvalbase des 431 modèles
 * "Template:Item data <objet>" (miroir local NGU-Wiki, NGU-Wiki\templates\), affichés
 * "Base value" sur la fiche de chaque objet. La documentation du modèle
 * (Template:Item data, champ "lvldrop" : "lvl of input stats (for Base Value)")
 * précise que c'est la stat de l'objet tel qu'il tombe. Jusqu'ici un objet neuf
 * démarrait à 0/0 (généralisation de la capture du Tutorial Cube, dont la Base
 * value est bien 0) et une pièce de set tombée recevait une Power/Toughness
 * TIRÉE AU HASARD entre 0 et son plafond (rollFreshEquipmentStatsV1, aucune
 * source) : l'une et l'autre sont remplacées par la Base value publiée.
 * Même règle que les Specials (départ = Base value, déjà appliquée) et que les
 * cœurs (pBase/tBase dans leur définition, exclus de cette table).
 * Table générée par script depuis les modèles ; seules les entrées non nulles
 * sont listées (absence = 0/0, ex. Tutorial Cube, The Lonely Flubber).
 * Cas limite : "A Regular Tie" (jake:tie) publie Toughness Base value 82 pour un
 * "Max stat at lvl 0" de 81.5 ; cleanItem() ramène la valeur au plafond.
 */
const ITEM_BASE_VALUE_PT_V1=Object.freeze({
  "training:weapon":[3,0],"training:head":[0,1],"training:chest":[0,1],"training:legs":[0,1],"training:boots":[0,1],"sewers:weapon":[2,0],
  "sewers:head":[0,1],"sewers:chest":[0,3],"sewers:legs":[0,3],"sewers:boots":[0,3],"sewers:amulet":[1,1],"forest:weapon":[20,0],
  "forest:head":[0,8],"forest:chest":[0,8],"forest:legs":[0,8],"forest:boots":[0,8],"forest:ring":[2,2],"cave:weapon":[120,0],
  "cave:head":[0,28],"cave:chest":[0,28],"cave:legs":[0,28],"cave:boots":[0,28],"cave:ring":[2,2],"hsb:weapon":[305,0],
  "hsb:head":[0,70],"hsb:chest":[0,70],"hsb:legs":[0,70],"hsb:boots":[0,70],"grb:weapon":[690,0],"grb:head":[180,180],
  "grb:chest":[0,180],"grb:legs":[4,180],"grb:boots":[4,185],"grb:necklace":[63,63],"clock:weapon":[1480,0],"clock:head":[0,240],
  "clock:chest":[0,260],"clock:legs":[0,360],"clock:boots":[0,360],"clock:alarm":[233,163],"2d:weapon":[2500,1],"2d:head":[0,314],
  "2d:chest":[0,60],"2d:legs":[0,480],"2d:boots":[0,460],"2d:cube":[363,363],"spoopy:weapon":[5700,1],"spoopy:head":[0,614],
  "spoopy:chest":[20,260],"spoopy:legs":[0,780],"spoopy:boots":[0,660],"spoopy:ring":[363,363],"jake:weapon":[8888,0],"jake:head":[0,966],
  "jake:chest":[0,909],"jake:legs":[0,822],"jake:boots":[80,911],"jake:tie":[0,82],"jake:paperweight":[1000,1000],"gaudy:weapon":[13000,0],
  "gaudy:head":[0,1300],"gaudy:chest":[0,1400],"gaudy:legs":[0,1400],"gaudy:boots":[0,1300],"mega:weapon":[44000,0],"mega:head":[0,5600],
  "mega:chest":[0,5600],"mega:legs":[0,5700],"mega:boots":[300,5500],"beardverse:weapon":[83000,6000],"beardverse:head":[1100,12000],"beardverse:chest":[1100,12500],
  "beardverse:legs":[1100,12500],"beardverse:boots":[1200,12500],"badly:weapon":[500000,25000],"badly:head":[0,60000],"badly:chest":[0,60000],"badly:legs":[0,60000],
  "badly:boots":[0,60000],"stealth:weapon":[1000000,60000],"stealth:head":[5000,112000],"stealth:chest":[5000,115000],"stealth:legs":[5000,118000],"stealth:boots":[5000,122000],
  "choco:weapon":[3800000,200000],"choco:head":[30000,352000],"choco:chest":[20000,370000],"choco:legs":[20000,355000],"choco:boots":[20000,366000],"uug:ringMight":[6666,6666],
  "uug:ringUtility":[0,1000],"uug:ringEnergy":[1000,1000],"uug:ringMagic":[1000,1000],"wanderer:head":[1000,22000],"wanderer:chest":[1000,23000],"wanderer:legs":[1000,23000],
  "wanderer:boots":[1000,24000],"rerednaw:head":[1000,21000],"rerednaw:chest":[1000,22000],"rerednaw:legs":[1000,23000],"rerednaw:boots":[1000,24000],"slimy:weapon":[2200000,100000],
  "slimy:head":[11000,242000],"slimy:chest":[11000,250000],"slimy:legs":[10000,245000],"slimy:boots":[10000,240000],"edgy:weapon":[5600000,300000],"edgy:head":[40000,502000],
  "edgy:chest":[30000,540000],"edgy:legs":[30000,555000],"edgy:amulet":[150000,150000],"edgyboots:left":[20000,516000],"edgyboots:right":[30000,516000],"bothedgy:boots":[60000,540000],
  "pinkprincess:weapon":[7600000,440000],"pinkprincess:head":[60000,742000],"pinkprincess:chest":[60000,740000],"pinkprincess:legs":[50000,755000],"pinkprincess:boots":[30000,730000],"pinkprincess:amulet":[400000,400000],
  "meta:weapon":[25000000,1200000],"meta:head":[150000,2200000],"meta:chest":[150000,2200000],"meta:legs":[150000,2200000],"meta:boots":[150000,2200000],"meta:charmInfinity":[888888,888888],
  "meta:charm69":[696969,696969],"party:weapon":[50000000,2000000],"party:head":[250000,4500000],"party:chest":[250000,4500000],"party:legs":[250000,4500000],"party:boots":[250000,4500000],
  "party:cup":[1500000,1000000],"party:whistle":[2000000,2000000],"typo:weapon":[160000000,6000000],"typo:head":[600000,15000000],"typo:chest":[600000,16000000],"typo:legs":[600000,15500000],
  "typo:boots":[600000,15000000],"typo:asscessory":[12000000,12000000],"typo:eyeElxu":[6666666,6666666],"fad:weapon":[250000000,10000000],"fad:head":[900000,22000000],"fad:chest":[900000,24000000],
  "fad:legs":[900000,23000000],"fad:boots":[900000,21000000],"fad:pokeymanCard":[19000000,19000000],"fad:krazyBonez":[20000000,20000000],"jrpg:weapon":[400000000,16000000],"jrpg:head":[1400000,38000000],
  "jrpg:chest":[1500000,37000000],"jrpg:legs":[1500000,39000000],"jrpg:boots":[1500000,38000000],"jrpg:zipper":[21000000,23000000],"jrpg:wig":[30000000,30000000],"rad:weapon":[880000000,35000000],
  "rad:head":[3300000,87000000],"rad:chest":[3400000,86000000],"rad:legs":[3500000,86000000],"rad:boots":[3400000,86000000],"rad:notDrugs":[90000000,90000000],"rad:gloveOfPower":[130000000,80000000],
  "backtoschool:weapon":[1140000000,45000000],"backtoschool:head":[4600000,122000000],"backtoschool:chest":[4600000,122000000],"backtoschool:legs":[4600000,122000000],"backtoschool:boots":[4600000,122000000],"backtoschool:theS":[180000000,180000000],
  "backtoschool:walkman":[126000000,90000000],"western:weapon":[1480000000,58000000],"western:head":[6000000,159000000],"western:chest":[6000000,160000000],"western:legs":[6000000,158000000],"western:boots":[6000000,162000000],
  "western:corgi":[220000000,220000000],"western:bandana":[170000000,170000000],"bread:weapon":[3820000000,90000000],"bread:head":[13000000,380000000],"bread:chest":[13000000,382000000],"bread:legs":[13000000,383000000],
  "bread:boots":[13000000,378000000],"bread:baguette":[3600000000,137000000],"bread:creamPie":[410000000,410000000],"bread:yeast":[380000000,380000000],"disco:weapon":[4860000000,137000000],"disco:head":[17500000,513000000],
  "disco:chest":[17600000,512000000],"disco:legs":[17600000,514000000],"disco:boots":[17600000,516000000],"disco:vinylShard":[5000000000,110000000],"disco:whitePowder":[553000000,553000000],"disco:rollingPaper":[555000000,555000000],
  "halloweenie:weapon":[7250000000,210000000],"halloweenie:head":[25300000,743000000],"halloweenie:chest":[25500000,740000000],"halloweenie:legs":[25500000,745000000],"halloweenie:boots":[25500000,744000000],"halloweenie:apple":[7020000000,137000000],
  "halloweenie:toiletPaper":[643000000,643000000],"halloweenie:pandora":[651000000,651000000],"construction:weapon":[20510000000,300000000],"construction:head":[72600000,2055000000],"construction:chest":[72400000,2040000000],"construction:legs":[75900000,2030000000],
  "construction:boots":[76000000,2060000000],"construction:hammer":[20000000000,400000000],"construction:toolbox":[1820000000,1820000000],"construction:levelLevel":[933000000,933000000],"duck:weapon":[28900000000,420000000],"duck:head":[100000000,2820000000],
  "duck:chest":[100000000,2810000000],"duck:legs":[100000000,2870000000],"duck:boots":[100000000,2840000000],"duck:shotgun":[28500000000,550000000],"duck:ducktTape":[2540000000,2540000000],"duck:duckCaller":[1200000000,1200000000],
  "dutch:weapon":[38200000000,600000000],"dutch:head":[140000000,3850000000],"dutch:chest":[140000000,3820000000],"dutch:legs":[140000000,3800000000],"dutch:boots":[140000000,3850000000],"dutch:tulip":[38000000000,600000000],
  "dutch:netherlands":[2810000000,2810000000],"dutch:cheese":[3510000000,3510000000],"pirate:weapon":[69000000000,1000000000],"pirate:head":[240000000,5600000000],"pirate:chest":[250000000,5700000000],"pirate:legs":[240000000,5500000000],
  "pirate:boots":[240000000,5500000000],"pirate:cutlass":[63000000000,1000000000],"pirate:eyepatch":[5900000000,5900000000],"pirate:compass":[5900000000,5900000000],"greasynerd:weapon":[11000000,600000],"greasynerd:head":[80000,1100000],
  "greasynerd:chest":[80000,1120000],"greasynerd:legs":[50000,1200000],"greasynerd:boots":[80000,1200000],"mobster:weapon":[100000000,4000000],"mobster:head":[400000,10000000],"mobster:chest":[400000,10000000],
  "mobster:legs":[400000,10000000],"mobster:boots":[400000,10000000],"mobster:garrote":[4000000,4000000],"mobster:brassKnuckles":[3500000,3500000],"exile:weapon":[620000000,25000000],"exile:head":[2200000,57000000],
  "exile:chest":[2300000,60000000],"exile:legs":[2200000,59000000],"exile:boots":[2200000,58000000],"space:weapon":[1920000000,75000000],"space:head":[7800000,205000000],"space:chest":[7800000,205000000],
  "space:legs":[7800000,205000000],"space:boots":[7800000,205000000],"space:manhole":[225000000,225000000],"space:redShirt":[300000000,1],"rock:weapon":[10510000000,300000000],"rock:head":[36600000,1075000000],
  "rock:chest":[36600000,1075000000],"rock:legs":[36600000,1070000000],"rock:boots":[36600000,1080000000],"rock:rocket":[10150000000,200000000],"rock:petRock":[931000000,931000000],"rock:rollingStone":[933000000,933000000],
  "amalgamate:weapon":[52000000000,800000000],"amalgamate:head":[170000000,4600000000],"amalgamate:chest":[4600000000,4600000000],"amalgamate:legs":[170000000,4600000000],"amalgamate:boots":[170000000,4600000000],"amalgamate:deathstick":[50000000000,800000000],
  "amalgamate:corruptedLeaf":[3200000000,3200000000],"amalgamate:glued":[4600000000,4600000000],"tubaTime":[2,2],"cheeseGrater":[5,0],"magicite":[25,25],"windupGear":[80,80],
  "ghostTypewriter":[300,300],"gaudyShoulders":[400,400],"fTank":[3000,3000],"wanderersCane":[170000,12000],"shrunkenVoodooDoll":[66666,66666],"pricelessVanGoghPainting":[30000,30000],
  "smallGerbil":[100000,100000],"lootyMcLootFace":[2,2],"ascendedAscendedForestPendant":[200,200],"dragonWings":[82,82],"aBeanie":[0,1600],"ascendedX3Pendant":[40000,40000],
  "beardHairStrand":[8000,8000],"uugSpecialRing":[12000,12000],"candyCaneDestiny":[170000,12000],"fannyPack":[15000,15000],"dorkyGlasses":[5000,5000],"kingLooty":[100000,100000],
  "ascendedX4Pendant":[10000,10000],"stealthiestArmour":[8000,150000],"baldEgg":[33333,33333],"giantApple":[50000,50000],"powerPill":[250000,250000],"energyBarBarAccessory":[50000,50000],
  "magicBarBarAccessory":[50000,50000],"ascendedX5Pendant":[400000,400000],"emperorLooty":[300000,300000],"ascendedX6Pendant":[20000000,20000000],"galacticHeraldLooty":[30000000,30000000],"ascendedX7Pendant":[400000000,400000000],
  "supremeIntelligenceLooty":[500000000,500000000],"beretta9mm":[1400000000,70000000],"edgyMagicite":[666000,666000],"creepyDoll":[930000,930000],"theExponential":[2800000,2800000],"rushmoreNose":[5000000,5000000],
  "throOdignslug":[17000000,17000000],"linkCable":[28000000,28000000],"handCursor":[35000000,35000000],"radMixtape":[100000000,100000000],"ordinaryCalculator":[250000,250000],"animeFigurine":[250000,250000],
  "theD20":[250000,250000],"theD8":[250000,250000],"animeBodypillow":[500000,500000],"redMeeple":[500000,500000],"bagOfTrash":[500000,500000],"heartShapedPanties":[666666,666666],
  "violinCase":[7000000,7000000],"molotovCocktail":[10000000,10000000],"godmothersRing":[15000000,15000000],"godmothersWand":[22000000,22000000],"leftFairyWing":[60000000,60000000],"theJoker":[66600000,66600000],
  "antlersExile":[80000000,0],"tentacleExile":[110000000,100000000],"skipCard":[120000000,120000000],"antennaeExile":[100000000,100000000],"blackLotus":[150000000,150000000],"busterExile":[250000000,250000000],
  "theCricket":[2100000000,90000000],"evilRubberDucky":[225000000,225000000],"gasGiant":[290000000,290000000],"carbonRod":[400000000,400000000],"kleinBottle":[380000000,380000000],"alienBugNest":[456000000,456000000],
  "theKey":[456000000,456000000],"skippingStone":[1582000000,1582000000],"bedRock":[1576000000,1576000000],"rockCandy":[2679000000,2679000000],"brokenScissors":[2700000000,2700000000],"portableStairway":[4860000000,4860000000],
  "amplifier":[4840000000,4840000000],"rawSlabOfWood":[6300000000,6300000000],"tieOfApathy":[8999999000,8999999000],"titanEffigy":[13000000000,13000000000]
});

function itemBaseValueAdventureV1(definitionId){
  const d=SPECIALS[definitionId];
  if(d&&(d.pBase!==undefined||d.tBase!==undefined))return[N(d.pBase),N(d.tBase)];
  const v=ITEM_BASE_VALUE_PT_V1[definitionId];
  return v?[N(v[0]),N(v[1])]:[0,0];
}

export function idleAdventureItemBaseValueV1(definitionId){const[p,t]=itemBaseValueAdventureV1(definitionId);return{power:p,toughness:t}}

export function item(id,set,slot,lv=0){const s=SETS[set];const definitionId=`${set}:${slot}`;const realName=SET_ITEM_NAMES_V1[definitionId];return{id,definitionId,wikiItemId:wikiItemIdAdventureV1(definitionId),name:realName||`${s.name} ${slot}`,kind:"equipment",set,slot,level:C(lv,0,MAX),power:itemBaseValueAdventureV1(definitionId)[0],toughness:itemBaseValueAdventureV1(definitionId)[1],hp:0,regen:0,special:N(SET_ITEM_SPECIALS_V1[definitionId]?.[0]?.[1]),...(SET_ITEM_SPECIALS_V1[definitionId]?.length>1?{specialExtra:SET_ITEM_SPECIALS_V1[definitionId].slice(1).map(x=>N(x[1]))}:{})}}

export function rollFreshEquipmentStatsV1(o){
  if(!o||o.kind!=="equipment")return o;
  /*
   * 2026-09-24 (audit des objets) : une pièce tombée garde sa "Base value"
   * Power/Toughness publiée (déjà posée par item(), ITEM_BASE_VALUE_PT_V1),
   * ramenée au plafond du niveau si besoin. L'ancien tirage pseudo-aléatoire
   * entre 0 et le plafond (2026-09-19) n'avait aucune source wiki : retiré.
   */
  const base=idleAdventureBaseStatsV1(o.set,o.slot);
  const q=1+C(o.level,0,MAX)/100;
  o.power=Math.min(N(o.power),Math.max(0,N(base&&base.baseP)*q));
  o.toughness=Math.min(N(o.toughness),Math.max(0,N(base&&base.baseT)*q));
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
export function special(id,lv=0){const d=SPECIALS[id];if(!d)throw Error("SPECIAL_INVALIDE");return{id,definitionId:id,wikiItemId:wikiItemIdAdventureV1(id),name:d.name,kind:d.cube?"cube":"special",slot:d.slot,zone:d.zone,set:d.set||"",consumable:Boolean(d.consumable),level:C(lv,0,MAX),power:itemBaseValueAdventureV1(id)[0],toughness:itemBaseValueAdventureV1(id)[1],hp:0,regen:0,special:N(d.sBase),...(Array.isArray(d.sExtra)&&d.sExtra.length?{specialExtra:d.sExtra.map(e=>N(e.base))}:{})}}

export function boost(type,strength){if(!["power","toughness","special"].includes(type)||!BOOSTS.includes(+strength))throw Error("BOOST_INVALIDE");return{id:`boost:${type}:${strength}:${Math.random()}`,definitionId:`boost:${type}:${strength}`,wikiItemId:wikiItemIdBoostV1(type,strength),name:`Boost ${type} ${strength}`,kind:"boost",boostType:type,strength:+strength,level:0}}

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

/* Fabrique d'objet SPECIALS (cœurs achetés au Sellout Shop, idle-hearts-v1.js) : même special() que les drops. */
export function idleAdventureSpecialItemV1(id,level){return special(id,level)}

/*
 * Automatisation de l'inventaire (idle-inventory-auto-v1.js : Auto Merge,
 * Auto Boost, A/D + clic, loadouts, filtre de butin) : ce module réutilise
 * exactement les primitives des actions manuelles ci-dessous, jamais une
 * seconde implémentation de la fusion, du boost ou de l'équipement.
 */
export function idleAdventureMergeItemsV1(state,a,b){return merge(state,a,b)}

export function idleAdventureApplyBoostItemV1(state,boostId,targetId,ctx){return applyBoost(state,boostId,targetId,ctx)}

export function idleAdventureCubeBoostItemV1(state,boostId,ctx){return cube(state,boostId,ctx)}

export function idleAdventureEquipItemV1(state,id,slot){return equip(state,id,slot)}

export function idleAdventureUnequipItemV1(state,id){return unequip(state,id)}

export function idleAdventureRecordItemV1(state,o){return record(state,o)}

export function idleAdventureSyncInventorySlotsV1(state){return syncInventorySlotsAdventureV2(state)}

export function idleAdventureInventoryCapacityV1(state){return inventoryCapacityAdventureV1(state)}

export function idleAdventureInventoryUsedV1(state){return inventoryUsedAdventureV1(state)}

/*
 * Marge restante avant le plafond d'une stat pour un type de boost : même
 * plafond que applyBoost() (base x (1 + niveau/100)). 0 = rien à combler ou
 * cible invalide pour ce type ; Infinity = stat sans plafond publié.
 */
export function idleAdventureBoostRoomV1(s,targetId,type){
  const o=(s&&Array.isArray(s.inventory)?s.inventory:[]).find(x=>x.id===targetId);
  if(!o||o.kind==="boost")return 0;
  const d=defById(o.definitionId);
  if(type==="special"){
    const specialPiece=d?.kind==="set"&&Boolean(idleAdventureSetSpecialsV1(d.set,d.slot));
    if(d?.kind!=="special"&&!specialPiece)return 0;
    return idleAdventureSpecialsRoomPointsV1(o);
  }
  if(type!=="power"&&type!=="toughness")return 0;
  const base=d?.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):(d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):null);
  const cap=base?(type==="power"?base.baseP:base.baseT)*(1+C(N(o.level),0,MAX)/100):null;
  return cap==null?Infinity:Math.max(0,cap-N(o[type]));
}

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
export function base(){
  const s={version:IDLE_ADVENTURE_V47,revision:0,recentClientMutations:[],selectedZone:"safe",retourSafe:{raison:"",detail:"",at:0},lastCombatZone:"tutorial",inventory:[],inventorySlots:[],coffre:{},trash:null,equipment:{head:"",chest:"",legs:"",boots:"",weapon:"",weapon2:"",accessories:[]},dualWieldRatio:0,theEnd:{pieces:{},endings:0,lastEndingAt:0},itemList:{},completedSets:{},autoPortraitSet:"",autoPortraitTier:0,setRewards:{experience:0,ap:0,energySpeed:0,energyBars:0,energyPower:0,magicPower:0,magicBars:0,magicCap:0,adventurePower:0,adventureToughness:0,adventureHp:0,adventureRegen:0,respawn:0,drop:0,chargeMultiplier:1,idleAttack:false,noEquipmentChallenge:false,wandoosMeh:false,diggerSlot:0,luckyCharms:0,extraDropLevelChance:0,boostEffectiveness:0,boostCompletions:0,itopodPpPct:0,diggerGlobalBonusPct:0,bloodMagicSpeedPct:0,nguSpeedPct:0,wishSpeedPct:0},permanent:{experience:0,ap:0,gold:0,ppProgress:0,qp:0,energySpeedFlat:0,energyPowerFlat:0,energyBarsFlat:0,magicPowerFlat:0,magicBarsFlat:0,magicCapFlat:0},unlockItems:{},unlockFlags:{},skillState:{beastMode:false,move69Uses:0,endPiece481:false},cube:{power:0,toughness:0,unlocked:false},zone:{kills:{},bossKills:{},encounters:{},bossEncounters:{}},titans:{},autoKillTitansEnabled:false,fight:{active:false,zone:"",monsterHp:0,monsterHpMax:0,boss:false,playerHp:0,playerHpMax:0},serial:1};
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
export function cleanItem(o){if(!o||typeof o!=="object")return null;const z=X(o);z.id=String(z.id||"");z.definitionId=String(z.definitionId||"");z.wikiItemId=wikiItemIdAdventureV1(z.definitionId)||Number(z.wikiItemId)||0;z.level=C(z.level,0,MAX);z.power=Math.max(0,N(z.power));z.toughness=Math.max(0,N(z.toughness));z.special=Math.max(0,N(z.special));z.locked=Boolean(z.locked);const d=defById(z.definitionId);const base=d?.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):(d?.kind==="special"?idleAdventureSpecialBaseStatsV1(d.id):null);if(base){const q=1+z.level/100;
// 2026-09-24 : jamais sous la "Base value" publiée (ITEM_BASE_VALUE_PT_V1) -- les objets créés avant ce correctif remontent à leur Base value au chargement, comme les Specials.
const bv=itemBaseValueAdventureV1(z.definitionId);z.power=Math.max(z.power,bv[0]);z.toughness=Math.max(z.toughness,bv[1]);
z.power=Math.min(z.power,base.baseP*q);z.toughness=Math.min(z.toughness,base.baseT*q);
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
if(d?.kind==="set"){
  const sp=idleAdventureSetSpecialsV1(d.set,d.slot);
  if(sp)z.special=Math.max(z.special,N(sp[0][1]));
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
/* Objets spéciaux : même resynchronisation (les noms anglais déjà enregistrés passent en français, Norman 2026-10-03). */
if((d?.kind==="special"||d?.kind==="cube")&&SPECIALS[d.id]?.name)z.name=SPECIALS[d.id].name;
idleAdventureNormaliserSpecialsExtraV1(z);
return z}

/* Migration 2026-09-23 : l'ancienne pièce "edgy:boots" (BOTH Edgy Boots) devient "bothedgy:boots". */
function migrerEdgyBootsV1(s){
  const ancien="edgy:boots",nouveau="bothedgy:boots";
  const renommer=o=>{if(o&&typeof o==="object"&&o.definitionId===ancien){o.definitionId=nouveau;if("set"in o)o.set="bothedgy";if(o.slot==="boots")o.slot="boots"}return o};
  if(Array.isArray(s.inventory))s.inventory.forEach(renommer);
  if(s.trash)renommer(s.trash);
  for(const cle of ["itemList","coffre"]){
    if(s[cle]&&typeof s[cle]==="object"&&Object.prototype.hasOwnProperty.call(s[cle],ancien)){
      s[cle][nouveau]=s[cle][ancien];
      delete s[cle][ancien];
      if(s[cle][nouveau]&&typeof s[cle][nouveau]==="object")renommer(s[cle][nouveau]);
    }
  }
  return s;
}

export function normalizeIdleAdventureStateV47(raw){__perfCompteursV1.normalisations+=1;if(raw?.version!==IDLE_ADVENTURE_V47){const neuf=base();neuf.flubberRemisAZeroV1=true;return neuf;}   /* nouvelle partie : rien à remettre à zéro */const s=migrerEdgyBootsV1(Object.assign(base(),X(raw)));s.revision=Math.max(0,I(s.revision));s.recentClientMutations=(Array.isArray(s.recentClientMutations)?s.recentClientMutations:[]).filter(x=>x&&x.id).slice(-64);s.inventory=(Array.isArray(s.inventory)?s.inventory:[]).map(cleanItem).filter(Boolean);s.trash=cleanItem(s.trash);
/*
 * Réparation (2026-09-23) : special() pose id = definitionId, et add()
 * gardait cet id -- deux exemplaires du même objet spécial (2 Pissed Off Key,
 * 2 accessoires identiques...) partageaient donc le même id et ne pouvaient
 * jamais être fusionnés (merge() : A===B). add() attribue désormais un id
 * neuf en cas de collision ; ici, les doublons déjà sauvegardés reçoivent un
 * id neuf (la première occurrence garde le sien, donc l'équipement aussi).
 */
{s.serial=Math.max(1,I(s.serial,1));const idsVus=new Set();for(const o of s.inventory){if(!o.id||idsVus.has(o.id))o.id=`i${s.serial++}`;idsVus.add(o.id)}}
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
s.itemList=s.itemList&&typeof s.itemList==="object"?s.itemList:{};s.completedSets=s.completedSets&&typeof s.completedSets==="object"?s.completedSets:{};s.autoPortraitSet=typeof s.autoPortraitSet==="string"?s.autoPortraitSet:"";s.autoPortraitTier=C(I(s.autoPortraitTier),0,100);s.setRewards=Object.assign(base().setRewards,s.setRewards||{});synchroniserCompletionsBoostAdventureV183_(s);s.permanent=Object.assign(base().permanent,s.permanent||{});s.unlockItems=s.unlockItems&&typeof s.unlockItems==="object"?s.unlockItems:{};s.unlockFlags=s.unlockFlags&&typeof s.unlockFlags==="object"?s.unlockFlags:{};s.skillState=Object.assign(base().skillState,s.skillState&&typeof s.skillState==="object"?s.skillState:{});s.skillState.move69Uses=C(I(s.skillState.move69Uses),0,69);s.skillState.endPiece481=Boolean(s.skillState.endPiece481||s.skillState.move69Uses>=69);s.cube=Object.assign(base().cube,s.cube||{});s.titans=s.titans&&typeof s.titans==="object"?s.titans:{};s.fight=Object.assign(base().fight,s.fight&&typeof s.fight==="object"?s.fight:{});const lastCombatCandidate=String(s.lastCombatZone||(s.selectedZone!=="safe"?s.selectedZone:"tutorial"));s.lastCombatZone=IDLE_ADVENTURE_ZONES.some(z=>z.id===lastCombatCandidate&&z.id!=="safe")?lastCombatCandidate:"tutorial";
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
/* Raison du dernier retour en Zone sûre (audit d'Aventure, Norman 2026-10-05 : « je gagne un combat et il me dit Zone sûre alors que je suis dans le ciel ») : affichée au joueur, jamais un retour silencieux. */
{const r=s.retourSafe&&typeof s.retourSafe==="object"?s.retourSafe:{};s.retourSafe={raison:String(r.raison||"").slice(0,40),detail:String(r.detail||"").slice(0,160),at:Math.max(0,I(r.at))}}
/* Seconde arme : slot toujours présent ; les secondes armes rangées en accessoires par l'ancienne version (100 % de leurs stats) sont migrées. */
s.dualWieldRatio=Math.min(1,Math.max(0,N(s.dualWieldRatio)));
s.theEnd=idleTheEndNormalizeV1(s.theEnd);
s.equipment=Object.assign({},s.equipment);
s.equipment.weapon2=typeof s.equipment.weapon2==="string"?s.equipment.weapon2:"";
{const acc=Array.isArray(s.equipment.accessories)?s.equipment.accessories:[];const armes=acc.filter(id=>IDLE_SECOND_WEAPON_SLOTS_V1.includes(s.inventory.find(x=>x.id===id)?.slot));
if(armes.length){s.equipment.accessories=acc.filter(id=>!armes.includes(id));if(!s.equipment.weapon2&&s.dualWieldRatio>0)s.equipment.weapon2=armes[0]}
if(s.equipment.weapon2&&(!s.inventory.some(x=>x.id===s.equipment.weapon2)||s.equipment.weapon2===s.equipment.weapon))s.equipment.weapon2=""}
/*
 * Auto-réparation des sauvegardes déjà en cours :
 * - une pièce actuellement verte/pleinement boostée doit immédiatement
 *   apparaître comme 100% dans Collection ;
 * - un set dont toutes les pièces ont déjà atteint le niveau 100 doit
 *   déclencher son vrai bonus même si un ancien build avait oublié
 *   d'appeler checkSets après chargement.
 */
/*
 * Le Flubber solitaire est tombé tout au début du jeu, quand le taux de butin était mal réglé : personne ne l'a vraiment (Norman, 2026-10-26 : « uniquement pour cet objet, remets à 0 cette statistique »). Une seule fois par partie (drapeau
 * flubberRemisAZeroV1), s'il n'est NI dans le sac (équipé compris), NI au Coffre, NI dans la corbeille, son « vu » et son niveau atteint repartent à zéro : sa case du Coffre n'apparaît plus avant un vrai butin.
 */
if(!s.flubberRemisAZeroV1){
  s.flubberRemisAZeroV1=true;
  const possede=s.inventory.some(o=>o&&o.definitionId==="flubber")||Boolean(s.trash&&s.trash.definitionId==="flubber")||Boolean(s.coffre&&typeof s.coffre==="object"&&s.coffre.flubber);
  if(!possede&&s.itemList&&s.itemList.flubber)delete s.itemList.flubber;
}
for(const o of s.inventory){
  if(o&&o.definitionId&&idleAdventureObjetPleinementMaxeV1(o)){
    const info=s.itemList[o.definitionId]||{maxLevel:I(o.level,-1),seen:true};
    info.seen=true;
    info.maxLevel=Math.max(I(info.maxLevel,-1),I(o.level));
    info.fullyMaxed=true;
    s.itemList[o.definitionId]=info;
  }
}
/*
 * 2026-09-27 (Norman revient sur le choix du 2026-09-25) : le Tutorial Cube maxé ne va plus
 * dans une case dédiée du Coffre, il disparaît -- voir record() ci-dessous. Migration inverse :
 * une sauvegarde qui porte déjà ce trophée (posé par l'ancienne version) le perd à la prochaine
 * ouverture, sans jamais retirer la place elle-même (IDLE_ADVENTURE_COFFRE_SPECIAUX_V1 ne le
 * liste plus du tout, plus bas dans ce fichier).
 */
if(s.coffre&&s.coffre.tutorialCube)delete s.coffre.tutorialCube;
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
 * 2026-09-23 (audit des bonus de complétion) : retrait de la migration
 * "Training Set 10 -> 20 EXP", qui ajoutait +10 EXP aux anciennes
 * complétions. Le wiki (page "Training (set)", miroir NGU-Wiki : "+2 energy
 * speed / 10 EXP") donne 10 EXP, valeur déjà dans SETS.training depuis
 * 27c9514 : le complément portait ces sauvegardes à 20 EXP, contraire au wiki.
 */
syncInventorySlotsAdventureV2(s);
convertirDeblocagesEnObjetsV1(s);
return s}

/*
 * Un déblocage de système est TOUJOURS un objet du sac (Norman, 2026-10-04 : « j'étais censée avoir un objet dans mon inventaire et non un menu à activer ; fais en sorte que ce soit bien des objets, même pour les
 * items futurs »). Les drapeaux unlockItems (menu « Objets de déblocage ») ne sont plus qu'une créance : tant qu'un système n'est pas débloqué et que l'objet correspondant n'est pas dans le sac, le moteur le crée
 * (A Number, Giant Seed, Scrap of Paper, UUG's Armpit Hair, Pissed Off Key, copie de Wandoos 98) dès qu'une place existe dans le sac, puis éteint le drapeau. Sac plein : la créance reste, et le jeu le dit au joueur.
 * Tout futur objet de déblocage ajouté à UNLOCK_PAR_OBJET_V1 / unlockMap suit la même règle sans autre code.
 */
function convertirDeblocagesEnObjetsV1(s){
  if(!s||!s.unlockItems||typeof s.unlockItems!=="object")return;
  for(const [definitionId,cle] of Object.entries(UNLOCK_PAR_OBJET_V1)){
    if(s.unlockItems[cle]!==true)continue;
    const flag=unlockMap[cle];
    if(s.unlockFlags&&s.unlockFlags[flag]){s.unlockItems[cle]=false;continue}
    if(s.inventory.some(x=>x&&x.definitionId===definitionId)){s.unlockItems[cle]=false;continue}
    const [setId,slot]=definitionId.split(":");
    const modele=SETS[setId]&&SETS[setId].slots.includes(slot)?item("",setId,slot,0):(SPECIALS[definitionId]?special(definitionId,0):null);
    if(!modele)continue;
    const objet=add(s,modele);
    if(objet)s.unlockItems[cle]=false;
  }
}

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
/*
 * Specials des pièces de set (audit NGU 2026-09-23, voir
 * idle-adventure-set-specials-v1.js). Le premier Special de la pièce est porté
 * par le scalaire `special` de l'objet (départ = "Base value", plafond =
 * "Max stat at lvl 0" x (1 + niveau/100), monté par les Special Boosts, comme
 * les accessoires) ; les autres Specials de la même pièce suivent la MÊME
 * fraction de progression vers leur propre plafond (le wiki ne dit pas
 * comment un boost se répartit entre plusieurs Specials).
 */
export function idleAdventureSetSpecialsV1(set,slot){return SET_ITEM_SPECIALS_V1[`${set}:${slot}`]||null}

/*
 * Specials d'un objet, SPECIAL PAR SPECIAL (2026-09-25). Définition : pièce de set = SET_ITEM_SPECIALS_V1 ; accessoire = sType/sBase/sMax puis sExtra.
 * Valeur courante : le 1er Special est le scalaire `special` de l'objet, les suivants sont dans `specialExtra` (départ = Base value).
 * Un Special Boost remplit les Specials DANS L'ORDRE de la fiche (le 1er jusqu'à son plafond, puis le suivant) et il apporte des POINTS :
 * valeur = points / ratio (idle-adventure-special-points-v1.js). Wiki, page Build Cooking : « if you have a Level 0 Chef's Apron, you need
 * to add 30 Special Boosts to it before you can start leveling the Energy Power boost » ; page Item data : « Base Points / Max Points ».
 */
function idleAdventureSpecialsDefsV1(o){
  const d=defById(o&&o.definitionId);
  if(!d)return[];
  let list=[];
  if(d.kind==="set"){
    const l=idleAdventureSetSpecialsV1(d.set,d.slot);
    if(l)list=l.map(([type,base,max0,max100])=>({type,base:N(base),max0:N(max0),max100:N(max100)}));
  }else if(d.kind==="special"){
    const sp=SPECIALS[d.id];
    if(sp&&sp.sType){
      list=[{type:sp.sType,base:N(sp.sBase),max0:N(sp.sMax),max100:N(sp.sMax)*2}];
      for(const e of sp.sExtra||[])list.push({type:e.type,base:N(e.base),max0:N(e.max0),max100:N(e.max100)});
    }
  }
  return list.map((x,i)=>({...x,ratio:idleSpecialPointsRatioV1(o.definitionId,i)}));
}

export function idleAdventureSpecialsListV1(o){
  const defs=idleAdventureSpecialsDefsV1(o);
  if(!defs.length)return[];
  const q=1+C(N(o.level),0,MAX)/100;
  const extra=Array.isArray(o.specialExtra)?o.specialExtra:[];
  return defs.map((s,i)=>{
    const cap=s.max0*q;
    let cur=i===0?N(o.special):(extra[i-1]===undefined||extra[i-1]===null?s.base:N(extra[i-1]));
    cur=Math.max(s.base,cur);
    if(cap>1e-12)cur=Math.min(cap,cur);
    return{type:s.type,value:cur,max:cap,base:s.base,ratio:s.ratio};
  });
}

/* Place d'un Special Boost (en points) : vrai Special chiffré ? sinon (aucune magnitude wiki) l'ancien comportement sans plafond. */
export function idleAdventureSpecialsCappedV1(o){const l=idleAdventureSpecialsListV1(o);return l.length>0&&l[0].max>1e-12}

export function idleAdventureSpecialsRoomPointsV1(o){
  if(!idleAdventureSpecialsCappedV1(o))return Infinity;
  return idleAdventureSpecialsListV1(o).reduce((a,s)=>a+Math.max(0,s.max-s.value)*s.ratio,0);
}

export function idleAdventureApplySpecialPointsV1(o,points){
  const list=idleAdventureSpecialsListV1(o);
  const extra=list.slice(1).map(s=>s.value);
  let p=Math.max(0,N(points));
  let first=list[0].value;
  for(let i=0;i<list.length&&p>1e-12;i++){
    const s=list[i];
    const cur=i===0?first:extra[i-1];
    const room=Math.max(0,s.max-cur)*s.ratio;
    if(!(room>1e-12))continue;
    const take=Math.min(p,room);
    const nv=Math.min(s.max,cur+take/s.ratio);
    if(i===0)first=nv;else extra[i-1]=nv;
    p-=take;
  }
  o.special=first;
  if(list.length>1)o.specialExtra=extra;
}

/* Normalisation d'un objet chargé : tableau specialExtra cohérent ; ancienne sauvegarde = les autres Specials des pièces de set suivaient la fraction du 1er (migration une seule fois). */
function idleAdventureNormaliserSpecialsExtraV1(z){
  const defs=idleAdventureSpecialsDefsV1(z);
  if(defs.length<2){if("specialExtra"in z)delete z.specialExtra;return}
  const q=1+C(N(z.level),0,MAX)/100;
  let extra;
  if(Array.isArray(z.specialExtra)){
    extra=defs.slice(1).map((s,i)=>{const v=Number(z.specialExtra[i]);const cap=s.max0*q;return Math.min(cap>1e-12?cap:Infinity,Math.max(s.base,Number.isFinite(v)?v:s.base))});
  }else{
    const d=defById(z.definitionId),d0=defs[0],cap0=d0.max0*q;
    const fraction=d?.kind==="set"&&cap0-d0.base>1e-12?C((N(z.special)-d0.base)/(cap0-d0.base),0,1):0;
    extra=defs.slice(1).map(s=>s.base+(s.max0*q-s.base)*fraction);
  }
  z.specialExtra=extra;
}

export function idleAdventureBaseStatsV1(set,slot){if(!SETS[set])return{baseP:0,baseT:0,baseS:0};const{p,t}=idleAdventureItemStatsMaxV1(set,slot);const sp=idleAdventureSetSpecialsV1(set,slot);return{baseP:p/2,baseT:t/2,baseS:sp?sp[0][2]:0}}

/*
 * Équivalent de idleAdventureBaseStatsV1 ci-dessus mais pour un accessoire
 * (SPECIALS), qui n'appartient à aucun set — ajouté le 2026-09-13 avec le
 * reste du correctif Power/Toughness des accessoires (cf. commentaire
 * sourcé au-dessus de SPECIALS) pour que le snapshot affiche la vraie base
 * au lieu de {baseP:0,baseT:0} fixe.
 */
// PISTE 1 (2026-09-18) : baseS = d.sMax (plafond du Special Bonus au niveau 0, wiki, ex. tutorialCube sMax:15) -- 0 quand l'objet n'a pas de Special Bonus chiffré.
export function idleAdventureSpecialBaseStatsV1(id){const d=SPECIALS[id];return d?{baseP:N(d.p),baseT:N(d.t),baseS:N(d.sMax)}:{baseP:0,baseT:0,baseS:0}}

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
/*
 * Boosts qu'il MANQUE encore à la pièce, statistique par statistique, au niveau ACTUEL (Norman, 2026-10-08 : « un petit point orange, bleu et jaune pour indiquer ce qu'il manque comme boost dans cet item »).
 * Orange = Power, bleu = Toughness, jaune = Special. Même plafond que applyBoost (base x (1 + niveau/100)) et que les Specials (max0 x (1 + niveau/100)) : un point est allumé tant qu'un boost de ce type serait accepté.
 * Une statistique que la pièce n'a pas n'a jamais de point. Le V vert, lui, ne se pose qu'au niveau 100 quand plus aucun point ne reste (fullyMaxed).
 */
export function idleAdventureBoostManquantV1(o){
  const rien={power:false,toughness:false,special:false};
  if(!o||o.kind==="boost")return rien;
  const d=defById(o.definitionId);
  if(!d||(d.kind!=="set"&&d.kind!=="special"))return rien;
  const base=d.kind==="set"?idleAdventureBaseStatsV1(d.set,d.slot):idleAdventureSpecialBaseStatsV1(d.id);
  const q=1+C(N(o.level),0,MAX)/100;
  return{
    power:N(base.baseP)>0&&N(o.power)+1e-9<N(base.baseP)*q,
    toughness:N(base.baseT)>0&&N(o.toughness)+1e-9<N(base.baseT)*q,
    special:N(base.baseS)>0&&idleAdventureSpecialsListV1(o).some(sv=>sv.value+1e-9<sv.max)
  };
}

export function idleAdventureObjetPleinementMaxeV1(o){
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
  const sOk=!(N(base.baseS)>0)||idleAdventureSpecialsListV1(o).every(sv=>sv.value+1e-9>=sv.max);
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

export function record(s,o){if(!o?.definitionId)return;const old=s.itemList[o.definitionId]||{maxLevel:-1};const prevMax=I(old.maxLevel,-1);old.maxLevel=Math.max(I(old.maxLevel,-1),I(o.level));old.seen=true;old.fullyMaxed=Boolean(old.fullyMaxed||idleAdventureObjetPleinementMaxeV1(o));s.itemList[o.definitionId]=old;attribuerCompletionBoostAdventureV183_(s,o.definitionId,old);const d=defById(o.definitionId);if(d?.kind==="special"&&SPECIALS[d.id]?.maxFlag&&idleAdventureNiveauEstMaxV1(old.maxLevel))s.unlockFlags[SPECIALS[d.id].maxFlag]=true;if(o.definitionId==="tutorialCube"&&idleAdventureNiveauEstMaxV1(old.maxLevel)&&!s.unlockFlags.tutorialCubeMaxed){s.cube.unlocked=true;s.unlockFlags.tutorialCubeMaxed=true;s.setRewards.ap=N(s.setRewards.ap)+10000;
/*
 * Le Tutorial Cube (accessoire équipable jusqu'ici) se TRANSFORME en Cube
 * de l'infini à ce seuil (wiki : la fusion/le boost du même objet devient
 * le Cube, qui n'est alors plus jamais équipé/déplacé). Retire toute
 * copie de l'inventaire ET de l'équipement plutôt que de la laisser
 * traîner, inéquipable et sans usage, dans le sac.
 *
 * 2026-09-27 (Norman, revient sur le choix du 2026-09-25 ci-dessous) : « je voudrais qu'il
 * disparaisse et qu'il ne soit plus possible de le looter à partir de ce moment-là. Il n'y a
 * plus que l'infinity cube. [...] Il ne doit même pas y avoir la place pour le tutorial cube. »
 * Le Tutorial Cube ne va donc plus dans une case dédiée du Coffre (ancien commentaire du
 * 2026-09-25 : « le Tutorial Cube maxxé ne disparaît pas, il est rangé dans sa case du Coffre »,
 * retiré) -- il disparaît purement et simplement, comme n'importe quel objet consommé. Le
 * verrou contre un nouveau drop vit dans rollSpecialAdventureV2 (même fichier).
 */
s.equipment.accessories=(Array.isArray(s.equipment.accessories)?s.equipment.accessories:[]).filter(accId=>{const e=s.inventory.find(x=>x.id===accId);return !(e&&e.definitionId==="tutorialCube")});
s.inventory=s.inventory.filter(x=>x.definitionId!=="tutorialCube")}/* Performance : la complétion des sets ne dépend que du niveau maximal vu de chaque objet ; inutile de la recalculer (2400 fois par requête) quand il n'a pas changé. */if(I(old.maxLevel,-1)!==prevMax)checkSets(s)}

/* Crédite la récompense de complétion d'un set (SETS ou SETS_OBJETS_V1) : setRewards cumulés + bonus permanents. */
function appliquerRecompenseSetV1(s,reward){for(const [k,v] of Object.entries(reward)){if(typeof v==="number")s.setRewards[k]=N(s.setRewards[k])+v;else if(v)s.setRewards[k]=true}if(N(reward.experience)>0)s.permanent.experience=N(s.permanent.experience)+N(reward.experience);if(N(reward.ap)>0)s.permanent.ap=N(s.permanent.ap)+N(reward.ap);if(N(reward.energySpeed)>0)s.permanent.energySpeedFlat=N(s.permanent.energySpeedFlat)+N(reward.energySpeed);if(N(reward.energyPower)>0)s.permanent.energyPowerFlat=N(s.permanent.energyPowerFlat)+N(reward.energyPower);if(N(reward.energyBars)>0)s.permanent.energyBarsFlat=N(s.permanent.energyBarsFlat)+N(reward.energyBars);if(N(reward.magicPower)>0)s.permanent.magicPowerFlat=N(s.permanent.magicPowerFlat)+N(reward.magicPower);if(N(reward.magicBars)>0)s.permanent.magicBarsFlat=N(s.permanent.magicBarsFlat)+N(reward.magicBars);if(N(reward.magicCap)>0)s.permanent.magicCapFlat=N(s.permanent.magicCapFlat)+N(reward.magicCap);for(const k of ["r3PowerFlat","r3CapFlat","r3BarsFlat"])if(N(reward[k])>0)s.permanent[k]=N(s.permanent[k])+N(reward[k])}

const PORTRAIT_ARMOR_SLOTS_V1=["head","chest","legs","boots","weapon"];

function entreesSetsV1(){
  if(!__advCtx.SETS_ENTREES_V1){__advCtx.SETS_ENTREES_V1=Object.entries(SETS);__advCtx.SETS_OBJETS_ENTREES_V1=Object.entries(SETS_OBJETS_V1);__advCtx.SETS_TOUTES_ENTREES_V1=[...__advCtx.SETS_ENTREES_V1,...__advCtx.SETS_OBJETS_ENTREES_V1];}
  return __advCtx.SETS_ENTREES_V1;
}

function checkSets(s){
  /* Aucun objet au niveau maximal : aucun set ne peut être complet, on évite de les parcourir tous (cas de presque tous les joueurs, presque tout le temps). */
  let auMoinsUnMax=false;
  for(const k in s.itemList){if(idleAdventureNiveauEstMaxV1(s.itemList[k]?.maxLevel)){auMoinsUnMax=true;break}}
  if(!auMoinsUnMax){accorderConsommablesSetsV1(s);return}
  for(const [id,d] of entreesSetsV1()){if(s.completedSets[id])continue;const ok=d.slots.every(slot=>idleAdventureNiveauEstMaxV1(s.itemList[`${id}:${slot}`]?.maxLevel));if(!ok)continue;s.completedSets[id]=true;appliquerRecompenseSetV1(s,d.reward);if(id==="training")s.unlockFlags.trainingSetExp20V1=true}
  /* Sets d'objets hors équipement (SETS_OBJETS_V1) : complétés quand chaque objet a atteint le niveau 100. */
  for(const [id,d] of __advCtx.SETS_OBJETS_ENTREES_V1){if(s.completedSets[id])continue;if(!d.items.every(defId=>idleAdventureNiveauEstMaxV1(s.itemList[defId]?.maxLevel)))continue;s.completedSets[id]=true;appliquerRecompenseSetV1(s,d.reward)}
  accorderConsommablesSetsV1(s);
}

/*
 * Portrait automatique par set équipé (Norman, 2026-09-27) : "il ne faut pas qu'on perde nos images de
 * portrait quand on retire une pièce d'armure. Il faut qu'on ait remplacé entièrement le set porté pour
 * que l'image change." Un set complet inclut désormais l'arme (tête/torse/jambes/bottes/arme), en
 * respectant les slots RÉELS de chaque set (SETS[id].slots ci-dessus) plutôt qu'une liste fixe -- Edgy n'a
 * pas de bottes, Wanderer's et S'rerednaW n'ont pas d'arme, ils restent donc détectables sans ces pièces.
 * s.autoPortraitSet ne se met à jour QUE quand un set complet différent est identifié : retirer une pièce
 * (le calcul redevient "") ne l'efface jamais -- c'est la mémoire qui rend le portrait "collant".
 */
/*
 * Norman (2026-09-29) : « Le set de la forêt affiche l'image ...19. Je
 * voudrais qu'une fois que les 5 pièces soient montées au niveau 50 mini,
 * ce soit ...20 qui soit utilisée. Une fois que les 5 pièces sont au
 * niveau 100, il faut ...21. » tier = plus petit niveau parmi les pièces
 * du set actuellement équipées (le maillon faible) ; idle-portraits-v1.js
 * (idlePortraitForEquippedSetV1) choisit la variante Forest la plus
 * avancée dont le seuil est atteint. Calculé pour tout set (inoffensif
 * pour ceux qui n'ont qu'un seul portrait, jamais de variante à seuil).
 */
function armureCompleteSetIdV1(s){
  const eq=s.equipment||{};
  for(const [id,d] of Object.entries(SETS)){
    const requis=d.slots.filter(slot=>PORTRAIT_ARMOR_SLOTS_V1.includes(slot));
    if(!requis.length)continue;
    let tier=100;
    const complet=requis.every(slot=>{
      const wornId=eq[slot];
      if(!wornId)return false;
      const piece=s.inventory.find(x=>x&&x.id===wornId);
      if(!piece||piece.kind!=="equipment"||!piece.set)return false;
      const pieceSet=piece.set==="bothedgy"?"edgy":String(piece.set);
      if(pieceSet!==id)return false;
      tier=Math.min(tier,I(piece.level));
      return true;
    });
    if(complet)return{id,tier};
  }
  return null;
}

export function rafraichirAutoPortraitSetV1(s){
  const r=armureCompleteSetIdV1(s);
  if(r){s.autoPortraitSet=r.id;s.autoPortraitTier=r.tier;}
}

/*
 * Consommables donnés par la complétion d'un set (2026-09-23) : Forest (2
 * Energy potions α, 2 β, 2 Energy bar bars), HSB (1 Magic potion α, 1 β, 1
 * Magic bar bar), Gaudy (2 Lucky Charms), Incriminating Evidence (+1 de chaque
 * potion Resource 3 : α, β, δ). SOREAL n'a pas d'inventaire de consommables :
 * comme la roue quotidienne, ils sont activés immédiatement via les effets de
 * la boutique Sellout (idleSelloutApplyEffectV1, appliqué par le moteur méta à
 * partir de pendingSetConsumablesV1). Une seule fois par set
 * (setConsumablesGrantedV1), y compris pour un set complété avant ce correctif.
 */
const SET_REWARD_CONSUMABLES_V1=Object.freeze({energyPotionA:"energyPotionAlpha",energyPotionB:"energyPotionBeta",energyBarBar:"energyBarBar",magicPotionA:"magicPotionAlpha",magicPotionB:"magicPotionBeta",magicBarBar:"magicBarBar",luckyCharms:"luckyCharm",r3PotionAlpha:"resource3PotionAlpha",r3PotionBeta:"resource3PotionBeta",r3PotionDelta:"resource3PotionDelta",poop:"poop"});

function accorderConsommablesSetsV1(s){
  if(!s.setConsumablesGrantedV1||typeof s.setConsumablesGrantedV1!=="object")s.setConsumablesGrantedV1={};
  if(!s.pendingSetConsumablesV1||typeof s.pendingSetConsumablesV1!=="object")s.pendingSetConsumablesV1={};
  entreesSetsV1();
  for(const [id,d] of __advCtx.SETS_TOUTES_ENTREES_V1){
    if(!s.completedSets[id]||s.setConsumablesGrantedV1[id])continue;
    const lots=Object.entries(d.reward).filter(([k,v])=>SET_REWARD_CONSUMABLES_V1[k]&&I(v)>0);
    if(!lots.length)continue;
    for(const [k,v] of lots){const effet=SET_REWARD_CONSUMABLES_V1[k];s.pendingSetConsumablesV1[effet]=I(s.pendingSetConsumablesV1[effet])+I(v)}
    s.setConsumablesGrantedV1[id]=true;
  }
}
