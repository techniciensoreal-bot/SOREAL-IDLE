import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Profil sur la partie de Norman (2026-11-06) : la décoration des cartes d'objets (item-extra-r2-v77.js) comparait chaque objet à chaque libellé de la page avec 3 normalisations par comparaison. Le nouvel algorithme classe les libellés et
 * les objets UNE fois par nom normalisé. PREUVE D'ÉQUIVALENCE : l'ancien algorithme (copié ici, implémentation de référence) et le nouveau donnent la MÊME suite d'installations, sur des milliers de cas aléatoires (noms en double,
 * objets sans fiche, libellés partagés, suffixes « +N », casse et espaces différents).
 */
const src = fs.readFileSync("cloudflare/public/modules/item-extra-r2-v77.js", "utf8");
const bloc = (de, jusqua) => { const a = src.indexOf(de), b = src.indexOf(jusqua, a); assert.ok(a > 0 && b > a, "bloc " + de); return src.slice(a, b); };
const normaliser = bloc("  function normaliser_(v){", "  function root_(){");
const trouver = bloc("  /*\n   * Index nom normalisé", "  function binder_(");
const cartes = bloc("  function decorerCartes_(root,items){", "  function appliquer_(joueur){");
const appliquer = src.slice(src.indexOf("  function appliquer_(joueur){"), src.indexOf("  function rendre_(){"));
assert.ok(appliquer.includes("indexObjets=null;indexSource=null;"), "l'index ne vit que le temps d'un rendu");

/* ----- ancien algorithme (référence) ----- */
const ANCIEN = `
function trouverObjet_(items,nom){
  var cible=normaliser_(nom);
  if(!cible)return null;
  return items.find(function(item){
    var spec=specObjet_(item);
    if(!spec)return false;
    return normaliser_(item&&item.name||item&&item.nom||spec.label)===cible;
  })||null;
}
function decorerCartes_(root,items){
  if(!items.length)return;
  var labels=Array.prototype.slice.call(root.querySelectorAll('b'));
  items.forEach(function(item){
    var spec=specObjet_(item);
    if(!spec)return;
    labels.forEach(function(label){
      if(normaliser_(label.textContent)!==normaliser_(item.name||item.nom||spec.label))return;
      var card=label.closest('div[style*="padding:12px"]');
      if(!card)return;
      var host=card.querySelector('.soreal-idle-v77-item-card-image');
      if(!host){
        host={cree:true,id:'h'+(++window.__n)};
        card.prepend(host);
      }
      installer_(host,spec,'card');
    });
  });
}`;
const NOUVEAU = trouver + "\n" + cartes.replace("host=document.createElement('div');\n          host.className='soreal-idle-v77-item-card-image';", "host={cree:true,id:'h'+(++window.__n)};");
function monter(code) {
  const journal = [];
  const win = { __n: 0 };
  const specObjet_ = (item) => (item && item.fiche ? { key: item.fiche, label: item.fiche } : null);
  const installer_ = (host, spec, mode) => journal.push([host.id, spec.key, mode]);
  const f = new Function("window", "document", "specObjet_", "installer_", normaliser + "\n" + code + "\nreturn {trouverObjet_:trouverObjet_,decorerCartes_:decorerCartes_};")(win, { createElement: () => ({}) }, specObjet_, installer_);
  return { f, journal, win };
}
/* alea déterministe */
let g = 12345; const alea = () => { g = (Math.imul(g, 1664525) + 1013904223) >>> 0; return g / 4294967296; };
const NOMS = ["Épée", "épée +3", "  Bouclier  ", "bouclier", "Casque", "CASQUE  +12", "Amulette", "Bague", "", "Cape +7", "cape"];
const choix = (t) => t[Math.floor(alea() * t.length)];
let cas = 0, installations = 0;
for (let tour = 0; tour < 4000; tour += 1) {
  const items = [];
  const n = Math.floor(alea() * 12);
  for (let i = 0; i < n; i += 1) { const nom = choix(NOMS); const it = {}; const m = alea(); if (m < 0.4) it.name = nom; else if (m < 0.6) it.nom = nom; if (alea() < 0.8) it.fiche = (it.name || it.nom || "f" + i) + "#" + i; items.push(it); }
  const labels = []; const cartes = [];
  const nl = Math.floor(alea() * 14);
  for (let i = 0; i < nl; i += 1) { const carte = alea() < 0.85 ? { id: "c" + i, host: alea() < 0.3 ? { id: "hx" + i } : null, prepended: null } : null; if (carte) { carte.querySelector = () => carte.host || carte.prepended; carte.prepend = (h) => { carte.prepended = h; }; } labels.push({ textContent: choix(NOMS), closest: () => carte }); cartes.push(carte); }
  const root = { querySelectorAll: (s) => (s === "b" ? labels : []) };
  const A = monter(ANCIEN), B = monter(NOUVEAU);
  /* les cartes sont recréées pour chaque algorithme (état d'hôte propre) */
  const refaire = () => labels.forEach((l, i) => { const c = cartes[i]; if (c) { c.prepended = null; } });
  A.f.decorerCartes_(root, items); const ja = A.journal.slice(); refaire();
  B.f.decorerCartes_(root, items); const jb = B.journal.slice(); refaire();
  assert.deepEqual(jb, ja, "décorer les cartes : même suite d'installations (cas " + tour + ")");
  installations += ja.length;
  for (const nom of NOMS) { const x = A.f.trouverObjet_(items, nom), y = B.f.trouverObjet_(items, nom); assert.equal(y, x, "trouverObjet_ « " + nom + " » (cas " + tour + ")"); }
  cas += 1;
}
assert.ok(installations > 5000, "le test installe vraiment des décorations : " + installations);
console.log("idle-decoration-cartes-equivalence-v1: OK (" + cas + " cas, " + installations + " installations identiques)");
