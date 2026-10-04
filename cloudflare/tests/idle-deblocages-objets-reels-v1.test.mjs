import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47, annulerVictoireTitanV1, applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-10-04) : « j'étais censée avoir un objet dans mon inventaire (NGU, Wandoos) et non un menu à activer ; fais que ce soit bien des objets, même pour les futurs items ; vérifie que l'image est dans R2 ; retire la
 * copie de Wandoos 98 obtenue par le bug. »
 */
const base = () => normalizeIdleAdventureStateV47({});
const DEBLOCAGES = [["aNumber", "aNumber", "ngu"], ["giantSeed", "giantSeed", "yggdrasil"], ["scrapPaper", "scrap:paper", "diggers"], ["uugHair", "uugHair", "beards"], ["pissedOffKey", "pissedOffKey", "tower"], ["wandoos98", "wandoos98", "wandoos"]];

// 1. Une créance de déblocage devient un vrai objet du sac, pour chacun des six objets (et le drapeau s'éteint).
for (const [cle, definitionId] of DEBLOCAGES) {
  const s = base();
  s.unlockItems[cle] = true;
  const n = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(s)));
  const objet = n.inventory.find((x) => x.definitionId === definitionId);
  assert.ok(objet, `${definitionId} : un vrai objet dans le sac`);
  assert.ok(objet.wikiItemId > 0, `${definitionId} : l'image est retrouvée par son identifiant wiki (R2 idle/items)`);
  assert.equal(n.unlockItems[cle], false, `${definitionId} : plus de menu à activer`);
  // Stable : une deuxième normalisation ne crée pas de doublon.
  assert.equal(normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(n))).inventory.filter((x) => x.definitionId === definitionId).length, 1);
}
// 2. Déjà débloqué ou déjà possédé : rien n'est créé en double.
{
  const s = base(); s.unlockItems.aNumber = true; s.unlockFlags.ngu = true;
  const n = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(s)));
  assert.ok(!n.inventory.some((x) => x.definitionId === "aNumber"), "système déjà débloqué : pas d'objet");
  assert.equal(n.unlockItems.aNumber, false);
}
// 3. Sac plein : la créance reste (rien n'est perdu), elle se transforme en objet dès qu'une place se libère.
{
  const s = base();
  const rempli = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify(s)));
  let k = 0;
  while (rempli.inventory.length < 400 && k < 400) {
    rempli.inventory.push({ id: "p" + k, definitionId: "training:head", kind: "equipment", set: "training", slot: "head", name: "x", level: 0 });
    k += 1;
    const t = normalizeIdleAdventureStateV47(JSON.parse(JSON.stringify({ ...rempli, unlockItems: { wandoos98: true } })));
    if (t.unlockItems.wandoos98 === true) { rempli.__plein = true; break; }
  }
  assert.ok(rempli.__plein, "sac plein : le drapeau reste pour ne rien perdre");
}
// 4. Annulation de la victoire du titan 1 : le drapeau ET la copie de Wandoos 98 partent (un seul exemplaire, jamais si Wandoos est déjà débloqué).
{
  const s = base();
  s.titans.t1 = { kills: 1, rebirthKills: 1, nextAt: 9e12 };
  s.unlockItems.wandoos98 = true;
  s.inventory.push({ id: "w1", definitionId: "wandoos98", kind: "special", name: "Wandoos 98", level: 1 }, { id: "w2", definitionId: "wandoos98", kind: "special", name: "Wandoos 98", level: 3 });
  const r = annulerVictoireTitanV1(s, "t1");
  assert.equal(s.unlockItems.wandoos98, false);
  assert.ok(!s.inventory.some((x) => x.id === "w1") && s.inventory.some((x) => x.id === "w2"), "la plus basse copie part, l'autre reste");
  assert.ok(r.retires.includes("wandoos98:drapeau") && r.retires.includes("wandoos98:objet"));
  const deja = base(); deja.titans.t1 = { kills: 1, nextAt: 0 }; deja.unlockFlags.wandoos = true; deja.inventory.push({ id: "w1", definitionId: "wandoos98", kind: "special", name: "Wandoos 98", level: 1 });
  annulerVictoireTitanV1(deja, "t1");
  assert.ok(deja.inventory.some((x) => x.id === "w1"), "Wandoos déjà débloqué : on n'y touche pas");
}
// 5. Les six objets de déblocage ont tous un wikiItemId (image R2 vérifiée en direct le 2026-10-04 : Item_0102_A_Number, 0066 Wandoos, 0092 Giant Seed, 0141 UUG, 0172 Pissed Off Key, 0197 Scrap of Paper).
const { IDLE_ADVENTURE_WIKI_ITEM_IDS_V1: WIKI } = await import("../src/idle-adventure-v47.js");
for (const [id, wiki] of [["aNumber", 102], ["wandoos98", 66], ["giantSeed", 92], ["uugHair", 141], ["pissedOffKey", 172], ["scrap:paper", 197]]) assert.equal(WIKI[id], wiki, id);
// 6. Le menu de secours n'offre plus « Utiliser » : il dit seulement qu'une place manque.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("Libère une place dans ton sac : l’objet y arrivera") && !ui.includes("window.__consommerDeblocageAdventureIdleV47__(\''+idleHtml_(id)"));
console.log("idle-deblocages-objets-reels-v1: OK");
