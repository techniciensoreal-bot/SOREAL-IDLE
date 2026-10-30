/* Boutons de la barre de sélection des menus (Norman, 2026-10-30) : chaque bouton reprend en mini le cadre de titre de son menu et le menu actif a son animation.
   Gardes : aucun mot-clé de priorité forcée, un bloc par menu du jeu, animations en boucle parfaite et coupées en mouvement réduit, décor fourni par le HTML du bouton
   (règle n°4), aucun texte dans le décor (règle n°2). */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireUiComplet } from "./_ui-sources.mjs";
import { deltaE } from "./_couleurs-v1.mjs";

const css = readFileSync("cloudflare/public/soreal-idle-menus-boutons-v1.css", "utf8");
const sansCom = css.replace(/\/\*[\s\S]*?\*\//g, "");
const ui = lireUiComplet();
const index = readFileSync("cloudflare/public/index.html", "utf8");

assert.ok(!/!\s*important/i.test(css), "aucun !important");

/* un bloc par menu du jeu (liste lue dans le code, pas recopiée) */
const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["));
const MENUS = [...bloc.slice(0, bloc.indexOf("];")).matchAll(/\{id:'([A-Za-z]+)'/g)].map((m) => m[1]);
assert.ok(MENUS.length >= 30, "liste des menus lue");
const P = "html body.soreal-idle-active-v47 .soreal-idle-nav-v28 .soreal-idle-nav-button-v28";
const HP = "html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28";
const kf = (id) => sansCom.match(new RegExp(`@keyframes nbV1_${id}\\{([\\s\\S]*?\\}\\})`));
for (const id of MENUS) {
  const deco = `${P}[data-menu-id-v1="${id}"] .soreal-idle-nav-deco-v1`;
  assert.ok(sansCom.includes(deco + "{"), `${id} : décor absent`);
  assert.ok(sansCom.includes(deco + "::after{"), `${id} : anneau lumineux absent`);
  assert.ok(sansCom.includes(`${P}[data-menu-id-v1="${id}"].active .soreal-idle-nav-deco-v1`), `${id} : état actif absent`);
  assert.ok(kf(id), `${id} : animation du menu actif absente (keyframes nbV1_${id})`);
  assert.ok(sansCom.includes(`animation:nbV1_${id} `), `${id} : animation non branchée`);
}
const vus = new Set([...sansCom.matchAll(/data-menu-id-v1="([^"]+)"/g)].map((m) => m[1]));
assert.deepEqual([...vus].sort(), [...MENUS].sort(), "aucune règle hors des menus du jeu");

/* toute règle vise le bouton de la barre (préfixe renforcé) ; l'animation ne tourne que sur le bouton actif (le décor inactif est fixe) */
for (const x of sansCom.replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{([^{}]*\{[^{}]*\}\s*)+\}/g, "").matchAll(/(^|\})\s*([^{}@]+)\{([^}]*)\}/gm)) {
  const sel = x[2].trim();
  if (!sel || sel.startsWith("@property")) continue;
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(P) || s.trim().startsWith(HP)), "sélecteur hors barre : " + sel.slice(0, 90));
  if (/animation:(?!none)/.test(x[3])) assert.ok(/\.active\b/.test(sel), "animation hors bouton actif : " + sel.slice(0, 90));
}

