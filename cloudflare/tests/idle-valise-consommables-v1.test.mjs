import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/* Norman (2026-10-23) : « j'ai des Potions de magie, je ne sais pas où elles sont stockées ; une valise médiévale, vivante comme le coffre, avec son cadre ; quand on l'ouvre, elle se déplie en étages, comme un étalage de magasin ». Les potions sont rangées dans la valise, utilisées à la demande. */
const lire = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const snap = lire("src/idle-ngu-snapshot.js");
assert.ok(snap.includes("consommables: consommablesSnapshotV1(state)"), "le moteur envoie les consommables");
const f = snap.slice(snap.indexOf("function consommablesSnapshotV1"), snap.indexOf("function consommablesSnapshotV1") + 1200);
assert.ok(f.includes("if (v > 0) restant[k]") && f.includes("if (fx.beta && fx.beta[k]) beta[k] = true") && f.includes("if (v > 0) reserve[k] = v") && f.includes("return { restant, beta, reserve, potions }"), "seulement ce qui est en effet ou en réserve (anti-spoil)");

// Moteur : acheter / gagner une potion la range, l'utiliser l'active.
const shop = lire("src/idle-sellout-shop-v1.js");
assert.ok(shop.includes("export const IDLE_POTIONS_STOCK_V1") && shop.includes("state.selloutEffects.stock[itemId] = I(state.selloutEffects.stock[itemId], 0)"), "acheter / gagner une potion la range");
assert.ok(shop.includes("export function idleSelloutUsePotionV1") && shop.includes("POTION_ABSENTE"), "utiliser une potion l'active et la sort de la valise");
assert.ok(lire("src/idle-ngu-actions.js").includes("action === \"usePotion\""), "action moteur usePotion");

// Le Coffre pose la valise (un seul nœud racine : le Coffre est remplacé d'un bloc).
const ui = lire("public/modules/ui-aventure-2-v1.js");
assert.ok(ui.includes("window.__SOREAL_IDLE_VALISE_V1__") && ui.includes("valiseConsommablesIdleV1_()+"), "valise posée dans le cadre du Coffre");
assert.ok(lire("public/index.html").includes('<script defer src="/modules/valise-v1.js?v='), "module chargé");

