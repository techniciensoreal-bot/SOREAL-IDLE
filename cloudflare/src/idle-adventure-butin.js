/*
 * Aventure : zones, tables de butin et tirages (audit d'architecture, 2026-10-16 : découpage de idle-adventure-v47.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { BOOSTS, C, I, N } from "./idle-adventure-base.js";
import { IDLE_ADVENTURE_MOB_BESTIARY_V1, IDLE_ADVENTURE_ZONES, idleAdventureBestiaryAverageV1 } from "./idle-adventure-zones.js";
import { SETS, SPECIALS, defById } from "./idle-adventure-sets.js";
import { base, boost, item, rollFreshEquipmentStatsV1, special } from "./idle-adventure-objets.js";
import { add } from "./idle-adventure-inventaire.js";
import { idleAdventureCubeTierV1 } from "./idle-adventure-combat.js";

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
/* Retour en Zone sûre AVEC sa raison (lue par le client, qui l'écrit dans le journal d'Aventure). */
export function versZoneSureV1(s,raison,detail,t=Date.now()){s.selectedZone="safe";s.retourSafe={raison:String(raison||"").slice(0,40),detail:String(detail||"").slice(0,160),at:Math.floor(N(t))}}

export function unlockedZone(z,bosses,difficulty,difficultyPeaks){
  if(!z.requiredDifficulty){
    /*
     * Norman (2026-10-02) : après un Rebirth, une zone se referme tant que le boss qui l'ouvre n'est pas retué DANS CE RUN (même s'il l'a été dans un run
     * précédent). Seule exception, celle du wiki (page Evil difficulty) : « Normal zones remain unlocked at all times » -- en Evil/Sadistic, les zones
     * Normal restent ouvertes grâce au pic atteint en Normal.
     */
    const horsNormal=difficulty==="difficile"||difficulty==="extreme";
    return I(bosses)>=I(z.boss)||(horsNormal&&I((difficultyPeaks||{}).normal)>=I(z.boss))
  }
  return difficulty===z.requiredDifficulty&&I(bosses)>=I(z.boss)
}

/* Zone NORMALE (sans difficulté requise) la plus avancée que le joueur peut atteindre maintenant, ou "safe" si aucune n'est ouverte (Adventure Advancer, Boutique AP). */
export function zoneNormalePlusAvanceeV1(bosses,difficulty,difficultyPeaks){
  const ouvertes=IDLE_ADVENTURE_ZONES.filter(z=>z.id!=="safe"&&!z.requiredDifficulty&&unlockedZone(z,bosses,difficulty,difficultyPeaks));
  return ouvertes.length?ouvertes[ouvertes.length-1].id:"safe";
}

/*
 * Zone refermée sous les pieds du joueur (Norman, 2026-10-02 : « je n'ai plus de combat en mode aventure qui se déclenchent »). Depuis que les zones
 * se referment après un Rebirth (unlockedZone), une zone d'Aventure déjà sélectionnée avant le Rebirth restait sélectionnée alors qu'elle était fermée :
 * chaque combat était refusé (ZONE_VERROUILLEE) et plus rien ne se lançait, sans aucun message. La sélection (et la dernière zone de combat) retombe
 * maintenant sur la zone ouverte la plus avancée -- jamais « Zone sûre » tant qu'une zone de combat est ouverte -- ; aucun combat en cours n'est touché.
 */
