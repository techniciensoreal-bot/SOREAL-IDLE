// Trou sans fond, côté page (Norman, 2026-11-02) : l'image du trou reste comme avant ; DESSOUS, dans la carte d'action (là où la roue met sa légende), la liste des lots possibles du palier de l'Or en stock.
// Pas de roue ni de secteurs ; aucune probabilité inventée (le wiki n'en publie pas) ; aucun total ni « ??? » ; seulement les lots envoyés par le moteur ; aucun redessin périodique (règle n°4).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const norm = (t) => t.split(String.fromCharCode(13)).join("");
const lire = (f) => norm(readFileSync(f, "utf8"));
const modSrc = lire("cloudflare/public/modules/trou-recompenses-v1.js");
const roueSrc = lire("cloudflare/public/modules/roue-journaliere-v1.js");
const pageSrc = lire("cloudflare/public/modules/money-pit-page-v1.js");

const window = { __SOREAL_IDLE_META_HOST_V130__: { formatGrandNombreIdleV70_: (v, d) => String(Number(v.toFixed(d || 0))) } };
window.window = window;
vm.runInNewContext(roueSrc, Object.assign(window, { document: { querySelector() { return null; } }, setTimeout, clearTimeout, requestAnimationFrame() {}, matchMedia: null }));
vm.runInNewContext(modSrc, window);
const TR = window.__SOREAL_IDLE_TROU_V1__;
assert.ok(TR && typeof TR.rendreLegende === "function");

const j = (lots, tier = 6, ap = 15) => ({ systemes: { puitRecompenses: { tier, min: 1e15, suivant: 1e18, lots, ap } } });
const lots6 = [{ adventureStats: 50 }, { cubePower: 10 }, { cubeToughness: 10 }, { cubeBoth: 5 }, { adventureHp: 200 }, { adventureRegen: 2 }, { experience: 25 }, { wandoos: 1, wandoosMax: 20 }, { seeds: 25 }];

// liste : une ligne par lot, icône + nom, aucun pourcentage, AP en plus, palier retenu pour le guetteur
{
  const h = TR.rendreLegende(j(lots6));
  assert.equal((h.match(/class="rb-leg"/g) || []).length, 9);
  assert.ok(h.includes('data-mp-palier="6"'));
  assert.ok(!/<em>|\d\s?%/.test(h), "aucun pourcentage");
  assert.ok(!/<circle|rb-svg|rb-sect|<path d="M\d+ \d+A/.test(h.replace(/<svg width="18"[\s\S]*?<\/svg>/g, "")), "ni roue ni secteurs");
  assert.equal((h.match(/<svg width="18"/g) || []).length, 9, "une icône par ligne");
  for (const t of ["+50 Puissance et Endurance d’Aventure", "+25 graines", "+1 niveau(x) Wandoos", "+10 Cube Puissance", "+25 EXP", "+2 Regen PV d’Aventure"]) assert.ok(h.includes(t), t);
  assert.ok(h.includes("Un seul de ces lots est tiré.") && h.includes("15 AP"));
  assert.ok(!/\?\?\?|verrouill|\/ ?\d+/.test(h), "ni « ??? », ni verrou, ni total « x / y »");
  assert.ok(!h.includes("1000000000000000") && !h.includes("1e18"), "min / suivant jamais affichés");
}
// anti-spoil : la page n'affiche que ce que le moteur envoie
{
  const h = TR.rendreLegende(j([{ adventureStats: 50 }, { adventureHp: 200 }, { experience: 25 }]));
  assert.equal((h.match(/class="rb-leg"/g) || []).length, 3);
  assert.ok(!/graines|Cube|Wandoos/.test(h), "aucun lot de système non envoyé");
}
// rien à gagner
{
  const h = TR.rendreLegende(j([], 0, 0));
  assert.ok(h.includes("le trou ne te donnera rien") && !h.includes(" AP"));
  assert.equal(TR.rendreLegende({}), "");
}

// page : image du trou inchangée, puis la carte d'action avec bouton, liste, TON PRIX, compteur ; colonne de la roue : même suite
{
  const trou = pageSrc.slice(pageSrc.indexOf("'<div class=\"mp-col-v1 mp-col-trou-v1\">'"), pageSrc.indexOf("'<div class=\"mp-col-v1 mp-col-roue-v1\">'"));
  const roue = pageSrc.slice(pageSrc.indexOf("'<div class=\"mp-col-v1 mp-col-roue-v1\">'"));
  const croissant = (t, r) => { const a = r.map((x) => t.indexOf(x)); return a.every((x, i) => x >= 0 && (i === 0 || x > a[i - 1])); };
  assert.ok(croissant(trou, ["soreal-idle-money-scene-v206\">'", "sorealIdleMoneyPitImageV209", "calquesTrouSansFondIdleV1_()", "soreal-idle-money-actions-v206", "money-action-title-v206\">Balance ton argent", "rendreBoutonMoneyPitIdleV1_(j,pitSt)", "TR.rendreLegende(j)", "prixPit", "rb-prix-txt\">Jets effectués", "cadreRecompensesMoneyPitIdleV1_('pit'"]), "trou : image, carte, titre, bouton, liste, prix, compteur, historique");
  assert.ok(croissant(roue, ["RO.rendreCarte(roueSt,j,boutonRoue)", "rb-prixcol", "money-action-title-v206\">Roue journalière !", "RO.rendreControles(roueSt,j,boutonRoue)", "prixRoue", "rb-prix-txt\">Tours effectués", "cadreRecompensesMoneyPitIdleV1_('roue'"]), "roue : même suite");
  assert.ok(trou.includes('<img id="sorealIdleMoneyPitImageV209" src="/trou/trou-sans-fond-v1.webp" width="1000" height="1000" alt="Trou sans fond">'), "image du trou inchangée");
  assert.ok(!/TR\.rendreCarte|mp-hub|mp-disque/.test(pageSrc), "plus de disque pour le trou");
  assert.ok(pageSrc.includes('class="rb-bouton rb-dispo glow-dispo-v1 mp2-spin-bouton-v1" onclick="window.__actionMetaIdleV130__({action:\\\'moneyPit\\\'})"'), "même bouton que celui de la roue");
}
// règle n°4 : le guetteur ne redessine que si le palier reçu diffère du palier dessiné, et ne synchronise qu'au plus toutes les 4 s
{
  const g = pageSrc.slice(pageSrc.indexOf("function guetterPalierTrouIdleV1_"), pageSrc.indexOf("function rendreBoutonMoneyPitIdleV1_"));
  assert.ok(g.includes("Number(d.tier)!==Number(carte.getAttribute('data-mp-palier'))") && g.includes("maintenant-derniereSynchroPalierIdleV1>4000"));
  assert.ok(g.includes("RO.enCours()"));
  assert.ok(!/setTimeout/.test(g), "aucune attente entre redessin et remise en état");
  assert.ok(!/setTimeout|setInterval|requestAnimationFrame/.test(modSrc), "le module de la liste ne tient aucun état d'animation");
}
console.log("idle-trou-recompenses-client-v1 : OK");
