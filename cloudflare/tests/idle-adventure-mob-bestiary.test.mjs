import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,IDLE_ADVENTURE_MOB_CATALOG_V1,IDLE_ADVENTURE_MOB_BESTIARY_V1,
  idleAdventureMobBestiaryEntryV1,monsterHpMaxForZoneV1WithMob,idleAdventureMobAttackFactorV1,
  idleAdventureMobTypeV1,idleAdventureBestiaryAverageV1,
  applyIdleAdventureActionV47,normalizeIdleAdventureStateV47
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-17, capture d'écran de la fiche wiki "A Small Piece of
 * Fluff") : "Pour les mobs aventure, tu dois cliquer sur l'onglet aventure
 * en dessous de la photo. Les statistiques des mobs ne sont pas bonnes...
 * il y a une version boss fight et une version adventure pour chaque
 * mobs. Tu dois connaitre les 2." Ce test verrouille que le mob RÉELLEMENT
 * tiré par un combat (monsterIndex) alimente désormais monsterHpMax/
 * mobAttackFactor/mobType depuis ses VRAIES stats d'onglet Adventure
 * (IDLE_ADVENTURE_MOB_BESTIARY_V1), jamais depuis une simple moyenne de
 * zone (z.oneHitP, qui reste le repli quand aucune donnée réelle n'est
 * connue pour ce monsterIndex précis).
 */

const zoneById=Object.fromEntries(IDLE_ADVENTURE_ZONES.map(z=>[z.id,z]));

// 1. Les 15 zones jouables (extension V2, miroir wiki local complet) ont
//    bien des entrées réelles non vides, jamais inventées.
for(const zoneId of ["tutorial","sewers","forest","cave","sky","hsb","clock","2d","ancient","avsp","mega","beardverse","badly","boring","chocolate"]){
  const bestiary=IDLE_ADVENTURE_MOB_BESTIARY_V1[zoneId];
  assert.ok(bestiary&&bestiary.normal&&bestiary.normal.length>0,`${zoneId} doit avoir au moins une entrée réelle normal[] (vérifiée au navigateur).`);
  for(const entry of [...bestiary.normal,...bestiary.boss]){
    assert.equal(typeof entry.name,"string");
    assert.ok(entry.name.length>0);
    assert.ok(entry.attackRate>0,`${zoneId}/${entry.name} : attackRate doit être un nombre réel positif sourcé du wiki.`);
    assert.ok(entry.power>0,`${zoneId}/${entry.name} : power doit être positif.`);
    assert.ok(entry.toughness>0,`${zoneId}/${entry.name} : toughness doit être positif.`);
    assert.ok(entry.maxHp>0,`${zoneId}/${entry.name} : maxHp doit être positif.`);
  }
}

/*
 * 2026-09-17 (extension bestiaire V2, design/build-idle-adventure-bestiary-v2.mjs) :
 * le miroir local complet du wiki (C:\Users\n0rma\Documents\NGU-Wiki\pages)
 * a remplacé la navigation manuelle page par page — Cave a maintenant ses
 * 16 ennemis réels au complet (13 normaux + 3 boss d'Aventure), plus les
 * 15 zones jouables au complet (voir cloudflare/tests/idle-ngu-real-names-bestiary-v2.test.mjs
 * pour le verrou détaillé par zone).
 */
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.cave.normal.length,13,"Cave : les 13 ennemis normaux réels (sourcés du miroir wiki local).");
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.cave.boss.length,3,"Cave : les 3 boss d'Aventure réels (A Fifth Giant Mole/Mega-Rat/Limburger Cheese).");

// 3. "safe" (Safety Zone) n'a jamais de combat (cf. IDLE_ADVENTURE_ZONES) :
//    aucune entrée bestiaire, jamais un canevas vide qui ferait illusion
//    de couverture.
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.safe,undefined,"Safety Zone n'a aucun combat : absente de IDLE_ADVENTURE_MOB_BESTIARY_V1.");

