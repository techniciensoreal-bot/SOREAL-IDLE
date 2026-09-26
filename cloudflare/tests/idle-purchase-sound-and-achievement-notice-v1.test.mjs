import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-26) :
 *  - « un bruit de caisse enregistreuse quand on effectue un achat » ;
 *  - « un popup fade in fade out quand on débloque un trophée » + « plus d'importance au visuel des Achievements : emoji, couleurs par catégorie ».
 */
const lire = (rel) => readFileSync(rel, "utf8");

// ---------- son d'achat : enveloppe de google.script.run ----------
{
  const joues = [];
  const appels = [];
  let reponse = { ok: true };
  const script = {};
  const runnerReel = () => {
    let succes = null, echec = null;
    const runner = new Proxy({}, {
      get(_c, prop) {
        if (prop === "withSuccessHandler") return (fn) => { succes = fn; return runner; };
        if (prop === "withFailureHandler") return (fn) => { echec = fn; return runner; };
        return (...args) => { appels.push([String(prop), args]); Promise.resolve().then(() => (reponse instanceof Error ? echec && echec(reponse) : succes && succes(reponse))); return runner; };
      }
    });
    return runner;
  };
  Object.defineProperty(script, "run", { configurable: true, enumerable: true, get: runnerReel });
  const window = { google: { script }, __SOREAL_IDLE_AUDIO_V199__: { play: (n) => joues.push(n) } };
  vm.runInNewContext(lire("cloudflare/public/modules/purchase-sound-v1.js"), { window, setInterval, clearInterval, Proxy, Promise, Object, Array, Boolean, String });
  const api = window.__SOREAL_IDLE_PURCHASE_SOUND_V1__;
  assert.ok(api, "module chargé");
  const attendre = () => new Promise((r) => setTimeout(r, 5));

  const recus = [];
  window.google.script.run.withSuccessHandler((r) => recus.push(r)).agirProgressionSorealIdle("s", { action: "buyExpShop", item: "x", quantity: 1 });
  await attendre();
  assert.equal(JSON.stringify(joues), '["purchase"]', "achat EXP Shop réussi : caisse enregistreuse");
  assert.equal(JSON.stringify(recus), '[{"ok":true}]', "le gestionnaire d'origine reçoit toujours la réponse");
  assert.equal(JSON.stringify(appels[0]), JSON.stringify(["agirProgressionSorealIdle", ["s", { action: "buyExpShop", item: "x", quantity: 1 }]]), "les arguments passent tels quels");

  window.google.script.run.acheterEntrainementsSorealIdle("s", [{ type: "x" }]);
  await attendre();
  assert.equal(joues.length, 2, "opération d'achat directe");

  reponse = { ok: false, message: "ACHAT_EXP_INCONNU" };
  window.google.script.run.withSuccessHandler(() => {}).agirProgressionSorealIdle("s", { action: "buyResource" });
  await attendre();
  assert.equal(joues.length, 2, "achat refusé (ok:false) : aucun son");

  reponse = { ok: true };
  window.google.script.run.agirProgressionSorealIdle("s", { action: "allocate", system: "x" });
  window.google.script.run.synchroniserSorealIdle("s");
  await attendre();
  assert.equal(joues.length, 2, "une action qui n'est pas un achat reste muette");

  for (const action of ["buyResource", "buyNewbieOffer", "buyPerk", "buyQuirk", "sellShopBuy", "buyExpShop", "richJerks", "buyDigger"]) assert.ok(api.actions.includes(action), action);

  let erreur = null;
  reponse = new Error("réseau");
  window.google.script.run.withSuccessHandler(() => {}).withFailureHandler((e) => { erreur = e; }).agirProgressionSorealIdle("s", { action: "buyPerk" });
  await attendre();
  assert.equal(erreur && erreur.message, "réseau", "le gestionnaire d'échec d'origine est conservé");
  assert.equal(joues.length, 2);
}

// ---------- sons ----------
{
  const audio = lire("cloudflare/public/modules/audio-effects-v199.js");
  assert.ok(audio.includes('purchase:{group:"purchase"') && audio.includes("purchase:caisse_") && audio.includes('purchase:function(){return demander_("purchase");}'), "son « purchase » déclaré, joué et exporté");
  assert.ok(audio.includes('achievement:{group:"achievement"') && audio.includes("achievement:succes_"), "son « achievement »");
}

