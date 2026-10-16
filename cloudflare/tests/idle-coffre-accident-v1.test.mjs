import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const acc = lire("modules/coffre-accident-v1.js"), dig = lire("modules/coffre-digestion-v1.js"), ui = lire("soreal-idle-ui.js"), idx = lire("index.html"), son = lire("modules/audio-coffre-v1.js"), fx = lire("modules/audio-effects-v199.js");
/* Norman (2026-10-15) : accident très occasionnel du Coffre : flaque, deux répliques, sac couvert de caca à frotter, caca qui glisse avec l'objet, bruit liquide avec des pets. */
assert.ok(dig.includes("var P_ACCIDENT=.08;") && dig.includes("Oh bordel, pas encore…") && dig.includes("J’crois que j’me suis chié dessus.") && dig.includes("a.play('coffreAccident')"), "accident rare, répliques et son");
assert.ok(acc.includes("NIVEAU_MAX=5") && acc.includes("suivi.courses%2===0") && acc.includes("flaqueNiveau-=1") && !acc.includes("carte:c"), "cinq allers-retours sur la flaque ; le sac ne se frotte pas");
assert.ok(acc.includes("transition:opacity .9s ease") && acc.includes("setAttribute('data-caca','0')") && acc.includes("(n/NIVEAU_MAX).toFixed(2)"), "les éclaboussures du sac s'effacent au fur et à mesure (fondu)");
assert.ok(acc.includes("__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__") && acc.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "survit au redessin (règle n°4)");
assert.ok(/pointer-events:none/.test(acc) && acc.includes(".soreal-idle-caca-fantome-v1"), "on peut toujours toucher les objets ; fantôme de glissement");
assert.ok(ui.includes("soreal-idle-caca-fantome-v1") && ui.includes("hasAttribute('data-caca')"), "le caca suit l'objet glissé, et un frottement n'ouvre ni glissement ni fiche");
assert.ok(idx.includes("/modules/coffre-accident-v1.js?v=") && idx.indexOf("coffre-accident-v1.js") < idx.indexOf("coffre-digestion-v1.js"), "module chargé avant le Coffre");
assert.ok(son.includes("function jouerAccident(ctx,sortie)") && fx.includes("coffreAccident:coffreAccident_") && fx.includes('coffreAccident:{group:"chest"'), "bruit liquide enregistré");
console.log("idle-coffre-accident-v1: OK");
/* Répliques tirées au sort, flaque à frotter (jamais effacée seule), cadre du fruit d'or au format de l'image */
{
  assert.ok(dig.includes("Ah ben voilà.. Forcément que ça allait arriver un jour.") && dig.includes("Oh merde. Ne me regardez pas") && dig.includes("OUVERTURES_ACCIDENT[Math.floor(Math.random()*OUVERTURES_ACCIDENT.length)]"), "trois ouvertures possibles");
  assert.ok(!acc.includes("bgFlaqueFin") && !/setTimeout\(function\(\)\{if\(f\.parentNode\)f\.parentNode\.removeChild\(f\);\}/.test(acc), "la flaque ne s'efface pas seule");
  assert.ok(acc.includes("flaqueNiveau-=1") && acc.includes("data-morph-garder") && acc.includes("ignorerClicJusqua"), "flaque : trois frottées, gardée au redessin, clic avalé");
  const ygg = lire("modules/yggdrasil-elfes-v1.js");
  assert.ok(ygg.includes(".ygg-vitre.ygg-portrait{aspect-ratio:4/5;") && ygg.includes("' ygg-portrait'"), "cadre en portrait pour le fruit d'or (format, pas résolution)");
}
/* Les répliques attendent que le Coffre soit entièrement à l'écran */
assert.ok(dig.includes("function quandEntierementVisible_(f){") && dig.includes("r.top>=0&&r.left>=0&&r.bottom<=h&&r.right<=w") && dig.includes("quandEntierementVisible_(function(coffre){"), "répliques différées jusqu'à ce que le Coffre soit entièrement visible");
