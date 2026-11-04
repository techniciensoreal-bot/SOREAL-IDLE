/* Cthulhu, la mascotte (Norman, 2026-11-04) + barres LED des Augmentations + galop + clown continu : gardes de cohérence. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { IDLE_TUTO_HUMEURS_V1, normaliserGuideV1 } from "../src/idle-tutoriel-v1.js";

const R = path.resolve(import.meta.dirname, "..");
const lire = (f) => fs.readFileSync(path.join(R, f), "utf8");

// 1. Invisible par défaut : un guide n'a pas de mascotte tant que l'administrateur ne la demande pas ; l'humeur inconnue est écartée
const base = { id: "t", titre: "T", declencheur: { type: "menu", menu: "ngu" }, etapes: [{ titre: "a", texte: "b" }] };
assert.equal(normaliserGuideV1(base).mascotte, false, "aucune mascotte par défaut");
assert.equal(normaliserGuideV1({ ...base, mascotte: true }).mascotte, true);
assert.equal(normaliserGuideV1(base).etapes[0].humeur, "", "humeur vide par défaut");
assert.equal(normaliserGuideV1({ ...base, etapes: [{ titre: "a", texte: "b", humeur: "nimportequoi" }] }).etapes[0].humeur, "", "humeur inconnue écartée");
for (const h of IDLE_TUTO_HUMEURS_V1) assert.equal(normaliserGuideV1({ ...base, etapes: [{ titre: "a", texte: "b", humeur: h }] }).etapes[0].humeur, h);

// 2. Les mêmes humeurs côté mascotte et côté éditeur
const mod = lire("public/modules/cthulhu-v1.js");
const liste = /var EXPRESSIONS=\[([^\]]*)\]/.exec(mod)[1].split(",").map((x) => x.replace(/'/g, "").trim());
assert.deepEqual([...liste].sort(), [...IDLE_TUTO_HUMEURS_V1].sort(), "humeurs : serveur et mascotte identiques");
const admin = lire("public/modules/admin-tutoriel-v1.js");
for (const h of IDLE_TUTO_HUMEURS_V1) if (h !== "normal") assert.ok(admin.includes("['" + h + "'"), "humeur proposée dans l'éditeur : " + h);

// 3. Toutes les pièces utilisées existent (fichier + position)
const pieces = JSON.parse(/=(\{.*\});\}\)\(\);/s.exec(lire("public/modules/cthulhu-pieces-v1.js"))[1]);
for (const m of mod.matchAll(/img\(P,'([a-z_0-9]+)'/g)) {
  assert.ok(pieces[m[1]], "pièce déclarée : " + m[1]);
  assert.ok(fs.existsSync(path.join(R, "public", "cthulhu", m[1] + ".webp")), "fichier présent : " + m[1]);
}

// 4. La mascotte ne s'affiche que si le guide la demande, et en grand elle reste dans l'écran
const tuto = lire("public/modules/tutoriel-v1.js");
assert.ok(tuto.includes("(s.guide.mascotte?mascotteHtml_(e):'')"), "Cthulhu seulement si le guide la demande");
assert.ok(tuto.includes("tu-cth-grand{position:fixed") && tuto.includes("tu-bas-cth"), "en grand : plein cadre, fenêtre en bas");

// 5. Barres LED : ajoutées après le rendu, gardées par le morph, relancées après redessin
const led = lire("public/modules/aug-led-barres-v1.js");
assert.ok(led.includes("data-morph-garder") && led.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "barres LED : règle n°4");
assert.ok(lire("public/index.html").includes("/modules/aug-led-barres-v1.js"), "script chargé");

// 6. Galop (Norman, 2026-11-04) : l'image du joueur revient petite au loin et grossit en galopant (3 foulées, bruit de sabots) ; la borne et la pancarte de la chronique rebondissent en même temps ; la borne tousse hors combat seulement ; aucun cheval dessiné
const borne = lire("public/modules/borne-led-v1.js");
assert.ok(borne.includes("function galopEffet()") && borne.includes("sorealIdleBossChroniqueV206") && borne.includes("if(reduit())return;") && borne.includes("if(!S.combat){") && borne.includes("A.borneTousse"), "borne + pancarte : rebond ; toux hors combat");
assert.ok(!borne.includes("CHEVAL") && !borne.includes("sGalop"), "aucun cheval dessiné");
const reap = lire("public/modules/reapparitions-v1.js");
assert.ok(reap.includes("{id:'galop',nom:'Galop',duree:3.2") && reap.includes("GALOP_FOULEES=[0.68,0.68,0.68,0.68]") && reap.includes("B.galop()"), "retour galop : 3 foulées, la borne suit");
assert.ok(lire("public/modules/mort-joueur-v1.js").includes("RETOURS.indexOf('galop')>=0?'galop':variante"), "le retour galop est celui de chaque mort");
assert.ok(lire("public/modules/audio-effects-v199.js").includes("borneTousse") && lire("public/modules/audio-borne-v1.js").includes("tousser:tousser"), "toux synthétisée");

// 7. Clown : la course se règle sur la durée et l'issue prévues, la défaite enchaîne sans relancer la course
assert.ok(borne.includes("pp.issue==='defaite'&&du>=0") && borne.includes("p.suite=true") && borne.includes("cont=Boolean(pp.suite)"), "clown continu");

// 8. Wandoos : vitesse en niveaux entiers au-dessus d'un niveau par seconde ; tour de barre sur l'horloge du jeu
const wd = lire("public/modules/wandoos-retro-v1.js");
assert.ok(wd.includes("Math.floor(n+1e-9)+' niv/s'"), "vitesse entière");
assert.ok(wd.includes("var ph=((maintenant_()/1000)*v)%1;"), "tour de barre calé sur l'horloge, pas sur la synchro");

console.log("idle-cthulhu-mascotte-v1: OK");

/* 9. Suppressions demandées (Norman, 2026-11-04) : plus de fenêtre à la première ouverture d'un menu, plus de popup des gains hors ligne, seuls les guides de Cthulhu sont joués ; voix et générateur intacts */
{
  const nav = lire("public/modules/ui-navigation-v1.js"), noyau = lire("public/modules/ui-noyau-v1.js"), amor = lire("public/modules/ui-amorcage-v1.js");
  assert.ok(!nav.includes("REG.idlePopupQueueV75.push(info)") && !nav.includes("demarrerTutorielPagesIdleV1_(\n"), "première ouverture d'un menu : aucune fenêtre");
  assert.ok(!/afficherResumeHorsLigneIdleV64_\(\s*j\s*\)/.test(noyau), "gains hors ligne : plus aucun appel");
  assert.ok(amor.includes("window.__sorealVoiceTextesIdleV1__"), "la liste des textes à voix (générateur) est intacte");
  const src = lire("src/idle-tutoriel-v1.js");
  assert.ok(src.includes("if (g.mascotte !== true) return false;") && src.includes("IDLE_TUTORIEL_SEED_V1 = [];"), "seuls les guides de Cthulhu sont joués ; plus de graine");
}

