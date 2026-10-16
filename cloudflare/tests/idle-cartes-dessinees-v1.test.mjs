import assert from "node:assert/strict";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleCardsCreateCardV1, IDLE_CARDS_BASE_V1 } from "../src/idle-cards-v1.js";

/* Norman (2026-10-14) : « branche les cartes sans image » : chaque carte du deck est un cadre SVG (nom, palier, 6 coûts en mayo, type, effet, rareté) ; l'illustration vient de R2 (idle/cartes/<type>) et reste vide sans fichier. */
const fenetre = {};
vm.runInNewContext(readFileSync("cloudflare/public/modules/cartes-v1.js", "utf8"), { window: fenetre, document: undefined });
const CV = fenetre.__SorealCartesV1__;
assert.ok(CV && typeof CV.carteSvg === "function" && typeof CV.defs === "function", "module exposé");

const normale = CV.carteSvg({ id: "carte-1", type: "adventure", code: "ADV", nom: "Stats d'Aventure", tier: 7, rarity: 1.18, rarityLabel: "Great", bonusPct: 1.234, mayo: { angry: 2, pretty: 1, sad: 12 }, protected: false });
assert.ok(normale.startsWith("<svg") && normale.endsWith("</svg>"), "SVG complet");
assert.ok(normale.includes("viewBox=\"0 0 331 538\""), "proportions de la vraie carte (331 x 538)");
assert.ok(normale.includes("STATS D&#39;AVENTURE") && normale.includes(">ADV<") && normale.includes(">Great<") && normale.includes("+1,234 %"), "nom, type, rareté, effet");
for (const mayo of CV.mayos) assert.ok(normale.includes("#mc-" + mayo), "badge de mayo : " + mayo);
assert.ok(CV.defs().split("<g id=\"mc-").length - 1 === 6, "les 6 badges sont définis une seule fois");
assert.ok(normale.includes("/api/idle/media/card?type=adventure"), "illustration lue dans R2 par type");
assert.ok(normale.includes("onerror=\"this.style.display='none'\""), "sans illustration, la zone reste vide");
assert.ok(normale.includes("fill=\"#3f6a8e\""), "cadre normal");

/* Variantes */
const foil = CV.carteSvg({ type: "gold", code: "GOLD", nom: "Or", tier: 1, rarityLabel: "Okay", bonusPct: 1, mayo: { angry: 1 }, foil: true });
assert.ok(foil.includes("fill=\"#c9a227\"") && !foil.includes("fill=\"#3f6a8e\""), "foil : cadre doré");
const chonker = CV.carteSvg({ type: "gold", code: "GOLD", nom: "Or", tier: 1, rarityLabel: "Hot Damn", bonusPct: 1, mayo: { angry: 25 }, chonker: true, protected: true });
assert.ok(chonker.includes("fill=\"#6a3f94\"") && chonker.includes(">CHONKER<") && chonker.includes("aria-label=\"protégée\""), "Big Chonker : cadre violet, mention et cadenas dessiné");
const fin = CV.carteSvg({ theEnd: true, tier: 69, mayo: { angry: 99, sad: 99, moldy: 99, ayyLmayo: 99, cincoDeMayo: 99, pretty: 99 }, rarityLabel: "Crappy" });
assert.ok(fin.includes("fill=\"#8e2f3f\"") && fin.includes("THE END") && fin.includes("/api/idle/media/card?type=theEnd"), "The End : cadre rouge, illustration theEnd");
/* Injection : un nom piégé ne sort jamais du SVG. */
assert.ok(!CV.carteSvg({ type: "x", code: "<img onerror=1>", nom: "<script>alert(1)</script>", tier: 1, mayo: {}, rarityLabel: "\"><b>" }).includes("<script>"), "texte échappé");
/* Un très long nom rétrécit au lieu de déborder. */
assert.match(CV.carteSvg({ type: "x", code: "X", nom: "Un nom de carte vraiment beaucoup trop long pour tenir", tier: 1, mayo: {} }), /font-size="1[2-6]"/, "nom long : police réduite");
/* Pas d'emoji de cadenas dans le module (garde anti-spoil des modules). */
assert.ok(!/🔒/.test(readFileSync("cloudflare/public/modules/cartes-v1.js", "utf8")), "cadenas dessiné, pas d'emoji");

/* Moteur : environ 1 % de cartes foil, jamais sur un Big Chonker. */
assert.equal(IDLE_CARDS_BASE_V1.foilChance, 0.01, "1 % (page Cards, Foil Cards)");
const etat = { systems: { cards: { unlocked: true, data: {} } } };
const aleatoire = (valeurs) => { let i = 0; return () => valeurs[i++ % valeurs.length]; };
const carteFoil = idleCardsCreateCardV1(JSON.parse(JSON.stringify(etat)), { rng: aleatoire([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.001]) });
assert.equal(typeof carteFoil.foil, "boolean", "champ foil présent");
const chonk = idleCardsCreateCardV1(JSON.parse(JSON.stringify(etat)), { chonker: true, rng: aleatoire([0.001]) });
assert.equal(chonk.foil, false, "un Big Chonker n'est jamais foil");

/* Serveur : la route d'illustration existe, valide son paramètre et cherche idle/cartes/. */
const media = readFileSync("cloudflare/src/idle-media-v1.js").toString("latin1");
assert.ok(media.includes("\"/api/idle/media/card\"") && media.includes("async function carteImage_(") && media.includes("\"idle/cartes/\"+type+\".\"+ext"), "route /api/idle/media/card");
/* Page : branchée sur le module, qui est chargé par index.html. */
const meta = (readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta());
assert.ok(meta.includes("window.__SorealCartesV1__") && meta.includes("CV.carteSvg(k)") && meta.includes("cv1-grille"), "page Cards branchée sur les cartes dessinées");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/cartes-v1.js"), "module chargé par la page");
console.log("Cartes dessinées: OK");
