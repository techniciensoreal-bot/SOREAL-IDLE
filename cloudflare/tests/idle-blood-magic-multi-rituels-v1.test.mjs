import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Blood Magic : de la Magic dans PLUSIEURS rituels en même temps (Norman, 2026-10-07 : « on ne peut pas mettre de la magie dans plusieurs barres en même temps ; il me semble qu'on pouvait dans le jeu de base »).
 * Wiki NGU, page Blood Magic : chaque rituel donne son temps pour « 1000 magic, 1 magic power » -> chaque rituel a sa propre Magic. Chacun progresse avec la sienne, en même temps que les autres.
 */
const ctx = { bosses: 140 };
function depart() {
  let s = normalizeIdleNguState({}, ctx, 1000);
  s.systems.bloodMagic.unlocked = true;
  s.resources.magic.cap = 100000;
  s.resources.magic.current = 5000;
  s.currencies.gold = 1e18;
  return s;
}
const agir = (s, a, t = 2000) => applyIdleNguAction(s, a, ctx, t).state;
const vue = (s, t = 2000) => idleNguSnapshot(s, ctx, t).bloodMagicView;
const rit = (v, id) => v.rituals.find((x) => x.id === id);

// 1. Deux rituels reçoivent de la Magic ; chacun garde la sienne et la Magic libre baisse de la somme.
{
  let s = depart();
  s = agir(s, { action: "allocateRitual", ritual: "tack", value: 1000 });
  s = agir(s, { action: "allocateRitual", ritual: "papercuts", value: 500 });
  const v = vue(s);
  assert.equal(rit(v, "tack").magic, 1000);
  assert.equal(rit(v, "papercuts").magic, 500);
  assert.equal(s.systems.bloodMagic.allocation.magic, 1500, "le total du système est la somme des rituels");
  assert.ok(Math.abs(s.resources.magic.current - 3500) <= 5, "la Magic libre baisse de la somme placée (à la régénération près)");
  assert.equal(rit(v, "tack").secondsPerCompletion, 2000, "wiki : 1000 magic, 1 magic power -> 2 000 s pour le premier rituel");
  assert.equal(rit(v, "papercuts").secondsPerCompletion, 40000, "le deuxième rituel suit sa propre durée de base et sa propre Magic");
}

// 2. Les deux progressent EN MÊME TEMPS (avec de l'or) et rapportent chacun leur sang.
{
  let s = depart();
  s = agir(s, { action: "allocateRitual", ritual: "tack", value: 1000 });
  s = agir(s, { action: "allocateRitual", ritual: "papercuts", value: 1000 });
  const avant = s.currencies.blood;
  s = advanceIdleNguState(s, 20000, ctx, 22000);
  const r = s.systems.bloodMagic.data.rituals;
  assert.ok(r.tack.completions >= 1, "le rituel 1 a progressé");
  assert.ok(r.papercuts.completions >= 1, "le rituel 2 a progressé en même temps");
  assert.ok(s.currencies.blood > avant, "du sang gagné");
}

// 3. Retirer la Magic d'un seul rituel laisse l'autre intact ; la Magic est rendue.
{
  let s = depart();
  s = agir(s, { action: "allocateRitual", ritual: "tack", value: 1000 });
  s = agir(s, { action: "allocateRitual", ritual: "papercuts", value: 500 });
  s = agir(s, { action: "allocateRitual", ritual: "tack", value: 0 });
  const v = vue(s);
  assert.equal(rit(v, "tack") && rit(v, "tack").magic, 0, "le rituel 1 est vidé");
  assert.equal(rit(v, "papercuts").magic, 500, "le rituel 2 garde sa Magic");
  assert.equal(s.systems.bloodMagic.allocation.magic, 500);
  assert.ok(Math.abs(s.resources.magic.current - 4500) <= 5, "la Magic du rituel 1 est rendue");
}

// 4. Borne : on ne peut pas placer plus que la Magic libre ni plus que le plafond (réparti sur tous les rituels).
{
  let s = depart();
  s = agir(s, { action: "allocateRitual", ritual: "tack", value: 4000 });
  s = agir(s, { action: "allocateRitual", ritual: "papercuts", value: 4000 });
  assert.ok(Math.abs(rit(vue(s), "papercuts").magic - 1000) <= 5, "borné par la Magic libre restante");
  assert.ok(s.resources.magic.current <= 5);
}

// 5. Anciens clients : « allocate bloodMagic magic » vise le rituel sélectionné ; « Tout retirer » vide tous les rituels.
{
  let s = depart();
  s = agir(s, { action: "allocate", system: "bloodMagic", resource: "magic", value: 700 });
  assert.equal(rit(vue(s), "tack").magic, 700, "ancienne action : rituel sélectionné par défaut");
  s = agir(s, { action: "selectRitual", ritual: "papercuts" });
  s = agir(s, { action: "allocate", system: "bloodMagic", resource: "magic", value: 300 });
  assert.equal(rit(vue(s), "papercuts").magic, 300);
  assert.equal(rit(vue(s), "tack").magic, 700, "l'autre rituel garde sa Magic");
  s = agir(s, { action: "clearRitualAllocations" });
  assert.equal(s.systems.bloodMagic.allocation.magic, 0);
  assert.ok(Math.abs(s.resources.magic.current - 5000) <= 5, "toute la Magic est rendue");
}

// 6. Ancienne sauvegarde : une seule allocation pour le rituel actif, reportée sur ce rituel.
{
  let s = depart();
  s.systems.bloodMagic.allocation.magic = 800;
  s.resources.magic.current = 4200;
  s.systems.bloodMagic.data.activeRitual = "papercuts";
  const v = vue(s);
  assert.equal(rit(v, "papercuts").magic, 800, "migration : l'allocation unique va au rituel actif");
}
// 7. Les boutons du client appellent des fonctions exposées sur window (régression du 2026-10-07 : les trois étaient perdues, plus rien ne se plaçait).
import { readFileSync } from "node:fs";
const meta = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8") + "\n" + readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") /* Blood Magic vit dans son module depuis le 2026-10-07 */;
for (const nom of ["__ajusterBloodMagicIdleV1__", "__viderBloodMagicIdleV1__", "__ajusterRituelBloodMagicIdleV1__", "__presetBloodMagicIdleV1__"]) assert.ok(meta.includes("window." + nom + "="), "exposé : " + nom);
const appelles = new Set([...meta.matchAll(/window\.(__[A-Za-z0-9]*BloodMagic[A-Za-z0-9]*__)\(/g)].map((x) => x[1]));
for (const nom of appelles) assert.ok(meta.includes("window." + nom + "="), "appelé par la page mais jamais défini : " + nom);
console.log("idle-blood-magic-multi-rituels-v1: OK");