/* boucle parfaite : une tuile qui défile glisse d'EXACTEMENT sa taille ; départ et arrivée des autres sont identiques ou invisibles */
for (const id of MENUS) {
  const m = kf(id)[1];
  const regle = sansCom.match(new RegExp(`\\.active \\.soreal-idle-nav-deco-v1::before\\{([^}]*animation:nbV1_${id} [^}]*)\\}`));
  const deco = regle ? regle[1] : "";
  if (/from\{background-position/.test(m) && /to\{background-position/.test(m)) {
    const from = m.match(/from\{background-position:([^}]*)\}/)[1].split(",").map((s) => s.trim());
    const to = m.match(/to\{background-position:([^}]*)\}/)[1].split(",").map((s) => s.trim());
    assert.equal(from.length, to.length, `${id} : couches de départ et d'arrivée différentes`);
    const tuiles = [...deco.matchAll(/\/(\d+)px (\d+)px/g)].map((t) => [Number(t[1]), Number(t[2])]);
    if (tuiles.length) from.forEach((f, i) => {
      const [fx, fy] = f.split(/\s+/), [tx, ty] = to[i].split(/\s+/);
      const px = (s) => (/px$/.test(s) ? parseFloat(s) : /^0%?$/.test(s) ? 0 : NaN);
      const dx = Math.abs(px(tx) - px(fx)), dy = Math.abs(px(ty) - px(fy));
      if (Number.isNaN(dx) || Number.isNaN(dy)) return; /* positions en pourcentage : balayage d'un motif plus grand que la boîte, invisible aux deux bouts */
      const [W, H] = tuiles[Math.min(i, tuiles.length - 1)];
      assert.ok((dx === 0 || dx === W) && (dy === 0 || dy === H), `${id} : couche ${i} glisse de ${dx}x${dy}, la tuile fait ${W}x${H}`);
    });
  } else if (/from\{transform:rotate\(0\)\}to\{transform:rotate\(360deg\)\}/.test(m)) {
    /* rotation complète */
  } else if (/0%,100%\{/.test(m) || /to\{--nb-ang-v1:360deg\}/.test(m)) {
    /* départ = arrivée */
  } else if (/0%,55%\{background-position:100% 0/.test(m)) {
    /* étoile filante : hors champ au départ et à l'arrivée */
  } else assert.fail(`${id} : animation qui n'est pas une boucle connue : ${m.slice(0, 80)}`);
}
/* les défilements en bande sont masqués aux bouts */
for (const id of ["entrainement", "moneyPit", "avance", "aventure", "hacks", "challenges", "daycare"]) {
  const regle = sansCom.match(new RegExp(`\\.active \\.soreal-idle-nav-deco-v1::before\\{[^}]*animation:nbV1_${id} [^}]*\\}`));
  assert.ok(regle && /mask:linear-gradient\((180|90)deg,transparent,/.test(regle[0]), `${id} : bords du défilement non masqués`);
}

/* Norman (2026-10-30) : chaque menu a une couleur dominante DIFFÉRENTE de tous les autres (jamais deux fois la même, pas juste deux verts proches) */
const dom = {};
for (const id of MENUS) {
  const m = sansCom.match(new RegExp(`data-menu-id-v1="${id}"\] \.soreal-idle-nav-deco-v1\{--nb-dom-v1:(#[0-9a-f]{6});`));
  assert.ok(m, `${id} : couleur dominante non déclarée (--nb-dom-v1)`);
  dom[id] = m[1];
  const deco = sansCom.match(new RegExp(`data-menu-id-v1="${id}"\] \.soreal-idle-nav-deco-v1\{[^}]*\}`))[0];
  const r = [1, 3, 5].map((i) => parseInt(m[1].slice(i, i + 2), 16)).join(",");
  assert.ok(deco.includes(`rgba(${r},`), `${id} : la lueur du décor n'est pas la couleur dominante`);
  assert.ok(sansCom.includes(`data-menu-id-v1="${id}"] .soreal-idle-nav-deco-v1::after{background:linear-gradient(90deg,`) && new RegExp(`data-menu-id-v1="${id}"\] \.soreal-idle-nav-deco-v1::after\{[^}]*${m[1]}`).test(sansCom) || /^(combat|shop)$/.test(id), `${id} : l'anneau ne contient pas la couleur dominante`);
}
const ids = Object.keys(dom);
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  const d = deltaE(dom[ids[i]], dom[ids[j]]);
  assert.ok(d >= 22, `${ids[i]} (${dom[ids[i]]}) et ${ids[j]} (${dom[ids[j]]}) ont des couleurs dominantes trop proches (écart ${d.toFixed(1)} < 22)`);
}
/* les cadres de titre des pages suivent la couleur dominante de leur bouton (lueur du cadre et du titre) */
for (const id of MENUS) {
  const head = `${HP}[data-menu="${id}"] .soreal-idle-page-head-v28[data-entete-menu]`;
  if (!css.includes(head + "::before," + head + "::after{filter:hue-rotate(")) continue; /* combat, sang, daycare : pas de cadre générique */
  const r = [1, 3, 5].map((i) => parseInt(dom[id].slice(i, i + 2), 16)).join(",");
  assert.ok(css.includes(`${head}{box-shadow:0 0 14px rgba(${r},`) && css.includes(`${head} .soreal-idle-page-title-v28{text-shadow:`), `${id} : cadre de titre non aligné sur la couleur dominante`);
}

/* mouvement réduit */
const rm = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"));
assert.ok(/\.soreal-idle-nav-deco-v1::before[^{]*\{animation:none\}/.test(rm) && /\.soreal-idle-nav-deco-v1::after/.test(rm), "mouvement réduit non géré");

/* règle n°2 : le décor n'écrit aucun texte */
for (const c of sansCom.matchAll(/content:([^;}]*)/g)) assert.equal(c[1].trim(), '""', "le décor ne doit contenir aucun texte : " + c[1]);

/* règle n°4 : le décor est un élément du HTML du bouton (rien à remettre après un redessin), premier enfant, masqué aux lecteurs d'écran, et la feuille est chargée */
assert.ok(/<span class="soreal-idle-nav-deco-v1" aria-hidden="true"><\/span>\s*<span class="soreal-idle-nav-cadre-v2">/.test(ui), "décor absent du bouton du menu");
assert.ok(/soreal-idle-menus-boutons-v1\.css\?v=\d+/.test(index), "feuille non chargée");
assert.ok(index.indexOf("soreal-idle-entetes-d.css") < index.indexOf("soreal-idle-menus-boutons-v1.css"), "ordre des feuilles");
/* le bouton est le repère du décor ; zone tactile inchangée : aucune taille posée par cette feuille */
assert.ok(!/\b(width|height|min-height|min-width|padding|margin)\s*:/.test(sansCom.replace(/\.soreal-idle-nav-deco-v1[^{]*\{[^}]*\}/g, "")), "la feuille ne touche pas la taille des boutons");
console.log("ok idle-menus-boutons-cadres-v1");