// Le module : rendu réel dans un faux navigateur.
const code = lire("public/modules/valise-v1.js");
function monde(consommables, ouverte) {
  const stockage = { soreal_idle_valise_ouverte_v1: ouverte ? "1" : "0" };
  const fen = {
    document: { getElementById: () => null, head: { appendChild() {} }, documentElement: { appendChild() {} }, createElement: () => ({ style: {} }), addEventListener() {}, querySelectorAll: () => [], hidden: false },
    localStorage: { getItem: (k) => stockage[k] ?? null, setItem: (k, v) => { stockage[k] = v; } },
    __SOREAL_IDLE_REG__: { idleEtat: { systemes: { consommables } } },
    setInterval() {}, matchMedia: () => ({ matches: false })
  };
  fen.window = fen;
  vm.runInNewContext(code, fen);
  return fen.__SOREAL_IDLE_VALISE_V1__;
}
{
  // Valise vide : toujours là (le joueur doit la voir), trois étages, aucun objet ni nom d'objet non possédé.
  const V = monde({ restant: {}, beta: {}, reserve: {}, potions: {} }, false);
  const h = V.html();
  assert.ok(h.includes("vl-section") && !h.includes("vl-ouverte"), "fermée");
  assert.ok(!h.includes("vl-langue") && h.includes("Rien là-dedans"), "sans objet : pas de langue, juste un mot");
  assert.ok(!h.includes("vl-rouleau"), "sans objet : pas de rouleau");
  assert.equal((h.match(/vl-art/g) || []).length, 0, "aucun objet");
  assert.ok(!/Potion d|Potion de|Poop|Beast Butter|Pilules|Stylos/.test(h), "aucun nom d'objet non possédé");
  assert.ok(!/\d+\s*\/\s*\d+/.test(h.replace(/<svg[\s\S]*?<\/svg>/, "")), "aucun total « x / y »");
}
{
  // Potions rangées + effets en cours + réserves : un article chacun, bouton « Utiliser » seulement pour les potions rangées.
  const V = monde({ restant: { magicPower: 2700, luck: 30 }, beta: { magicPower: true }, reserve: { poop: 12 }, potions: { magicPotionAlpha: 2, resource3PotionDelta: 1 } }, true);
  const h = V.html();
  assert.ok(h.includes("vl-ouverte") && h.includes('aria-expanded="true"'), "ouverte (état rangé dans localStorage)");
  assert.ok(h.includes("vl-langue") && h.includes("vl-lg-racine") && h.includes("vl-lg-bout") && h.includes("vl-rouleau") && h.includes('data-n="6"'), "la langue porte les objets (racine, corps, bout, rouleau)");
  assert.ok(h.includes('data-vl-utiliser="magicPotionAlpha"') && h.includes('data-vl-utiliser="resource3PotionDelta"') && (h.match(/data-vl-utiliser=/g) || []).length === 2, "un bouton Utiliser par potion rangée");
  assert.ok(h.includes("× 2") && h.includes("45 min") && h.includes("jusqu’au Rebirth") && h.includes("Porte-bonheur") && h.includes("× 12"), "quantités, durées, réserves");
  assert.ok(h.includes("Valise des consommables (6)"), "compteur d'objets possédés, sans total");
  assert.ok(h.includes('data-morph-classes-gardees="^vl-(dort|ouverte|parle|glou|anim)$"'), "classes posées par le module gardées au redessin (règle n°4)");
}
{
  // Style : cuir et cadre propres à la valise, étages qui se déplient en cascade, aucune règle forcée, mouvement réduit respecté.
  const css = monde({}, false).css;
  assert.ok(css.includes("max-height:calc(var(--vl-h,0)*var(--vl-pf,var(--vl-p,0))*1px)") && css.includes(".vl-ouverte:not(.vl-anim) .vl-deplie-in{max-height:none}") && css.includes(":not(.vl-ouverte):not(.vl-anim) .vl-langue{visibility:hidden}") && css.includes("vl-rouleau") && css.includes(".vl-anim .vl-rouleau") && css.includes("repeat-y"), "langue qui se déroule de la bouche, rouleau au bout, corps qui se répète");
  assert.ok(css.includes("vlRespire") && css.includes("vlCligne") && css.includes("vlAnse") && css.includes("vl-dort"), "vivante : respire, cligne, remue l'anse, dort");
  assert.ok(css.includes("prefers-reduced-motion"), "mouvement réduit");
  assert.ok(css.includes("height:calc(var(--vl-rr,0)*2px)") && css.includes("var(--vl-s,0)*1px") && !css.includes("vl-ro-face"), "rouleau vu de face : rayon qui diminue, peau qui défile (pas de faces vues de dessus)");
  assert.ok(css.includes("svg.vl-haut{position:absolute") && css.includes("z-index:5") && !css.includes("vl-gueule") && !css.includes("vl-sourire"), "couvercle au-dessus de la langue ; aucune bouche dessinée (la bouche est l'ouverture)");
  assert.ok(css.includes("--vl-m:calc(min(250px,64cqw)*.444)") && css.includes("margin-top:calc(var(--vl-m)*-1)") && css.includes("width:min(210px,54cqw)"), "langue posée sur la lèvre inférieure, aussi large que la valise");
  assert.ok(!/!important/.test(css), "aucune règle forcée");
  assert.ok(/@keyframes vlBulle\{0%\{opacity:0;/.test(css) && /@keyframes vlZ\{0%\{opacity:0;[\s\S]*?100%\{opacity:0;/.test(css), "boucles sans à-coup (fondu d'entrée et de sortie)");
}
{
  // Vraie animation : la longueur déroulée, le rayon du rouleau et sa rotation sont calculés image par image (aucune simple transition).
  assert.ok(code.includes("function anime(vers)") && code.includes("requestAnimationFrame(image)") && code.includes("var rr=r0*(1-p),defile=H*p"), "animation image par image, rouleau physique");
  assert.ok(code.includes("anime(o?1:0);") && code.includes("finirProgres("), "ouvrir / fermer la lancent");
  assert.ok(!/vl-deplie-in{[^}]*transition/.test(code), "plus de transition simulée sur la hauteur");
}
// Sons de la valise.
const audio = lire("public/modules/audio-effects-v199.js");
for (const s of ["valiseOuvre", "valiseFerme", "valisePotion", "valiseTouche"]) assert.ok(audio.includes(s + ":valise") && audio.includes('demander_("' + s + '")'), "son " + s);
// Les règles de police forcées du Coffre n'écrasent pas les polices de la valise.
assert.ok(lire("public/soreal-idle-itopod.css").includes(":not(.vl-section):not(.vl-section *){font-family"), "polices de la valise respectées");
console.log("idle-valise-consommables-v1: OK");

// La bouche (le couvercle) ne se referme qu'une fois la langue entièrement repliée, et s'ouvre avant que la langue sorte (Norman, 2026-10-23).
{
  const c = readFileSync(new URL("../public/modules/valise-v1.js", import.meta.url), "utf8");
  assert.ok(c.includes("if(p===0)s.classList.remove('vl-ouverte');") && c.includes("if(o)s.classList.add('vl-ouverte');") && !c.includes("s.classList.toggle('vl-ouverte',o)"), "la classe « ouverte » ne part qu'à la fin de l'enroulement");
  assert.ok(c.includes("var retard=vers?340:0") && c.includes("now-t0<retard"), "la bouche s'ouvre avant la sortie de la langue");
}
console.log("idle-valise-consommables-v1 (bouche): OK");

// Le couvercle est articulé à l'arrière (son bord haut reste collé au fond) : il se raccourcit autour de ce bord au lieu de s'envoler ; plus de « dents » colorées (Norman, 2026-10-23).
{
  const c = readFileSync(new URL("../public/modules/valise-v1.js", import.meta.url), "utf8");
  assert.ok(c.includes(".vl-dome{transform-origin:160px 52px") && c.includes(".vl-ouverte .vl-dome{animation:none;transform:scaleY(.74)}"), "charnière à l'arrière");
  assert.ok(!c.includes("translateY(-20px) scaleY(.96)"), "le couvercle ne se détache plus");
  assert.ok(!c.includes("vl-goulot") && !c.includes("#7be6a0") && !c.includes("#ffc24a"), "aucune dent de couleur");
}
console.log("idle-valise-consommables-v1 (charnière): OK");

// Fermeture : la langue s'enroule 0,5 s avant que le cadre rétrécisse (le cadre cachait l'animation) : la longueur visible suit --vl-p, la place du cadre suit --vl-pf en retard.
{
  const c = readFileSync(new URL("../public/modules/valise-v1.js", import.meta.url), "utf8");
  assert.ok(c.includes("var DELAI_CADRE=vers?0:500") && c.includes("appliquerProgres(depart+(vers-depart)*facile(k),depart+(vers-depart)*facile(kf))"), "le cadre rétrécit 0,5 s après le début de l'enroulement");
  assert.ok(c.includes(".vl-anim .vl-langue{clip-path:inset(0 0 calc(var(--vl-h,0)*(1 - var(--vl-p,0))*1px) 0)}"), "la langue visible suit son propre avancement");
}
console.log("idle-valise-consommables-v1 (cadre en retard): OK");

// Les yeux d'un fou : chaque pupille a sa propre trajectoire (haut, bas, de travers), à son propre rythme (Norman, 2026-10-23).
{
  const c = readFileSync(new URL("../public/modules/valise-v1.js", import.meta.url), "utf8");
  assert.ok(c.includes(".vl-pg{animation-name:vlFouG;animation-duration:2.9s}") && c.includes(".vl-pd{animation-name:vlFouD;animation-duration:2.3s}"), "deux pupilles, deux rythmes");
  const g = c.match(/@keyframes vlFouG\{([^@]*?)\}\n/)[1], d = c.match(/@keyframes vlFouD\{([^@]*?)\}\n/)[1];
  assert.ok(g !== d && /translate\([^)]*,[^)]*\)/.test(g) && /translate\([^)]*,[^)]*\)/.test(d), "trajectoires différentes, à deux dimensions");
}
console.log("idle-valise-consommables-v1 (yeux): OK");

// Graines et poop dans la réserve, valise toujours à jour, phrase à l'ouverture, disposition PC (Norman, 2026-10-23).
{
  assert.ok(snap.includes("if (graines > 0) reserve.seeds = graines;"), "le moteur envoie les graines (seulement s'il y en a)");
  const c = readFileSync(new URL("../public/modules/valise-v1.js", import.meta.url), "utf8");
  assert.ok(c.includes("{id:'seeds',nom:'Graines'") && c.includes("{id:'poop',nom:'Poop'"), "graines et poop dans les réserves");
  assert.ok(c.includes("function rafraichirContenu()") && c.includes("rafraichirContenu();\n      if(document.hidden"), "contenu rafraîchi en direct");
  assert.ok(c.includes("function phraseHtml()") && c.includes(".vl-ouverte .vl-phrase{max-height:160px"), "phrase marrante à l'ouverture");
  assert.ok(c.includes("@media (min-width:761px)") && c.includes(":has(>.vl-section){display:grid;grid-template-columns:minmax(0,1fr) 350px") && c.includes(">.vl-section{grid-column:2;grid-row:2}"), "PC : dans le cadre du Coffre, à droite de « Il mange les objets… »");
}
console.log("idle-valise-consommables-v1 (graines, PC): OK");