export function repliZonesFermeesV1(s,bosses,difficulty,difficultyPeaks){
  if(s.fight&&s.fight.active)return s;
  const ouvertes=IDLE_ADVENTURE_ZONES.filter(z=>z.id!=="safe"&&unlockedZone(z,bosses,difficulty,difficultyPeaks));
  const meilleure=ouvertes.length?ouvertes[ouvertes.length-1].id:"safe";
  const fermee=id=>{const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===id);return Boolean(z)&&z.id!=="safe"&&!unlockedZone(z,bosses,difficulty,difficultyPeaks)};
  if(fermee(s.selectedZone)){
    const ferme=IDLE_ADVENTURE_ZONES.find(x=>x.id===s.selectedZone);
    const detail=(ferme?ferme.name||ferme.id:s.selectedZone)+" : il faut avoir vaincu le boss "+I(ferme&&ferme.boss)+" dans ce run (tu en es au boss "+I(bosses)+")";
    /* at = 0 : ce repli est recalculé à chaque réponse (sans être enregistré) ; le client le repère à son texte, pas à une heure. */
    if(meilleure==="safe"){s.selectedZone="safe";s.retourSafe={raison:"zone_fermee",detail,at:0}}
    else{s.selectedZone=meilleure;s.retourSafe={raison:"zone_fermee",detail,at:0}}
  }
  if(fermee(s.lastCombatZone))s.lastCombatZone=meilleure==="safe"?"tutorial":meilleure;
  return s;
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
        {id:"lootyMcLootFace",chance:.01,level:0}, /* wiki, section Loot > Boss (audit 2026-09-23) */
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
        {id:"ghostTypewriter",chance:.0045,level:1},
        {id:"dragonWings",chance:.0015,level:4,mobName:"Mysterious Figure"} /* wiki : "MYSTERIOUS FIGURE (BOSS): Dragon Wings lvl 4 (0.15% base chance)" */
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
        {id:"aBeanie",chance:.0015,level:4}, /* wiki, section Loot > Boss (audit 2026-09-23) */
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
      specials:[
        {id:"ascendedForestPendant",chance:.01,level:0}, /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"fTank",chance:.002,level:1}
      ]
    }
  },
  beardverse:{
    normal:{
      boosts:[{strength:50,chance:.0035,cap:.25},{strength:100,chance:.0035,cap:.25}],
      specials:[{id:"beardComb",chance:.0002,level:1}]
    },
    boss:{
      equipment:[{chance:.01,set:"beardverse",level:1}],
      specials:[
        {id:"beardHairStrand",chance:.0002,level:5}, /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedForestPendant",chance:.006,level:1},
        {id:"beardComb",chance:.0002,level:1}
      ]
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
      specials:[
        {id:"lootyMcLootFace",chance:.0005,cap:.10,level:10}, /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"sirLooty",chance:.00001,cap:.01,level:5},
        {id:"ascendedAscendedForestPendant",chance:.0001,cap:.01,level:1},
        {id:"wandoosXl",chance:.00005,cap:.01,level:3}, /* wiki Badly Drawn World, Loot > Boss : "lvl 3 (0.005% base chance, up to 1% max)" */
        {id:"randomCrayons",chance:.000012,cap:.03,level:1}
      ]
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
      specials:[
        {id:"ascendedAscendedForestPendant",chance:.00007,cap:.01,level:5}, /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"wandoosXl",chance:.00003,cap:.01,level:8}, /* wiki Boring-Ass Earth, Loot > Boss : "lvl 8 (0.003% base chance, up to 1% max)" */
        {id:"sirLooty",chance:.000007,cap:.01,level:8},
        {id:"stealthiestArmour",chance:.000001,cap:.005,level:5,requiresCompletedSet:"stealth"},
        {id:"redLipstick",chance:.000006,cap:.02,level:1}
      ]
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
      specials:[
        {ids:["energyBarBarAccessory","magicBarBarAccessory"],chance:.00018,cap:.12,level:1,requiresCompletedSet:"choco"}, /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"candyCornNecklace",chance:.00008,cap:.016,level:1}
      ]
    }
  },
  /*
   * 2026-09-23 (audit NGU, parité wiki) : profils des 17 zones Evil/Sadistic,
   * remplaçant le repli universel inventé (22% set / 12% boost / 4% spécial,
   * force de boost = log2(1+boss/10)). Taux de base et plafonds ("up to") de la
   * section Loot de chaque page ; le cube root de la chance de drop reste appliqué
   * par idleAdventureDropChanceV2 (zoneUsesCubeRootDropV2).
   *
   * Audit des objets manquants (2026-09-23) : les accessoires propres à chaque
   * zone (Evil Bonus Accs), les Ascended Pendants et les Looties sont désormais
   * tirés avec les taux/plafonds/niveaux de la section Loot. Lignes volontairement
   * NON tirées (jamais de valeur de repli, règle n°1 AGENTS.md) :
   * - Chocolate World / The Evilverse / Pretty Pink Princess Land : "Ascended
   *   Ascended Ascended Pendant (0.1% + 0.0000001% / 0.15% + 0.00000001% /
   *   0.15% + 0.000000002% base chance)" -- notation "+" que le wiki n'explique
   *   nulle part ;
   * - The Aethereal Sea : "Ascended x6 Pendant lvl 16 chance ?" et "GALACTIC
   *   HERALD LOOTY lvl 16 chance ?" -- taux non publiés.
   */
  evilverse:{
    normal:{
      boosts:[{strength:200,chance:0.00012,cap:0.1},{strength:500,chance:0.00012,cap:0.1}],
      equipment:[{chance:0.00007,cap:0.08,definitions:["edgy:head","edgy:chest","edgy:legs","edgy:weapon","edgy:amulet","edgyboots:left","edgyboots:right"],level:1}],
      specials:[{id:"edgyMagicite",chance:0.00002,cap:0.011,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[
        {chance:0.00021,cap:0.12,definitions:["edgy:head","edgy:chest","edgy:legs","edgy:weapon","edgy:amulet","edgyboots:left","edgyboots:right"],level:1},
        {chance:0.000018,cap:0.12,definitions:["bothedgy:boots"],level:1,requiresCompletedSet:"edgyboots"}
      ],
      specials:[{id:"edgyMagicite",chance:0.00002,cap:0.011,level:1}] /* wiki, section Loot > Boss (audit 2026-09-23) */
    }
  },
  pinkprincess:{
    normal:{
      boosts:[{strength:500,chance:0.0001,cap:0.08},{strength:1000,chance:0.0001,cap:0.06}],
      equipment:[{chance:0.00003,cap:0.08,set:"pinkprincess",level:1}],
      specials:[{id:"creepyDoll",chance:0.000012,cap:0.013,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:0.0001,cap:0.12,set:"pinkprincess",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"creepyDoll",chance:0.000012,cap:0.013,level:1}
      ]
    }
  },
  metaland:{
    normal:{
      boosts:[{strength:1000,chance:0.00005,cap:0.07},{strength:2000,chance:0.00005,cap:0.07}],
      equipment:[{chance:0.000015,cap:0.04,set:"meta",level:1}],
      specials:[{id:"theExponential",chance:0.000006,cap:0.017,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:0.00005,cap:0.12,set:"meta",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX3Pendant",chance:0.00005,cap:0.03,level:5},
        {id:"sirLooty",chance:0.000012,cap:0.03,level:25},
        {id:"theExponential",chance:0.000006,cap:0.017,level:1}
      ]
    }
  },
  interdimensional:{
    normal:{
      boosts:[{strength:1000,chance:0.00003,cap:0.08},{strength:2000,chance:0.00003,cap:0.08}],
      equipment:[{chance:0.000011,cap:0.04,set:"party",level:1}],
      specials:[{id:"rushmoreNose",chance:0.000014,cap:0.017,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:0.000035,cap:0.12,set:"party",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX3Pendant",chance:0.000035,cap:0.12,level:10},
        {id:"sirLooty",chance:0.00001,cap:0.12,level:68},
        {id:"rushmoreNose",chance:0.000014,cap:0.017,level:1}
      ]
    }
  },
  typozone:{
    normal:{
      boosts:[{strength:1000,chance:0.000022,cap:0.08},{strength:2000,chance:0.000022,cap:0.08}],
      equipment:[{chance:0.000009,cap:0.04,set:"typo",level:1}],
      specials:[{id:"throOdignslug",chance:0.000004,cap:0.017,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:0.000025,cap:0.12,set:"typo",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX3Pendant",chance:0.000025,cap:0.12,level:10},
        {id:"sirLooty",chance:0.000006,cap:0.12,level:68},
        {id:"throOdignslug",chance:0.000004,cap:0.017,level:1}
      ]
    }
  },
  fadlands:{
    normal:{
      boosts:[{strength:2000,chance:0.000018,cap:0.08},{strength:5000,chance:0.000018,cap:0.08}],
      equipment:[{chance:0.000007,cap:0.04,set:"fad",level:1}],
      specials:[{id:"linkCable",chance:0.0000025,cap:0.017,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:0.000021,cap:0.12,set:"fad",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX3Pendant",chance:0.000021,cap:0.08,level:10},
        {id:"sirLooty",chance:0.000007,cap:0.08,level:68},
        {id:"linkCable",chance:0.0000025,cap:0.017,level:1}
      ]
    }
  },
  jrpgville:{
    normal:{
      boosts:[{strength:2000,chance:0.000015,cap:0.1},{strength:5000,chance:0.000015,cap:0.1}],
      equipment:[{chance:0.0000055,cap:0.04,set:"jrpg",level:1}],
      specials:[{id:"handCursor",chance:0.000002,cap:0.017,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:0.000018,cap:0.12,set:"jrpg",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX3Pendant",chance:0.000018,cap:0.12,level:10},
        {id:"sirLooty",chance:0.0000055,cap:0.12,level:68},
        {id:"handCursor",chance:0.000002,cap:0.017,level:1}
      ]
    }
  },
  radlands:{
    normal:{
      boosts:[{strength:2000,chance:6e-7,cap:0.15},{strength:5000,chance:6e-7,cap:0.15}],
      equipment:[{chance:2e-7,cap:0.05,set:"rad",level:1}],
      specials:[{id:"radMixtape",chance:8e-8,cap:0.017,level:1}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:6e-7,cap:0.15,set:"rad",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX4Pendant",chance:0.0000012,cap:0.12,level:1},
        {id:"kingLooty",chance:4e-7,cap:0.12,level:1},
        {id:"radMixtape",chance:8e-8,cap:0.017,level:1}
      ]
    }
  },
  backtoschool:{
    normal:{
      boosts:[{strength:5000,chance:4e-7,cap:0.1},{strength:10000,chance:4e-7,cap:0.1}],
      equipment:[{chance:1.5e-7,cap:0.05,set:"backtoschool",level:1}]
    },
    boss:{
      equipment:[{chance:4.5e-7,cap:0.15,set:"backtoschool",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX5Pendant",chance:4.5e-7,cap:0.12,level:1},
        {id:"emperorLooty",chance:1.5e-7,cap:0.12,level:1}
      ]
    }
  },
  westworld:{
    normal:{
      boosts:[{strength:5000,chance:2.5e-7,cap:0.15},{strength:10000,chance:2.5e-7,cap:0.15}],
      equipment:[{chance:1e-7,cap:0.05,set:"western",level:1}],
      specials:[{id:"beretta9mm",chance:2e-8,cap:0.12,level:1,requiresCompletedSet:"western"}] /* wiki, section Loot > Normal enemy (audit 2026-09-23) */
    },
    boss:{
      equipment:[{chance:3e-7,cap:0.15,set:"western",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"beretta9mm",chance:6e-8,cap:0.12,level:1,requiresCompletedSet:"western"},
        {id:"ascendedX5Pendant",chance:0.000001,cap:0.12,level:1},
        {id:"emperorLooty",chance:3e-7,cap:0.12,level:1}
      ]
    }
  },
  breadverse:{
    normal:{
      boosts:[{strength:5000,chance:1e-7,cap:0.15},{strength:10000,chance:1e-7,cap:0.15}],
      equipment:[{chance:4e-8,cap:0.04,set:"bread",level:1}]
    },
    boss:{
      equipment:[{chance:1.2e-7,cap:0.15,set:"bread",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX5Pendant",chance:4e-7,cap:0.12,level:5},
        {id:"emperorLooty",chance:1.2e-7,cap:0.12,level:5}
      ]
    }
  },
  seventies:{
    normal:{
      boosts:[{strength:10000,chance:6e-8,cap:0.15},{strength:10000,chance:6e-8,cap:0.15}],
      equipment:[{chance:2.5e-8,cap:0.04,set:"disco",level:1}]
    },
    boss:{
      equipment:[{chance:8e-8,cap:0.15,set:"disco",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX5Pendant",chance:2.5e-7,cap:0.12,level:15},
        {id:"emperorLooty",chance:8e-8,cap:0.12,level:15}
      ]
    }
  },
  halloweenies:{
    normal:{
      boosts:[{strength:10000,chance:4e-8,cap:0.15},{strength:10000,chance:4e-8,cap:0.15}],
      equipment:[{chance:1.6e-8,cap:0.04,set:"halloweenie",level:1}]
    },
    boss:{
      equipment:[{chance:5e-8,cap:0.15,set:"halloweenie",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX5Pendant",chance:1.6e-7,cap:0.12,level:40},
        {id:"emperorLooty",chance:6e-8,cap:0.12,level:40}
      ]
    }
  },
  construction:{
    normal:{
      boosts:[{strength:10000,chance:2.5e-8,cap:0.16},{strength:10000,chance:2.5e-8,cap:0.16}],
      equipment:[{chance:1e-8,cap:0.04,set:"construction",level:1}]
    },
    boss:{
      equipment:[{chance:3e-8,cap:0.15,set:"construction",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX6Pendant",chance:1e-7,cap:0.12,level:2},
        {id:"galacticHeraldLooty",chance:4e-8,cap:0.12,level:2}
      ]
    }
  },
  duckduck:{
    normal:{
      boosts:[{strength:10000,chance:2e-8,cap:0.17},{strength:10000,chance:2e-8,cap:0.17}],
      equipment:[{chance:8e-9,cap:0.05,set:"duck",level:1}]
    },
    boss:{
      equipment:[{chance:2.4e-8,cap:0.15,set:"duck",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX6Pendant",chance:8e-8,cap:0.12,level:4},
        {id:"galacticHeraldLooty",chance:3e-8,cap:0.12,level:4}
      ]
    }
  },
  netherregions:{
    normal:{
      boosts:[{strength:10000,chance:1.6e-8,cap:0.17},{strength:10000,chance:1.6e-8,cap:0.17}],
      equipment:[{chance:6e-9,cap:0.05,set:"dutch",level:1}]
    },
    boss:{
      equipment:[{chance:1.8e-8,cap:0.15,set:"dutch",level:1}],
      specials:[ /* wiki, section Loot > Boss (audit 2026-09-23) */
        {id:"ascendedX6Pendant",chance:6e-8,cap:0.12,level:8},
        {id:"galacticHeraldLooty",chance:2.4e-8,cap:0.12,level:8}
      ]
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
  if(lv>=1&&Math.random()<Math.min(1,N(s.setRewards.extraDropLevelChance)+N(s.bonusDropLevelChance)))lv++;
  return lv;
}

export function definitionEquipmentDropAdventureV2(s,definitionId,level){
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
  if(pool.requiresCompletedSet&&!s.completedSets[String(pool.requiresCompletedSet)])return null;
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

/*
 * Audit 2026-09-23 (sections Loot du wiki) -- trois formes de ligne en plus :
 * - requiresCompletedSet : "if <Set> complete, x% base chance" (ex. The
 *   Stealthiest Armour, A 9mm Beretta) ;
 * - ids : un seul jet pour "x% base chance ... for one of:" plusieurs objets
 *   (Energy/Magic Bar Bar (Accessory) en Chocolate World) ;
 * - mobName : butin propre à un ennemi nommé de la zone (Dragon Wings sur
 *   "MYSTERIOUS FIGURE (BOSS)" en Ancient Battlefield), même principe que le
 *   Ring of Apathy sur le Goblin de la Forêt (ctx.forceMobName).
 */
function rollSpecialAdventureV2(s,z,def,dropMult,mobName){
  const ids=Array.isArray(def.ids)&&def.ids.length?def.ids.map(String):[String(def.id||"")];
  if(!ids.every(x=>SPECIALS[x]))return null;
  if(def.requiresCompletedSet&&!s.completedSets[String(def.requiresCompletedSet)])return null;
  if(def.mobName&&String(mobName||"")!==String(def.mobName))return null;
  /*
   * Tutorial Cube (2026-09-27, Norman : « il ne soit plus possible de le looter à partir de ce
   * moment-là. Il n'y a plus que l'infinity cube. ») : une fois maxé, l'Infinity Cube prend sa
   * place définitivement -- aucune nouvelle copie ne doit plus jamais retomber, même par ce
   * pool de drop de boss de zone (Sewers, 10 %, record() -> idle-adventure-v47.js).
   */
  if(ids.includes("tutorialCube")&&s.unlockFlags?.tutorialCubeMaxed)return null;

  const firstGuaranteed=Boolean(ids.length===1&&def.firstGuaranteed&&!s.itemList[ids[0]]?.seen);
  if(!firstGuaranteed&&Math.random()>=idleAdventureDropChanceV2(def.chance,def.cap,dropMult,z))return null;

  const id=ids.length===1?ids[0]:ids[I(Math.random()*ids.length)];
  const source=SPECIALS[id];
  const level=def.level!=null?def.level:(source.dropLevel||0);
  return add(s,special(id,dropLevelAdventureV2(s,level)));
}

function rollProfileLootAdventureV2(s,z,boss,dropMult,mobName){
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
    const o=rollSpecialAdventureV2(s,z,def,dropMult,mobName);
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

export function rollKill(s,ctx){
  const z=IDLE_ADVENTURE_ZONES.find(x=>x.id===s.selectedZone)||IDLE_ADVENTURE_ZONES[0];
  if(!unlockedZone(z,ctx.bosses,ctx.difficulty,ctx.difficultyPeaks))throw Error("ZONE_VERROUILLEE");

  const kills=(s.zone.kills[z.id]||0)+1;
  s.zone.kills[z.id]=kills;
  const boss=ctx.forceBoss!=null?Boolean(ctx.forceBoss):kills%10===0;
  if(boss)s.zone.bossKills[z.id]=(s.zone.bossKills[z.id]||0)+1;
  /* Page Arbitrary Points : « Adventure Bosses : 1 AP tous les 10 boss ». */
  if(boss){s.permanent.adventureBossKills=I(s.permanent.adventureBossKills)+1;if(s.permanent.adventureBossKills%10===0)s.permanent.ap=N(s.permanent.ap)+1}

  /* 2026-09-23 : quand le moteur meta fournit un multiplicateur qui contient déjà l'équipement (set + Cube + objets), ne pas les recompter. */
  const dropMult=Math.max(
    .1,
    N(ctx.dropMultiplier,1)*
    (ctx.dropMultiplierIncludesGear?1:1+N(s.setRewards.drop)+idleAdventureCubeTierV1(s.cube).dropChancePct/100)
  );

  const exact=rollProfileLootAdventureV2(s,z,boss,dropMult,ctx.forceMobName);
  const out=exact===null?rollLegacyZoneLootAdventureV2(s,z,dropMult,ctx):exact;

  if(
    !boss&&z.id==="forest"&&String(ctx.forceMobName||"")==="Goblin"&&
    (I(ctx.bosses)>=100||Boolean(s.itemList.ringOfApathy?.seen))&&
    Math.random()<idleAdventureDropChanceV2(.008,1,dropMult,z)
  ){
    const ring=add(s,special("ringOfApathy",1));
    if(ring)out.push(ring);
  }

  /*
   * 2026-09-24 -- wiki « The Sky », Loot > Icarus Proudbottom : « Poop (0.05% base chance, up
   * to 0.5% max) » ; fiche « Icarus Proudbottom » : « the only enemy in The Sky that drops
   * Poop (base chance is 0.05%, the max chance is 0.5%) ». Une Poop par drop : cumulée dans
   * permanent.poop, versée dans state.selloutEffects.poop par crediterRecompensesAventure.
   */
  let poop=0;
  if(
    !boss&&z.id==="sky"&&String(ctx.forceMobName||"")==="Icarus Proudbottom"&&
    Math.random()<idleAdventureDropChanceV2(.0005,.005,dropMult,z)
  ){
    poop=1;
    s.permanent.poop=I(s.permanent.poop)+poop;
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
    gold=Math.max(1,Math.round((lo+Math.random()*(hi-lo))*goldDropsMult*Math.max(0,N(ctx.goldMultiplier,1))));
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

  return{zone:z.id,boss,drops:out.filter(Boolean),gold,experience,poop};
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

export function playerHpMaxForAdventureV1(stats){return Math.max(0,N(stats&&stats.hp))}
