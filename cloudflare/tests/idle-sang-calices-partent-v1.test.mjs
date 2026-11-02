import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
/*
 * Norman (2026-11-02) : « avaler un bol de fil. Il y a encore 2 calices. Le premier est plein mais il ne part pas. Le 2e est vide et il attend. »
 * Cause : le calice suivant arrivait à 90 % du récipient. Un récipient compte des centaines de niveaux (capacité par paliers : 200, 2 000, 20 000...) : ces 10 % durent des dizaines de secondes à plusieurs minutes pendant
 * lesquelles le premier calice paraît plein et reste en place pendant que le second attend, vide, à côté. Et un nouveau récipient plein oublié si un échange était déjà en cours (le compte « montré » avançait quand même).
 * Règles gardées ici, avec une horloge SIMULÉE (aucun animationend, aucun nombre lu dans la page) :
 *  - le suivant n'arrive qu'à l'approche réelle du plein (temps restant d'après la cadence mesurée <= DELAI_ARRIVEE_S) ;
 *  - un récipient plein part toujours, le suivant prend sa place, il ne reste jamais deux calices courants ni un calice « en sortie » ;
 *  - pause / gel (aucune mise à jour pendant des dizaines de secondes, plusieurs récipients terminés d'un coup) : rattrapé à la reprise ;
 *  - minuteur perdu (gel) : le tour de mise à jour termine l'échange ;
 *  - récipient terminé PENDANT un échange : son échange est joué juste après, jamais oublié.
 */
const src = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");

