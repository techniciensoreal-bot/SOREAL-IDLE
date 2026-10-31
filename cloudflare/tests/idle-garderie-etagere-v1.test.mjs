import assert from "node:assert/strict";
import { PAGES_META } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Garderie d'objets dans le COFFRE (Norman, 2026-10-30 : « je veux que le coffre ait des emplacements daycare, avec l'animation ; on doit bien voir que ce sont des cases à part »).
 * Le vrai module (modules/daycare-page-v1.js) est rendu à partir d'un vrai snapshot du moteur : verrou (règle n°2), récipients, hauteur du liquide = progression, bouton « Garderie » de la fiche.
 */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const numberFormat = { window: {} };
vm.runInNewContext(pub("modules/number-format-v1.js"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
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
  document: { getElementById() { return null; } },
  localStorage: { _m: {}, getItem(k) { return k in this._m ? this._m[k] : null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; } }
};
{
  const bac = { window, document: window.document, SOREAL_SESSION: null, Date };
  vm.runInNewContext(pub("modules/meta-progression-v130.js"), bac);
  for (const f of PAGES_META) vm.runInNewContext(pub("modules/" + f), bac);
}
const G = window.__SOREAL_IDLE_DAYCARE_PAGE_V1__;
assert.equal(typeof G.etagere, "function");
assert.equal(typeof window.__daycareIdleV1__, "function");

const ctx = { bosses: 100 };
const T0 = 1_000_000;
let state = normalizeIdleNguState({}, ctx, T0);
const joueur = (t) => ({ systemes: idleNguSnapshot(state, ctx, t) });

/* 1. Garderie verrouillée : rien du tout (ni cadre, ni texte, ni bouton). */
{
  const j = joueur(T0);
  assert.equal(G.disponible(j), false);
  assert.equal(G.etagere(j), "");
  assert.equal(G.boutonFiche(j, "i1", {}), "");
}

/* 2. Premier emplacement acheté, un objet au sac : un récipient vide, bouton « Garderie » sur la fiche. */
state.currencies.experience = 1000;
state = applyIdleNguAction(state, { action: "buyExpShop", item: "daycareSlot1" }, ctx, T0).state;
const ajout = applyIdleNguAction(state, { action: "adventure", adventure: { action: "addItem", definitionId: "forest:pendant", level: 2 } }, ctx, T0);
state = ajout.state;
const id = ajout.result.id;
{
  const j = joueur(T0);
  assert.equal(G.disponible(j), true);
  const html = G.etagere(j);
  assert.ok(html.includes("gd-armoire") && html.includes("/garderie/armoire-v1.webp"), "l'armoire (son image) est le décor");
  assert.ok(html.includes("gd-vide"), "récipient vide");
  assert.ok(!/data-gd-id=/.test(html), "aucun objet en garderie");
  assert.ok(!/\/ ?1\b|\/ ?6\b/.test(html.replace(/<[^>]+>/g, " ")), "aucun total de type x / y");
  const bouton = G.boutonFiche(j, id, { locked: false });
  assert.ok(bouton.includes("Garderie") && bouton.includes("daycarePlace") && bouton.includes(id), "action envoyée : daycarePlace sur l'objet");
  assert.ok(bouton.includes("__fermerDetailsObjetAdventureIdleV1__"), "la fiche se ferme");
  assert.ok(!bouton.includes("disabled"), "bouton actif");
  assert.equal(G.boutonFiche(j, id, { locked: true }), "", "objet verrouillé : pas de bouton");
  assert.equal(G.boutonFiche(j, "inconnu", {}), "", "objet non plaçable (équipé, boost, taux inconnu...) : pas de bouton");
}

/* 3. Objet placé, 1 h 30 plus tard : un niveau gagné, le liquide est à la moitié du bocal. */
state = applyIdleNguAction(state, { action: "daycarePlace", itemId: id }, ctx, T0).state;
{
  const j = joueur(T0 + 90 * 60 * 1000);
  const html = G.etagere(j);
  assert.ok(html.includes("data-gd-id=\"" + id + "\""), "récipient plein");
  assert.ok(html.includes("data-icone=\"forest:pendant\""), "l'image de l'objet est dans le bocal");
  assert.ok(html.includes("transform:translateY(50.00%)"), "liquide à 50 % (progression du moteur)");
  assert.ok(html.includes("data-gd-lv=\"3\"") && html.includes("<b class=\"gd-niv-n\">3</b>"), "niveau du moteur");
  assert.ok(html.includes("data-gd-r=\"" + 1 / 3600 + "\""), "vitesse du moteur : 1 niveau par heure");
  /* plus de liste ni de boutons sous l'armoire : on clique sur le bocal (Norman, 2026-10-30) ; reprendre passe par un panneau qui prévient que l'avancée du niveau est perdue */
  assert.ok(!html.includes("gd-liste") && !html.includes("class=\"gd-reprendre\"") && !html.includes("Emplacement libre"), "plus de liste de notes sous l'armoire");
  assert.ok(html.includes("class=\"gd-bocal gd-occupe\"") && html.includes("__garderieReprendreV1__('" + id + "')"), "le bocal occupé est cliquable");
  assert.ok(html.includes("<span class=\"gd-niv-badge\"") && html.includes("<b class=\"gd-niv-n\">3</b>"), "le niveau est sur le bocal");
  {
    const src = readFileSync(new URL("../public/modules/daycare-page-v1.js", import.meta.url), "utf8");
    assert.ok(src.includes("sera perdue") && src.includes("__garderieConfirmerV1__") && src.includes("'daycareRemove',String(id)"), "reprendre : avertissement puis confirmation");
    assert.ok(src.includes("repriseId=null;") && src.includes("window.__garderieReprendreV1__=function(id)"), "panneau de reprise : ouvrir, annuler");
  }
  assert.ok(!html.includes("gd-vide"), "plus de récipient libre");
  assert.equal(G.boutonFiche(j, "autre", {}), "");
  /* un autre objet au sac, plus aucun emplacement libre : bouton visible mais explicite */
  const autre = applyIdleNguAction(state, { action: "adventure", adventure: { action: "addItem", definitionId: "forest:boots", level: 0 } }, ctx, T0);
  state = autre.state;
  const pleine = G.boutonFiche(joueur(T0 + 90 * 60 * 1000), autre.result.id, { locked: false });
  assert.ok(pleine.includes("Garderie pleine") && pleine.includes("disabled") && pleine.includes("idle-fiche-bouton-large-v1"), "garderie pleine : bouton désactivé, pleine largeur");
  assert.ok(!pleine.includes("daycarePlace"));
}

/* 4. Le liquide (CSS) : arc-en-ciel, ondulation et reflet en boucle d'une période exacte, fondu des bulles, mouvement réduit. */
{
  const m = pub("modules/daycare-page-v1.js");
  for (const c of ["#ff4a4a", "#ffe135", "#4be07b", "#2fb5ff", "#b24bff"]) assert.ok(m.includes(c), "bandes de l'arc-en-ciel : " + c);
  assert.ok(m.includes("mask-size:50cqw 8cqw") && m.includes("to{-webkit-mask-position:50cqw 0"), "l'onde glisse d'exactement une tuile (50 cqw)");
  assert.ok(m.includes("mask-image:linear-gradient(180deg,rgba(0,0,0,0),#000 22%,#000 78%,rgba(0,0,0,0))") && !m.includes("gd-bulles 5s"), "bulles : fondu aux deux bouts, statiques (la couche animée du bocal est la morve)");
  assert.ok(m.includes("gd-bouchon") && m.includes("gd-col") && m.includes("gd-verre") && m.includes("container-type:size"), "bocal détaillé (liège, col, verre) dont les mesures suivent sa taille (cqw)");
  assert.ok(!/gd-bocal[^}]*animation/.test(m) && (m.match(/\.gd-liq\{[^}]*animation:gd-onde/g) || []).length === 1, "par bocal : l'onde du liquide + la rigole qui l'alimente, pas plus de deux couches animées");
  assert.ok(m.includes("prefers-reduced-motion:reduce"), "mouvement réduit coupé");
  assert.ok(m.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "règle n°4 : remise en état juste après un redessin");
  assert.ok(m.includes("requestAnimationFrame") && !/getAnimations|getComputedStyle/.test(m), "règle n°5 : montée calculée, rien lu dans le DOM");
}

