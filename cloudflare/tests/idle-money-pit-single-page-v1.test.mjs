import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-24) : « Le money pit a encore 2 fonctions qui s'écrasent. On a le money pit avec l'image (celui que je veux garder)
 * et l'autre money pit, uniquement textuel (que je veux virer). »
 * Le module V49 (modules/ui.js) réécrivait la page Money Pit à image de meta-progression-v130.js avec une version texte seul.
 */
const ui = readFileSync("cloudflare/public/modules/ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

// La page texte a disparu de ui.js ; celle à image reste dans le module méta, seule page Money Pit.
for (const banni of ["rendreMoney_", "moneyEtat_", "MONEY PIT + DAILY SPIN", "Le puits et la roue", "data-v49-action=\"pit\"", "if(page==='moneyPit')"]) {
  assert.ok(!ui.includes(banni), "ui.js ne doit plus contenir : " + banni);
}
assert.ok(meta.includes('<img id="sorealIdleMoneyPitImageV209" src="/api/idle/media/banner?name=Money_Pit.jpg"'), "la page à image est conservée");
assert.match(meta, /if\(id==='moneyPit'\)return pageMoneyPitDailySpinIdleV206_\(j\);/);
assert.ok(index.includes("/modules/ui.js?v=50"));

// Comportement : sur la page Money Pit, ui.js ne touche plus au contenu de la page.
{
  let innerHTML = "<div id='page-a-image'>PAGE IMAGE</div>";
  const root = {
    isConnected: true, dataset: {}, classList: { add() {}, remove() {} },
    setAttribute() {}, addEventListener() {}, contains: () => true,
    get innerHTML() { return innerHTML; }, set innerHTML(v) { innerHTML = v; }
  };
  const bouton = { getAttribute: () => "window.__menuIdleV28__('moneyPit')" };
  let rappelObservateur = null;
  const appels = [];
  const document = {
    readyState: "complete", body: {}, head: { appendChild() {} },
    getElementById: () => null, createElement: () => ({}),
    querySelector: (sel) => (sel.includes("nav-button") ? bouton : sel.includes("page-root") ? root : null),
    querySelectorAll: () => [], addEventListener() {}
  };
  const joueur = { systemes: { currencies: { gold: 1e6 }, systems: [{ id: "moneyPit", state: { unlocked: true, data: {} } }] } };
  const window = {
    google: { script: { run: { withSuccessHandler() { return this; }, withFailureHandler() { return this; }, obtenirEtatSorealIdle() { appels.push("etat"); } } } },
    SOREAL_SESSION: "s"
  };
  class Observateur { constructor(cb) { rappelObservateur = cb; } observe() {} }
  vm.runInNewContext(ui, { window, document, MutationObserver: Observateur, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, Number, String, Array, Boolean, Object, console, SOREAL_SESSION: "s" });
  rappelObservateur([{ type: "childList", addedNodes: [{}] }]);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(innerHTML, "<div id='page-a-image'>PAGE IMAGE</div>", "la page Money Pit n'est plus réécrite");
  assert.equal(appels.length, 0, "ui.js ne lit même plus l'état pour Money Pit");
}

console.log("idle-money-pit-single-page-v1: OK");
