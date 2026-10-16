import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { normalizeIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";
import { consumeAdventureSkillItemV1 } from "../src/idle-adventure-combat.js";

/*
 * Norman (2026-10-16) : « j'ai eu Mysterious Red Liquid, je l'ai utilisé et aucun popup ne m'a dit ce que j'avais eu. » Boire un liquide mystérieux débloque une compétence du combat manuel d'Aventure :
 * le serveur répond avec l'objet bu, et le client ouvre un popup (competence-debloquee-v1.js) qui dit laquelle, sans rien dévoiler des autres liquides.
 */
// Serveur : la réponse nomme l'objet bu et le déblocage.
for (const [def, flag] of [["mysteriousRedLiquid", "hyperRegenUnlocked"], ["mysteriousPurpleLiquid", "beastModeUnlocked"], ["mysteriousGreyLiquid", "move69Unlocked"]]) {
  const s = normalizeIdleAdventureStateV47({});
  s.inventory.push({ id: "liq1", definitionId: def, consumable: true, level: 0 });
  const r = consumeAdventureSkillItemV1(s, "liq1");
  assert.equal(r.definitionId, def, "la réponse nomme l'objet bu");
  assert.equal(r.flag, flag);
  assert.equal(s.unlockFlags[flag], true, "compétence débloquée");
}

// Client : le popup annonce la compétence obtenue, et seulement celle-là.
function lancer() {
  const ajoutes = [];
  const el = () => ({ className: "", id: "", innerHTML: "", textContent: "", attrs: {}, classList: { contains: () => false }, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener() {}, parentNode: null });
  const doc = {
    createElement: () => el(), getElementById: (id) => ajoutes.find((x) => x.id === id) || null,
    head: { appendChild: (x) => { x.parentNode = doc.head; ajoutes.push(x); } },
    body: { appendChild: (x) => { x.parentNode = { removeChild: (y) => { const i = ajoutes.indexOf(y); if (i >= 0) ajoutes.splice(i, 1); } }; ajoutes.push(x); } }
  };
  const fen = { document: doc, String, Number };
  fen.window = fen;
  vm.runInNewContext(readFileSync("cloudflare/public/modules/competence-debloquee-v1.js", "utf8"), fen, { filename: "competence-debloquee-v1.js" });
  return { api: fen.__SOREAL_IDLE_COMPETENCE_V1__, popup: () => ajoutes.find((x) => x.id === "competence-debloquee-v1") };
}
const { api, popup } = lancer();
assert.equal(api.annoncer("mysteriousRedLiquid"), true);
const html = popup().innerHTML;
assert.ok(html.includes("Hyper Regen") && /mode manuel/.test(html), "dit quelle compétence et où elle sert");
assert.ok(!html.includes("Beast Mode") && !html.includes("Move 69"), "rien des autres liquides");
assert.equal(api.annoncer("autreChose"), false, "un objet inconnu n'ouvre rien");
api.annoncer("mysteriousPurpleLiquid");
assert.ok(popup().innerHTML.includes("Beast Mode") && !popup().innerHTML.includes("Hyper Regen"), "un seul popup à la fois, celui de la dernière compétence");

// Branchement : le retour de l'action « consumeSkillItem » appelle le popup ; le script est chargé par la page.
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(/payload\.adventure\.action==='consumeSkillItem'[\s\S]{0,120}__SOREAL_IDLE_COMPETENCE_V1__[\s\S]{0,120}annoncer\(res\.resultat\.definitionId\)/.test(meta), "popup appelé au retour de consumeSkillItem");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/competence-debloquee-v1.js?v="), "script chargé par la page");
console.log("idle-competence-debloquee-popup-v1: OK");
