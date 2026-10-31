import assert from "node:assert/strict";
import { PAGES_META } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Garderie : apparences du chat-étagère (2026-10-31). Le skin ACTIF fournit l'image, les yeux et les 6 positions de bocaux ; la rangée de vignettes n'existe qu'à partir de 2 apparences possédées
 * (règle n°2) ; le choix vit dans l'état du jeu (règle n°6 : rien dans localStorage) ; la transition glisse l'ancien chat dehors pendant que le nouveau entre (coupée en mouvement réduit) ;
 * plus aucune trace de la vieille dame dans les modules de la Garderie.
 */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const numberFormat = { window: {} };
vm.runInNewContext(pub("modules/number-format-v1.js"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;

let reduit = false;
const retardes = [];
const fausseCopie = () => {
  const c = { classes: new Set(), attrs: {}, style: {}, parentNode: null };
  c.classList = { add: (...k) => k.forEach((x) => c.classes.add(x)), remove: (...k) => k.forEach((x) => c.classes.delete(x)) };
  c.setAttribute = (k, v) => { c.attrs[k] = v; };
  c.removeAttribute = (k) => { delete c.attrs[k]; };
  c.querySelector = () => null;
  c.querySelectorAll = () => [];
  return c;
};
const fausseScene = { appended: [], querySelector() { return this.appended[0] || null; }, appendChild(c) { this.appended.push(c); c.parentNode = this; } };
const window = {
  __SOREAL_IDLE_REG__: { iconeObjetAdventureIdleV138_: (it) => "<img data-icone=\"" + it.definitionId + "\">" },
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    entetePageIdleV28_: (t) => t,
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  matchMedia: () => ({ matches: reduit }),
  document: {
    getElementById() { return null; },
    querySelectorAll() { return []; },
    querySelector(s) { return s === ".gd-scene>.gd-etagere" ? { cloneNode: () => fausseCopie() } : s === ".gd-scene" ? fausseScene : null; }
  },
  localStorage: { _m: {}, ecritures: [], getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this.ecritures.push(k); this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } }
};
const bac = { window, document: window.document, SOREAL_SESSION: null, Date, setTimeout: (f, ms) => { retardes.push([f, ms]); return retardes.length; }, clearTimeout() {} };
vm.runInNewContext(pub("modules/meta-progression-v130.js"), bac);
vm.runInNewContext(pub("modules/etagere-skins-v1.js"), bac);
for (const f of PAGES_META) vm.runInNewContext(pub("modules/" + f), bac);
vm.runInNewContext(pub("modules/etagere-personnage-v1.js"), bac);
const G = window.__SOREAL_IDLE_DAYCARE_PAGE_V1__;
const D = window.__SOREAL_IDLE_ETAGERE_SKINS_V1__;
const envoyees = [];
window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaIdleV130_ = (p) => envoyees.push(p);

/* Un joueur avec la garderie débloquée et 3 emplacements ; les apparences possédées sont posées comme le serveur les envoie (ids possédés seulement). */
const ctx = { bosses: 100 };
const T0 = 1_000_000;
let state = normalizeIdleNguState({}, ctx, T0);
state.currencies.experience = 1e9;
for (const item of ["daycareSlot1", "daycareSlot2", "daycareSlot3"]) state = applyIdleNguAction(state, { action: "buyExpShop", item }, ctx, T0).state;
const joueur = (skins) => {
  const j = { systemes: idleNguSnapshot(state, ctx, T0) };
  if (skins === undefined) return j;
  if (skins === null) delete j.systemes.daycare.skins;
  else j.systemes.daycare.skins = skins;
  return j;
};
const compte = (h, re) => (h.match(re) || []).length;

/* 1. Une seule apparence possédée : rien ne trahit les autres (ni rangée, ni vignette, ni case vide, ni verrou, ni total). */
{
  const html = G.etagere(joueur({ actif: "defaut", possedes: ["defaut"] }));
  assert.ok(!html.includes("gd-skin") && !html.includes("Apparence") && !html.includes("noeud"), "aucune rangée avec 1 seule apparence");
  assert.ok(html.includes("src=\"/api/idle/media/garderie-skin?id=defaut\"") && html.includes("id=\"gd-fig-defaut\""), "image de l'apparence active");
  assert.ok(!/cadenas|verrou|🔒|\?\?\?|\/ ?11\b/.test(html), "ni verrou ni total");
  const sansDonnee = G.etagere(joueur(null));
  assert.ok(sansDonnee.includes("id=defaut") && !sansDonnee.includes("gd-skin"), "pas d'état d'apparences : repli sur le chat par défaut");
}

/* 2. Deux apparences : rangée de vignettes des seules possédées, l'active entourée, un clic envoie daycareSkin. */
{
  const html = G.etagere(joueur({ actif: "defaut", possedes: ["noeud", "defaut"] }));
  assert.ok(html.includes("class=\"gd-skins\""), "rangée présente à partir de 2");
  assert.equal(compte(html, /class="gd-skin( actif)?"/g), 2, "une vignette par apparence possédée, pas une de plus");
  assert.ok(html.indexOf("garderieSkinV1__('defaut')") < html.indexOf("garderieSkinV1__('noeud')"), "ordre des apparences (pas l'ordre reçu)");
  assert.ok(/class="gd-skin actif" aria-pressed="true"[^>]*garderieSkinV1__\('defaut'\)/.test(html), "l'apparence active est entourée");
  assert.ok(html.includes("<img src=\"/api/idle/media/garderie-skin?id=noeud\"") && !/id=(dore|matrix)/.test(html), "vignette = même route, seulement les possédées");
  assert.equal(compte(html, /<button type="button" class="gd-skin/g), 2);
  assert.ok(!/cadenas|verrou|🔒|\?\?\?|\/ ?11\b/.test(html), "ni case vide, ni verrou, ni total");
}

/* 3. Le skin actif fournit l'image, les yeux et les 6 bocaux. */
{
  const j = joueur({ actif: "noeud", possedes: ["defaut", "noeud"] });
  const html = G.etagere(j);   /* le 1er rendu fixe l'apparence affichée : aucun glissement */
  assert.ok(html.includes("src=\"/api/idle/media/garderie-skin?id=noeud\" alt=\"\" width=\"768\"") && html.includes("data-skin=\"noeud\""), "image du skin actif");
  assert.ok(!html.includes("gd-entre"), "premier affichage : net, sans glissement");
  assert.ok(html.includes("left:34.38%;top:24.74%;width:8.2%;height:4.43%") && html.includes("left:57.03%;top:24.74%"), "yeux du skin actif");
  assert.ok(compte(html, /class="gd-pot/g) === 3 && html.includes("left:30.62%;top:38.63%;width:13.2%;height:13.8%"), "bocal 1 sur la planche du skin actif (cx 37,22 / sol 52,43)");
  assert.ok(html.includes("left:58%;top:38.63%") && html.includes("left:30.62%;top:55.47%"), "bocaux 2 et 3 selon le skin actif");
  const j2 = joueur({ actif: "inconnu", possedes: ["defaut", "noeud"] });
  assert.ok(G.etagere(j2).includes("id=defaut"), "skin inconnu : repli sur defaut");
  const six = joueur({ actif: "fibonacci", possedes: ["defaut", "fibonacci"] });
  six.systemes.daycare.slots = 6;
  const h6 = G.etagere(six);
  assert.equal(compte(h6, /class="gd-pot/g), 6);
  assert.equal(compte(h6, /<i class="et-oeil/g), 6, "fibonacci : 6 ovales = 6 yeux");
  assert.ok(h6.includes("left:57.89%;top:67.97%"), "6e bocal : compartiment du bas à droite pour fibonacci (cx 64,49 / sol 81,77)");
}

/* 4. Transition : seul un clic du joueur anime ; direction selon l'ordre ; pas de clic pendant le glissement ; calque data-morph-garder. */
{
  const base = { actif: "defaut", possedes: ["defaut", "noeud"] };
  G.etagere(joueur(base));
  envoyees.length = 0;
  window.__garderieSkinV1__("noeud");
  assert.equal(JSON.stringify(envoyees), JSON.stringify([{ action: "daycareSkin", id: "noeud" }]), "un clic envoie l'action au moteur (comme les autres actions du jeu)");
  window.__garderieSkinV1__("defaut");
  assert.equal(envoyees.length, 1, "pas de second clic tant que le premier n'est pas arrivé");
  /* la réponse du moteur arrive : le nouveau chat entre par la droite (apparence suivante), et l'ancien est copié dans le calque */
  const html = G.etagere(joueur({ actif: "noeud", possedes: ["defaut", "noeud"] }));
  assert.ok(html.includes("class=\"gd-fig gd-entre gd-entre-g\" id=\"gd-fig-noeud\""), "le nouveau chat glisse (sens gauche) dans un bloc neuf (id par apparence)");
  fausseScene.appended.length = 0;
  const hook = window.__SOREAL_IDLE_APRES_REDESSIN_V1__;
  assert.ok(Array.isArray(hook) && hook.length >= 1, "règle n°4 : crochet de remise en état après redessin");
  hook.forEach((f) => f());
  assert.equal(fausseScene.appended.length, 1, "le calque de l'ancien chat est posé après le redessin");
  const c = fausseScene.appended[0];
  assert.ok(c.classes.has("gd-sort") && c.classes.has("gd-sort-g") && c.attrs["data-morph-garder"] === "1" && c.attrs["aria-hidden"] === "true", "calque : sort du même côté, gardé par le morph, hors accessibilité");
  assert.ok(/^-\d+ms$/.test(c.style.animationDelay), "phase = temps déjà écoulé (délai négatif)");
  hook.forEach((f) => f());
  assert.equal(fausseScene.appended.length, 1, "jamais deux calques");
  window.__garderieSkinV1__("defaut");
  assert.equal(envoyees.length, 1, "pas de clic pendant le glissement");
  /* un redessin pendant le glissement garde la classe (l'animation n'est pas perdue) */
  assert.ok(G.etagere(joueur({ actif: "noeud", possedes: ["defaut", "noeud"] })).includes("gd-entre-g"));
  /* fin du glissement : minuterie de nettoyage, puis le chat est net et le clic de nouveau possible */
  const fin = retardes.filter(([, ms]) => ms === 660).pop();
  assert.ok(fin, "le calque est retiré à la fin du glissement (0,6 s)");
  fin[0]();
  const apres = G.etagere(joueur({ actif: "noeud", possedes: ["defaut", "noeud"] }));
  assert.ok(!apres.includes("gd-entre"), "après le glissement : plus de classe d'animation");
  window.__garderieSkinV1__("defaut");
  assert.equal(envoyees.length, 2, "clic possible de nouveau");
  const retour = G.etagere(joueur({ actif: "defaut", possedes: ["defaut", "noeud"] }));
  assert.ok(retour.includes("gd-entre-d"), "apparence précédente : le chat entre par la gauche");
  retardes.filter(([, ms]) => ms === 660).pop()[0]();
  /* un changement venu d'ailleurs (autre appareil, nouveau skin) est net */
  const net = G.etagere(joueur({ actif: "noeud", possedes: ["defaut", "noeud"] }));
  assert.ok(!net.includes("gd-entre"), "changement non demandé ici : net");
}

/* 5. Mouvement réduit : changement net, aucun calque. */
{
  reduit = true;
  G.etagere(joueur({ actif: "noeud", possedes: ["defaut", "noeud"] }));
  envoyees.length = 0;
  window.__garderieSkinV1__("defaut");
  assert.equal(envoyees.length, 1);
  const html = G.etagere(joueur({ actif: "defaut", possedes: ["defaut", "noeud"] }));
  assert.ok(!html.includes("gd-entre"), "mouvement réduit : pas de glissement");
  reduit = false;
}

/* 6. Code : transition coupée en mouvement réduit, bloc gardé, règle n°6 (rien dans localStorage pour le choix), préchargement, plus de vieille dame. */
{
  const m = pub("modules/daycare-page-v1.js");
  assert.ok(/\.gd-sort\{display:none\}/.test(m) && /prefers-reduced-motion:reduce\)?'?\)?[^]*?\.gd-sort\{display:none\}/.test(m) && m.includes("matchMedia('(prefers-reduced-motion: reduce)')"), "transition coupée en mouvement réduit (CSS et JS)");
  assert.ok(m.includes("ease-in-out both") && m.includes("@keyframes gd-sort-g") && m.includes("@keyframes gd-entre-d") && m.includes(".6s"), "glissement de 0,6 s en ease-in-out");
  assert.ok(m.includes("data-morph-garder") && m.includes("ensureCalque();") && m.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "règle n°4 : calque gardé et remis après redessin");
  assert.ok(!/stockage\([^)]*skin|localStorage[^;]*skin|setItem\([^)]*skin/i.test(m), "règle n°6 : le choix vit dans l'état du jeu, pas dans localStorage");
  assert.ok(window.localStorage.ecritures.every((k) => !/skin/i.test(k)), "aucune clé localStorage d'apparence écrite");
  assert.ok(m.includes("precharger(possedes)") && m.includes("new Image()"), "images des apparences possédées préchargées");
  assert.ok(m.includes("possedes.length<2"), "règle n°2 : rangée seulement à partir de 2");
  const idx = pub("index.html");
  const iSkins = idx.indexOf("/modules/etagere-skins-v1.js?v="), iPage = idx.indexOf("/modules/daycare-page-v1.js?v="), iYeux = idx.indexOf("/modules/etagere-personnage-v1.js?v=");
  assert.ok(iSkins > 0 && iSkins < iPage && iSkins < iYeux, "données des apparences chargées avant la page et avant les yeux");
  /* aucun texte de l'ancienne armoire-dame dans les modules de la Garderie */
  const interdit = /mamie|vieille|armoire|bougonn|yeux fous|tricot|poussin|rhumatisme|et-bulle|\bnez\b|zzz|dort\b/i;
  for (const f of ["daycare-page-v1.js", "etagere-personnage-v1.js", "etagere-skins-v1.js", "phrases-coffre-valise-v1.js"]) assert.ok(!interdit.test(pub("modules/" + f)), "plus de vieille dame dans " + f);
  const intro = "Ce chat fait gagner des niveaux à tes objets avec le temps, même hors ligne : quand le liquide atteint le haut du bocal, l’objet prend 1 niveau. Un seul exemplaire de chaque objet ; niveau maximum 100. Tant qu’un objet n’est pas sorti du bocal, il ne peut être ni fusionné ni équipé.";
  assert.ok(m.includes(intro), "texte d'introduction du chat");
  const dico = JSON.parse(pub("modules/traduction-anglais-dict-v1.json"));
  assert.equal(dico[intro], "This cat makes your items gain levels over time, even offline: when the liquid reaches the top of the jar, the item gains 1 level. Only one copy of each item; maximum level 100. As long as an item has not been taken out of the jar, it can be neither merged nor equipped.");
  assert.ok(!Object.keys(dico).some((k) => /drôle d’armoire/.test(k)), "l'ancien texte n'est plus au dictionnaire");
  for (const t of ["Apparence du chat", "Choisir cette apparence"]) assert.ok(dico[t], "traduction : " + t);
  assert.ok(D.ordre.length === 11 && D.ordre.every((id) => D.skins[id]), "les 11 apparences ont leurs données");
}
console.log("idle-garderie-skins-ui-v1 ok");