/* 5. Câblage : onglets Sac | Garderie sur le sac, plus de panneau dans le Coffre, plus de menu autonome. */
{
  const av2 = pub("modules/ui-aventure-2-v1.js");
  assert.ok(!av2.includes("DAYCARE_PAGE_V1__.panneau"), "plus de panneau de garderie dans le Coffre");
  assert.ok(av2.includes("__SOREAL_IDLE_DAYCARE_PAGE_V1__.boutonFiche(REG.idleEtat,id,item)"), "bouton Garderie dans la fiche d'objet");
  const inv = pub("modules/ui-inventaire-v1.js");
  assert.ok(inv.includes("G&&G.vueGarderie(j)?G.etagere(j):'<div class=\"soreal-idle-section-v8\" id=\"soreal-idle-v138-bag-section\">'+") && inv.includes("(G?G.onglets(j):'')"), "l'onglet Garderie remplace le cadre du sac par l'étagère ; les onglets viennent de la garderie seule");
  const nav = pub("modules/ui-navigation-v1.js");
  assert.ok(nav.includes("if(id==='daycare')return false;"), "plus de bouton de menu");
  assert.ok(!pub("soreal-idle-ui.js").includes("daycare:1}"), "plus de menu vivant daycare");
  assert.ok(!pub("modules/ui-menus-v1.js").includes("case 'daycare'"));
  assert.ok(!pub("modules/meta-progression-v130.js").includes("pageDaycareIdleV1_"));
  assert.ok(pub("modules/ui-reglages-v1.js").includes("ids.daycare=true"), "groupe de notes visible seulement si la garderie est débloquée");
  assert.ok(pub("index.html").includes("/modules/etagere-personnage-v1.js?v="), "module du personnage chargé");
}

