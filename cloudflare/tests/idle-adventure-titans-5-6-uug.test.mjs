import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_TITANS,IDLE_ADVENTURE_SETS,
  normalizeIdleAdventureStateV47,applyIdleAdventureActionV47,idleAdventureSnapshotV47
} from "../src/idle-adventure-v47.js";

/*
 * Audit NGU 2026-09-23 : le butin des titans suit désormais les taux "base
 * chance" du wiki (plus d'objets garantis inventés). Les tests qui vérifient
 * "ce qui PEUT tomber" forcent donc le tirage à 0 (tout réussit).
 */
function tirageForce(valeur,fn){
  const avant=Math.random;
  Math.random=()=>valeur;
  try{return fn()}finally{Math.random=avant}
}


/*
 * Norman (2026-09-11) : "pas le choix" — suite du monde Normal apres les
 * 4 zones simples. Titan 6 (The Beast) : Norman a confirme que les 4
 * paliers de difficulte ne sont "pas un minijeu" ("il faut juste faire
 * certaines choses, non ?") — les 4 vrais paliers (Easy/Normal/Hard/
 * Brutal, seuils du wiki) SONT reproduits via
 * IDLE_ADVENTURE_TITANS[t6].difficulties. UUG's rings (set) : 5 anneaux
 * coequipables simultanement (pas 5 emplacements corps distincts) —
 * verifie que le moteur generique (equip/checkSets) gere ca sans code
 * dedie, en s'appuyant sur le fait qu'equip() traite deja tout
 * slot!=="accessory" demande comme un ajout au tableau accessories
 * (jamais un remplacement unique), et que le client route deja tout
 * slot hors du "coeur" (head/chest/legs/boots/weapon) vers "accessory"
 * (ADVENTURE_CORE_SLOTS_V138, Soreal_Idle_UI.html).
 * Titan 5 (Walderp) : voir idle-adventure-walderp-hide-and-seek.test.mjs
 * (cache-cache 5 formes, construit separement le 2026-09-11).
 */

const t6=IDLE_ADVENTURE_TITANS.find(x=>x.id==="t6");

assert.equal(t6.name,"The Beast");
assert.equal(t6.boss,132);
assert.equal(t6.cooldown/3600000,3.5,"Le respawn (cooldown) est UNIQUE et partage entre les 4 paliers, comme le wiki (une seule valeur affichee).");
/*
 * Idle P/T (2026-09-18) : idleP/idleT ajoutes a chaque palier, sources de
 * https://ngu-idle.fandom.com/wiki/Adventure_Mode, ligne "The Beast" —
 * voir le commentaire dedie au-dessus de IDLE_ADVENTURE_TITANS
 * (idle-adventure-v47.js) pour le detail de la verification.
 */
assert.deepEqual(
  t6.difficulties,
  {
    easy:{p:700000000,t:500000000,idleP:1e9,idleT:7e8},
    normal:{p:7000000000,t:5000000000,idleP:1e10,idleT:7e9},
    hard:{p:70000000000,t:50000000000,idleP:1e11,idleT:7e10},
    brutal:{p:700000000000,t:500000000000,idleP:1e12,idleT:7e11}
  },
  "Les 4 paliers doivent etre les vrais seuils Manual P/T du wiki (x10 a chaque palier), avec leur Idle P/T publie."
);
assert.equal(t6.requiresTitan,undefined,"t5/t6 ne doivent pas inventer un palier de chaine anti-skip non confirme par Norman.");

assert.deepEqual(
  [IDLE_ADVENTURE_SETS.uug.p,IDLE_ADVENTURE_SETS.uug.t,IDLE_ADVENTURE_SETS.uug.slots],
  [19332,19332,["ringGreed","ringMight","ringUtility","ringEnergy","ringMagic"]]
);
assert.deepEqual(IDLE_ADVENTURE_SETS.uug.reward,{experience:20000,ap:20000});
assert.deepEqual(
  [IDLE_ADVENTURE_SETS.wanderer.slots.length,IDLE_ADVENTURE_SETS.rerednaw.slots.length],
  [4,4],
  "Wanderer's/S'rerednaW n'ont que 4 pieces (pas de weapon) — le Cane est un objet a part, non repris."
);
assert.deepEqual(
  [IDLE_ADVENTURE_SETS.slimy.p,IDLE_ADVENTURE_SETS.slimy.t],
  [4484000,2154000]
);

