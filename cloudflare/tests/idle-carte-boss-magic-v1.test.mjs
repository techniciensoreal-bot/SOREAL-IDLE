// Carte de boss façon carte à collectionner (Norman, 2026-10-28) : la chronique ouverte et la fiche de la Collection utilisent le même module ;
// attaque et vie vont dans la case du coin (pas répétées en toutes lettres dans le texte) ; rien d'autre que les données du boss reçu (anti-spoil, règle n°2).
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lire = (f) => fs.readFileSync(path.join(R, f), "utf8");

const ecouteurs = {};
const ctx = { window: { __SOREAL_IDLE_REG__: { formatGrandNombreIdleV70_: (n) => "N" + n } }, document: { addEventListener: (t, f) => { ecouteurs[t] = f; } } };
vm.createContext(ctx);
vm.runInContext(lire("cloudflare/public/modules/carte-boss-magic-v1.js"), ctx);
const carte = ctx.window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__;
assert.ok(carte && typeof carte.html === "function");

const h = carte.html({ numero: 12, nom: "Bambi <b>", monde: 2, ordre: 3, pv: 1000, attaque: 50, xp: 7, capacites: ["Régénération"], notesHtml: "<i>note</i>", histoireHtml: "<div>récit</div>", boutonsHtml: "<button>Écouter</button>", image: "/x.png", rencontres: 3 });
assert.match(h, /class="carte-mtg-v1" data-numero="12" data-couleur="1"/, "couleur de repli selon le monde (avant l'analyse de l'illustration)");
assert.ok(h.includes('onload="window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__.colorier(this)"'), "la couleur suit l'illustration, analysée à son chargement");
const iDos = h.indexOf('class="mtg-dos"');
assert.ok(iDos > 0 && h.indexOf("SOREAL</text>", iDos) > iDos && h.indexOf("IDLE</text>") > h.indexOf("SOREAL</text>", iDos) && h.indexOf("mtg-dos-orbes", iDos) > iDos, "dos : titre du jeu sur deux lignes puis les cinq billes");
assert.ok(!h.slice(iDos).includes("<img"), "dos : aucune photo du boss, seulement le dessin de dos de carte");
assert.match(h, /mtg-nom[^>]*>Bambi &lt;b&gt;</, "le nom est échappé");
assert.match(h, /<span>Boss légendaire<\/span> — <span>Monde<\/span> 2/, "ligne de type traduisible");
assert.match(h, /mtg-force"><span>N50<\/span><i>\/<\/i><span>N1000<\/span>/, "case attaque / vie dans le coin");
assert.ok(!/Points de vie|Attaque/.test(h), "pas de « Points de vie » ni « Attaque » en toutes lettres");
assert.equal((h.match(/class="mtg-badge"/g) || []).length, 2, "badges : EXP et une capacité (PV et attaque sont dans la case du coin)");
assert.match(h, /B 0012 · FR/, "ligne de collection");
assert.match(h, /mtg-boutons"><button>Écouter/, "boutons dans le cadre de texte");
assert.ok(h.indexOf("note") < h.indexOf("récit"), "notes puis récit");
// repli : cinq couleurs par monde, le sixième monde revient à la première
assert.match(carte.html({ numero: 1, nom: "A", monde: 6 }), /data-couleur="0"/);
assert.ok(!/mtg-force/.test(carte.html({ numero: 1, nom: "A" })), "sans statistiques, pas de case");

/* retournement */
const classes = new Set();
const carteFausse = { classList: { contains: (c) => classes.has(c), toggle: (c, v) => { if (v) classes.add(c); else classes.delete(c); } }, getAttribute: () => "12" };
const cibleArt = { closest: (sel) => (sel === ".carte-mtg-v1" ? carteFausse : sel === ".mtg-art" ? {} : null) };
const cibleTexte = { closest: (sel) => (sel === ".carte-mtg-v1" ? carteFausse : null) };
ecouteurs.click({ target: cibleTexte });
assert.ok(!classes.has("retournee"), "un tap hors de l'illustration ne retourne pas la carte");
ecouteurs.click({ target: cibleArt });
assert.ok(classes.has("retournee"), "un tap sur l'illustration retourne la carte");
assert.match(carte.html({ numero: 12, nom: "A" }), /carte-mtg-v1 retournee"/, "le redessin de la page garde la carte retournée");
ecouteurs.click({ target: cibleTexte });
assert.ok(!classes.has("retournee"), "un tap sur le dos remet la carte à l'endroit");
ecouteurs.click({ target: { closest: () => null } });
assert.doesNotMatch(carte.html({ numero: 12, nom: "A" }), /retournee/, "à la fermeture la carte repart à l'endroit");

const c1 = lire("cloudflare/public/modules/ui-combat-1-v1.js"), c2 = lire("cloudflare/public/modules/ui-combat-2-v1.js");
assert.match(c1, /carteBossChroniqueIdleV1_\(j,nomBoss,notesHtml,histoireHtml\)/, "chronique du boss = carte");
assert.match(c2, /__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__/, "fiche de la Collection = carte");
assert.match(lire("cloudflare/public/index.html"), /carte-boss-magic-v1\.js\?v=\d+/, "module chargé avant les pages");
const css = lire("cloudflare/public/soreal-idle-carte-boss.css");
assert.match(lire("cloudflare/public/index.html"), /soreal-idle-carte-boss\.css\?v=\d+/, "feuille de style chargée");
assert.ok(css.includes(".carte-mtg-v1.retournee{transform:rotateY(180deg)}"), "retournement");
assert.match(css, /\.mtg-art\{[^}]*aspect-ratio:1 \/ 1/, "illustration en carré : entière, jamais rognée");
assert.match(css, /\.mtg-art img\{[^}]*object-fit:contain/, "image entière dans son cadre");
assert.ok(css.includes("aspect-ratio:5 / 8.4"), "carte allongée pour montrer l'illustration entière");
assert.ok(css.includes("--mtg-cadre:#2a6aa6"), "couleur 0 (bleu)");
for (const c of [1, 2, 3, 4, 5]) assert.ok(css.includes('.carte-mtg-v1[data-couleur="' + c + '"]{--mtg-cadre'), "couleur " + c);
assert.match(css, /aspect-ratio:5 \/ 8\.4/, "proportions de la carte allongée");
assert.match(css, /boss-lore-v142:not\(\.ouverte\) :is\(\.carte-mtg-v1,\.mtg-avant,\.mtg-cadre,\.mtg-titre,\.mtg-texte,\.mtg-boutons\)\{display:contents\}/, "fermée : le petit cadre au mur est inchangé");
assert.match(css, /\.mtg-modal-v1\{/, "fiche de la Collection");
// flèches : seulement des boss découverts (jamais le suivant d'un boss inconnu), sur les côtés, la carte est floutée autour
ctx.window.__SOREAL_IDLE_REG__.idleEtat = { bestiaire: { entrees: [1, 2, 4].map((n) => ({ source: "boss", decouvert: true, numero: n })).concat([{ source: "boss", decouvert: false, numero: 3 }, { source: "boss", decouvert: false, numero: 9 }]) } };
assert.deepEqual({ ...carte.voisinsDe(2) }, { prec: 1, suiv: 4 }, "3 est inconnu : le voisin de 2 est 4");
assert.deepEqual({ ...carte.voisinsDe(1) }, { prec: 0, suiv: 2 }, "pas de flèche avant le premier");
assert.deepEqual({ ...carte.voisinsDe(4) }, { prec: 2, suiv: 0 }, "pas de flèche après le dernier boss découvert");
const avecFleches = carte.html({ numero: 2, nom: "A" });
assert.match(avecFleches, /^<button type="button" class="mtg-fleche mtg-fleche-prec" data-mtg-aller="1"/, "flèches AVANT la carte (donc à côté, hors de la face qui se retourne)");
assert.ok(avecFleches.includes('data-mtg-aller="4"') && !avecFleches.includes('data-mtg-aller="3"'));
assert.ok(!carte.html({ numero: 4, nom: "A" }).includes("mtg-fleche-suiv"));
assert.ok(carte.aller && carte.voisinsDe, "navigation exposée");
const css2 = lire("cloudflare/public/soreal-idle-carte-boss.css");
assert.ok(css2.includes(".mtg-fleche-prec{left:-56px}"), "flèche à gauche, hors de la carte");
assert.ok(css2.includes(".mtg-fleche-suiv{right:-56px}"), "flèche à droite, hors de la carte");
assert.ok(css2.includes("calc(100vw - 112px)"), "la carte laisse la place des flèches sur téléphone");
assert.ok(css2.includes("backdrop-filter:blur(10px)"), "l interface autour de la carte est floutée");
assert.ok(/ouverte::before{[^}]*left:-100vmax[^}]*height:auto/.test(css2), "calque de flou plus grand que l écran (chronique)");
assert.ok(css2.includes("backdrop-v63:has(.mtg-modal-v1){z-index:100000"), "fiche : au-dessus de l interface, fond flouté");
console.log("idle-carte-boss-magic-v1 : OK");
