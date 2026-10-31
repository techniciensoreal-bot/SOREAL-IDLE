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
const gen = readFileSync("cloudflare/tools/gen-menus-boutons-v1.mjs", "utf8");
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
    /* un dessin « o:nom » (original, secours contre les doublons) n'est pas dans le grand cadre ; tout autre vient du cadre */
    const original = new RegExp(`\\b${id}: \\{[^}]*?\\b${c === "nb-g" ? "g" : "d"}: "o:`).test(gen);
    if (u && !original) assert.ok(entetes.includes(u[0]), `${id} : le dessin ${c} n'est pas celui du grand cadre`);
  }
}

/* Norman (2026-10-30) : jamais deux dessins identiques sur un bouton (ni le même emblème répété, retourné ou teinté) : comparaison du texte, puis de la « famille » (balises SVG) */
const echap = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const dessinDe = (id, c) => sansCom.match(new RegExp(echap(D(id, ` .${c}`)) + "\\{background:([^;]*)"))[1];
const famille = (bg) => {
  const m = bg.match(/^url\("data:image\/svg\+xml,([^"]*)"\)/);
  if (!m) return "gradient:" + bg.replace(/\s[\d.]+(cqw|%).*$/, "");
  const s = decodeURIComponent(m[1]);
  return [...s.matchAll(/<([a-z]+)/g)].map((x) => x[1]).filter((x) => x !== "svg" && x !== "defs").sort().join(",") + [...s.matchAll(/ id="([a-z]+)"/g)].map((x) => "#" + x[1]).join("");
};
/* paires de dessins construites de la même façon mais vérifiées à l'œil comme DIFFÉRENTES (Hacks : invite de commande > et accolades {}) */
const VERIFIES_A_LOEIL = new Set(["hacks"]);
for (const id of MENUS) {
  const g = dessinDe(id, "nb-g"), d = dessinDe(id, "nb-d");
  assert.notEqual(g, d, `${id} : deux dessins identiques`);
  const long = (b) => { try { return decodeURIComponent(b).length; } catch (_e) { return b.length; } };
  const lg = long(g), ld = long(d);
  assert.ok(VERIFIES_A_LOEIL.has(id) || famille(g) !== famille(d) || Math.abs(lg - ld) / Math.max(lg, ld) > 0.12, `${id} : deux dessins de la même famille et de même taille (même emblème répété ou retourné)`);
}
/* Renaissance : un tourbillon (spirale) à gauche, un signe infini à droite, en SVG original ; la spirale tourne, l'infini pulse */
{
  const g = decodeURIComponent(dessinDe("renaissance", "nb-g")), d = decodeURIComponent(dessinDe("renaissance", "nb-d"));
  assert.ok(g.includes('id="tourbillon"') && !g.includes("<text"), "Renaissance : tourbillon à gauche");
  assert.ok(d.includes('id="infini"') && !d.includes("<text"), "Renaissance : signe infini à droite (SVG, pas une police)");
  assert.ok(sansCom.includes(`${P}[data-menu-id-v1="renaissance"].travail-v1 .soreal-idle-nav-deco-v1 .nb-g{animation:nbV1_spin 6s linear infinite}`), "le tourbillon tourne (360°, linéaire)");
  assert.ok(sansCom.includes(`${P}[data-menu-id-v1="renaissance"].travail-v1 .soreal-idle-nav-deco-v1 .nb-d{animation:nbV1_pulse `), "l'infini pulse");
}
/* miniature fidèle du grand cadre : le fond est celui du cadre, réduit en cqw (la boîte du décor est un conteneur) ; ITOPOD : la tour occupe toute la hauteur */
assert.ok(/\.soreal-idle-nav-deco-v1\{[^}]*container-type:size/.test(sansCom), "le décor est un conteneur (unités cqw)");
for (const id of MENUS) {
  const m = sansCom.match(new RegExp(echap(D(id, "::before")) + "\\{background:([^}]*)\\}"));
  assert.ok(m && m[1].length > 40, `${id} : fond de la miniature absent`);
  if (id !== "daycare") assert.ok(/cqw|%/.test(m[1]), `${id} : fond non réduit`);
  assert.ok(!/\d(px)\b/.test(m[1].replace(/url\("[^"]*"\)/g, "")), `${id} : longueur en px dans le fond (doit être réduite)`);
  assert.ok(sansCom.includes(`data-menu-id-v1="${id}"] .soreal-idle-nav-texte-v2 b{color:`), `${id} : nom du menu sans le style du titre`);
}
assert.ok(/tower"\] \.soreal-idle-nav-deco-v1 \.nb-g\{[^}]*height:100cqh/.test(sansCom),"ITOPOD : la tour prend toute la hauteur du bouton");

/* l'animation ne tourne QUE quand le menu travaille : jamais sur .active seul, jamais au repos */
for (const x of sansCom.replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{([^{}]*\{[^}]*\}\s*)+\}/g, "").matchAll(/(^|\})\s*([^{}@]+)\{([^}]*)\}/gm)) {
  const sel = x[2].trim();
  if (!sel) continue;
  assert.ok(sel.split(",").every((s) => s.trim().startsWith(P)), "sélecteur hors barre : " + sel.slice(0, 90));
  if (/animation:(?!none)/.test(x[3])) assert.ok(/\.travail-v1\b/.test(sel) && !/\.active\b/.test(sel), "animation hors menu qui travaille : " + sel.slice(0, 200));
}