// Titan 6 : le set Slimy tombe au kill, a n'importe quel palier — et
// sans difficulty explicite, repli sur "easy" (jamais une erreur).
{
  let s=normalizeIdleAdventureStateV47({});
  const t=tirageForce(0,()=>applyIdleAdventureActionV47(
    s,{action:"titan",titan:"t6"},{bosses:132,stats:{power:700000000,toughness:500000000}},1000
  ));
  assert.ok(t.result.drops.some(x=>x.set==="slimy"));
  assert.equal(t.result.difficulty,"easy");
  // Wiki The Beast : Slimy = 0,05 % de base par pièce, jamais garanti.
  const sans=tirageForce(0.999999,()=>applyIdleAdventureActionV47(
    normalizeIdleAdventureStateV47({}),{action:"titan",titan:"t6"},{bosses:132,stats:{power:700000000,toughness:500000000}},1000
  ));
  assert.equal(sans.result.drops.some(x=>x.set==="slimy"),false,"Slimy ne doit plus tomber à coup sûr.");
  assert.equal(sans.result.experience,750,"The Beast : 750 EXP");
  assert.ok(sans.result.gold>=20000000&&sans.result.gold<=25000000);
  assert.equal(sans.result.ppProgress,250000,"The Beast : 250 000 de progression de PP");
}

// Titan 6 : un palier trop faible pour les stats du joueur doit refuser
// le combat (chaque palier a son propre seuil, x10 le precedent).
{
  const s=normalizeIdleAdventureStateV47({});
  assert.throws(
    ()=>applyIdleAdventureActionV47(
      s,{action:"titan",titan:"t6",difficulty:"normal"},{bosses:132,stats:{power:700000000,toughness:500000000}},1
    ),
    /PUISSANCE_INSUFFISANTE/,
    "Les stats du palier Easy ne doivent jamais suffire pour Normal (x10)."
  );
}

// Titan 6 : le butin bonus s'accumule STRICTEMENT avec la difficulte
// (jamais moins qu'un palier inferieur), garanti (pas un jet aleatoire
// a % comme le wiki — titan() ne tire jamais au hasard aujourd'hui).
{
  const easy=applyIdleAdventureActionV47(
    normalizeIdleAdventureStateV47({}),
    {action:"titan",titan:"t6",difficulty:"easy"},
    {bosses:132,stats:{power:700000000,toughness:500000000}},1
  ).result;
  assert.equal(easy.drops.some(x=>x.definitionId==="shrunkenVoodooDoll"),false);

  const normal=tirageForce(0,()=>applyIdleAdventureActionV47(
    normalizeIdleAdventureStateV47({}),
    {action:"titan",titan:"t6",difficulty:"normal"},
    {bosses:132,stats:{power:7000000000,toughness:5000000000}},1
  )).result;
  assert.ok(normal.drops.some(x=>x.definitionId==="shrunkenVoodooDoll"));
  assert.equal(normal.drops.some(x=>x.definitionId==="pricelessVanGoghPainting"),false);

  const hard=tirageForce(0,()=>applyIdleAdventureActionV47(
    normalizeIdleAdventureStateV47({}),
    {action:"titan",titan:"t6",difficulty:"hard"},
    {bosses:132,stats:{power:70000000000,toughness:50000000000}},1
  )).result;
  assert.ok(hard.drops.some(x=>x.definitionId==="shrunkenVoodooDoll"));
  assert.ok(hard.drops.some(x=>x.definitionId==="pricelessVanGoghPainting"));
  assert.equal(hard.drops.some(x=>x.definitionId==="smallGerbil"),false);

  const randomAvant=Math.random;
  let brutal;
  try{
    /*
     * Small Gerbil est un vrai jet rare (0,0001 %). Le test force le jet
     * gagnant au lieu de dépendre du hasard du runner CI.
     */
    Math.random=()=>0;
    brutal=applyIdleAdventureActionV47(
      normalizeIdleAdventureStateV47({}),
      {action:"titan",titan:"t6",difficulty:"brutal"},
      {bosses:132,stats:{power:700000000000,toughness:500000000000}},1
    ).result;
  }finally{
    Math.random=randomAvant;
  }
  assert.ok(brutal.drops.some(x=>x.definitionId==="shrunkenVoodooDoll"));
  assert.ok(brutal.drops.some(x=>x.definitionId==="pricelessVanGoghPainting"));
  assert.ok(brutal.drops.some(x=>x.definitionId==="smallGerbil"));
}