/* 5a. Plus aucun tuyau entre les bocaux. */
{
  const m = pub("modules/daycare-page-v1.js");
  assert.ok(!/gd-rig|gd-flot|fils\(/.test(m), "ni tuyau, ni rigole, ni fil de morve");
}

/* 5b. Onglets : absents avant déblocage, mémorisés ensuite (préférence liée au compte, clé soreal_idle_*_v1). */
{
  const verrouille = { systemes: idleNguSnapshot(normalizeIdleNguState({}, ctx, T0), ctx, T0) };
  assert.equal(G.onglets(verrouille), "", "garderie verrouillée : aucun onglet, le sac reste comme avant");
  assert.equal(G.vueGarderie(verrouille), false);
  window.localStorage.setItem("soreal_idle_sac_onglet_v1", "garderie");
  assert.equal(G.vueGarderie(verrouille), false, "même avec un onglet mémorisé, rien tant que c'est verrouillé");
  const j = joueur(T0);
  const html = G.onglets(j);
  assert.ok(html.includes("Sac") && html.includes("Garderie") && html.includes("__garderieOngletV1__('garderie')"));
  assert.ok(G.vueGarderie(j), "onglet mémorisé : l'étagère s'affiche");
  window.__garderieOngletV1__("sac");
  assert.equal(window.localStorage.getItem("soreal_idle_sac_onglet_v1"), "sac");
  assert.equal(G.vueGarderie(j), false);
}

/* 5c. Armoire : 6 places dans les 3 compartiments, bocaux affichés un à un, aucune place fantôme, mise en page constante. */
{
  const rendu = (slots, pris) => {
    const j = joueur(T0);
    const d = j.systemes.daycare;
    d.slots = slots;
    d.items = d.items.slice(0, pris);
    while (d.items.length < pris) d.items.push(Object.assign({}, d.items[0] || {}, { item: { id: "x" + d.items.length, definitionId: "t" + d.items.length, name: "Objet", level: 3 }, progress: 0.4, effectiveHoursPerLevel: 1 }));
    return G.etagere(j);
  };
  const compte = (h, re) => (h.match(re) || []).length;
  const un = rendu(1, 0), trois = rendu(3, 3), quatre = rendu(4, 3), six = rendu(6, 4), troisVides = rendu(3, 0);
  assert.equal(compte(un, /class="gd-pot/g), 1, "1 place : 1 bocal, rien d'autre");
  assert.equal(compte(trois, /class="gd-pot/g), 3);
  assert.equal(compte(quatre, /class="gd-pot/g), 4);
  assert.equal(compte(six, /class="gd-pot/g), 6);
  assert.equal(compte(troisVides, /gd-vide/g), 3 * 1, "places libres : un bocal vide par place possédée seulement");
  assert.ok(un.includes("left:29.4%;top:33%"), "1er bocal : compartiment du haut, à gauche (sur la planche)");
  assert.ok(trois.includes("left:56.4%;top:33%") && trois.includes("left:29.4%;top:51.400000000000006%"), "2e bocal à droite du 1er compartiment, 3e dans le compartiment du milieu");
  assert.ok(six.includes("left:56.4%;top:68.2%"), "6e bocal : compartiment du bas, à droite");
  assert.ok(!six.includes("gd-vide") || compte(six, /gd-vide/g) === 2, "aucune place au-delà de celles possédées");
  assert.ok(!/maxSlots|sur 6|\/ ?6/.test(un.replace(/<[^>]+>/g, " ")), "le maximum n'est écrit nulle part");
  /* mise en page : l'armoire a un cadre à rapport fixe, la liste réserve 3 rangées : rien ne bouge quand une place s'ajoute */
  const m = pub("modules/daycare-page-v1.js");
  assert.ok(m.includes("aspect-ratio:768/1152") && m.includes("grid-template-rows:repeat(3,minmax(92px,auto))") && m.includes("min-height:calc(3*92px + 16px)"), "cadre fixe + 3 rangées de liste réservées");
  const w = readFileSync("cloudflare/public/garderie/armoire-v1.webp");
  assert.ok(w.length > 20000 && w.slice(0, 4).toString() === "RIFF" && w.slice(8, 12).toString() === "WEBP", "l'image de l'armoire est un vrai webp");
  /* pose animée : une seule fois, mémorisée */
  const vraiMaintenant = Date.now;
  Date.now = () => vraiMaintenant() + 5000;   /* les poses des rendus précédents sont terminées */
  window.localStorage.removeItem("soreal_idle_garderie_places_v1");
  const premiere = rendu(2, 0);
  assert.ok(!premiere.includes("gd-pose"), "première visite : aucune animation (rien n'est nouveau)");
  const apres = rendu(3, 0);
  assert.equal(compte(apres, /class="gd-pot gd-pose"/g), 1, "le bocal acheté se pose avec une animation");
  assert.equal(window.localStorage.getItem("soreal_idle_garderie_places_v1"), "3", "mémorisé");
  Date.now = vraiMaintenant;
}

/* 6. Note de mise à jour : groupe réservé à ceux qui ont la garderie, sans parler du Coffre. */
{
  const notes = pub("modules/release-notes-v1.js");
  const bloc = /\{menu:'daycare'[\s\S]*?\]\},/.exec(notes);
  assert.ok(bloc, "groupe « Garderie » dans la note du jour");
  assert.ok(!/coffre|valise/i.test(bloc[0]), "la note ne nomme pas le Coffre");
  const dico = JSON.parse(pub("modules/traduction-anglais-dict-v1.json"));
  for (const t of ["Garderie", "Garderie pleine", "Emplacement libre", "Placer un objet"]) assert.ok(dico[t], "traduction : " + t);
}
/* 7. Règle du Coffre (moteur) : non maxé => accepté seulement avec un emplacement de garderie libre ; sinon refus lisible et rien ne bouge. */
{
  const coffre = (st, itemId) => applyIdleNguAction(st, { action: "adventure", adventure: { action: "coffreDeposer", id: itemId } }, ctx, T0);
  const ajouter = (st, definitionId, level = 0) => {
    const r = applyIdleNguAction(st, { action: "adventure", adventure: { action: "addItem", definitionId, level } }, ctx, T0);
    return { state: r.state, id: r.result.id };
  };
  /* garderie non débloquée : comportement d'avant (le Coffre ne range que les objets maxés) */
  let v = normalizeIdleNguState({}, ctx, T0);
  let a1 = ajouter(v, "forest:pendant", 3);
  assert.throws(() => coffre(a1.state, a1.id), /OBJET_NON_MAXE/, "garderie verrouillée : refus d'avant, aucune mention de garderie");
  /* une place libre : l'objet non maxé part dans un récipient de garderie */
  v = normalizeIdleNguState({}, ctx, T0);
  v.currencies.experience = 1000;
  v = applyIdleNguAction(v, { action: "buyExpShop", item: "daycareSlot1" }, ctx, T0).state;
  a1 = ajouter(v, "forest:pendant", 3);
  const ok = coffre(a1.state, a1.id);
  assert.equal(ok.state.systems.daycare.data.slots.length, 1, "l'objet est dans un emplacement de garderie");
  assert.equal(ok.state.systems.daycare.data.slots[0].item.id, a1.id);
  assert.ok(!ok.state.adventure.inventory.some((o) => o.id === a1.id), "il a quitté le sac");
  assert.ok(!ok.state.adventure.coffre["forest:pendant"], "pas rangé comme un objet maxé");
  /* plus de place : refus lisible, sac intact, garderie intacte */
  const a2 = ajouter(ok.state, "forest:boots", 0);
  const avant = JSON.stringify([a2.state.adventure.inventory, a2.state.systems.daycare.data]);
  assert.throws(() => coffre(a2.state, a2.id), /DAYCARE_PLEIN/, "garderie pleine : refus clair");
  assert.equal(JSON.stringify([a2.state.adventure.inventory, a2.state.systems.daycare.data]), avant, "rien n'a bougé");
  /* objet maxé : rangé dans le Coffre comme avant, même garderie pleine */
  const t = ajouter(a2.state, "tubaTime", 100);
  const tuba = t.state.adventure.inventory.find((o) => o.id === t.id);
  tuba.power = 1e9; tuba.toughness = 1e9; tuba.special = 1e9;
  const range = coffre(t.state, t.id);
  assert.ok(range.state.adventure.coffre.tubaTime, "objet maxé : rangé dans le Coffre, inchangé");
  assert.equal(range.state.systems.daycare.data.slots.length, 1, "la garderie n'a pas bougé");
}

/* 8. Client : geste « poser sur le Coffre » et phrases. */
{
  const m = pub("modules/daycare-page-v1.js");
  assert.ok(m.includes("function deposerNonMaxe(id)") && m.includes("parler('plein')") && m.includes("window.__jouerNonCoffreIdleV1__()"), "refus animé + phrase {P}");
  assert.ok(m.includes("parler(mode)") && m.includes("it.fullyMaxed?'daycare:max':'daycare'"), "phrase {D} / {M} au placement");
  assert.ok(m.includes("function apresDepotMaxe(){if(disponible("), "phrase {M} seulement si la garderie est débloquée");
  assert.ok(m.includes("if(!d)return false;"),"garderie verrouillée : comportement d'avant");
  const av2 = pub("modules/ui-aventure-2-v1.js");
  assert.ok(av2.includes("__SOREAL_IDLE_DAYCARE_PAGE_V1__.deposerNonMaxe(id)))jouerNonCoffreIdleV1_();"), "le dépôt non maxé passe par la garderie ; sinon refus d'avant");
  assert.ok(av2.includes("__SOREAL_IDLE_DAYCARE_PAGE_V1__.apresDepotMaxe()"));
}
/* 9. Mamie l'armoire est un personnage : yeux animés dans les ovales de l'image, nez qui oscille, goutte, phrases à elle ; plus de phrases de garderie au Coffre. */
{
  const bac = {
    window: { __SOREAL_IDLE_TEXTES_V1__: { surcharge: () => null }, __SOREAL_IDLE_REG__: {} },
    document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, createElement() { return { style: {}, classList: { add() {}, remove() {} } }; }, head: null, hidden: false },
    setInterval() {}, setTimeout() {}, Math, Date
  };
  vm.runInNewContext(pub("modules/phrases-coffre-valise-v1.js"), bac);
  vm.runInNewContext(pub("modules/etagere-personnage-v1.js"), bac);
  const P = bac.window.__SOREAL_IDLE_PHRASES_V1__, E = bac.window.__SOREAL_IDLE_ETAGERE_V1__;
  const tout = (qui, mode) => new Set(Array.from({ length: 500 }, () => P.tirer(qui, mode)));
  const yeux = E.yeuxHtml();
  for (const k of ["et-oeil et-og", "et-oeil et-od", "et-regard", "et-iris", "et-paup", "et-nez", "et-zzz", "left:29.7%", "left:57.8%"]) assert.ok(yeux.includes(k), "armoire : " + k);
  assert.equal(E.classes(), "", "au repos : elle ne parle pas");
  assert.ok(!yeux.includes("et-goutte") && !/morve|goutte|fluxMorve|nez-coule/.test(pub("modules/etagere-personnage-v1.js") + pub("modules/daycare-page-v1.js")), "plus de goutte de morve");
  assert.equal(E.humeur(), "eveillee");
  assert.equal(JSON.stringify(E.etat()), JSON.stringify({ dort: false, humeur: "eveillee", parle: false }));
  E.reagir("plein");
  assert.equal(E.etat().humeur, "agacee", "agacée quand elle est pleine");
  E.reagir("daycare");
  assert.equal(E.etat().humeur, "contente", "contente quand on lui confie un objet");
  E.reagir("daycare:max");
  assert.equal(E.etat().humeur, "clin", "clin d'œil pour un objet maxé");
  for (const [mode, motif] of [["reveil", /poussin|petit|mailles|rhumatismes|feuilleton|secouée|bocaux/], ["daycare", /bocal|poussin|petit|mamie|tricot|planche/], ["daycare:max", /maxé|bel objet|Parfait|brille/], ["plein", /place|libre|complet|déborde|bonshommes/]]) {
    const t = tout("etagere", mode);
    assert.ok(t.size >= 3 && [...t].every((x) => x && motif.test(x)), "l'armoire a ses phrases : " + mode);
  }
  assert.ok(tout("etagere", "plein").has("Fais de la place, c’est full là dedans !"));
  assert.ok(![...tout("etagere", "remarque")].some((x) => /full là dedans|Maxé/.test(x)), "les phrases de situation ne sortent pas en remarque");
  for (const m of ["daycare", "daycare:max", "plein"]) assert.equal(tout("coffre", m).size === 1 && tout("coffre", m).has(""), true, "le Coffre n'a plus de phrases de garderie : " + m);
  assert.ok(tout("coffre", "reveil").size >= 5, "le Coffre garde ses phrases de réveil");
  const html = P.editeurHtml();
  assert.ok(html.includes('data-qui="etagere"') && html.includes("L’étagère"), "éditeur : 3e personnage");
  const be = html.slice(html.indexOf('data-qui="etagere"'));
  for (const k of ["data-php-r", "data-php-d", "data-php-m", "data-php-p"]) assert.ok(be.includes(k), "armoire : case " + k);
  const bc = html.slice(html.indexOf('data-qui="coffre"'), html.indexOf('data-qui="etagere"'));
  assert.ok(bc.includes("data-php-r") && !bc.includes("data-php-d") && !bc.includes("data-php-p"), "le Coffre n'a plus que Réveil en plus");
  assert.equal(P.defauts.etagere.some((x) => /^\{P\}/.test(x)), true);
  /* règle n°2 : l'armoire n'est dessinée que par l'onglet Garderie */
  assert.ok(!/yeuxHtml/.test(pub("modules/ui-inventaire-v1.js")) && pub("modules/daycare-page-v1.js").includes("__SOREAL_IDLE_ETAGERE_V1__"));
  const m = pub("modules/etagere-personnage-v1.js");
  assert.ok(m.includes("data-morph-garder") && m.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "règle n°4");
  /* yeux : pupilles petites, opposées, aucun verre grossissant ; mouvements lents, boucles parfaites */
  assert.ok(m.includes("height:26%;aspect-ratio:1") && m.includes(".et-og .et-iris{left:5%}.et-od .et-iris{right:5%}"), "petites pupilles, l'une à l'extérieur gauche, l'autre à l'extérieur droit");
  assert.ok(!/scale\(1\.2|cul de bouteille|et-loupe/.test(m), "plus de verre grossissant");
  assert.ok(m.includes("etRegG 17s") && m.includes("etRegD 21s") && m.includes("etClin 13s") && m.includes("etNez 19s"), "mouvements lents ; le nez ne bouge qu'de temps en temps (19 s, longs repos)");
  assert.ok(m.includes("etBilleG 29s") && m.includes("etPaupG 29s") && m.includes("@keyframes etBilleG{0%,60%{transform:translate(0,0)}") && m.includes("100%{transform:translate(0,0)}}"), "la pupille de l'œil gauche tombe comme une bille et la paupière se ferme plusieurs fois pour la remettre en place (boucle parfaite de 29 s, départ = arrivée)");
  assert.equal((m.match(/@keyframes etPaupG\{[^]*?\}',/)[0].match(/scaleY\(1\.03\)/g) || []).length, 5, "5 fermetures : 2 clins normaux et 3 pour remettre la pupille");
  assert.ok(/@keyframes etClin\{0%,90%,100%\{transform:scaleY\(0\)\}/.test(m) && /@keyframes etRespire\{0%,100%\{transform:scale\(1\)\}50%/.test(m) && /@keyframes etNez\{0%,28%,34%,70%,76\.5%,100%\{transform:rotate\(0\) scale\(1\)\}/.test(m), "boucles parfaites : clignement, respiration, nez (début = fin)");
  assert.ok(m.includes("prefers-reduced-motion:reduce"));
}
console.log("idle-garderie-etagere-v1 ok");
