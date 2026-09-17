import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,IDLE_ADVENTURE_MOB_CATALOG_V1,IDLE_ADVENTURE_MOB_BESTIARY_V1,
  idleAdventureMobBestiaryEntryV1,monsterHpMaxForZoneV1WithMob,idleAdventureMobAttackFactorV1,
  idleAdventureMobTypeV1,idleAdventureMobScaleV1,idleAdventureBestiaryAverageV1,
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

// 1. Les zones couvertes cette session (avatarLevel 1-4, priorité donnée par
//    Norman aux joueurs en cours de progression) ont bien des entrées
//    réelles non vides, jamais inventées au-delà de ce qui a été vérifié.
for(const zoneId of ["tutorial","sewers","forest","sky","hsb","clock","2d"]){
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

// 2. cave n'a QUE 3 des 16 ennemis réels vérifiés (Gorgonzola/Brie/Gouda) —
//    honnêteté de couverture partielle, jamais complétée par invention.
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.cave.normal.length,3,"Cave : seulement 3 mobs normaux réels vérifiés cette session (Gorgonzola/Brie/Gouda), le reste honnêtement absent plutôt qu'inventé.");
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.cave.boss.length,0,"Cave : aucun boss réel d'Aventure vérifié cette session (A Fifth Giant Mole/Mega Rat/Limburger Cheese) — repli sur l'ancien calcul zone-plat attendu.");

// 3. Zones non atteintes cette session (au-delà d'avatarLevel 4, ex.
//    Ancient Battlefield) : aucune entrée du tout, jamais un canevas vide
//    qui ferait illusion de couverture.
assert.equal(IDLE_ADVENTURE_MOB_BESTIARY_V1.ancient,undefined,"Ancient Battlefield (avatarLevel 5) n'a pas été vérifié cette session — honnêtement absent de IDLE_ADVENTURE_MOB_BESTIARY_V1.");

// 4. monsterHpMaxForZoneV1WithMob : mob réel connu -> PV dérivés de SES
//    propres stats (Max HP réel × facteur d'échelle de zone), jamais la
//    moyenne plate.
{
  const z=zoneById.tutorial;
  // index 0 -> "A Small Piece of Fluff", Max HP réel 40.
  const scale=idleAdventureMobScaleV1(z,IDLE_ADVENTURE_MOB_BESTIARY_V1.tutorial);
  const attendu=Math.max(1,Math.floor(40*scale));
  assert.equal(monsterHpMaxForZoneV1WithMob(z,false,0),attendu);
  // Chaque index doit donner un pool de PV DIFFÉRENT (variance réelle du
  // wiki, jamais le monolithe zone-plat d'avant ce correctif).
  const hp0=monsterHpMaxForZoneV1WithMob(z,false,0);
  const hp2=monsterHpMaxForZoneV1WithMob(z,false,2);
  assert.notEqual(hp0,hp2,"Deux mobs différents de la même zone doivent avoir des PV différents (A Small Piece of Fluff=40 vs A Stick?=55 réels), jamais la même moyenne figée.");
}

// 5. monsterHpMaxForZoneV1WithMob : mob réel INCONNU (monsterIndex=-1 ou
//    zone non couverte) -> repli garanti sur l'ancien calcul zone-plat,
//    jamais un crash ni un 0.
{
  const z=zoneById.tutorial;
  assert.equal(monsterHpMaxForZoneV1WithMob(z,false,-1),Math.max(1,Math.floor(z.oneHitP)),"monsterIndex=-1 doit retomber sur l'ancien calcul zone-plat.");
  const zAncient=zoneById.ancient;
  assert.equal(monsterHpMaxForZoneV1WithMob(zAncient,false,0),Math.max(1,Math.floor(zAncient.oneHitP)),"Une zone jamais vérifiée (ancient) doit retomber sur l'ancien calcul zone-plat, jamais planter.");
  assert.equal(monsterHpMaxForZoneV1WithMob(zAncient,true,0),Math.max(1,Math.floor(zAncient.oneHitP))*3,"Idem côté boss (×3, comportement historique inchangé).");
}

// 6. idleAdventureMobAttackFactorV1 : repli à 1 (comportement IDENTIQUE à
//    avant ce correctif) quand le mob réel est inconnu ; sinon un facteur
//    cohérent avec le Power/Attack Rate réel du mob face à sa zone.
{
  assert.equal(idleAdventureMobAttackFactorV1(zoneById.ancient,false,0),1,"Zone non couverte -> aucun ajustement (comportement historique préservé).");
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
  assert.equal(idleAdventureMobTypeV1(zoneById.forest,false,7),"exploder","Forest index 7 = Fairy (exploder), sourcé wiki.");
  assert.equal(idleAdventureMobTypeV1(zoneById.sewers,true,0),"poison","Sewers boss = Brown Slime (poison), sourcé wiki.");
  assert.equal(idleAdventureMobTypeV1(zoneById.ancient,false,0),"","Zone non couverte -> type inconnu, jamais un type inventé.");
}

// 8. Intégration bout-en-bout via applyIdleAdventureActionV47/
//    startZoneFight : le combat réel expose bien mobAttackFactor/mobType
//    sur s.fight, dérivés du VRAI mob tiré (même pool/même tirage que le
//    reskin déjà utilisé pour le nom/l'image, jamais un second tirage).
{
  let s=normalizeIdleAdventureStateV47({});
  s=applyIdleAdventureActionV47(s,{action:"selectZone",zone:"forest"},{bosses:17},1).state;
  const alea=Math.random;
  let f;
  try{
    // reskin forest.normal a 7 entrées ; floor(0.99*7)=6 -> real forest
    // normal[6] = "Rat of Unusual Size" (index 6 sur 8 réels, cf. tableau).
    Math.random=()=>0.99;
    f=applyIdleAdventureActionV47(s,{action:"startZoneFight"},{bosses:17,stats:{power:35,toughness:35}},2);
  }finally{Math.random=alea;}
  assert.equal(f.result.boss,false);
  assert.equal(f.result.monsterIndex,6);
  assert.equal(f.result.mobType,"normal","Rat of Unusual Size est de type normal (sourcé wiki).");
  assert.ok(typeof f.result.mobAttackFactor==="number"&&f.result.mobAttackFactor>0,"mobAttackFactor doit être exposé au client sur s.fight, jamais recalculé côté APP (source de vérité unique).");
}

console.log("idle-adventure-mob-bestiary: OK");