// Un difficulty inconnu/absent ne doit jamais planter (repli "easy").
{
  const s=normalizeIdleAdventureStateV47({});
  assert.doesNotThrow(()=>
    applyIdleAdventureActionV47(
      s,{action:"titan",titan:"t6",difficulty:"legendaire-invente"},
      {bosses:132,stats:{power:700000000,toughness:500000000}},1
    )
  );
}

/*
 * V149 — bug trouve en verifiant l'inventaire complet du monde Normal
 * (Norman, 2026-09-11 : "tu as termine d'adapter le mode normal
 * alors ?") : le set uug etait defini et se completait correctement une
 * fois les objets obtenus (test ci-dessous), mais titan() n'avait
 * JAMAIS de branche id==="t4" pour le faire reellement tomber au
 * combat — UUG etait battable indefiniment sans jamais droper son
 * propre set en jeu normal. Ce test verrouille que vaincre t4 (le vrai
 * titan, pas un addItem manuel) drop reellement le set uug, comme
 * t1/t3/t5/t6 dropent deja le leur.
 */
{
  let s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"addItem",definitionId:"ringOfApathy",level:100},{bosses:100},1).state;
  s.unlockFlags.diggers=true;
  s.titans.t3={kills:28,nextAt:0};
  const t=tirageForce(0,()=>applyIdleAdventureActionV47(
    s,{action:"titan",titan:"t4"},{bosses:100,stats:{power:1e6,toughness:1e6}},2
  ));
  assert.ok(
    t.result.drops.some(x=>x.set==="uug"),
    "Vaincre UUG (t4) doit reellement faire tomber une piece du set uug, pas seulement debloquer 'beards'."
  );
}

// UUG's rings : les 5 anneaux se completent via equip("accessory") pour
// chacun (jamais un remplacement d'un seul emplacement partage) — le
// moteur ne doit avoir AUCUN code dedie a "uug" dans equip()/checkSets(),
// la completion doit marcher exactement comme n'importe quel autre set.
{
  let s=normalizeIdleAdventureStateV47({});
  for(const slot of IDLE_ADVENTURE_SETS.uug.slots){
    const added=applyIdleAdventureActionV47(
      s,{action:"addItem",definitionId:`uug:${slot}`,level:100},{bosses:100},1
    );
    s=added.state;
    const itemId=s.inventory[s.inventory.length-1].id;
    s=applyIdleAdventureActionV47(
      s,{action:"equip",id:itemId,slot:"accessory"},{bosses:100},1
    ).state;
  }
  assert.equal(s.completedSets.uug,true,"Les 5 anneaux equipes en accessory doivent completer le set uug.");
  assert.equal(s.equipment.accessories.length,5,"Les 5 anneaux doivent coexister dans accessories, aucun ne doit en remplacer un autre.");
  assert.equal(s.setRewards.experience,20000);
  assert.equal(s.setRewards.ap,20000);
}

// Snapshot : le nouveau titan apparait avec le meme contrat que les 4
// existants (deblocage par seuil de boss reel).
{
  const s=normalizeIdleAdventureStateV47({});
  const snap131=idleAdventureSnapshotV47(s,131);
  const snap132=idleAdventureSnapshotV47(s,132);
  assert.equal(snap131.titans.find(x=>x.id==="t6").progressionUnlocked,false);
  assert.equal(snap132.titans.find(x=>x.id==="t6").progressionUnlocked,true);
}

console.log("idle-adventure-titans-5-6-uug: OK");