// 4. monsterHpMaxForZoneV1WithMob : les Max HP de l'onglet Adventure
//    NGU sont déjà la valeur finale de l'ennemi. oneHitP est une statistique
//    de recommandation joueur ("Power pour one-shot"), jamais un facteur
//    d'échelle à appliquer aux PV. Les trois premières zones sont verrouillées
//    ici avec leurs valeurs bestiaire réelles.
{
  assert.deepEqual(
    IDLE_ADVENTURE_MOB_BESTIARY_V1.tutorial.normal.map(x=>x.maxHp),
    [40,45,55],
    "Tutorial : Max HP réels des 3 mobs normaux."
  );
  assert.deepEqual(
    IDLE_ADVENTURE_MOB_BESTIARY_V1.tutorial.boss.map(x=>x.maxHp),
    [100],
    "Tutorial : A Small Mouse = 100 HP."
  );
  assert.deepEqual(
    IDLE_ADVENTURE_MOB_BESTIARY_V1.sewers.normal.map(x=>x.maxHp),
    [50,70,40],
    "Sewers : Max HP réels des 3 mobs normaux."
  );
  assert.deepEqual(
    IDLE_ADVENTURE_MOB_BESTIARY_V1.sewers.boss.map(x=>x.maxHp),
    [150],
    "Sewers : Brown Slime = 150 HP."
  );
  assert.deepEqual(
    IDLE_ADVENTURE_MOB_BESTIARY_V1.forest.normal.map(x=>x.maxHp),
    [400,420,450,900,515,500,200],
    "Forest : Max HP réels des 7 mobs normaux."
  );
  assert.deepEqual(
    IDLE_ADVENTURE_MOB_BESTIARY_V1.forest.boss.map(x=>x.maxHp),
    [500,600],
    "Forest : R.O.U.S/Gorgon = 500/600 HP."
  );

  assert.equal(monsterHpMaxForZoneV1WithMob(zoneById.tutorial,false,0),40);
  assert.equal(monsterHpMaxForZoneV1WithMob(zoneById.tutorial,true,0),100);
  assert.equal(monsterHpMaxForZoneV1WithMob(zoneById.sewers,false,2),40);
  assert.equal(monsterHpMaxForZoneV1WithMob(zoneById.sewers,true,0),150);
  assert.equal(monsterHpMaxForZoneV1WithMob(zoneById.forest,false,3),900);
  assert.equal(monsterHpMaxForZoneV1WithMob(zoneById.forest,true,1),600);

  const hp0=monsterHpMaxForZoneV1WithMob(zoneById.tutorial,false,0);
  const hp2=monsterHpMaxForZoneV1WithMob(zoneById.tutorial,false,2);
  assert.notEqual(hp0,hp2,"Deux mobs différents doivent garder leurs Max HP NGU distincts (40 vs 55), jamais une moyenne de zone.");
}

// 5. monsterHpMaxForZoneV1WithMob : mob réel INCONNU (monsterIndex=-1 ou
//    zone non couverte, ex. "safe" qui n'a jamais de combat) -> repli
//    garanti sur l'ancien calcul zone-plat, jamais un crash ni un 0.
{
  const z=zoneById.tutorial;
  assert.equal(monsterHpMaxForZoneV1WithMob(z,false,-1),Math.max(1,Math.floor(z.oneHitP)),"monsterIndex=-1 doit retomber sur l'ancien calcul zone-plat.");
  const zSafe=zoneById.safe;
  assert.equal(monsterHpMaxForZoneV1WithMob(zSafe,false,0),Math.max(1,Math.floor(zSafe.oneHitP||zSafe.t)),"Une zone sans bestiaire (safe) doit retomber sur l'ancien calcul zone-plat, jamais planter.");
  assert.equal(monsterHpMaxForZoneV1WithMob(zSafe,true,0),Math.max(1,Math.floor(zSafe.oneHitP||zSafe.t))*3,"Idem côté boss (×3, comportement historique inchangé).");
}

