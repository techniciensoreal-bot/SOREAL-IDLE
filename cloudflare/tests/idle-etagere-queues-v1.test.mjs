import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import vm from "node:vm";

/* Queues des chats-étagères (Norman, 2026-10-31 : « quand le chat a une QUEUE VISIBLE, elle bouge légèrement ») : sprite de la queue + masque alpha retirant la queue d'origine du décor,
 * balancement de ±2° autour d'un pivot à la racine, boucle parfaite (règle n°3), rendu par la page sans minuterie (règle n°4), repart du repos au changement d'apparence.
 * La pose de repos (= image d'origine) et l'absence de déchirure aux poses extrêmes sont vérifiées par PIL à la fabrication (planches ×3) : ici, tout ce qui se contrôle sans décoder les images. */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const AVEC = ["defaut", "noeud", "arcenciel", "fibonacci", "dore", "matrix", "chauvesouris", "pirate", "noel", "nega"];
const bac = { window: {}, document: { head: null }, Math, Date };
for (const f of ["etagere-skins-v1", "etagere-paupieres-v1", "etagere-regards-v1", "etagere-queues-v1", "etagere-personnage-v1"]) vm.runInNewContext(pub("modules/" + f + ".js"), bac);
const Q = bac.window.__SOREAL_IDLE_ETAGERE_QUEUES_V1__, S = bac.window.__SOREAL_IDLE_ETAGERE_SKINS_V1__, E = bac.window.__SOREAL_IDLE_ETAGERE_V1__;
assert.ok(Q && S && E && typeof E.queueHtml === "function" && typeof E.queueMasqueStyle === "function" && typeof E.queueSousHtml === "function");

