import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-08) : « une barre de son supplémentaire, Musique : elle baisserait les musiques de Blood Magic et de la boutique EXP, parfois trop fortes ; je veux les régler indépendamment de l'ambiance ».
 */
function creer() {
  const stock = {};
  const window = {};
  vm.runInNewContext(readFileSync("cloudflare/public/modules/audio-volume-v1.js", "utf8"), { window, localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } } });
  return { V: window.__SOREAL_IDLE_AUDIO_VOLUME_V1__, stock };
}

// Quatre types, dans l'ordre des Réglages
{
  const { V } = creer();
  assert.equal(JSON.stringify(V.types), JSON.stringify(["voix", "ambiance", "musique", "interface"]));
}
// Jamais réglée : la musique garde le volume de l'ambiance (rien ne change pour un joueur qui n'y touche pas)
{
  const { V } = creer();
  assert.equal(V.getMusique(), 0.75, "défaut = défaut de l'ambiance");
  V.setAmbiance(0.2);
  assert.equal(V.getMusique(), 0.2, "suit l'ambiance tant qu'elle n'a pas été réglée");
  assert.equal(V.getReglage("musique"), 0.2);
}
// Réglée : indépendante de l'ambiance, dans les deux sens
{
  const { V } = creer();
  V.setAmbiance(0.6);
  V.setReglage("musique", 0.1);
  assert.equal(V.getMusique(), 0.1);
  assert.equal(V.getAmbiance(), 0.6, "régler la musique ne touche pas l'ambiance");
  V.setAmbiance(0.9);
  assert.equal(V.getMusique(), 0.1, "régler l'ambiance ne touche plus la musique");
  V.setMusique(0.4);
  assert.equal(V.getReglage("musique"), 0.4);
}
// Case décochée : musique coupée (le réglage de la barre est gardé)
{
  const { V } = creer();
  V.setReglage("musique", 0.5);
  V.setActif("musique", false);
  assert.equal(V.getMusique(), 0, "coupée");
  assert.equal(V.getReglage("musique"), 0.5, "réglage conservé");
  V.setActif("musique", true);
  assert.equal(V.getMusique(), 0.5);
  assert.equal(V.getAmbiance(), 0.75, "l'ambiance n'est pas coupée avec la musique");
}
// Les musiques de Blood Magic et de la boutique EXP lisent la barre Musique ; l'ambiance, non
{
  const musique = readFileSync("cloudflare/public/modules/shop-music-v1.js", "utf8");
  assert.ok(musique.includes("r.getMusique()") && musique.includes("menu:'shop'") && musique.includes("menu:'sang'"), "Shop EXP et Blood Magic suivent la barre Musique");
  assert.ok(!/r\.getAmbiance\(\)\):/.test(musique) || musique.includes("repli sur l'ambiance"), "l'ambiance n'est plus que le repli d'un ancien module de volume");
  const ambiant = readFileSync("cloudflare/public/modules/ambient-audio-v1.js", "utf8");
  assert.ok(!ambiant.includes("getMusique"), "la piste d'ambiance reste sur la barre Ambiance");
}
// Réglages : une ligne Musique entre Ambiance et Sons de l'interface
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  assert.ok(ui.includes("['ambiance','🎶 Ambiance'],\n          ['musique','🎵 Musique'],\n          ['interface','🔔 Sons de l’interface']"), "ligne Musique dans les Réglages");
  assert.ok(ui.includes("des musiques (Blood Magic et boutique EXP)"), "explication mise à jour");
}
console.log("idle-audio-musique-v1: OK");
