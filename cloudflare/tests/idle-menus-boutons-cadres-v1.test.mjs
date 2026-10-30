/* Boutons de la barre de sélection des menus (Norman, 2026-10-30) : chaque petit bouton montre les DEUX GRANDS DESSINS du cadre de titre de son menu (mêmes images, extraites des feuilles des cadres).
   Menu ouvert = il brille ; fermé = sombre ; menu qui TRAVAILLE (classe travail-v1) = ses deux dessins s'animent, jamais du seul fait d'être ouvert.
   Gardes : aucun mot-clé de priorité forcée, un bloc par menu du jeu, animations en boucle parfaite et coupées en mouvement réduit, décor fourni par le HTML du bouton (règle n°4),
   aucun texte ni émoji dans le décor (règle n°2), couleurs dominantes toutes différentes. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireUiComplet } from "./_ui-sources.mjs";
import { deltaE } from "./_couleurs-v1.mjs";

const css = readFileSync("cloudflare/public/soreal-idle-menus-boutons-v1.css", "utf8");
const sansCom = css.replace(/\/\*[\s\S]*?\*\//g, "");
const ui = lireUiComplet();
const index = readFileSync("cloudflare/public/index.html", "utf8");
const entetes = ["a", "b", "c", "d"].map((x) => readFileSync(`cloudflare/public/soreal-idle-entetes-${x}.css`, "utf8")).join("\n") + readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");

assert.ok(!/!\s*important/i.test(css), "aucun !important");

/* un bloc par menu du jeu (liste lue dans le code, pas recopiée) */
const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["));
const MENUS = [...bloc.slice(0, bloc.indexOf("];")).matchAll(/\{id:'([A-Za-z]+)'/g)].map((m) => m[1]);
assert.ok(MENUS.length >= 30, "liste des menus lue");
const P = "html body.soreal-idle-active-v47 .soreal-idle-nav-v28 .soreal-idle-nav-button-v28";
const D = (id, part = "") => `${P}[data-menu-id-v1="${id}"] .soreal-idle-nav-deco-v1${part}`;
for (const id of MENUS) {
  assert.ok(sansCom.includes(D(id) + "{"), `${id} : décor absent`);
  assert.ok(sansCom.includes(D(id, "::after") + "{"), `${id} : anneau absent`);
  assert.ok(sansCom.includes(`${P}[data-menu-id-v1="${id}"].active .soreal-idle-nav-deco-v1{`), `${id} : état ouvert (il brille) absent`);
  for (const c of ["nb-g", "nb-d"]) {
    const m = sansCom.match(new RegExp(D(id, ` .${c}`).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{background:([^;]*)"));
    assert.ok(m && m[1].length > 10, `${id} : dessin ${c} absent`);
    assert.ok(!/inventé/.test(m[1]));
  }
  assert.ok(sansCom.includes(`${P}[data-menu-id-v1="${id}"].travail-v1 .soreal-idle-nav-deco-v1 .nb-g{animation:nbV1_`), `${id} : dessin gauche non animé au travail`);
  assert.ok(sansCom.includes(`${P}[data-menu-id-v1="${id}"].travail-v1 .soreal-idle-nav-deco-v1 .nb-d{animation:nbV1_`), `${id} : dessin droit non animé au travail`);
}
const vus = new Set([...sansCom.matchAll(/data-menu-id-v1="([^"]+)"/g)].map((m) => m[1]));
assert.deepEqual([...vus].sort(), [...MENUS].sort(), "aucune règle hors des menus du jeu");

/* les dessins sont CEUX du grand cadre : chaque image (hors dessins de secours des menus sans cadre à images) se retrouve dans les feuilles des cadres */
const SANS_IMAGE_DE_CADRE = new Set(["daycare"]);
for (const id of MENUS) {
  if (SANS_IMAGE_DE_CADRE.has(id)) continue;
  for (const c of ["nb-g", "nb-d"]) {
    const m = sansCom.match(new RegExp(D(id, ` .${c}`).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{background:([^;]*)"));
    const u = m[1].match(/^url\("[^"]+"\)/);
    if (u) assert.ok(entetes.includes(u[0]), `${id} : le dessin ${c} n'est pas celui du grand cadre`);
  }
}

/* l'animation ne tourne QUE quand le menu travaille : jamais sur .active seul, jamais au repos */
for (const x of sansCom.replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{([^{}]*\{[^}]*\}\s*)+\}/g, "").matchAll(/(^|\})\s*([^{}@]+)\{([^}]*)\}/gm)) {
  const sel = x[2].trim();
  if (!sel) continue;
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(P)), "sélecteur hors barre : " + sel.slice(0, 90));
  if (/animation:(?!none)/.test(x[3])) assert.ok(/\.travail-v1\b/.test(sel) && !/\.active\b/.test(sel), "animation hors menu qui travaille : " + sel.slice(0, 90));
}

/* boucle parfaite : chaque mouvement revient à son point de départ (ou tourne d'un tour complet) */
const kfs = [...sansCom.matchAll(/@keyframes (nbV1_[a-z]+)\{(.*)\}/g)];
const noms = [];
for (const line of sansCom.split("\n").filter((l) => l.startsWith("@keyframes"))) {
  const m = line.match(/^@keyframes (nbV1_[a-z]+)\{(.*)\}$/);
  assert.ok(m, "keyframes illisible : " + line.slice(0, 60));
  noms.push(m[1]);
  const c = m[2];
  assert.ok(/^0%,100%\{[^}]*\}50%\{[^}]*\}$/.test(c) || c === "from{transform:rotate(0)}to{transform:rotate(360deg)}", `${m[1]} : n'est pas une boucle parfaite : ${c.slice(0, 60)}`);
}
assert.ok(noms.length >= 4 && kfs.length >= 0);
for (const m of sansCom.matchAll(/animation:(nbV1_[a-z]+) ([\d.]+)s (linear|ease-in-out) infinite/g)) {
  assert.ok(noms.includes(m[1]), `${m[1]} : keyframes absent`);
  if (m[1] === "nbV1_spin") assert.equal(m[3], "linear", "la rotation complète est linéaire (aucun à-coup)");
}
/* le dessin de droite part d'une demi-période d'écart (pas de recopie synchrone) */
for (const m of sansCom.matchAll(/\.nb-d\{animation:nbV1_[a-z]+ ([\d.]+)s [a-z-]+ infinite;animation-delay:-([\d.]+)s/g)) assert.equal(Number(m[2]), Number(m[1]) / 2, "décalage d'une demi-période");

/* états : fermé = sombre, ouvert = brille */
assert.ok(/\.soreal-idle-nav-deco-v1\{[^}]*filter:brightness\(\.5\) saturate\(\.55\)/.test(sansCom), "menu fermé : sombre");
assert.ok(new RegExp(P.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\.active \\.soreal-idle-nav-deco-v1\\{filter:brightness\\(1\\.2\\)").test(sansCom), "menu ouvert : il brille");
assert.ok(/\.active \.soreal-idle-nav-deco-v1 \.nb-g,[^{]*\.nb-d\{filter:drop-shadow/.test(sansCom), "menu ouvert : les dessins brillent");

/* Norman (2026-10-30) : chaque menu a une couleur dominante DIFFÉRENTE de tous les autres */
const dom = {};
for (const id of MENUS) {
  const m = sansCom.match(new RegExp(`data-menu-id-v1="${id}"\\] \\.soreal-idle-nav-deco-v1\\{--nb-dom-v1:(#[0-9a-f]{6});`));
  assert.ok(m, `${id} : couleur dominante non déclarée (--nb-dom-v1)`);
  dom[id] = m[1];
  const deco = sansCom.match(new RegExp(`data-menu-id-v1="${id}"\\] \\.soreal-idle-nav-deco-v1\\{[^}]*\\}`))[0];
  const r = [1, 3, 5].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(",");
  assert.ok(deco.includes(`rgba(${r},`), `${id} : la lueur du décor n'est pas la couleur dominante`);
}
const ids = Object.keys(dom);
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const d = deltaE(dom[ids[i]], dom[ids[j]]);
  assert.ok(d >= 22, `${ids[i]} (${dom[ids[i]]}) et ${ids[j]} (${dom[ids[j]]}) ont des couleurs dominantes trop proches (écart ${d.toFixed(1)} < 22)`);
}
/* les cadres de titre des pages gardent leurs couleurs d'origine : aucune recoloration (Norman, 2026-10-30) */
assert.ok(!css.includes("hue-rotate") && !css.includes("[data-entete-menu]"), "les cadres de titre ne sont plus recolorés");

/* mouvement réduit */
const rm = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"));
assert.ok(/\.nb-g,[^{]*\.nb-d\{animation:none\}/.test(rm), "mouvement réduit non géré");

/* règle n°2 : plus d'émoji dans le bouton, aucun texte dans le décor */
for (const c of sansCom.matchAll(/content:([^;}]*)/g)) assert.equal(c[1].trim(), '""', "le décor ne doit contenir aucun texte : " + c[1]);
assert.ok(!/soreal-idle-nav-emoji-v2">\$\{m\.icon\}/.test(ui), "plus d'émoji dans les boutons du menu");
assert.ok(/\.soreal-idle-nav-cadre-v2\{visibility:hidden\}/.test(sansCom), "la pastille d'émoji ne s'affiche plus");

/* règle n°4 : les deux dessins sont des éléments du HTML du bouton (rien à remettre après un redessin), masqués aux lecteurs d'écran ; la feuille est chargée */
assert.ok(/<span class="soreal-idle-nav-deco-v1" aria-hidden="true"><i class="nb-g"><\/i><i class="nb-d"><\/i><\/span>\s*<span class="soreal-idle-nav-cadre-v2">/.test(ui), "dessins absents du bouton du menu");
assert.ok(/soreal-idle-menus-boutons-v1\.css\?v=\d+/.test(index), "feuille non chargée");
assert.ok(index.indexOf("soreal-idle-entetes-d.css") < index.indexOf("soreal-idle-menus-boutons-v1.css"), "ordre des feuilles");

/* « travaille » : un seul signal, celui de l'état du jeu (menus animés), jamais le menu ouvert ; les menus qu'on ne fait que consulter ne travaillent jamais */
assert.ok(ui.includes("idleMenuTravailleV1_(m.id,j)?' travail-v1':''"), "classe travail-v1 posée par le rendu de la barre");
assert.ok(/function idleMenuTravailleV1_\(id,j\)\{\s*return !IDLE_MENUS_CONSULTES_V1\[id\]&&idleMenuAlimenteV1_\(id,j\);/.test(ui), "travail = état d'alimentation sans les menus consultés");
assert.ok(ui.includes("b.classList.toggle('travail-v1',idleMenuTravailleV1_("), "mise à jour en direct de la classe");
assert.ok(!/travail-v1[^\n]*REG\.idleMenuActifV28/.test(ui.slice(ui.indexOf("function idleMenuTravailleV1_"), ui.indexOf("function idleMenuTravailleV1_") + 300)), "le menu ouvert ne fait pas travailler");
/* la barre se redessine avec le HTML : la classe y est déjà (aucune attente) ; un attribut posé hors rendu n'existe pas */
assert.ok(!ui.includes("data-travail-v1"), "pas d'attribut posé après coup");
/* la zone tactile n'est pas modifiée : aucune taille posée hors des dessins et du retrait du texte */
assert.ok(!/\b(height|min-height|min-width|margin)\s*:/.test(sansCom.replace(/\.nb-[gd][^{]*\{[^}]*\}/g, "")), "la feuille ne touche pas la taille des boutons");
console.log("ok idle-menus-boutons-cadres-v1");
