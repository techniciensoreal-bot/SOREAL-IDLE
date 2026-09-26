import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-09-26) : Fuite = l'image du boss n'est pas rechargée et son gong ne se rejoue pas, un son de « lose » ; un nouveau menu débloqué
 * est annoncé en fondu avec un petit bruit de victoire différent de celui des boss. Vérifié en navigateur (local) : 1 seul son (flee) à la fuite,
 * aucun fondu, annonce non cliquable avec le son menuUnlock. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");

// 1. Sons : deux nouveaux, distincts de la victoire et de la défaite des boss
for (const nom of ["flee", "menuUnlock"]) {
  assert.ok(audio.includes(`${nom}:{group:`), nom + " défini");
  assert.ok(audio.includes(`${nom}:function(){return demander_("${nom}");}`), nom + " exposé");
}
assert.ok(audio.includes("flee:fuite_,") && audio.includes("menuUnlock:menuDebloque_,"));
const corps = (nom) => audio.slice(audio.indexOf(`function ${nom}(){`), audio.indexOf("\n  }\n", audio.indexOf(`function ${nom}(){`)));
assert.notEqual(corps("fuite_"), corps("defaite_"));
assert.notEqual(corps("menuDebloque_"), corps("victoireBoss_"));
assert.ok(!corps("menuDebloque_").includes("[392,.18,.052,0]"), "pas la fanfare des boss");

// 2. Fuite : clé du fondu = l'adresse de l'image (plus de clé nom / numéro qui alternent), image déjà affichée non remplacée, son de fuite seulement en combat
assert.ok(ui.includes("void cle;") && /classeFonduImageIdleV61_\(\s*type,\s*url\s*\)/.test(ui));
assert.ok(ui.includes("dejaAffichee.getAttribute('src')===urlAttendue"));
assert.ok(ui.includes('onclick="window.__fuirBossIdleV1__()"'));
assert.ok(ui.includes("if(enCombat)jouerEffetAudioIdleV199_('flee');"));
assert.ok(ui.includes(`decoding="'+(fade?'async':'sync')+'"`), "pas d'image vide d'une image sur l'autre quand l'image ne change pas");

// 3. Annonce d'un menu débloqué
const annonce = ui.slice(ui.indexOf("function annoncerNouveauxMenusIdleV1_(j){"), ui.indexOf("window.__annoncerNouveauxMenusIdleV1__="));
assert.ok(annonce.includes("menus-annonces-init") && annonce.includes("menu-annonce:"), "première fois : menus déjà disponibles notés sans annonce ; ensuite une annonce par menu");
assert.ok(annonce.includes("jouerEffetAudioIdleV199_('menuUnlock')") && annonce.includes("window.__sorealFadeNoticeV1__('🔓 Nouveau menu débloqué !'"));
assert.ok(ui.includes("annoncerNouveauxMenusIdleV1_(j);"), "appelée à chaque rendu");
const fade = readFileSync("cloudflare/public/modules/fade-notice-v1.js", "utf8");
assert.ok(fade.includes("pointer-events:none"), "jamais cliquable");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/audio-effects-v199.js?v=214"));
console.log("idle-flee-and-menu-unlock-v1: OK");
