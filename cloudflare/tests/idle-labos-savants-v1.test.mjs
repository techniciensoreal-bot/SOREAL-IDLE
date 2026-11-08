import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { IDLE_NGU_DIGGERS } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-11-08) : « transformer les mineurs d'or en Labos : des savants fous qui concoctent des potions ; style cartoon ». Garde du module des savants fous (modules/labos-savants-v1.js) :
 * un labo par mineur du moteur, une potion différente par labo, des scènes SVG en couches, un liquide découpé dans la forme réelle de chaque verre, des animations en boucle parfaite (règle n°3).
 */
const src = fs.readFileSync("cloudflare/public/modules/labos-savants-v1.js", "utf8");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const S = ctx.window.__SOREAL_IDLE_LABOS_SAVANTS_V1__;
assert.ok(S && typeof S.scene === "function" && typeof S.css === "function", "module exposé");

// Un labo par mineur du moteur (mêmes identifiants), tous différents.
const ids = IDLE_NGU_DIGGERS.map((d) => d.id).sort();
assert.deepEqual(Object.keys(S.labos).sort(), ids, "un labo par mineur du moteur");
assert.deepEqual(Object.keys(S.cellules).sort(), ids, "une cellule de décor par labo");
assert.equal(new Set(Object.values(S.labos).map((l) => l.potion)).size, ids.length, "douze potions différentes");
assert.equal(new Set(Object.values(S.labos).map((l) => l.c.join())).size, ids.length, "douze couleurs de potion différentes");
assert.equal(new Set(Object.values(S.labos).map((l) => l.nom)).size, ids.length, "douze noms de labos différents");

// Les recadrages tombent dans l'image du décor (1262 x 848) avec la taille d'une scène (316 x 268).
for (const [id, f] of Object.entries(S.cellules)) assert.ok(f === "decor-" + id + ".webp" && fs.existsSync(new URL("../public/img/mineurs/labos/" + f, import.meta.url)), "image de décor propre au labo " + id);

// Les formes intérieures des verres (mesurées sur le canal alpha) tiennent dans leur image.
const dims = { flacon: [274, 378], becher: [222, 324], tubeD: [265, 325], tubeG: [265, 325] };
for (const [k, [w, h]] of Object.entries(dims)) {
  const I = S.interieurs[k];
  assert.ok(I && I.p.startsWith("M") && I.p.endsWith("Z"), "chemin du verre " + k);
  assert.ok(I.x0 >= 0 && I.x1 <= w && I.y0 >= 0 && I.y1 <= h && I.x1 > I.x0 && I.y1 > I.y0, "intérieur de " + k + " dans son image");
}

// Une scène complète : décor, savant, établi, liquides et verre dans l'ordre des couches ; images fournies par l'appelant.
const img = { decor: "d.webp", etabli: "e.webp", flacon: "f.webp", tubes: "t.webp", becher: "b.webp" };
for (const id of ids) {
  const svg = S.scene(id, img, true);
  assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>") && svg.includes('class="lb lb-on"'), "scène de " + id);
  const ordre = ["d.webp", "lb-savant", "e.webp", "lbc-" + id + "-flacon", 'href="f.webp"'].map((m) => svg.indexOf(m));
  assert.ok(ordre.every((p) => p >= 0) && ordre.every((p, i) => i === 0 || p > ordre[i - 1]), "couches dans l'ordre : décor, savant, établi, liquide, verre (" + id + ")");
  assert.ok(!svg.includes("NaN") && !svg.includes("undefined"), "aucune valeur invalide dans " + id);
  const ouverts = (svg.match(/<g[ >]/g) || []).length, fermes = (svg.match(/<\/g>/g) || []).length;
  assert.equal(ouverts, fermes, "groupes SVG équilibrés dans " + id);
}
assert.ok(!S.scene("inconnu", img, true), "labo inconnu : rien");
assert.ok(!S.scene("drop", img, false).includes('class="lb lb-on"'), "au repos : aucune animation");

