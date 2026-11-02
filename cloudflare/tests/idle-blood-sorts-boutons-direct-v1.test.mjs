// Blood Magic (Norman, 2026-11-02) : « pour que le sang soit pris en compte et qu'on puisse cliquer pour lancer le rituel, on doit changer d'onglet et revenir pour que le bouton soit cliquable ».
// Les boutons « Lancer le sort » suivent le sang reçu du moteur en direct (même minuterie que le chiffre « Sang collecté »), sans redessiner la page.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8").split(String.fromCharCode(13)).join("");
assert.ok(src.includes('data-sort-id="\'+idSort+\'" data-sang-mini="\'+sangMini+\'" data-recharge="\'+(recharge?\'1\':\'0\')+\'"'), "le sang minimum, la recharge et le sort sont posés sur chaque bouton au rendu");
const i = src.indexOf("function majBoutonsSortsV1_(){");
assert.ok(i > 0, "mise à jour directe des boutons");
const corps = src.slice(i, src.indexOf("\n}\n", i));
assert.ok(corps.includes("const sang=sangServeurV1_();") && corps.includes("sang>=mini&&!recharge") && corps.includes("b.disabled=false") && corps.includes("setAttribute('onclick',clic)") && corps.includes("b.disabled=true") && corps.includes("removeAttribute('onclick')"), "bouton activé (clic posé) dès que le sang suffit, désactivé sinon ; un sort en recharge n'est pas touché");
const boucle = src.slice(src.indexOf("setInterval(function(){\n  if(document.hidden)return;\n  const el=document.getElementById('sorealIdleBloodTotalV1');"));
assert.ok(boucle.includes("majBoutonsSortsV1_();") && boucle.indexOf("majBoutonsSortsV1_();") < boucle.indexOf("sorealIdleBloodOrV1"), "appelée à chaque tour de la minuterie existante de la page (aucune minuterie de plus)");
assert.ok(!/setTimeout/.test(corps), "aucune attente");
console.log("idle-blood-sorts-boutons-direct-v1 : OK");
// comportement : le même code, sur de faux boutons
{
  const vm = await import("node:vm");
  const fn = src.slice(i, src.indexOf("\n}\n", i) + 2);
  const bouton = (mini, recharge) => { const a = { "data-sang-mini": String(mini), "data-recharge": recharge, "data-sort-id": "ironPill", onclick: null }; return { disabled: true, textContent: "Pas assez de sang", getAttribute: (k) => (k in a ? a[k] : null), setAttribute: (k, v) => { a[k] = v; }, hasAttribute: (k) => a[k] != null && k === "onclick", removeAttribute: (k) => { a[k] = null; }, a }; };
  const b1 = bouton(100, "0"), b2 = bouton(1e4, "0"), b3 = bouton(1, "1");
  let sang = 50;
  const sb = { sangServeurV1_: () => sang, document: { querySelectorAll: () => [b1, b2, b3] } };
  vm.runInNewContext(fn + "; this.maj=majBoutonsSortsV1_;", sb);
  sb.maj();
  assert.equal(b1.disabled, true, "50 < 100 : inactif");
  sang = 150; sb.maj();
  assert.equal(b1.disabled, false, "150 >= 100 : actif sans changer de page");
  assert.equal(b1.a.onclick, "window.__lancerSortBloodIdleV1__('ironPill')");
  assert.equal(b1.textContent, "Lancer le sort");
  assert.equal(b2.disabled, true, "1e4 : toujours inactif");
  assert.equal(b3.disabled, true, "sort en recharge : jamais activé");
  sang = 10; sb.maj();
  assert.equal(b1.disabled, true, "le sang baisse (sort lancé) : de nouveau inactif");
  assert.equal(b1.a.onclick, null);
  console.log("idle-blood-sorts-boutons-direct-v1 (comportement) : OK");
}