// ---------- annonce d'un succès ----------
{
  const stock = new Map();
  const annonces = [], sons = [];
  const window = {
    __SOREAL_IDLE_AUDIO_V199__: { play: (n) => sons.push(n) },
    __sorealFadeNoticeV1__: (titre, lignes, options) => annonces.push({ titre, lignes, options }),
    __SOREAL_IDLE_SUCCES_GROUPES_V1__: { boss: { emoji: "👹", couleur: "#ef4444" }, energyPower: { emoji: "⚡", couleur: "#f2a900" } }
  };
  const localStorage = { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)) };
  vm.runInNewContext(lire("cloudflare/public/modules/achievement-notice-v1.js"), { window, localStorage, JSON, Array, Number, String });
  const api = window.__SOREAL_IDLE_ACHIEVEMENT_NOTICE_V1__;
  const joueur = (ids) => ({ systemes: { achievements: { list: [
    { id: "energyPower_1", group: "energyPower", name: "Energy Power 1", bp: 5, unlocked: ids.includes("energyPower_1") },
    { id: "boss_1", group: "boss", name: "Defeat Boss 1", bp: 3, unlocked: ids.includes("boss_1") },
    ...[2, 3, 4, 5, 6, 7].map((n) => ({ id: "boss_" + n, group: "boss", name: "Defeat Boss " + n, bp: 3, unlocked: ids.includes("boss_" + n) }))
  ] } } });
  const cle = "cle-test";

  api.verifier(joueur(["energyPower_1"]), cle);
  assert.equal(annonces.length, 0, "premier passage : l'existant est noté, aucune rafale");
  api.verifier(joueur(["energyPower_1"]), cle);
  assert.equal(annonces.length, 0, "rien de nouveau : rien à annoncer");

  api.verifier(joueur(["energyPower_1", "boss_1"]), cle);
  assert.equal(annonces.length, 1);
  assert.equal(annonces[0].titre, "🏆 Succès débloqué !");
  assert.equal(JSON.stringify(annonces[0].lignes), JSON.stringify(["👹 Defeat Boss 1", "+3 BP"]));
  assert.equal(annonces[0].options.accent, "#ef4444", "couleur de la catégorie");
  assert.equal(JSON.stringify(sons), '["achievement"]', "fanfare");

  api.verifier(joueur(["energyPower_1", "boss_1"]), cle);
  assert.equal(annonces.length, 1, "un succès n'est annoncé qu'une fois");

  api.verifier(joueur(["energyPower_1", "boss_1", "boss_2", "boss_3", "boss_4", "boss_5", "boss_6", "boss_7"]), cle);
  assert.equal(annonces.length, 1 + 4 + 1, "au plus 4 annonces, puis « et N autres »");
  assert.match(annonces[annonces.length - 1].titre, /Et 2 autres succès/);
  assert.equal(sons.length, 2, "un seul son par lot");
}

// ---------- branchement ----------
{
  const ui = lire("cloudflare/public/soreal-idle-ui.js");
  assert.ok(ui.includes("window.__SOREAL_IDLE_ACHIEVEMENT_NOTICE_V1__.verifier(j,'soreal_idle_succes_annonces_v1_'+generationJoueurIdleV75_(j));"), "vérification à chaque rendu, clé par joueur");
  const index = lire("cloudflare/public/index.html");
  for (const m of ["/modules/purchase-sound-v1.js?v=1", "/modules/achievement-notice-v1.js?v=1"]) assert.ok(index.includes(m), m);
  assert.ok(index.indexOf("/modules/audio-effects-v199.js") < index.indexOf("/modules/purchase-sound-v1.js") && index.indexOf("/modules/purchase-sound-v1.js") < index.indexOf("/soreal-idle-ui.js?v="), "chargés avant le jeu, après le son");
  const fade = lire("cloudflare/public/modules/fade-notice-v1.js");
  assert.ok(fade.includes("options.accent") && fade.includes("n.accent"), "l'annonce en fondu accepte une couleur d'accent");
}

// ---------- page Achievements ----------
{
  const profil = lire("cloudflare/public/modules/profile-v1.js");
  for (const [groupe, emoji] of [["energyPower", "⚡"], ["magicPower", "🔮"], ["energyCap", "🔋"], ["magicCap", "🧪"], ["energyBars", "📊"], ["magicBars", "📈"], ["boss", "👹"], ["rebirth", "♻️"], ["secret", "🕵️"]]) {
    assert.ok(new RegExp(groupe + ":\\{nom:'[^']+',emoji:'" + emoji + "',couleur:'#[0-9a-f]{6}'\\}").test(profil), "catégorie " + groupe + " : emoji et couleur");
  }
  assert.ok(profil.includes("secret:{nom:'Secrets'"), "la catégorie des secrets utilise l'identifiant serveur « secret » (avant : « secrets », jamais affichée)");
  const couleurs = [...profil.matchAll(/couleur:'(#[0-9a-f]{6})'/g)].map((m) => m[1]);
  assert.equal(new Set(couleurs).size, couleurs.length, "une couleur distincte par catégorie");
  assert.ok(profil.includes("idle-succes-groupe-v1") && profil.includes("var(--acc)"), "cartes colorées par catégorie");
}

console.log("idle-purchase-sound-and-achievement-notice-v1: OK");