// Animations : boucle parfaite (période commune --T), seulement transform et opacity, mouvement réduit coupé.
const css = S.css();
const kf = [...css.matchAll(/@keyframes (\w+)\{([^@]*?)\}\s*(?=\n|$)/g)];
assert.ok(kf.length >= 15, "au moins quinze animations (articulations, cheveux, blouse, yeux, bouche, liquide, bulles)");
for (const [, nom, corps] of kf) {
  assert.ok(!/(?:^|[;{ ])(?:width|height|top|left|margin|background|filter)\s*:/.test(corps), "seuls transform et opacity animés : " + nom);
  const premier = /^(?:0%|0%,)/.test(corps), dernier = /100%/.test(corps);
  assert.ok(premier && dernier, "départ et arrivée identiques (0 % et 100 % groupés) : " + nom);
}
assert.ok(css.includes("--T:2.4s") && css.includes("prefers-reduced-motion"), "période commune et mouvement réduit");
for (const articulation of ["lb-bras-av", "lb-avbras-av", "lb-bras-ar", "lb-avbras-ar", "lb-tete", "lb-cheveux", "lb-pan"]) assert.ok(css.includes("." + articulation + "{animation"), "articulation animée : " + articulation);
// Pivots : chaque articulation tourne autour de son vrai point.
assert.ok(css.includes("transform-origin:47px 46px") && css.includes("transform-origin:57.5px 37.5px"), "épaule puis coude du bras avant");

// Anti-spoil (règle n°2) : aucun total « x / y » dans le module.
assert.ok(!/\d+\s*\/\s*(?:12|total)/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun total révélateur");
console.log("idle-labos-savants-v1: OK");

/* ---------- chorégraphie (Norman, 2026-11-08 : « qu'ils se déplacent dans leurs cases, passent derrière le bureau et versent du liquide dans les récipients ») ---------- */
{
  const M = S.modele();
  // trois postes de versement (flacon, tubes, bécher), de gauche à droite derrière l'établi, bras atteignables
  assert.equal(M.postes.length, 3, "trois postes de versement");
  assert.ok(M.postes[0].X < M.postes[1].X && M.postes[1].X < M.postes[2].X, "le savant avance de gauche à droite derrière l'établi");
  for (const p of M.postes) { assert.ok(Number.isFinite(p.t1) && Number.isFinite(p.t2) && Math.abs(p.t1) < 170 && Math.abs(p.t2) < 170, "angles de bras finis et plausibles"); assert.ok(p.Y === 230, "sur le sol dallé, derrière l'établi (le sol commence à y = 224)"); }
  // boucle exacte : la fin du cycle retrouve le début (position, sens, articulations, niveaux)
  const a0 = M.articulations(0), a1 = M.articulations(15.9999);
  for (const k of ["x", "y", "f", "cuG", "tiG", "cuD", "tiD", "pv", "corps", "bob", "brasAv", "avbrasAv", "fiole", "brasAr", "avbrasAr"]) assert.ok(Math.abs(a0[k] - a1[k]) < 0.02, "boucle exacte : " + k + " (" + a0[k] + " / " + a1[k] + ")");
  for (let k = 0; k < 3; k++) assert.ok(Math.abs(M.niveau(0, k, 0.2) - M.niveau(15.9999, k, 0.2)) < 0.001, "niveau " + k + " : retour exact");
  // le savant reste dans sa case, jamais devant l'établi quand il le croise (y haut = derrière), et regarde à gauche seulement au retour
  let gauche = 0;
  for (let t = 0; t < 16; t += 0.05) {
    const a = M.articulations(t);
    assert.ok(a.x >= 70 && a.x <= 260 && a.y >= 226 && a.y <= 240, "position dans la case à t=" + t.toFixed(2));
    for (const k of Object.keys(a)) assert.ok(Number.isFinite(a[k]), "valeur finie " + k + " à t=" + t.toFixed(2));
    if (a.x > 140 && a.x < 262) assert.ok(a.y <= 233.5, "derrière l'établi quand il le longe (t=" + t.toFixed(2) + ")");
    if (a.f < -0.99) gauche += 1;
  }
  assert.ok(gauche > 20 && gauche < 80, "il regarde à gauche pendant le retour seulement");
  // chaque verre se remplit pendant son versement : le niveau monte puis redescend lentement
  for (let k = 0; k < 3; k++) { const ph = [4.2, 6.9, 9.8][k]; assert.ok(M.niveau(ph + 1.5, k, 0.2) > M.niveau(ph, k, 0.2) + 0.15, "le niveau du verre " + k + " monte pendant le versement"); assert.ok(M.filet(ph + 1.0, k) > 0.9 && M.filet(ph - 0.3, k) < 0.05, "le filet de potion coule seulement pendant le versement " + k); }
  // la fiole bascule seulement pendant le versement
  assert.ok(M.articulations(5.2).fiole > 100 && M.articulations(1).fiole === 0 && M.articulations(3.5).fiole < 1, "la fiole bascule pour verser");
  // jambes : elles marchent seulement sur les trajets
  assert.ok(Math.abs(M.articulations(3.6).cuG) + Math.abs(M.articulations(13.1).cuG) > 5 && M.articulations(5.2).cuG === 0 && M.articulations(1).cuG === 0, "jambes immobiles hors des trajets");
  // la scène ne dessine le savant qu'une fois, derrière l'établi (une seule instance de lb-savant, avant l'image de l'établi)
  const sc = S.scene("drop", { decor: "d.webp", etabli: "e.webp", flacon: "f.webp", tubes: "t.webp", becher: "b.webp" }, true, 0.25);
  assert.equal((sc.match(/class="lb-savant"/g) || []).length, 1, "un seul savant");
  assert.ok(sc.indexOf("lb-savant") < sc.indexOf("e.webp"), "le savant est derrière l'établi");
  assert.ok(sc.includes("--dec:0.25") && S.css().includes("animation-delay:calc(var(--P)*var(--dec,0)*-1)"), "départ décalé par labo");
  assert.ok(sc.includes("lb-filet-f") && sc.includes("lb-filet-t") && sc.includes("lb-filet-b"), "un filet de potion par verre");
}
console.log("idle-labos-savants-v1 (chorégraphie): OK");

/* ---------- trois positions du corps (Norman, 2026-11-08 : « marche à droite, marche à gauche, et de face quand il s'arrête pour mettre le liquide ; la tête peut rester de côté ») ---------- */
{
  const M = S.modele();
  const sc = S.scene("drop", { decor: "d.webp", etabli: "e.webp", flacon: "f.webp", tubes: "t.webp", becher: "b.webp" }, true, 0);
  assert.ok((sc.match(/class="lb-vf"/g) || []).length === 2 && (sc.match(/class="lb-vp"/g) || []).length === 2, "deux calques de corps de face (jambes, buste) et deux de profil");
  assert.ok(sc.includes("lb-p-ar") && sc.includes("lb-p-av") && sc.includes("lb-cu-g") && sc.includes("lb-ti-g") && sc.includes("lb-cu-d") && sc.includes("lb-ti-d"), "le profil a ses bras et ses jambes");
  // à l'arrêt (repos, versement) : de face ; en marche : de profil, à droite à l'aller, à gauche au retour
  for (const t of [0.5, 1.5, 5.2, 8.0, 10.8, 15.2]) assert.ok(M.articulations(t).pv < 0.01, "de face à l'arrêt (t=" + t + ")");
  for (const t of [3.2, 3.8, 6.55, 9.3, 12.5, 13.2, 13.9]) assert.ok(M.articulations(t).pv > 0.99, "de profil en marche (t=" + t + ")");
  assert.ok(M.articulations(3.8).f === 1 && M.articulations(6.55).f === 1 && M.articulations(9.3).f === 1, "marche vers la droite à l'aller");
  assert.ok(M.articulations(12.5).f === -1 && M.articulations(13.9).f === -1, "marche vers la gauche au retour");
  // le retournement de sens se fait pendant le fondu face -> profil (jamais sur un corps de face visible)
  for (let t = 0; t < 16; t += 0.01) { const a = M.articulations(t), b = M.articulations(t + 0.01 > 16 ? 0 : t + 0.01); if (Math.abs(a.f - b.f) > 0.001) assert.ok(a.pv > 0.01 || b.pv > 0.01, "retournement sans corps de face visible à t=" + t.toFixed(2)); }
  // le profil est le corps le plus étroit (buste de profil < buste de face)
  assert.ok(src.includes("M34.4 47c0-4.2 2.6-6.8 6.2-7.2") && src.includes("M30 47c0-4.4 3.4-7 7.6-7.4"), "deux busts distincts");
  assert.ok(S.css().includes("@keyframes lbVF") && S.css().includes("@keyframes lbVP"), "fondu enchaîné face / profil");
}
console.log("idle-labos-savants-v1 (trois positions): OK");

/* ---------- marche naturelle (Norman, 2026-11-08 : « les pieds ne doivent pas décoller du sol ; mouvement plus naturel des jambes » ; « derrière le pupitre, leurs pieds sont sur les murs ») ---------- */
{
  const M = S.modele();
  // sol : la limite mur / sol dallé est à y = 224 dans la scène ; les semelles touchent le sol (pieds en y >= 226) à tout instant, jamais sur le mur
  for (let t = 0; t < 16; t += 0.05) { const a = M.articulations(t); assert.ok(a.y >= 226, "pieds sur le sol dallé (y = " + a.y.toFixed(1) + " à t=" + t.toFixed(2) + ")"); }
  // le pied posé ne glisse JAMAIS : sa position dans la scène reste fixe pendant que le corps avance
  let appuis = 0, glisse = 0, leves = 0;
  for (let t = 2.5; t < 14.5; t += 0.02) {
    const a = M.pieds(t), b = M.pieds(t + 0.02);
    if (!a || !b) continue;
    if (Math.abs(M.articulations(t).f) < 0.99 || Math.abs(M.articulations(t + 0.02).f) < 0.99) continue;   /* pendant le retournement (0,15 s) le corps se resserre et pivote : le pied est mis en miroir avec lui */
    for (const k of ["a", "b"]) {
      if (a[k].appui && b[k].appui) { appuis += 1; glisse = Math.max(glisse, Math.abs(b[k].x - a[k].x)); }
      if (!a[k].appui) leves = Math.max(leves, Math.abs(a[k].y - M.articulations(t).y));
    }
  }
  assert.ok(appuis > 150, "pieds en appui mesurés : " + appuis);
  assert.ok(glisse < 0.05, "le pied posé ne glisse pas (glissement maximal " + glisse.toFixed(3) + " px par 0,02 s)");
  assert.ok(leves > 5 && leves < 9, "seul le pied qui avance se lève (de " + leves.toFixed(1) + " px)");
  // à chaque instant de marche, un pied au moins est posé (jamais deux pieds en l'air)
  for (let t = 2.7; t < 4.1; t += 0.05) { const p = M.pieds(t); assert.ok(p && (p.a.appui || p.b.appui), "un pied au moins est posé à t=" + t.toFixed(2)); }
  // genou : les deux segments gardent leur longueur, la jambe ne s'étire jamais (cinématique inverse atteignable)
  for (let t = 2.7; t < 4.1; t += 0.05) { const j = M.jambes(t); for (const k of ["a", "b"]) assert.ok(Math.abs(j[k].t1) < 80 && Math.abs(j[k].t2) < 130, "angles de jambe plausibles"); }
  assert.ok(S.css().includes("@keyframes lbCuG") && S.css().includes("@keyframes lbTiG") && S.css().includes("@keyframes lbCuD") && S.css().includes("@keyframes lbTiD"), "cuisse et tibia de chaque jambe animés");
}
console.log("idle-labos-savants-v1 (marche naturelle): OK");

/* ---------- au repos (Norman, 2026-11-08 : « au repos, la lumière éteinte et le scientifique les bras baissés ») ---------- */
{
  const css = S.css();
  const img = { decor: "d.webp", etabli: "e.webp", flacon: "f.webp", tubes: "t.webp", becher: "b.webp" };
  // lumières éteintes : un voile sombre sur toute la pièce, levé seulement quand le labo travaille
  for (const id of ids) assert.ok(S.scene(id, img, false).includes('class="lb-nuit"') && S.scene(id, img, true).includes('class="lb-nuit"'), "voile de nuit dans la scène de " + id);
  assert.ok(/\.lb-nuit\{opacity:\.[78]\d*;transition:opacity \.6s ease\}/.test(css) && css.includes(".lb-on .lb-nuit{opacity:0}"), "pièce sombre au repos, lumière rendue en 0,6 s au travail");
  assert.ok(S.scene("drop", img, false).indexOf('class="lb-nuit"') > S.scene("drop", img, false).indexOf("b.webp"), "le voile couvre toutes les couches");
  // bras baissés : calcul des positions de l'épaule, du coude et de la main avec les angles du repos
  const m = /\.lb:not\(\.lb-on\) \.lb-bras-av\{transform:rotate\((-?\d+)deg\)\}/.exec(css), n = /\.lb:not\(\.lb-on\) \.lb-avbras-av\{transform:rotate\((-?\d+)deg\)\}/.exec(css), f = /\.lb:not\(\.lb-on\) \.lb-fiole\{transform:rotate\((-?\d+)deg\)\}/.exec(css);
  assert.ok(m && n && f, "pose de repos du bras avant dans le style");
  const t1 = Number(m[1]) * Math.PI / 180, t2 = Number(n[1]) * Math.PI / 180, S1 = [47, 46], E0 = [57.5, 37.5], H0 = [60.5, 25.5];
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const e = rot([E0[0] - S1[0], E0[1] - S1[1]], t1), elbow = [S1[0] + e[0], S1[1] + e[1]];
  const h = rot([H0[0] - E0[0], H0[1] - E0[1]], t1 + t2), hand = [elbow[0] + h[0], elbow[1] + h[1]];
  assert.ok(elbow[1] > S1[1] + 10 && hand[1] > elbow[1] + 8 && hand[1] > 66, "le bras avant pend : le coude sous l'épaule, la main plus bas encore (au niveau de la hanche)");
  assert.ok(hand[0] > 52 && hand[0] < 60, "la main pend SUR LE CÔTÉ du corps, hors de la blouse (le bord droit de la blouse est à x = 51,6), pas devant : x = " + hand[0].toFixed(1));
  assert.ok(Math.abs(t1 * 180 / Math.PI + t2 * 180 / Math.PI + Number(f[1])) < 1, "la fiole reste droite (contre-rotation de la somme des deux segments)");
  assert.ok(css.includes(".lb:not(.lb-on) .lb-tete{transform-origin:41px 41px;transform:rotate(5deg)}") && css.includes(".lb:not(.lb-on) .lb-bouche{transform-origin:48px 38px;transform:scaleY(.4)}"), "tête baissée et bouche fermée au repos");
}
console.log("idle-labos-savants-v1 (repos): OK");
