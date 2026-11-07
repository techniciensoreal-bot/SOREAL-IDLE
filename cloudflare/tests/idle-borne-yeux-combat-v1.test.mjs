import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-07) : « quand on lance un combat, les yeux doivent apparaître et regarder la barre de vie ; suivant l'avancée du combat, ils adoptent des émotions ; quand on perd, ses yeux sont des croix ; il faut vraiment
 * lui donner vie ». Le vrai module des yeux (borne-yeux-v1.js) tourne ici sur un faux panneau 120 x 14 : on compte les points allumés.
 */
const src = fs.readFileSync("cloudflare/public/modules/borne-yeux-v1.js", "utf8");
const fen = { addEventListener() {}, performance: { now: () => 0 } };
const ctx = vm.createContext({ window: fen, performance: fen.performance, Math, Array, Object, String, Number });
vm.runInContext(src, ctx);

function monde() {
  const P = { W: 120, H: 14, p: {}, reduced: false };
  const S = { pv: { pct: 1 }, bar: { v: 1 } };
  let pts = new Map();
  const O = {
    px: (x, y, c, v) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= P.W || y >= P.H) return; pts.set(x + "," + y, v === undefined ? 255 : v); },
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    sm: (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); },
    BLA: 7, P: () => P, S: () => S
  };
  const Y = fen.__SOREAL_IDLE_BORNE_YEUX_V1__(O);
  const image = (f) => { pts = new Map(); f(); return pts; };
  const centre = (m) => { let sx = 0, n = 0; for (const k of m.keys()) { sx += Number(k.split(",")[0]); n += 1; } return n ? sx / n : NaN; };
  return { P, S, Y, image, centre };
}

/* 1. le regard suit le bout de la barre de vie du boss : boss presque mort (barre à gauche) contre boss plein (barre jusqu'au bout) */
{
  const m = monde();
  const joue = (pct) => { const w = monde(); w.S.pv.pct = pct; let c; for (let t = 1.2; t <= 3.0; t += 0.04) c = w.image(() => w.Y.combat(t)); return w.centre(c); };
  const plein = joue(1), presque = joue(0.1);
  assert.ok(presque - plein > 0.15, "pupille vers la gauche quand la barre recule : les points allumés se déplacent vers la droite (" + plein.toFixed(2) + " -> " + presque.toFixed(2) + ")");
  assert.ok(m.Y.combat && m.Y.fin, "scènes de combat et de fin exposées");
}

/* 2. l'humeur change avec l'avancée : le dessin diffère (concentré, déterminé, ravi, peur) */
{
  const empreintes = new Set();
  for (const [pct, pj] of [[1, 1], [0.3, 1], [0.08, 1], [0.6, 0.12], [0.6, 0.4]]) {
    const w = monde(); w.S.pv.pct = pct; w.S.bar.v = pj; let c;
    for (let t = 1.2; t <= 3.0; t += 0.04) c = w.image(() => w.Y.combat(t));
    empreintes.add([...c.keys()].sort().join(";"));
  }
  assert.equal(empreintes.size, 5, "cinq humeurs, cinq dessins différents");
}

/* 3. les yeux s'ouvrent au lancement (fermés à t = 0) */
{
  const w = monde(); const t0 = w.image(() => w.Y.combat(0)), t1 = w.image(() => w.Y.combat(1.5));
  assert.ok(t0.size < t1.size * 0.5, "yeux fermés à t = 0 (" + t0.size + " points) puis ouverts (" + t1.size + ")");
}

/* 4. défaite : des CROIX (peu de points, pas d'œil plein) ; victoire : arcs et étincelles */
{
  const w = monde(); const ko = w.image(() => w.Y.fin(1.5, "ko")), ouvert = w.image(() => w.Y.fin(0.1, "ko")), win = w.image(() => w.Y.fin(1.5, "win"));
  assert.ok(ko.size > 20 && ko.size < ouvert.size * 0.5, "croix : bien moins de points que des yeux ouverts (" + ko.size + " contre " + ouvert.size + ")");
  assert.notDeepEqual([...ko.keys()].sort(), [...win.keys()].sort(), "défaite et victoire se distinguent");
  /* chaque croix est symétrique : les points de l'œil gauche et ceux de l'œil droit se correspondent par symétrie verticale du dessin (même nombre de points de chaque côté) */
  const gauche = [...ko.keys()].filter((k) => Number(k.split(",")[0]) < 60).length, droite = ko.size - gauche;
  assert.ok(Math.abs(gauche - droite) <= 2, "deux croix identiques (" + gauche + " / " + droite + ")");
}

/* 5. animation réduite : yeux ouverts et fixes (aucun clignement, aucun tremblement) */
{
  const w = monde(); w.P.reduced = true;
  const a = w.image(() => w.Y.combat(2.0)), b = w.image(() => w.Y.combat(2.9));
  assert.deepEqual([...a.keys()].sort(), [...b.keys()].sort(), "mouvement réduit : image identique à deux instants");
}

/* 5 bis. DISTANCE (Norman, 2026-11-07 : « il doit zoomer pour certaines raisons, pas tout le temps ; énervé il zoome et nous regarde de plus près ») : taille fixe au calme, plus grande quand le boss faiblit (énervé), recul quand la peur s'installe puis détente, tout près quand le boss va tomber, jamais de respiration continue */
{
  const largeur = (pct, pj, t, depart = 1.2) => {
    const w = monde(); w.S.pv.pct = pct; w.S.bar.v = pj; let c;
    for (let u = depart; u <= t; u += 0.04) c = w.image(() => w.Y.combat(u));
    const xs = [...c.keys()].map((k) => Number(k.split(",")[0])); return Math.max(...xs) - Math.min(...xs);
  };
  const calme = largeur(1, 1, 3.0), calme2 = largeur(1, 1, 6.5);
  assert.ok(Math.abs(calme - calme2) <= 1, "au calme la distance ne bouge pas (pas de respiration) : " + calme + " / " + calme2);
  assert.ok(largeur(0.3, 1, 3.0) > calme + 1, "énervé (le boss faiblit) : plus près, yeux plus grands");
  assert.ok(largeur(0.05, 1, 3.0) > largeur(0.3, 1, 3.0), "le boss va tomber : tout près");
  const peurDebut = largeur(0.6, 0.12, 2.0, 1.2), peurPlusTard = largeur(0.6, 0.12, 4.5, 1.2);
  assert.ok(peurDebut < calme - 1, "la peur s'installe : il recule");
  assert.ok(peurPlusTard > peurDebut, "puis il se détend un peu (la peur ne le fait pas reculer en continu)");
}

/* 6. branchement dans la borne */
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8");
assert.ok(led.includes("yeuxcb:{fn:function(t){var Y=yeuxMod();if(Y)Y.combat(t);},dur:9,prio:0,cap:1.0}"), "scène de combat enregistrée");
assert.ok(led.includes("if(animChoisie==='yeuxcb'||pr.secondes>=ANIM_DUREE_MIN_S||serreV1(pr))"), "les yeux apparaissent à CHAQUE combat, court ou long");
assert.ok(led.includes("Yw.fin(t,'win')") && led.includes("Yk.fin(t,'ko')"), "victoire et défaite commencent par les yeux (arcs / croix) puis le message habituel");
assert.ok(led.includes("S:function(){return S;}"), "le module lit l'état du jeu (vie du boss, vie du joueur)");
console.log("idle-borne-yeux-combat-v1: OK");
