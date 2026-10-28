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
assert.ok(iDos > 0 && h.indexOf("SOREAL</text>", iDos) > iDos && h.indexOf("IDLE</text>") > h.indexOf("SOREAL</text>", iDos) && h.indexOf('mtg-dos-photo"><img src="/x.png"', iDos) > iDos, "dos : titre du jeu sur deux lignes puis la photo du boss");
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
assert.match(css, /\.mtg-dos-photo img\{[^}]*object-fit:contain/, "photo du dos entière, jamais rognée");
assert.ok(css.includes("--mtg-cadre:#2a6aa6"), "couleur 0 (bleu)");
for (const c of [1, 2, 3, 4, 5]) assert.ok(css.includes('.carte-mtg-v1[data-couleur="' + c + '"]{--mtg-cadre'), "couleur " + c);
assert.match(css, /aspect-ratio:5 \/ 7/, "proportions d'une carte");
assert.match(css, /boss-lore-v142:not\(\.ouverte\) :is\(\.carte-mtg-v1,\.mtg-avant,\.mtg-cadre,\.mtg-titre,\.mtg-texte,\.mtg-boutons\)\{display:contents\}/, "fermée : le petit cadre au mur est inchangé");
assert.match(css, /\.mtg-modal-v1\{/, "fiche de la Collection");
console.log("idle-carte-boss-magic-v1 : OK");