assert.ok(/function gererVases\(sc,id,type,pal,avant,nReel\)\{/.test(src) && /vus\[id\]=vuApres;/.test(src), "la décision des récipients vit dans gererVases et le compte montré n'avance que si l'échange a eu lieu");
assert.ok(/if\(sc\.__swap\)return avant;/.test(src), "récipient terminé pendant un échange : le compte montré n'avance pas (rattrapage)");
assert.ok(/function suivantAttendu\(id,pal,nReel\)\{/.test(src) && /var attendu=suivantAttendu\(opts\.id,pal\);/.test(src), "le rendu de la page et la mise à jour utilisent la même règle d'arrivée du suivant");
const bloc = src.slice(src.indexOf("function gererVases"), src.indexOf("var DEPART_GOUTTE"));
assert.ok(!/animationend|getAnimations|lireCompte|textContent/.test(bloc.slice(0, bloc.indexOf("var DELAI_ARRIVEE_S"))), "le cycle ne lit ni animation ni nombre affiché");

// ---- mini DOM + horloge simulée ----
let maintenant = 0, minuteurs = [], perdre = false;
function noeud(classes = []) {
  const n = {
    attrs: new Map(), parentNode: null, enfants: [], className: classes.join(" "), innerHTML: "",
    get classList() {
      const o = this;
      const lire = () => new Set(String(o.className).split(/\s+/).filter(Boolean));
      return { add(...c) { const s = lire(); c.forEach((x) => s.add(x)); o.className = [...s].join(" "); }, remove(...c) { const s = lire(); c.forEach((x) => s.delete(x)); o.className = [...s].join(" "); }, contains(c) { return lire().has(c); } };
    },
    hasAttribute(a) { return this.attrs.has(a); }, setAttribute(a, v) { this.attrs.set(a, String(v == null ? "" : v)); }, removeAttribute(a) { this.attrs.delete(a); }, getAttribute(a) { return this.attrs.has(a) ? this.attrs.get(a) : null; },
    appendChild(c) { c.parentNode = this; this.enfants.push(c); return c; },
    removeChild(c) { this.enfants = this.enfants.filter((x) => x !== c); c.parentNode = null; },
    insertBefore(c, ref) { c.parentNode = this; const i = ref ? this.enfants.indexOf(ref) : -1; if (i < 0) this.enfants.push(c); else this.enfants.splice(i, 0, c); return c; },
    vases() { return this.enfants.filter((e) => e.classList.contains("bm-vase")); },
    querySelectorAll(sel) { return sel === ".bm-vase" ? this.vases() : []; },
    querySelector(sel) {
      if (sel === ".bm-vase.bm-suivant") return this.vases().find((e) => e.classList.contains("bm-suivant")) || null;
      if (sel === ".bm-vase:not(.bm-suivant)") return this.vases().find((e) => !e.classList.contains("bm-suivant")) || null;
      return null;
    },
  };
  return n;
}
const fenetre = { __nomJoueurIdleV1__: () => "Norman" };
const documentFaux = { createElement: () => noeud() };
vm.runInNewContext(
  src.replace("window.__SOREAL_IDLE_SANG_DECOR_V1__={", "window.__T__={gererVases:gererVases,noterNiveau:noterNiveau,cadenceNiveaux:cadenceNiveaux,suivantAttendu:suivantAttendu,paliers:paliers,normaliserVases:normaliserVases,vus:vus,suivantVu:suivantVu,echantNiv:echantNiv,DELAI:DELAI_ARRIVEE_S,SEUIL:SEUIL_ARRIVEE,filmFond:filmFond};window.__SOREAL_IDLE_SANG_DECOR_V1__={"),
  { window: fenetre, setInterval: () => 0, clearInterval: () => {}, document: documentFaux, performance: { now: () => maintenant }, setTimeout: (f, ms) => { if (!perdre) minuteurs.push({ t: maintenant + ms, f }); return 0; }, console }
);
const T = fenetre.__T__;
const ID = "barbedWire";

function nouvelleScene() {
  const sc = noeud(["bm-scene"]); sc.__swap = false;
  const v = noeud(["bm-vase"]); sc.appendChild(v);
  return sc;
}
function reinitialiser() { for (const k of Object.keys(T.vus)) delete T.vus[k]; for (const k of Object.keys(T.suivantVu)) delete T.suivantVu[k]; for (const k of Object.keys(T.echantNiv)) delete T.echantNiv[k]; minuteurs = []; perdre = false; }
function avancerHorloge(t) {   // fait « sonner » les minuteurs échus (comme un navigateur qui tourne)
  while (true) {
    const due = minuteurs.filter((m) => m.t <= t).sort((a, b) => a.t - b.t)[0];
    if (!due) break;
    minuteurs = minuteurs.filter((m) => m !== due);
    maintenant = due.t; due.f();
  }
  maintenant = t;
}
// un tour de majScene (400 ms) : même ordre que le vrai : normaliserVases -> gererVases ; n = nombre de niveaux terminés à cet instant
function tour(sc, n, nv = n) {   // nv = niveau AFFICHÉ (peut retarder sur le compte réel n, voir filNAffiche)
  const pal = T.paliers(ID, nv); pal.nv = nv;
  T.noterNiveau(ID, n, maintenant);
  T.normaliserVases(sc, ID, "calice", T.filmFond(ID, nv, pal.fraction));
  const avant = T.vus[ID] === undefined ? (Number(sc.getAttribute("data-bm-pleins")) || 0) : T.vus[ID];
  T.vus[ID] = T.gererVases(sc, ID, "calice", pal, avant, n);
  sc.setAttribute("data-bm-pleins", String(pal.pleins));
  return pal;
}
const courants = (sc) => sc.vases().filter((e) => !e.classList.contains("bm-suivant") && !e.classList.contains("bm-sort"));
const sortants = (sc) => sc.vases().filter((e) => e.classList.contains("bm-sort"));
const suivants = (sc) => sc.vases().filter((e) => e.classList.contains("bm-suivant"));

/** Déroule la scène : niveauA(t) = niveaux terminés à t (ms) ; pas = 400 ms ; sauts = intervalles sans aucune mise à jour (onglet masqué, gel). */
function derouler({ niveaux, duree, pas = 400, sauts = [], depart = 0 }) {
  reinitialiser();
  const sc = nouvelleScene(); maintenant = depart; sc.setAttribute("data-bm-pleins", String(T.paliers(ID, niveaux(depart)).pleins));
  const journal = [], anomalies = [];
  let bloqueDepuis = null, nbEchanges = 0, etaitSortant = false;
  for (let t = depart; t <= depart + duree; t += pas) {
    avancerHorloge(t);
    if (sauts.some(([a, b]) => t >= a && t < b)) continue;   // pas de tour : la scène ne se met pas à jour
    const pal = tour(sc, niveaux(t));
    const s = sortants(sc).length > 0; if (s && !etaitSortant) nbEchanges++; etaitSortant = s;
    journal.push({ t, pleins: pal.pleins, fraction: pal.fraction, cour: courants(sc).length, suiv: suivants(sc).length, sort: sortants(sc).length, swap: sc.__swap });
    // anomalie : hors échange, plus d'un calice courant ou un calice en sortie, pendant plus de 1,3 s
    const mauvais = !sc.__swap && (courants(sc).length !== 1 || sortants(sc).length > 0 || suivants(sc).length > 1);
    if (mauvais) { if (bloqueDepuis === null) bloqueDepuis = t; if (t - bloqueDepuis > 1300) anomalies.push(t); } else bloqueDepuis = null;
  }
  return { sc, journal, anomalies, nbEchanges };
}

// ---- 1. rythme LENT (1 niveau / 2 s, récipient de 200) : le suivant n'arrive qu'à l'approche du plein, et le plein part ----
{
  const { journal, anomalies, sc } = derouler({ niveaux: (t) => Math.floor(t / 2000), duree: 420000 });
  const arrivee = journal.find((j) => j.suiv === 1 && j.pleins === 0);
  assert.ok(arrivee, "le suivant finit par arriver");
  const restant = (1 - arrivee.fraction) * 200 * 2;   // secondes avant la fin du récipient
  assert.ok(restant <= T.DELAI + 2.5, "le suivant arrive à moins de ~" + T.DELAI + " s du plein (restant " + restant.toFixed(1) + " s) : plus de calice vide qui attend pendant 40 s");
  const echange = journal.find((j) => j.pleins === 1);
  assert.ok(echange, "le premier récipient atteint le plein");
  const fin = journal.find((j) => j.t >= echange.t + 1300);
  assert.equal(fin.cour, 1, "un seul calice courant après l'échange"); assert.equal(fin.sort, 0, "plus aucun calice en sortie");
  assert.deepEqual(anomalies, [], "aucun état bloqué (deux calices, calice en sortie)");
  assert.equal(courants(sc).length, 1);
}

// ---- 2. gros récipient (palier 2 000, 5 niveaux / s : les 10 % duraient 40 s) ----
{
  const depart = 0, N0 = 2000 + 1700;   // 85 % du premier récipient du palier suivant
  const { journal, anomalies } = derouler({ niveaux: (t) => N0 + Math.floor(t / 200), duree: 120000 });
  const arrivee = journal.find((j) => j.suiv === 1);
  assert.ok(arrivee, "suivant arrivé");
  const restant = (1 - arrivee.fraction) * 2000 / 5;
  assert.ok(restant <= T.DELAI + 2.5, "gros récipient : suivant à moins de ~" + T.DELAI + " s du plein (restant " + restant.toFixed(1) + " s, l'ancienne règle donnait 40 s)");
  const sortie = journal.find((j) => j.sort === 1);
  assert.ok(sortie, "le plein part");
  assert.deepEqual(anomalies, []);
}

// ---- 3. pause / gel de 70 s : plusieurs récipients terminés d'un coup, rattrapés à la reprise ----
{
  const { journal, anomalies, sc, nbEchanges } = derouler({ niveaux: (t) => Math.floor(Math.min(t, 134000) / 100), duree: 140000, sauts: [[20000, 90000]] });
  const apres = journal.filter((j) => j.t >= 90000);
  assert.ok(apres[0].pleins >= 3, "plusieurs récipients terminés pendant la pause");
  assert.ok(nbEchanges >= 2, "au moins un échange avant la pause et un au retour");
  assert.deepEqual(anomalies, [], "après la pause : un seul calice courant, rien en sortie");
  const dernier = journal[journal.length - 1];
  assert.equal(dernier.cour, 1); assert.equal(dernier.sort, 0);
  assert.equal(T.vus[ID], dernier.pleins, "le compte montré a rattrapé le compte réel");
  assert.equal(courants(sc).length, 1);
}

// ---- 4. rythme très rapide : un récipient terminé pendant un échange est joué juste après, jamais oublié ----
{
  const { journal, anomalies, nbEchanges } = derouler({ niveaux: (t) => Math.floor(Math.min(t, 54000) / 20), duree: 60000 });   // 50 niveaux / s : un récipient toutes les 4 s
  const dernier = journal[journal.length - 1];
  assert.deepEqual(anomalies, []);
  assert.ok(nbEchanges >= dernier.pleins - 2, "chaque récipient terminé a son échange (" + nbEchanges + " échanges pour " + dernier.pleins + " récipients)");
  assert.equal(T.vus[ID], dernier.pleins);
  // cas précis : deux récipients terminés à moins de 400 ms d'écart pendant le même échange
  reinitialiser();
  const sc = nouvelleScene(); maintenant = 0;
  T.vus[ID] = 0;
  avancerHorloge(0); tour(sc, 199);
  avancerHorloge(400); tour(sc, 200);            // 1er plein : échange
  assert.equal(sortants(sc).length, 1, "le premier plein part");
  avancerHorloge(800); tour(sc, 400);            // 2e plein PENDANT l'échange
  assert.equal(T.vus[ID], 1, "le 2e récipient n'est pas noté montré : son échange viendra");
  avancerHorloge(1300); tour(sc, 400);           // échange fini (minuteur 800 ms), le 2e part tout de suite
  avancerHorloge(1800); tour(sc, 400);
  avancerHorloge(3500); tour(sc, 400);
  assert.equal(T.vus[ID], 2, "le 2e récipient a eu son échange");
  assert.equal(courants(sc).length, 1); assert.equal(sortants(sc).length, 0);
}

// ---- 5. minuteur perdu (gel) : le tour de mise à jour termine l'échange ----
{
  reinitialiser();
  const sc = nouvelleScene(); maintenant = 0; T.vus[ID] = 0;
  tour(sc, 199);
  perdre = true;                                  // plus aucun minuteur ne sonnera
  avancerHorloge(400); tour(sc, 200);
  assert.equal(sortants(sc).length, 1, "le plein est parti en sortie");
  avancerHorloge(900); tour(sc, 200);
  assert.equal(sc.__swap, true, "pas encore terminé (800 ms)");
  avancerHorloge(1600); tour(sc, 200);
  assert.equal(sortants(sc).length, 0, "sans minuteur, le tour termine l'échange : le calice plein a quitté la scène");
  assert.equal(courants(sc).length, 1); assert.equal(sc.__swap, false);
}

// ---- 5b. niveau affiché en retard de plusieurs secondes sur le compte réel (rafraîchi par à-coups de 4,5 s) : le suivant est quand même en place AVANT le plein ----
{
  reinitialiser();
  const sc = nouvelleScene(); maintenant = 0; const N0 = 5750, RATE = 8;
  T.vus[ID] = T.paliers(ID, N0).pleins; sc.setAttribute("data-bm-pleins", String(T.vus[ID]));
  let nv = N0, dernierAffichage = 0, suivantAvantPlein = null, echange = false;
  for (let t = 0; t <= 45000; t += 400) {
    avancerHorloge(t);
    const n = N0 + Math.floor(RATE * t / 1000);
    if (t - dernierAffichage >= 4500) { nv = n; dernierAffichage = t; }
    const avantPleins = T.vus[ID];
    const pal = tour(sc, n, nv);
    if (pal.pleins > avantPleins && !echange) { echange = true; suivantAvantPlein = suivants(sc).length === 1 || sortants(sc).length === 1; }
  }
  assert.ok(echange, "le récipient plein est parti");
  assert.ok(suivantAvantPlein, "le suivant attendait déjà (pas d'entrée tardive, pas de plein figé pendant 0,9 s)");
}

// ---- 6. règles de cadence ----
{
  reinitialiser();
  assert.equal(T.cadenceNiveaux("x"), 0, "cadence inconnue : 0");
  for (let k = 0; k <= 10; k++) T.noterNiveau("x", k * 5, k * 1000);
  assert.equal(Math.round(T.cadenceNiveaux("x")), 5, "5 niveaux / s");
  T.noterNiveau("x", 3, 11000);
  assert.equal(T.cadenceNiveaux("x"), 0, "le compte a reculé (Renaissance) : on repart de zéro");
  // cadence inconnue (page ouverte à l'instant, rituel à l'arrêt) : seulement tout près du plein (97 %), plus de calice vide qui attend dès 90 %
  assert.equal(T.suivantAttendu("y", { fraction: 0.9, cap: 200 }), false);
  assert.equal(T.suivantAttendu("y", { fraction: 0.97, cap: 200 }), true);
  // cadence connue et lointaine : le suivant attend
  for (let k = 0; k <= 10; k++) T.noterNiveau("z", k, k * 2000);
  assert.equal(T.suivantAttendu("z", { fraction: 0.9, cap: 200 }), false, "20 niveaux restants à 0,5 / s = 40 s : pas encore");
  assert.equal(T.suivantAttendu("z", { fraction: 0.995, cap: 200 }), true, "1 niveau restant à 0,5 / s = 2 s : il arrive");
}
console.log("idle-sang-calices-partent-v1: ok");