const dim = (b) => {
  assert.equal(b.toString("ascii", 0, 4), "RIFF"); assert.equal(b.toString("ascii", 8, 12), "WEBP");
  const t = b.toString("ascii", 12, 16);
  if (t === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
  if (t === "VP8X") return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
  throw new Error("format webp inattendu " + t);
};

/* 1. Quels chats : tous ceux dont la queue est visible et identifiable ; tchernobyl (excroissances fondues dans la chair) n'a pas de queue animée. */
assert.deepEqual(Object.keys(Q).sort(), AVEC.slice().sort());
assert.ok(!Q.tchernobyl);
for (const id of Object.keys(S.skins)) if (!Q[id]) assert.equal(id, "tchernobyl", id + " : seul tchernobyl est sans queue animée");

/* 2. Fichiers : sprite + masque existent, tailles raisonnables, dimensions du sprite = sa boîte en % de l'image 768 x 1152, masque = image entière. */
let poids = 0;
for (const id of AVEC) {
  const q = Q[id];
  for (const k of ["left", "top", "larg", "haut", "angle", "duree", "phase"]) assert.ok(typeof q[k] === "number" && isFinite(q[k]), id + " " + k);
  assert.ok(q.left >= 0 && q.top >= 0 && q.larg > 0 && q.haut > 0 && q.left + q.larg <= 100.001 && q.top + q.haut <= 100.001, id + " : aucun % hors de l'image");
  assert.ok(q.pivot.x >= 0 && q.pivot.x <= 100 && q.pivot.y >= 0 && q.pivot.y <= 100, id + " : pivot dans le sprite");
  assert.ok(q.sprite === "/garderie/queues/" + id + ".webp" && q.masque === "/garderie/queues/" + id + "-m.webp", id + " : chemins");
  for (const u of [q.sprite, q.masque]) {
    const f = "cloudflare/public" + u;
    assert.ok(existsSync(f), f);
    poids += statSync(f).size;
  }
  assert.ok(statSync("cloudflare/public" + q.sprite).size > 2000 && statSync("cloudflare/public" + q.sprite).size < 60000, id + " : sprite de taille raisonnable");
  assert.ok(statSync("cloudflare/public" + q.masque).size < 3000, id + " : masque de quelques Ko");
  const ds = dim(readFileSync("cloudflare/public" + q.sprite));
  assert.ok(Math.abs(ds.w - q.larg * 7.68) <= 0.6 && Math.abs(ds.h - q.haut * 11.52) <= 0.6, id + " : sprite " + ds.w + "x" + ds.h + " = boîte annoncée");
  const dm = dim(readFileSync("cloudflare/public" + q.masque));
  assert.deepEqual(dm, { w: 768, h: 1152 }, id + " : masque dans le repère 768 x 1152 de l'image");
  /* mouvement doux, lent, léger */
  assert.ok(q.angle >= 1.5 && q.angle <= 3, id + " : ±2 à 3° (selon la taille de la queue)");
  assert.ok(q.duree >= 6 && q.duree <= 9, id + " : 6 à 9 s par cycle");
  assert.ok(q.phase >= 0 && q.phase < q.duree, id + " : phase = délai positif (repart du repos)");
  if (q.sous) {
    assert.equal(id, "fibonacci", "calque sous le décor : seulement le halo de Fibonacci");
    assert.ok(existsSync("cloudflare/public" + q.sous.image) && q.sous.left + q.sous.larg <= 100.001 && q.sous.top + q.sous.haut <= 100.001);
    poids += statSync("cloudflare/public" + q.sous.image).size;
  }
}
assert.ok(poids < 250 * 1024, "poids total des nouveaux fichiers < 250 Ko (" + poids + " o)");
const phases = AVEC.map((i) => Q[i].phase);
assert.equal(new Set(phases).size, AVEC.length, "une phase propre à chaque chat");

/* 3. Les queues visibles sortent à droite du chat. */
for (const id of AVEC) assert.ok(Q[id].left > 70, id + " : sprite à droite du chat (là où la queue sort)");

/* 4. Rendu : sprite animé par-dessus le décor, masque alpha sur l'image du décor, calque dessous pour Fibonacci seulement ; rien pour un chat sans queue. */
for (const id of AVEC) {
  const h = E.queueHtml(id), q = Q[id];
  assert.ok(h.startsWith('<i class="et-queue"') && h.includes("left:" + q.left + "%;top:" + q.top + "%;width:" + q.larg + "%;height:" + q.haut + "%"), id + " : boîte en % de l'image");
  assert.ok(h.includes("url(" + q.sprite + ")") && h.includes("transform-origin:" + q.pivot.x + "% " + q.pivot.y + "%") && h.includes("--qa:" + q.angle + "deg") && h.includes("--qd:" + q.duree + "s") && h.includes("--qp:" + q.phase + "s"), id + " : pivot, angle, durée, phase");
  const m = E.queueMasqueStyle(id);
  assert.ok(m.includes("mask-image:url(" + q.masque + ")") && m.includes("mask-size:100% 100%"), id + " : masque sur le décor");
  assert.equal(E.queueSousHtml(id) !== "", id === "fibonacci", id + " : calque sous le décor seulement pour Fibonacci");
}
assert.equal(E.queueHtml("tchernobyl"), ""); assert.equal(E.queueMasqueStyle("tchernobyl"), ""); assert.equal(E.queueSousHtml("tchernobyl"), "");
assert.equal(E.queueHtml("inconnu"), "");

/* 5. CSS : boucle parfaite (0 % = 100 %, départ = arrivée, repos = image d'origine), ease-in-out, mouvement réduit coupé, aucune minuterie. */
const perso = pub("modules/etagere-personnage-v1.js");
const kf = perso.match(/@keyframes etQueue\{(.*?)\}\}'/);
assert.ok(kf, "keyframes etQueue");
assert.ok(/0%,100%\{transform:rotate\(0deg\)\}/.test(kf[1]), "0 % = 100 % = repos (aucune rotation)");
assert.ok(/25%\{transform:rotate\(var\(--qa,2deg\)\)\}/.test(kf[1]) && /75%\{transform:rotate\(calc\(var\(--qa,2deg\) \* -1\)\)/.test(kf[1]), "extrêmes symétriques +a / −a");
assert.ok(/\.et-queue\{[^}]*animation:etQueue var\(--qd,8s\) ease-in-out var\(--qp,0s\) infinite/.test(perso), "ease-in-out, boucle infinie, délai propre");
assert.ok(/prefers-reduced-motion:reduce\)\{[^']*\.et-queue\{animation:none\}/.test(perso) || /prefers-reduced-motion:reduce\)\{[^']*\.et-queue[^']*animation:none/.test(perso), "mouvement réduit : la queue reste au repos");
assert.ok(!/setTimeout|setInterval|requestAnimationFrame/.test(perso), "aucune minuterie dans le module (règle n°4)");
assert.ok(/\.et-queue\{position:absolute;z-index:5;/.test(perso) && /\.et-sous\{position:absolute;z-index:0;/.test(perso));

/* 6. Page : le rendu de la Garderie pose calque dessous + image masquée + queue ; l'ancienne copie du chat qui sort fige sa queue dans sa pose ; script chargé avant le module personnage. */
const page = pub("modules/daycare-page-v1.js");
assert.ok(page.includes("E2.queueSousHtml(sid)") && page.includes("E2.queueMasqueStyle(sid)") && page.includes("E2.queueHtml(sid)"), "la page dessine les queues");
assert.ok(page.indexOf("queueSousHtml(sid)") < page.indexOf('class="gd-img"') && page.indexOf('class="gd-img"') < page.indexOf("E2.queueHtml(sid)"), "ordre : calque dessous, image du décor, puis queue");
assert.ok(page.includes("E3.figerQueues(el,ancien)"), "la copie sortante fige sa queue");
assert.ok(perso.includes("function figerQueues(source,copie){") && perso.includes("querySelectorAll('.et-queue')") && perso.includes("style.animation='none'") && perso.includes("getComputedStyle(a[i]).transform"), "figerQueues : animation coupée, pose courante conservée");
{ /* essai du vrai code : la copie reçoit la transformation courante et plus d'animation */
  const mk = (tr) => ({ style: {}, tr });
  const a = [mk("matrix(1,0,0,1,0,0)")], c = [mk("")];
  const src = { querySelectorAll: () => a }, cop = { querySelectorAll: () => c };
  const ctx = { window: { getComputedStyle: (n) => ({ transform: n.tr }) }, document: { head: null } };
  vm.runInNewContext(perso, ctx);
  ctx.window.__SOREAL_IDLE_ETAGERE_V1__.figerQueues(src, cop);
  assert.equal(c[0].style.animation, "none"); assert.equal(c[0].style.transform, "matrix(1,0,0,1,0,0)");
  ctx.window.__SOREAL_IDLE_ETAGERE_V1__.figerQueues({}, cop);   /* faux éléments sans querySelectorAll : sans effet */
}
const idx = pub("index.html");
const iQ = idx.indexOf("/modules/etagere-queues-v1.js?v="), iP = idx.indexOf("/modules/etagere-personnage-v1.js?v=");
assert.ok(iQ > 0 && iQ < iP, "données des queues chargées avant le module personnage");
assert.ok(/<script defer src="\/modules\/etagere-queues-v1\.js\?v=\d+"><\/script>/.test(idx));
/* anti-spoil (règle n°2) : ce module ne contient aucun texte joueur. */
assert.ok(!/title=|aria-label|alt="[^"]/.test(pub("modules/etagere-queues-v1.js")));
console.log("OK idle-etagere-queues-v1");