/* boucle parfaite : chaque mouvement revient à son point de départ (ou tourne d'un tour complet) */
const kfs = [...sansCom.matchAll(/@keyframes (nbV1_[a-z]+)\{(.*)\}/g)];
const noms = [];
for (const line of sansCom.split("\n").filter((l) => l.startsWith("@keyframes"))) {
  const m = line.match(/^@keyframes (nbV1_[a-z]+)\{(.*)\}$/);
  assert.ok(m, "keyframes illisible : " + line.slice(0, 60));
  noms.push(m[1]);
  const c = m[2];
  if (m[1] === "nbV1_halte" || m[1] === "nbV1_frappe") { const im = [...c.matchAll(/([\d.]+)%\{transform:([^}]*)\}/g)]; assert.ok(im.length > 10 && im[0][1] === "0" && im[im.length - 1][1] === "100" && im[0][2] === im[im.length - 1][2], `${m[1]} : boucle parfaite (0 % = 100 %)`); continue; }
  /* ITOPOD : la tour monte à l'infini : la texture glisse d'EXACTEMENT un étage (le tiers de la hauteur = la période du motif) par cycle, vitesse constante */
  if (m[1] === "nbV1_monte") { assert.equal(c, "0%{background-position:0 0}100%{background-position:0 33.3333cqh}", "monte : un étage exactement"); continue; }
  assert.ok(/^0%,100%\{[^}]*\}50%\{[^}]*\}$/.test(c) || c === "from{transform:rotate(0)}to{transform:rotate(360deg)}", `${m[1]} : n'est pas une boucle parfaite : ${c.slice(0, 60)}`);
}
assert.ok(noms.length >= 4 && kfs.length >= 0);
assert.ok(/\[data-menu-id-v1="tower"\]\.travail-v1 \.soreal-idle-nav-deco-v1 \.nb-g\{animation:nbV1_monte 2\.4s linear infinite\}/.test(sansCom) && /\.nb-g\{[^}]*repeat-y/.test(sansCom.slice(sansCom.indexOf('[data-menu-id-v1="tower"] .soreal-idle-nav-deco-v1 .nb-g{'))), "ITOPOD : la tour de gauche monte à l'infini (texture répétée, un étage par cycle)");
for (const m of sansCom.matchAll(/animation:(nbV1_[a-z]+) ([\d.]+)s (linear|ease-in-out) infinite/g)) {
  assert.ok(noms.includes(m[1]), `${m[1]} : keyframes absent`);
  if (m[1] === "nbV1_spin") assert.equal(m[3], "linear", "la rotation complète est linéaire (aucun à-coup)");
}
/* le dessin de droite part d'une demi-période d'écart (pas de recopie synchrone) */
for (const m of sansCom.matchAll(/\.nb-d\{animation:nbV1_[a-z]+ ([\d.]+)s [a-z-]+ infinite;animation-delay:-([\d.]+)s/g)) assert.equal(Number(m[2]), Number(m[1]) / 2, "décalage d'une demi-période");

/* états : fermé = sombre (fond ET icônes), ouvert = brille, menu qui travaille non ouvert = fond sombre mais ICÔNES en couleurs pleines (Norman, 2026-10-30) ; aucun filtre global sur le décor */
assert.ok(!/\.soreal-idle-nav-deco-v1\{[^}]*filter:/.test(sansCom), "pas de filtre global sur le décor (il assombrirait aussi les icônes)");
assert.ok(/\.soreal-idle-nav-deco-v1::before,[^{]*\.soreal-idle-nav-deco-v1::after,[^{]*\.nb-g,[^{]*\.nb-d\{filter:brightness\(\.5\) saturate\(\.55\)/.test(sansCom), "menu fermé : fond, liseré et icônes sombres");
assert.ok(/\.travail-v1 \.soreal-idle-nav-deco-v1 \.nb-g,[^{]*\.travail-v1 \.soreal-idle-nav-deco-v1 \.nb-d\{filter:none\}/.test(sansCom), "menu qui travaille : icônes en couleurs pleines");
assert.ok(!/\.travail-v1 \.soreal-idle-nav-deco-v1(::before|::after)\{[^}]*filter:none/.test(sansCom), "menu qui travaille : le fond reste sombre");
assert.ok(sansCom.indexOf(".travail-v1 .soreal-idle-nav-deco-v1 .nb-g,") < sansCom.indexOf(".active .soreal-idle-nav-deco-v1 .nb-g,"), "ouvert l'emporte sur travaille (même spécificité, règle plus tard)");
assert.ok(/\.active \.soreal-idle-nav-deco-v1::before,[^{]*\.active \.soreal-idle-nav-deco-v1::after\{filter:brightness\(1\.2\)/.test(sansCom), "menu ouvert : le fond brille");
assert.ok(/\.active \.soreal-idle-nav-deco-v1 \.nb-g,[^{]*\.nb-d\{filter:brightness\(1\.2\)[^}]*drop-shadow/.test(sansCom), "menu ouvert : les dessins brillent");

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
for (const c of sansCom.matchAll(/(?<![-a-z])content:([^;}]*)/g)) assert.equal(c[1].trim(), '""', "le décor ne doit contenir aucun texte : " + c[1]);
assert.ok(!/soreal-idle-nav-emoji-v2">\$\{m\.icon\}/.test(ui), "plus d'émoji dans les boutons du menu");
assert.ok(/\.soreal-idle-nav-cadre-v2\{display:none\}/.test(sansCom), "la pastille d'émoji ne s'affiche plus");
/* noms centrés (horizontalement et verticalement) dans chaque bouton */
assert.ok(/\.soreal-idle-nav-texte-v2\{[^}]*justify-content:center;[^}]*text-align:center;padding:0 36px;margin-left:6px\}/.test(sansCom) && /\.soreal-idle-nav-texte-v2\{[^}]*align-items:center/.test(sansCom), "noms centrés");

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
assert.ok(!/\b(height|min-height|min-width|margin)\s*:/.test(sansCom.replace(/\.nb-[gd][^{]*\{[^}]*\}/g, "").replace(/\.soreal-idle-nav-texte-v2[^{]*\{[^}]*\}/g, "")), "la feuille ne touche pas la taille des boutons");

/* Norman (2026-10-30) : les dessins gardent leurs VRAIES couleurs (jamais une teinte unique) : tout dessin SVG a au moins deux couleurs franches ; Yggdrasil = tronc brun, feuillage vert, pomme dorée */
for (const id of MENUS) for (const c of ["nb-g", "nb-d"]) {
  const bg = dessinDe(id, c);
  const m = bg.match(/^url\("data:image\/svg\+xml,([^"]*)"\)/);
  if (!m || !new RegExp(`\\b${id}: \\{[^}]*?\\b${c === "nb-g" ? "g" : "d"}: "o:`).test(gen)) continue; /* les dessins repris du grand cadre gardent ses couleurs, quelles qu'elles soient */
  const couleurs = new Set([...decodeURIComponent(m[1]).matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgb\([^)]*\)/g)].map((x) => x[0].toLowerCase()));
  assert.ok(couleurs.size >= 2, `${id} : le dessin ${c} est monochrome (${[...couleurs]})`);
}
{
  const g = decodeURIComponent(dessinDe("yggdrasil", "nb-g")).toLowerCase(), d = decodeURIComponent(dessinDe("yggdrasil", "nb-d")).toLowerCase();
  assert.ok(g.includes("#7a4a21") && g.includes("#2f9e44"), "Yggdrasil : arbre au tronc brun et au feuillage vert");
  assert.ok(d.includes("#f2b705") && d.includes("#ffd84d") && d.includes("#fff6c9"), "Yggdrasil : pomme dorée avec son reflet");
}
{
  const g = decodeURIComponent(dessinDe("beards", "nb-g")).toLowerCase(), d = decodeURIComponent(dessinDe("beards", "nb-d")).toLowerCase();
  assert.ok(g.includes('id="peigne"') && g.includes("#15151a") && !g.includes("#d62839"), "Barbes : peigne noir à un côté");
  assert.ok(d.includes('id="ciseaux"') && d.includes("lineargradient") && d.includes("#9aa3af"), "Barbes : ciseaux en acier (dégradé métallique) de l'autre côté");
  assert.ok(d.includes("#d62839") && d.includes('r="6" fill="none" stroke="#d62839"'), "Barbes : anneaux des ciseaux d'une autre couleur (rouge) que la lame");
  const m = decodeURIComponent(dessinDe("macguffins", "nb-d")).toLowerCase();
  assert.ok(m.includes('id="puzzle"') && m.includes("#0b6e4f") && m.includes("#003a2b") && m.includes("lineargradient"), "MacGuffins : pièce de puzzle vert bouteille (dégradé, bord plus foncé)");
}

/* Grands cadres de titre : même composition que la miniature, à toute largeur (Norman, 2026-10-30 : « le petit menu comme visuel du grand »). Feuille générée, chargée avant itopod.css, sans !important, spécificité plus forte que
   l'ancien réglage de itopod.css qui étirait le soleil et la lune de NGU en pourcentage de la largeur. Combat (marquise déjà juste), Sang (cadre de rituel) et Garderie (pas de grand cadre) ne sont pas touchés. */
{
  const gros = readFileSync("cloudflare/public/soreal-idle-entetes-miniature-v1.css", "utf8");
  assert.ok(!/!\s*important/i.test(gros) && !gros.includes("hue-rotate"), "grands cadres : ni !important ni recoloration");
  const idx = ["soreal-idle-menus-boutons-v1.css", "soreal-idle-entetes-miniature-v1.css", "soreal-idle-itopod.css"].map((x) => index.indexOf(x + "?v="));
  assert.ok(idx[0] > 0 && idx[0] < idx[1] && idx[1] < idx[2], "feuille des grands cadres : après les cadres et les boutons, avant itopod.css");
  const SANS = new Set(["combat", "sang", "daycare"]);
  for (const id of MENUS) {
    if (SANS.has(id)) continue;
    assert.ok(gros.includes(`[data-menu="${id}"] .soreal-idle-page-head-v28[data-entete-menu][data-entete-menu]::before{background:`), `${id} : grand cadre non couvert par la feuille générée`);
  }
  /* le fond du grand cadre est celui de la miniature : mêmes images que les deux dessins du bouton quand ils viennent du cadre */
  const ngu = gros.match(/@media \(min-width:561px\)\{[^\n]*data-menu="ngu"[^\n]*\}/)[0];
  assert.ok(ngu.includes("140px 140px") && ngu.includes("130px 130px") && !/circle at 13% 36%/.test(ngu), "NGU : soleil et lune à rayons dimensionnés sur la hauteur (pas de gros cercles flous en % de la largeur)");
  assert.ok(gros.includes("@media (max-width:560px)"), "version téléphone du fond");
}
/* Entraînement, version PC : à GAUCHE l'haltère collée au bord et coupée par lui, barre qui monte et descend (cycle 2,4 s) ; à DROITE un gant de boxe collé au bord droit, coupé, qui frappe de droite à gauche
   (un coup toutes les 1,8 s : coup rapide, retour lent, pause) ; une seule animation de 7,2 s = 3 cycles d'haltère = 4 coups, boucle parfaite ; coupée en mouvement réduit ; téléphone inchangé */
{
  const gros = readFileSync("cloudflare/public/soreal-idle-entetes-miniature-v1.css", "utf8");
  const pc = gros.match(/@media \(min-width:561px\)\{[^\n]*data-menu="entrainement"[^\n]*\}\}/)[0];
  assert.ok(/calc\(var\(--ent-h\) \* -0\.55\) 46%\/auto 62% no-repeat/.test(pc), "haltère de gauche collée au bord gauche et coupée par lui");
  assert.ok(/url\("data:image\/svg\+xml,[^"]*"\) calc\(100% \+ var\(--ent-h\) \* 0\.125\) 50%\/auto 62% no-repeat/.test(pc) && pc.includes('id%3D%22gant%22') && pc.includes("%23d62828"), "gant de boxe rouge à droite, légèrement coupé par le bord droit");
  assert.ok(pc.includes("animation:nbEntHalteres 7.2s linear infinite"), "une animation de 7,2 s");
  const kf = gros.match(/@keyframes nbEntHalteres\{(.*)\}\n/)[1];
  const cadres = [...kf.matchAll(/([\d.]+)%\{background-position:([^}]*)\}/g)].map((m) => [Number(m[1]), m[2].split(/,(?![^(]*\))/).map((x) => x.trim())]);
  assert.equal(cadres.length, 73, "73 images clés (toutes les 0,1 s)");
  assert.ok(cadres.every(([, l]) => l.length === 8), "une position par couche (8 couches)");
  assert.equal(cadres[0][0], 0); assert.equal(cadres[72][0], 100);
  assert.deepEqual(cadres[0][1], cadres[72][1], "boucle parfaite : départ = arrivée");
  const bouge = new Set();
  for (const [, l] of cadres) l.forEach((x, i) => { if (x !== cadres[0][1][i]) bouge.add(i); });
  assert.deepEqual([...bouge].sort(), [1, 2], "seules l'haltère (couche 1) et le gant (couche 2) bougent");
  /* haltère : même position à 2,4 s qu'à 0 ; gant : même position à 1,8 s qu'à 0 (cycles désynchronisés dans la même boucle) */
  assert.equal(cadres[24][1][1], cadres[0][1][1], "haltère : cycle de 2,4 s");
  assert.equal(cadres[18][1][2], cadres[0][1][2], "gant : un coup toutes les 1,8 s");
  assert.notEqual(cadres[8][1][1], cadres[0][1][1], "la barre bouge");
  const gant = cadres.slice(0, 19).map(([, l]) => Number(l[2].match(/\* (-?[\d.]+)\) 50%/)[1]));
  assert.ok(Math.min(...gant) < gant[0] - 0.4, "le gant avance vers la gauche (coup)");
  assert.ok(gant.slice(0, 3).every((x, i, a) => i === 0 || x < a[i - 1]) && gant.indexOf(Math.min(...gant)) <= 3, "coup rapide (en 0,2 s)");
  assert.ok(gant.slice(-10).every((x) => x === gant[0]), "pause avant le coup suivant");
  const mobile = gros.match(/@media \(max-width:560px\)\{[^\n]*data-menu="entrainement"[^\n]*\}\}/)[0];
  assert.ok(!mobile.includes("animation") && !mobile.includes("--ent-h"), "téléphone inchangé");
  assert.ok(/prefers-reduced-motion:reduce\)\{[^\n]*data-menu="entrainement"[^\n]*::before\{animation:none\}/.test(gros), "mouvement réduit coupé");
  /* le petit bouton montre le même gant */
  assert.ok(sansCom.includes('id%3D%22gant%22'), "le bouton Entraînement montre le même gant");
}
/* Petit bouton Entraînement : mêmes mouvements que le grand cadre, seulement quand le menu travaille ; coupés en mouvement réduit par la règle générale du fichier */
{
  const B = sansCom;
  assert.ok(B.includes('[data-menu-id-v1="entrainement"].travail-v1 .soreal-idle-nav-deco-v1 .nb-g{animation:nbV1_halte 2.4s linear infinite}'), "haltère du bouton : la barre monte et descend (2,4 s) au travail");
  assert.ok(B.includes('[data-menu-id-v1="entrainement"].travail-v1 .soreal-idle-nav-deco-v1 .nb-d{animation:nbV1_frappe 1.8s linear infinite}'), "gant du bouton : un coup toutes les 1,8 s au travail");
  const kf = (n) => [...B.match(new RegExp("@keyframes nbV1_" + n + "\\{(.*)\\}"))[1].matchAll(/([\d.]+)%\{transform:([^}]*)\}/g)].map((m) => m[2]);
  const h = kf("halte"), g = kf("frappe");
  assert.equal(h.length, 25); assert.equal(g.length, 19);
  assert.ok(new Set(h).size > 5 && new Set(g).size > 5, "ça bouge");
  const x = g.map((v) => Number(v.match(/translateX\((-?[\d.]+)cqh/)[1]));
  assert.ok(Math.min(...x) < -30 && x[0] === 0 && x[1] < x[0] && x.slice(-3).every((v) => v === 0), "le gant part vers la gauche (coup rapide), revient, pause");
  assert.ok(!/entrainement"\]\.active[^{]*\{[^}]*animation/.test(B), "jamais du seul fait d'être ouvert");
}
console.log("ok idle-menus-boutons-cadres-v1");
