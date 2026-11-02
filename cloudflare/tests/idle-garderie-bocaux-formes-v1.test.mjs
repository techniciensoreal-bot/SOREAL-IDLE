import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Garderie (Norman, 2026-11-01) : étiquette de niveau SOUS le bocal, une forme de récipient par apparence du chat (liquide contenu par un masque), ombrage du chat, cadrage du fond sur téléphone,
 * bocaux centrés sur la planche, flacons du chat coquet plus petits, vue ZOOM d'un bocal (le clic n'ouvre plus le popup, « Reprendre » l'ouvre).
 */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const formes = pub("modules/garderie-bocaux-formes-v1.js");
const zoom = pub("modules/garderie-zoom-v1.js");
const daycare = pub("modules/daycare-page-v1.js");
const html = pub("index.html");

/* 1. Le module de formes s'exécute et expose une forme DIFFÉRENTE pour chacune des 10 apparences (le défaut garde le bocal classique). */
const fakeDoc = { head: { appendChild() {} }, getElementById() { return null; }, createElement() { return { id: "", textContent: "" }; } };
const win = {};
vm.runInNewContext(formes, { window: win, document: fakeDoc, encodeURIComponent });
const F = win.__SOREAL_IDLE_GARDERIE_FORMES_V1__;
assert.ok(F && typeof F.css === "function");
const ids = ["noeud", "arcenciel", "fibonacci", "dore", "matrix", "chauvesouris", "tchernobyl", "pirate", "noel", "nega"];
assert.deepEqual(Object.keys(F.formes).sort(), ids.slice().sort(), "une forme par apparence (hors défaut)");
assert.equal(new Set(ids.map((i) => F.formes[i].d)).size, ids.length, "toutes les silhouettes sont différentes");
assert.equal(new Set(ids.map((i) => F.formes[i].deco)).size, ids.length, "tous les cadres sont différents");
assert.ok(!("defaut" in F.formes), "le défaut garde le bocal classique");
const css = F.css();
for (const id of ids) {
  assert.ok(css.includes('.gd-etagere[data-skin="' + id + '"] .gd-verre{'), "règle de vitre pour " + id);
}
/* 2. Le liquide reste contenu : la vitre est MASQUÉE par la silhouette (mask), le mécanisme du liquide n'est pas touché. */
assert.ok(/\.gd-verre\{[^}]*-webkit-mask:url\([^}]*mask:url\(/.test(css), "silhouette par mask");
assert.ok(!/\.gd-liq\s*\{/.test(css) && !css.includes("translateY"), "le calcul du liquide n'est pas modifié");
assert.ok(/\.gd-liq\{[^}]*transform|\.gd-liq\{position/.test(daycare), "le liquide garde son mécanisme dans la page");
/* 3. Étiquette SOUS le bocal : plus de bottom négatif sur la vitre, top = sous le pied. */
assert.ok(css.includes(".gd-pot .gd-niv-badge{top:calc(100% + 2.5cqw);bottom:auto"), "étiquette posée sous le bocal");
/* 4. Ombrage : ellipse statique par apparence, teinte propre à chaque chat, aucun filtre. */
assert.ok(css.includes(".gd-etagere::before{") && css.includes("radial-gradient(closest-side"), "ombre au sol");
for (const id of ["defaut", ...ids]) assert.ok(F.ombres[id], "teinte d'ombre pour " + id);
assert.notEqual(F.ombres.dore, F.ombres.matrix, "teintes différentes");
assert.ok(!/filter\s*:|drop-shadow|blur\(/.test(css), "aucun filtre coûteux");
assert.ok(!/animation|@keyframes/.test(css), "aucune animation dans les formes (rien à boucler)");
/* 5. Cadrage téléphone : media query < 900 px, variable --gd-s, ombre du plancher alignée sur les pieds. */
assert.ok(css.includes("@media (max-width:899px)") && css.includes("--gd-s:min(100cqw - 36px,520px)") && css.includes("fond-grenier-tel-v1.webp"), "cadrage téléphone");
assert.ok(css.includes("background-position:50% calc(18px + var(--gd-haut) + var(--gd-s) * 1.174 - var(--gd-s) * 1.5578)"), "position du fond calculée sur la scène");
/* 6. Pretty Kitty : flacons rangés 25 % plus petits, étiquette remise à taille, vue zoom à taille pleine. */
assert.ok(css.includes('.gd-etagere[data-skin="noeud"] .gd-pot:not(.gdz-pot) .gd-bocal{transform:scale(0.75)'), "flacons coquets plus petits");
assert.ok(css.includes('.gd-etagere[data-skin="noeud"] .gd-pot:not(.gdz-pot) .gd-niv-badge{transform:translateX(-50%) scale(1.333)'), "étiquette à taille normale");
/* 7. Pas de nouveau !important, pas de mot interdit. */
for (const [nom, src] of [["formes", formes], ["zoom", zoom]]) {
  assert.ok(!/!important/.test(src), nom + " : aucun !important");
  assert.ok(!/wiki/i.test(src.replace(/^\/\*[\s\S]*?\*\//, "")), nom + " : jamais « wiki »");
}
/* 8. Reduced-motion et boucle : la vue zoom joue UNE fois, coupée en mouvement réduit. */
assert.ok(zoom.includes("prefers-reduced-motion:reduce") && zoom.includes("animation:none"), "mouvement réduit");
assert.ok(/gdz-arrive[^;]*\.32s[^;]*1 both/.test(zoom) && !/infinite/.test(zoom), "arrivée jouée une seule fois");
/* 9. Vue zoom : le clic ne déclenche plus le popup, « Reprendre » le déclenche, couche gardée par le morph, dialogue accessible, durée jusqu'au niveau 100. */
assert.ok(zoom.includes("window.__garderieReprendreV1__=function") && zoom.includes("originalReprendre(id)"), "Reprendre appelle l'ancien popup");
assert.ok(/data-gdz-reprendre\]'\)\)\{fermer\(\);if\(typeof originalReprendre==='function'\)originalReprendre\(id\)/.test(zoom.replace(/\s+/g, " ").replace("t.closest&&t.closest('[data-gdz-reprendre]'","t.closest&&t.closest('[data-gdz-reprendre]'")) || zoom.includes("[data-gdz-reprendre]')){fermer();if(typeof originalReprendre"), "seul le bouton Reprendre ouvre le popup");
assert.ok(zoom.includes("data-morph-garder") && zoom.includes("'role','dialog'") && zoom.includes("aria-modal") && zoom.includes("Escape"), "couche gardée, dialogue, Échap");
assert.ok(zoom.includes("Niveau 100 dans") && zoom.includes("Niveau maximal atteint") && zoom.includes("(100-niv-v.p)/v.r"), "durée jusqu'au niveau 100 (même modèle de vitesse que la page)");
assert.ok(zoom.includes("Ranger") && zoom.includes("Prochain niveau dans"), "boutons et infos");
/* 10. Branchement : formes avant la page, zoom après ; la page appelle la feuille de formes après la sienne. */
const ordre = ["garderie-bocaux-formes-v1.js", "daycare-page-v1.js", "garderie-zoom-v1.js"].map((f) => html.indexOf("/modules/" + f));
assert.ok(ordre.every((i) => i > 0) && ordre[0] < ordre[1] && ordre[1] < ordre[2], "ordre des scripts");
assert.ok(daycare.includes("__SOREAL_IDLE_GARDERIE_FORMES_V1__") && daycare.includes("F.assurer()"), "feuille de formes posée après celle de la page");
/* 11. Textes anglais. */
const dico = JSON.parse(pub("modules/traduction-anglais-dict-v1.json"));
for (const k of ["Prochain niveau dans", "Niveau 100 dans", "Niveau maximal atteint", "Ranger", "Reprendre"]) assert.ok(dico[k], "traduction de « " + k + " »");
/* 12. Bocaux centrés sur la planche (écart <= 2 % de la largeur de la planche) pour toutes les apparences. */
{
  const w = {};
  vm.runInNewContext(pub("modules/etagere-skins-v1.js"), { window: w });
  const D = w.__SOREAL_IDLE_ETAGERE_SKINS_V1__;
  for (const id of D.ordre) {
    for (const c of D.skins[id].pots.compartiments) {
      const ecart = Math.abs((c.cx[0] + c.cx[1]) / 2 - (c.gauche + c.droite) / 2) / (c.droite - c.gauche) * 100;
      assert.ok(ecart <= 2, id + " : bocaux centrés sur la planche (" + ecart.toFixed(2) + " %)");
    }
  }
}
/* 13. Anti-spoil : les formes ne dépendent que de data-skin (apparence active, donc possédée). */
assert.ok(!/possedes|skins\.actif/.test(formes.replace(/\/\*[\s\S]*?\*\//g, "")), "aucune lecture des apparences non possédées");
/* 14. Marges (Norman, 2026-11-01 : « trop près du bord ») : marge latérale >= une demi-fiole pour toutes les apparences ; fond du bocal remonté de >= 1,6 % de l'image (>= 15 % de la profondeur d'une planche, dessus visible ≈ 4 %) depuis l'arête avant. */
{
  const w = {};
  vm.runInNewContext(pub("modules/etagere-skins-v1.js"), { window: w });
  const D = w.__SOREAL_IDLE_ETAGERE_SKINS_V1__;
  for (const id of D.ordre) {
    const p = D.skins[id].pots;
    for (const c of p.compartiments) {
      const marge = Math.min(c.cx[0] - p.larg / 2 - c.gauche, c.droite - (c.cx[1] + p.larg / 2));
      assert.ok(marge >= p.larg / 2, id + " : marge latérale >= une demi-fiole (" + marge.toFixed(2) + " %)");
    }
  }
  const m = /const REMONTEE_POSE=([0-9.]+)/.exec(daycare);
  assert.ok(m && Number(m[1]) >= 1.6, "fond du bocal remonté depuis l'arête avant de la planche");
  assert.ok(Number(m[1]) / 4 >= 0.15, "au moins 15 % de la profondeur de la planche");
}
/* 15. Pupilles en fente (Norman, 2026-11-01) : transform scaleX seulement, boucle parfaite, durées différentes, mouvement réduit = fente fixe, yeux non félins exclus. */
{
  const src = pub("modules/etagere-pupilles-v1.js");
  const w = {};
  vm.runInNewContext(src, { window: w, document: { getElementById() { return null; }, head: { appendChild() {} }, createElement() { return {}; } } });
  const P = w.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__;
  for (const id of ["arcenciel", "fibonacci", "matrix", "nega", "tchernobyl"]) assert.equal(P.html(id), "", id + " : yeux non félins, pas de fente");
  for (const id of ["defaut", "noeud", "dore", "chauvesouris", "pirate", "noel"]) assert.ok(P.html(id).includes("et-pf"), id + " : pupille fente");
  assert.equal(new Set(Object.values(P.skins).map((s) => s.d)).size, Object.keys(P.skins).length, "durées différentes d'un chat à l'autre");
  assert.equal(P.html("dore"), P.html("dore"), "rendu identique à chaque redessin (aucun saut)");
  assert.ok(src.includes("transform:scale(.17,1)") && !src.includes("@keyframes"), "retour exact à la fente (transition de transform, aucune boucle imparfaite)");
  assert.ok(src.includes("prefers-reduced-motion:reduce") && src.includes(".et-pf{transition:none}"), "mouvement réduit = fente fixe");
  assert.ok(!src.includes("filter:"), "aucun filtre");
  assert.ok(pub("modules/etagere-personnage-v1.js").includes("pupilleFente_(idSkin)"), "les yeux reçoivent la fente");
  const h = pub("index.html");
  assert.ok(h.indexOf("etagere-pupilles-v1.js") > 0 && h.indexOf("etagere-pupilles-v1.js") < h.indexOf("etagere-personnage-v1.js"), "script chargé avant les yeux");
}
console.log("OK idle-garderie-bocaux-formes-v1");