// 6. idleAdventureMobAttackFactorV1 : repli à 1 (comportement IDENTIQUE à
//    avant ce correctif) quand le mob réel est inconnu ; sinon un facteur
//    cohérent avec le Power/Attack Rate réel du mob face à sa zone.
{
  assert.equal(idleAdventureMobAttackFactorV1(zoneById.safe,false,0),1,"Zone sans bestiaire (safe) -> aucun ajustement (comportement historique préservé).");
  assert.equal(idleAdventureMobAttackFactorV1(zoneById.tutorial,false,-1),1,"monsterIndex=-1 -> aucun ajustement.");
  // Forest, index 5 = "Giant" (charger, power 30, attackRate 1.3), au
  // Power légèrement au-dessus de la moyenne forest (~30.5) mais à
  // l'Attack Rate plus lent -> facteur proche de 1, jamais aberrant.
  const facteur=idleAdventureMobAttackFactorV1(zoneById.forest,false,5);
  assert.ok(facteur>=.2&&facteur<=3,"Le facteur doit toujours rester dans la plage de sécurité [0.2, 3], jamais un multiplicateur aberrant.");
  // Sky, index 5 = "Icarus Proudbottom" (exploder, Attack Rate réel 9 —
  // beaucoup plus lent que la moyenne du ciel) -> facteur nettement réduit
  // par rapport à Sky index 4 (Ninja Samurai, rapid, Attack Rate 1.3).
  const facteurExploder=idleAdventureMobAttackFactorV1(zoneById.sky,false,5);
  const facteurRapid=idleAdventureMobAttackFactorV1(zoneById.sky,false,4);
  assert.ok(facteurExploder<facteurRapid,"Un mob avec un Attack Rate réel beaucoup plus lent (exploder) doit taper moins souvent qu'un mob 'rapid', donc un facteur de dégâts continus plus faible.");
}

// 7. idleAdventureMobTypeV1 : type réel exposé tel quel (pour la logique
//    de combat côté client, ex. exploder/poison), chaîne vide si inconnu.
{
  assert.equal(idleAdventureMobTypeV1(zoneById.forest,false,6),"exploder","Forest index 6 = Fairy (exploder), sourcé wiki.");
  assert.equal(idleAdventureMobTypeV1(zoneById.sewers,true,0),"poison","Sewers boss = Brown Slime (poison), sourcé wiki.");
  assert.equal(idleAdventureMobTypeV1(zoneById.safe,false,0),"","Zone sans bestiaire (safe) -> type inconnu, jamais un type inventé.");
}

// 8. Intégration bout-en-bout via applyIdleAdventureActionV47/
//    startZoneFight : le combat réel expose bien les données brutes du
//    bestiaire sur s.fight. Le client n'a donc jamais à déduire un nom ou
//    une statistique depuis un ancien catalogue d'illustrations.
{
  let s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"forest"},{bosses:17},1).state;
  const alea=Math.random;
  let f;
  try{
    /*
     * reskin forest.normal (catalogue d'images) a 7 entrées ; floor(0.99*7)=6.
     * Bestiaire forest.normal (V2, 7 entrées désormais -- "Rat of Unusual
     * Size" reclassé boss d'Aventure, cf. commentaire IDLE_ADVENTURE_MOB_BESTIARY_V1)
     * -> real forest normal[6] = "Fairy" (exploder, sourcé wiki).
     */
    Math.random=()=>0.99;
    f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:17,stats:{power:35,toughness:35}},2);
  }finally{Math.random=alea;}
  assert.equal(f.result.boss,false);
  assert.equal(f.result.monsterIndex,6);
  assert.equal(f.result.mobName,"Fairy","Le nom réel du bestiaire doit être transmis au combat.");
  assert.equal(f.result.mobPower,33,"Fairy : Power d'Aventure NGU transmis sans conversion.");
  assert.equal(f.result.mobToughness,31,"Fairy : Toughness d'Aventure NGU transmis sans conversion.");
  assert.equal(f.result.mobHpRegen,2,"Fairy : HP Regen d'Aventure NGU transmis sans conversion.");
  assert.equal(f.result.mobAttackRate,5,"Fairy : Attack Rate d'Aventure NGU transmis sans conversion.");
  assert.equal(f.result.mobType,"exploder","Fairy est de type exploder (sourcé wiki).");
  assert.ok(typeof f.result.mobAttackFactor==="number"&&f.result.mobAttackFactor>0,"mobAttackFactor doit être exposé au client sur s.fight, jamais recalculé côté APP (source de vérité unique).");
}

console.log("idle-adventure-mob-bestiary: OK");
