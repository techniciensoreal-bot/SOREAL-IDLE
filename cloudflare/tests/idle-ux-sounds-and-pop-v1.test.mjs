import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-26) : bruit agréable en changeant de menu ; chiffre « Énergie affectée » qui gonfle une fois quand on met de l'énergie ; voix IA activée de base ;
 * badge du haut avec le vrai numéro de version (Beta 2.x).
 */
const lire = (rel) => readFileSync(rel, "utf8");

// ---------- son de navigation ----------
{
  const audio = lire("cloudflare/public/modules/audio-effects-v199.js");
  assert.ok(audio.includes('menuNav:{group:"ui-nav"') && audio.includes("menuNav:menuNav_") && audio.includes('menuNav:function(){return demander_("menuNav");}'), "son « menuNav » déclaré, joué et exporté");
  assert.ok(audio.includes('closest(".soreal-idle-nav-button-v28")') && audio.includes('b.classList.contains("active")'), "il ne joue que sur un vrai changement de menu (pas le menu déjà ouvert)");
  assert.ok(audio.includes("b.closest(\".edition\")"), "silencieux quand on range les boutons (mode édition)");
}

// ---------- gonflement du chiffre d'énergie affectée ----------
{
  const listeners = {};
  const elements = [];
  const fabrique = (id, texte) => {
    const classes = new Set();
    return { id, textContent: texte, offsetWidth: 1, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), has: (c) => classes.has(c) }, addEventListener() {}, removeEventListener() {} };
  };
  const document = {
    head: { appendChild() {} }, documentElement: {},
    getElementById: () => null, createElement: () => ({}),
    querySelectorAll: () => elements,
    addEventListener: (type, fn) => { listeners[type] = fn; }
  };
  const window = { requestAnimationFrame: (fn) => fn() };
  vm.runInNewContext(lire("cloudflare/public/modules/alloc-pop-v1.js"), { window, document, MutationObserver: undefined, Date, parseInt, String, setTimeout });
  const api = window.__SOREAL_IDLE_ALLOC_POP_V1__;
  assert.ok(api, "module chargé");

  const attaque = fabrique("sorealIdleBtAllocationV120_attaque_passive", "0 ⚡");
  elements.push(attaque);
  api.balayer();
  assert.equal(attaque.classList.has("soreal-idle-alloc-pop-v1"), false, "ouverture du menu : pas de gonflement");

  attaque.textContent = "125 ⚡";
  api.balayer();
  assert.equal(attaque.classList.has("soreal-idle-alloc-pop-v1"), false, "augmentation sans clic (redessin, synchro) : pas de gonflement");

  const bouton = { closest: () => bouton };
  listeners.click({ target: { closest: () => bouton } });
  attaque.textContent = "250 ⚡";
  api.balayer();
  assert.equal(attaque.classList.has("soreal-idle-alloc-pop-v1"), true, "clic sur + puis chiffre qui augmente : le chiffre gonfle");

  attaque.classList.remove("soreal-idle-alloc-pop-v1");
  api.balayer();
  assert.equal(attaque.classList.has("soreal-idle-alloc-pop-v1"), false, "une seule fois : sans nouvelle augmentation, rien ne se rejoue");
  attaque.textContent = "100 ⚡";
  api.balayer();
  assert.equal(attaque.classList.has("soreal-idle-alloc-pop-v1"), false, "une baisse (−) ne gonfle pas");

  const css = lire("cloudflare/public/modules/alloc-pop-v1.js");
  assert.ok(css.includes("sorealIdleAllocPopV1") && css.includes("scale(1.9)") && css.includes(".55s ease-out 1"), "animation de gonflement, une seule itération");
  const index = lire("cloudflare/public/index.html");
  assert.ok(index.includes("/modules/alloc-pop-v1.js?v=1"));
}

// ---------- voix IA auto : ON de base ----------
{
  const tts = lire("cloudflare/public/modules/tutorial-tts-v202.js");
  assert.ok(tts.includes("auto=true;") && tts.includes("try{auto=localStorage.getItem(KEY)!=='0';}catch(_){}"), "activée de base ; seul un « 0 » mémorisé (choix du joueur) la coupe");
  assert.equal(tts.includes("auto=localStorage.getItem(KEY)==='1'"), false);
}

// ---------- badge de version ----------
{
  const ui = lire("cloudflare/public/soreal-idle-ui.js");
  const debut = ui.indexOf("function versionBadgeIdleV1_(){");
  const fn = ui.slice(debut, ui.indexOf("\n      }", debut) + 8);
  const badge = (courante) => new Function("window", "IDLE_TEST_VERSION", fn + "\nreturn versionBadgeIdleV1_();")({ __SOREAL_IDLE_RELEASE_NOTES_V1__: courante ? { courante } : undefined }, "Version bêta");
  assert.equal(badge("2.7"), "Beta 2.7", "le badge suit la version courante des notes de mise à jour");
  assert.equal(badge(""), "Version bêta");
  assert.equal(ui.includes("${IDLE_TEST_VERSION}"), false, "le libellé fixe n'est plus affiché");
  assert.equal((ui.match(/🔒 \$\{versionBadgeIdleV1_\(\)\}/g) || []).length, 2, "les deux endroits (écran principal et écran d'erreur)");
  assert.equal(ui.includes("Ver. Beta local"), false);
}

console.log("idle-ux-sounds-and-pop-v1: OK");

/* Norman (2026-09-26) : « le son du boss se répète 2 fois » : une seule lecture par apparition (deux adresses d'image pour le même boss). */
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  assert.ok(ui.includes("let idleDernierGongBossV1=0;"));
  assert.ok(ui.includes("if(maintenantGong-idleDernierGongBossV1>4500){\n              idleDernierGongBossV1=maintenantGong;\n              jouerEffetAudioIdleV199_('bossAppear');"), "le gong ne repart pas dans les 4,5 s");
  assert.equal(ui.split("jouerEffetAudioIdleV199_('bossAppear')").length - 1, 1, "un seul site d'appel");
}
