/* Profilage 2026-11-18 : un sélecteur dont un compose NON final porte un attribut `style` (ex. `g.bn-lueur[style*="bnLuitB"] > path`) crée pour Blink un ensemble d'invalidation « tout élément dont l'attribut style change invalide tous ses descendants path/polygon ».
   Or le redessin de chaque menu vivant (≈ 3 fois par seconde en jeu local) écrit le `style` de <main> (retenue de hauteur) et le jeu écrit le `style` de dizaines d'éléments par image : chaque écriture recalculait le style de ~350 éléments SVG (forcé, 8 ms par redessin sur un processeur normal, 4 à 6 fois plus sur un téléphone).
   Règle : jamais d'attribut `style` dans un compose non final d'un sélecteur CSS ; accrocher une donnée dédiée (data-*) qui ne change jamais. Un `[style…]` en position finale (le sujet) reste permis : il ne touche que l'élément lui-même. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const pub = "cloudflare/public";
const fichiers = [];
for (const f of readdirSync(pub)) if (f.endsWith(".css")) fichiers.push(pub + "/" + f);
for (const f of readdirSync(pub + "/modules")) if (f.endsWith(".js")) fichiers.push(pub + "/modules/" + f);

const interdit = /\[style[~|^$*]?=[^\]]*\]\s*[>+~ ]\s*[A-Za-z.#:*[][^{,;]{0,60}/g;
const fautifs = [];
for (const f of fichiers) {
  const t = readFileSync(f, "utf8");
  let m;
  while ((m = interdit.exec(t))) fautifs.push(f + " : " + m[0].slice(0, 90));
}
assert.deepEqual(fautifs, [], "attribut style dans un compose non final d'un sélecteur (invalidation globale des descendants) :\n" + fautifs.join("\n"));

// La bande de la borne : le crochet est une donnée fixe, posée par le dessin du pupitre.
const css = readFileSync(pub + "/soreal-idle-itopod.css", "utf8");
const combat = readFileSync(pub + "/modules/ui-combat-2-v1.js", "utf8");
assert.ok(css.includes('g.bn-lueur[data-lueur="B"]>path') && css.includes('g.bn-lueur[data-lueur="R"]>path'), "bandes du pupitre : sélecteurs sur data-lueur");
assert.ok(combat.includes("<g class='bn-lueur' data-lueur='B' style='animation:bnLuitB 3.2s ease-in-out infinite'") && combat.includes("<g class='bn-lueur' data-lueur='R' style='animation:bnLuitR 3.2s ease-in-out infinite'"), "bandes du pupitre : data-lueur posé par le dessin");

console.log("idle-invalidation-style-attribut-v1: OK");
