import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { annulerVictoireTitanV1, IDLE_ADVENTURE_TITANS } from "../src/idle-adventure-v47.js";

/* Norman (2026-10-04) : annuler la victoire de titan 1 obtenue par le bug. Opération admin, sur son propre compte. */
const d = IDLE_ADVENTURE_TITANS.find((x) => x.id === "t1");
const fresh = () => ({ titans: { t1: { kills: 1, rebirthKills: 1, nextAt: 9e12, hiddenPanel: "", hiddenSince: 0 } }, unlockItems: d.drop ? { [d.drop]: true } : {}, fight: { active: true, boss: true } });
{
  const s = fresh();
  const r = annulerVictoireTitanV1(s, "t1");
  assert.equal(s.titans.t1.kills, 0); assert.equal(s.titans.t1.rebirthKills, 0); assert.equal(s.titans.t1.nextAt, 0);
  assert.equal(r.kills, 0);
  if (d.drop) { assert.equal(s.unlockItems[d.drop], false, "l'objet de première victoire est retiré"); assert.equal(r.objetRetire, d.drop); }
  assert.equal(s.fight.active, false);
}
{
  const s = fresh(); s.titans.t1.kills = 3; s.titans.t1.rebirthKills = 3;
  annulerVictoireTitanV1(s, "t1");
  assert.equal(s.titans.t1.kills, 2, "une seule victoire annulée");
  if (d.drop) assert.equal(s.unlockItems[d.drop], true, "l'objet reste tant qu'il y a eu d'autres victoires");
}
assert.throws(() => annulerVictoireTitanV1({ titans: {}, unlockItems: {} }, "t1"), /TITAN_SANS_VICTOIRE/);
assert.throws(() => annulerVictoireTitanV1({ titans: { zz: { kills: 1 } } }, "zz"), /TITAN_SANS_VICTOIRE/, "titan inconnu");
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const bloc = rt.slice(rt.indexOf("function annulerVictoireTitanAdminSorealIdle"), rt.indexOf("function listerHistoiresAdminSorealIdle"));
assert.ok(bloc.includes("exigerAdminHistoiresSorealIdle_(sessionToken)") && bloc.includes("trouverLigneJoueurSorealIdle_(feuille, acces)"), "admin requis, sur son propre compte seulement");
console.log("idle-annuler-victoire-titan-v1: OK");
