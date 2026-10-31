import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Annonce d'un nouveau chat de la Garderie (Norman, 2026-10-31) : un seul bouton « Cool », aucune autre fermeture, un thème par skin, ajoutée à <body>
 * (data-morph-garder), textes au dictionnaire anglais, mémorisation « vu » sur le compte (action daycareSkinVu, aucun localStorage).
 */
const chemin = new URL("../public/modules/daycare-skin-popup-v1.js", import.meta.url);
const src = readFileSync(chemin, "utf8");
const dico = JSON.parse(readFileSync(new URL("../public/modules/traduction-anglais-dict-v1.json", import.meta.url), "utf8"));
const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

const win = { setTimeout() {}, setInterval() {} };
vm.runInNewContext(src, { window: win, document: {}, setInterval() {}, setTimeout() {}, console });
const P = win.__SOREAL_IDLE_DAYCARE_SKIN_POPUP_V1__;
assert.ok(P, "module exposé");

const IDS = ["noeud", "arcenciel", "fibonacci", "dore", "matrix", "chauvesouris", "tchernobyl", "pirate", "noel", "nega"];
assert.deepEqual(Object.keys(P.noms).sort(), [...IDS].sort(), "un nom par skin (defaut n'est jamais annoncé)");
assert.equal(P.noms.noeud, "Joli chaton");
assert.equal(P.noms.arcenciel, "Nyankitty");
assert.equal(P.noms.dore, "Chaton Premium");
assert.equal(P.noms.matrix, "Chaton blanc");
assert.equal(P.noms.chauvesouris, "Chaton chauve-souris");
assert.equal(P.noms.tchernobyl, "Chaton Tchernobyl");
assert.equal(P.noms.pirate, "Chaton pirate");
assert.equal(P.noms.noel, "Chaton de Noël");
assert.equal(P.noms.nega, "Chaton Néga");

const fonds = new Set();
for (const id of IDS) {
  const h = P.html(id);
  assert.equal((h.match(/<button/g) || []).length, 1, id + " : un SEUL bouton");
  assert.ok(/<button[^>]*data-gsp-cool="1"[^>]*>Cool<\/button>/.test(h), id + " : bouton « Cool »");
  assert.ok(h.includes("Nouveau chat pour la Garderie !"), id + " : titre");
  assert.ok(h.includes("/api/idle/media/garderie-skin?id=" + id), id + " : image du skin");
  assert.ok(h.includes(">" + P.noms[id] + "<"), id + " : nom FR");
  assert.ok(!/×|✕|aria-label="[^"]*[Ff]erm/.test(h), id + " : pas de croix");
  assert.ok(!/\p{Extended_Pictographic}/u.test(h), id + " : pas d'émoji");
  assert.ok(!/wiki/i.test(h), id + " : pas de « wiki »");
  fonds.add((h.match(/--gsp-bg:([^;]+);/) || [])[1]);
  for (const t of [P.noms[id], P.phrases[id]]) assert.ok(dico[t], "dictionnaire anglais : " + t);
}
assert.equal(fonds.size >= 8, true, "des palettes distinctes");
for (const t of ["Nouveau chat pour la Garderie !", "Choisis-le dans la Garderie quand tu veux.", "Cool", "Un nouveau chaton te rejoint."]) assert.ok(dico[t] !== undefined, "dico : " + t);

// Thèmes demandés
assert.ok(P.html("chauvesouris").includes("gsp-halloween") && P.html("chauvesouris").includes("#f77f00"), "Halloween : citrouilles");
assert.ok(P.html("chauvesouris").includes("M0 0L90 90"), "Halloween : toile");
assert.ok(P.html("noel").includes("gsp-noel") && P.html("noel").includes("gsp-guirlande") && P.html("noel").includes("gsp-d-f1"), "Noël : guirlande, flocons");
assert.ok(P.html("dore").includes("gsp-premium") && P.html("dore").includes("PREMIUM") && P.html("dore").includes("gsp-d-e1"), "Premium : étoiles et mention");
assert.ok(P.html("tchernobyl").includes("gsp-tchernobyl") && P.html("tchernobyl").includes("gsp-d-rad1") && P.html("tchernobyl").includes("gsp-bande"), "Tchernobyl : radiation, bandes");
assert.ok(P.html("tchernobyl").includes("Tu as trouvé le chat Tchernobyl !"));
assert.ok(P.html("pirate").includes("gsp-pirate") && P.html("pirate").includes("gsp-corde") && P.html("pirate").includes("gsp-d-flag"), "pirate : corde, drapeau");

assert.ok(P.html("nega").includes("gsp-nuit") && P.html("nega").includes("gsp-d-lune") && P.html("nega").includes("gsp-d-n1") && P.html("nega").includes("Tu as trouvé le chat Néga !"), "Néga : nuit étoilée, lune");

// Fermeture : seulement par « Cool »
assert.ok(/data-morph-garder/.test(src), "bloc gardé par le morph");
assert.ok(src.includes("document.body.appendChild(f)"), "ajouté à <body>");
assert.ok(!/key==='Escape'|key===\"Escape\"/.test(src), "pas de fermeture par Échap");
assert.ok(!/e\.target===f/.test(src), "pas de fermeture par clic dehors");
assert.ok(/closest\('\[data-gsp-cool\]'\)\)valider\(\)/.test(src), "le clic n'agit que sur le bouton Cool");
assert.ok(src.includes("b.focus()") && src.includes("aria-modal"), "focus sur Cool, dialogue modal");
assert.ok(src.includes("e.key==='Tab'"), "le focus reste sur Cool");
assert.ok(src.includes("action:'daycareSkinVu'"), "mémorisation sur le compte");
assert.ok(!/localStorage|sessionStorage/.test(src), "rien en localStorage");
assert.ok(src.includes("@media (prefers-reduced-motion:reduce)"), "mouvement réduit");
assert.ok(src.includes("garderieDisponible(etat)"), "rien tant que la Garderie n'est pas débloquée (règle n°2)");
assert.ok(src.includes("p.indexOf(id)>=0"), "jamais un skin non possédé");
assert.ok(/max-height:calc\(100dvh - 24px\)/.test(src) && src.includes("@media (max-width:420px)"), "lisible sur téléphone");
assert.ok(index.includes('/modules/daycare-skin-popup-v1.js?v='), "chargé par index.html");
console.log("idle-daycare-skin-popup-v1 OK");
