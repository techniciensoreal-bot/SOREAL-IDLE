/*
 * Garde (Norman, 2026-11-03 : « au moment de se stabiliser quand on tourne une page, les cartes adoptent une police floue ») :
 * la feuille qui tourne ne porte PAS de will-change. Une couche promue d'avance etait rasterisee a une autre echelle que la page figee :
 * le texte des cartes changeait d'aspect a la fin du tour (mesure dans Chromium, contraste du texte de la carte : 12,1 pendant le tour, 8,6 apres ;
 * sans will-change : 9,0 pendant, 8,0 apres). Ne jamais le remettre sur .alb-feuille-tournante ni sur les cartes de l'album.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync("cloudflare/public/soreal-idle-album.css", "utf8");
const regle = css.split("\n").find((l) => l.startsWith(".alb-feuille-tournante{"));
assert.ok(regle, "regle de la feuille qui tourne");
const decl = regle.slice(0, regle.indexOf("}") + 1);
assert.ok(!/will-change/.test(decl), "la feuille qui tourne n'a pas de will-change (rendu du texte identique pendant et apres le tour)");
for (const f of ["soreal-idle-album.css", "soreal-idle-carte-boss.css"]) {
  const c = fs.readFileSync("cloudflare/public/" + f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const m = c.match(/[^{}]*(\.alb-pochette|\.alb-carte|\.carte-mtg-v1|\.alb-feuille)[^{}]*\{[^}]*will-change[^}]*\}/g) || [];
  assert.equal(m.length, 0, f + " : aucune carte / pochette / feuille de l'album ne promeut sa couche avec will-change : " + m.join(" | ").slice(0, 200));
}
console.log("idle-album-tour-texte-net-v1 : ok");
