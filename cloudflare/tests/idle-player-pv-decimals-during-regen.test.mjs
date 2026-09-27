import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : "la barre grisée rétrécit non stop pendant la
 * regen. C'est parce qu'une fois qu'elle atteint par exemple 14 il n'y a
 * plus la virgule présente pour 13.9."
 *
 * Le PV du boss affichait déjà 2 décimales pendant sa régénération hors
 * combat (bossEnRegenV174), mais le PV du joueur -- juste au-dessus, même
 * écran -- restait toujours arrondi à l'entier via formatGrandNombreIdleV70_,
 * y compris pendant sa propre régénération. La vraie valeur avance par
 * petits pas (13.92, 13.94...) : sans décimale, l'affichage oscille entre
 * deux entiers au lieu de monter, donnant l'impression que la barre
 * "rétrécit" plutôt que de se remplir. Corrigé en donnant au PV joueur la
 * même condition de décimales que le PV boss (regen visible + joueur vivant).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const start = ui.indexOf("const regenJoueurVisibleV176=");
assert.ok(start >= 0, "bloc de calcul du PV joueur introuvable.");
const end = ui.indexOf("const joueurBarre=", start);
assert.ok(end > start, "fin du bloc PV joueur introuvable.");
const bloc = ui.slice(start, end);

assert.match(
  bloc,
  /\(regenJoueurVisibleV176>0&&idleNombre_\(idleEtat\.pvJoueur\)>0\?formaterDecimalesFixesIdleV1_\(idleEtat\.pvJoueur,2\):formatGrandNombreIdleV70_\(idleEtat\.pvJoueur\)\)/,
  "le nombre de PV joueur doit passer à 2 décimales pendant sa propre regen, comme le PV boss (bossEnRegenV174)."
);

// Les deux jauges (joueur et boss) doivent suivre le même modèle de décimales pendant la regen.
const bossStart = ui.indexOf("const bossPvEl=");
assert.ok(bossStart >= 0, "bloc d'affichage du PV boss introuvable.");
const bossEnd = ui.indexOf("const barre=", bossStart);
const bossBloc = ui.slice(bossStart, bossEnd);
assert.match(
  bossBloc,
  /bossEnRegenV174\s*\?formaterDecimalesFixesIdleV1_\(idleEtat\.bossPv,2\)\s*:formatGrandNombreIdleV70_\(idleEtat\.bossPv\)/,
  "référence : le PV boss doit toujours suivre ce même modèle (sinon ce test compare contre du texte périmé)."
);

console.log("idle-player-pv-decimals-during-regen: OK");