/* 10. Nuages NGU (Norman, 2026-11-04) : un seul nuage lent = l'avancée du niveau (à l'arrêt si on retire l'énergie), plusieurs à partir de 2 niveaux par seconde, fumée dense jusqu'à 49, tuyau plein à 50 */
{
  const ngu = lire("public/modules/ngu-labo-v1.js");
  assert.ok(ngu.includes("var NB_NUAGES=12") && ngu.includes("function fumeeEtat_(spl,p,deplace,maintenant)") && ngu.includes("function majNuages_(f,spl,frac,maintenant)"), "réserve de nuages placés par le tick");
  assert.ok(ngu.includes("var pleine=spl>0&&(1/spl)>=49.99;") && !ngu.includes("spl<0.04"), "tuyau plein seulement à 50 niveaux par seconde");
  assert.ok(ngu.includes("data-nl-nuage") && ngu.includes(".nl-barre:not([data-nl-nuage]):not(.actif) .nl-ciel{display:none}"), "le nuage reste (à l'arrêt) quand on retire l'énergie en cours de niveau");
  assert.ok(!ngu.includes("longueurTraine_") && !ngu.includes("mask-image:'+masque"), "plus de fenêtre masquée ni de voiles qui défilent (énergie)");
  /* la logique de placement, exécutée telle quelle */
  const m = /function fumeeEtat_\(spl,p,deplace,maintenant\)\{[\s\S]*?\n\}\n/.exec(ngu)[0];
  const fumeeEtat = new Function("NB_NUAGES", m + "return fumeeEtat_;")(12);
  const n = (e) => e.nuages.filter((x) => x != null).length;
  assert.equal(n(fumeeEtat(10, 0.4, true, 0)), 1, "lent : un seul nuage");
  assert.equal(fumeeEtat(10, 0.4, true, 0).nuages[0], 0.4, "sa position EST l'avancée du niveau");
  assert.equal(n(fumeeEtat(10, 0.4, false, 0)), 1, "énergie retirée : le nuage reste, à sa place");
  assert.equal(n(fumeeEtat(10, 0.05, true, 0)), 2, "début de niveau : l'ancien finit de sortir, le nouveau entre");
  for (const k of [2, 3, 4, 6]) { const e = fumeeEtat(1 / k, 0, true, 0); assert.ok(n(e) >= k && n(e) <= k + 2, k + " niveaux par seconde : environ " + k + " nuages en même temps (" + n(e) + ")"); }
  assert.ok(fumeeEtat(1 / 20, 0, true, 0).d > 0.2 && fumeeEtat(1 / 49, 0, true, 0).d > 0.9, "la fumée se densifie jusqu'à 49");
}
