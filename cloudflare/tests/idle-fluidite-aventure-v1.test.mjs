import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit de fluidité du périmètre Aventure / ITOPOD / Entraînement / Boutique (2026-11-02). Chaque optimisation est figée ici :
 * 1. le mémo de actualiserCooldownAventureIdleV100_ (deux querySelectorAll sur tout le document à CHAQUE image : ~15 ms/s sur PC mesurés au profileur) ;
 * 2. le rafraîchissement en direct de la page ITOPOD ne fabrique plus les vitrines de perks ;
 * 3. deux animations qui ne se voyaient jamais (box-shadow du bouton Titans, torches de la page) retirées : le CSS impose déjà ces valeurs en !important.
 */
const lire = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* ---- 1. mémo du cooldown d'Aventure (comportement réel, sur un faux document) ---- */
{
  const src = lire("modules/ui-aventure-1-v1.js");
  const debut = src.indexOf("let cooldownMemoV1=null");
  const fin = src.indexOf("function actualiserCooldownAventureIdleV100_");
  assert.ok(debut > 0 && fin > debut, "mémo présent avant la fonction");
  const finFonction = src.indexOf("\n      }\n", fin);
  const code = src.slice(debut, finFonction + 9);
  assert.ok(!/document\s*\.querySelectorAll\(\s*'\[id\^="sorealIdleAdventureCooldown_"\]'\s*\)\s*\.forEach/.test(code), "plus de parcours du document à chaque appel");

  let requetes = 0;
  const el = { isConnected: true, textContent: "", classes: new Set(), classList: { toggle(c, f) { if (f) el.classes.add(c); else el.classes.delete(c); } } };
  let ecritures = 0;
  Object.defineProperty(el, "textContent", { get() { return this._t || ""; }, set(v) { ecritures += 1; this._t = v; } });
  const document = { querySelectorAll(sel) { requetes += 1; return /Cooldown_/.test(sel) ? [el] : []; } };
  const REG = { idleEtat: { aventure: { cooldownJusqua: 10000, zones: [] } } };
  const hooks = [];
  const window = { __SOREAL_IDLE_APRES_REDESSIN_V1__: hooks };
  let t = 0;
  const performance = { now: () => t };
  const f = new Function("REG", "document", "window", "performance", "idleNombre_", "idleEntier_", code + "\nreturn actualiserCooldownAventureIdleV100_;")(REG, document, window, performance, (x) => Number(x) || 0, (x) => Math.floor(Number(x) || 0));
  assert.equal(hooks.length, 1, "le mémo s'invalide après chaque redessin (hook de la règle n°4)");

  for (let i = 0; i < 100; i++) { t = i * 7; f(5000 + i * 10); }   /* 100 images en 700 ms */
  assert.equal(requetes, 2, "2 requêtes (cooldown + boutons de zone) pour 100 images, au lieu de 200");
  assert.ok(/Prochaine rencontre dans/.test(el.textContent), "le texte du cooldown reste mis à jour");
  const avant = ecritures;
  f(5990); f(5990); f(5990);
  assert.equal(ecritures, avant, "un texte identique n'est pas réécrit (pas de mutation inutile)");
  f(10000);
  assert.ok(/Rencontre disponible/.test(el.textContent) && el.classes.has("ready"), "état prêt");

  hooks[0]();   /* redessin de la page */
  const r0 = requetes; f(10000);
  assert.equal(requetes, r0 + 2, "après un redessin, les éléments sont relus");
  el.isConnected = false; const r1 = requetes; f(10000);
  assert.equal(requetes, r1 + 2, "un élément détaché est relu");
  t = 5000; el.isConnected = true; f(10000);
  assert.ok(requetes > r1 + 2, "relecture au plus toutes les 750 ms même sans redessin");
}

/* ---- 2. ITOPOD : le rafraîchissement en direct ne construit plus toutes les vitrines ---- */
{
  const src = lire("modules/itopod-perks-page-v1.js");
  assert.ok(src.includes("if(window.__itopodLegerV1__)return '<div class=\"pk-solde\"><b>'+pp+'</b></div>';"), "pagePerksIdleV1_ : version légère (solde seul)");
  const i = src.indexOf("function rafraichirItopodIdleV1_");
  const corps = src.slice(i, src.indexOf("window.__rafraichirItopodIdleV1__=", i));
  assert.ok(corps.includes("window.__itopodLegerV1__=true;") && /finally\{[^}]*window\.__itopodLegerV1__=false;/.test(corps), "drapeau posé puis TOUJOURS retiré (finally)");
  /* la version légère précède la fabrication des cartes, et le rendu complet (drapeau absent) reste intact */
  assert.ok(src.indexOf("window.__itopodLegerV1__)return") < src.indexOf("const cartes=defs.map"), "retour avant la boucle des cartes");
  assert.ok(src.includes("'<div class=\"pk-fond\"><div class=\"pk-boutique\">'"), "page complète inchangée");
  assert.ok(corps.includes("copier(vivant,neuf,'.itp-tuile b')") && corps.includes(".pk-solde b"), "les mêmes chiffres sont copiés (tuiles, PP, solde)");
}

/* ---- 3. animations jamais visibles retirées ---- */
{
  const ui = lire("soreal-idle-ui.css");
  const regle = ui.match(/\n\.soreal-idle-titan-brille-v1\{[^}]*\}/);
  assert.ok(regle && !/animation/.test(regle[0]) && /border-color:#ffc440!important/.test(regle[0]), "bouton Titans : plus d'animation box-shadow (écrasée par le !important de la page)");
  const it = lire("soreal-idle-itopod.css");
  const torche = it.match(/\.soreal-idle-page-root-v28\[data-menu\]::before,\nhtml body[^\n]*\.soreal-idle-page-root-v28\[data-menu\]::after\{[^}]*\}/);
  assert.ok(torche, "règle des torches de page trouvée");
  assert.ok(/opacity:1!important/.test(torche[0]) && /filter:none!important/.test(torche[0]), "opacity et filter imposés en !important (c'est ce qui rendait l'animation inutile)");
  assert.ok(!/animation:itpTorche/.test(torche[0]) && !/animation-delay:-1\.1s/.test(it), "torches de page : plus d'animation inutile");
}

console.log("idle-fluidite-aventure-v1 : OK");
