import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-29) : « quand on décide de manger les fruits, un bruit de mâche, et les fruits rétrécissent tous à tour de rôle ; quand on décide d'en faire des graines, ils tombent au sol en mini particules ».
 * Plus : bouton plein écran / écran normal (PC, bout de la rangée des chiffres) et prix du niveau suivant sous la barre de la Machine temporelle.
 */
const sons = readFileSync("cloudflare/public/modules/yggdrasil-sons-v1.js", "utf8");
const page = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");

// 1. mâche : n coups de mâchoire, un par fruit
let noeuds = 0;
const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
const ctx = {
  state: "running", sampleRate: 8000, currentTime: 0, destination: {},
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => { noeuds += 1; return { connect() {}, start() {}, buffer: null }; },
  createBiquadFilter: () => { noeuds += 1; return { type: "", frequency: param(), Q: { value: 0 }, connect() {} }; },
  createGain: () => { noeuds += 1; return { gain: param(), connect() {} }; },
  createOscillator: () => { noeuds += 1; return { type: "", frequency: param(), connect() {}, start() {}, stop() {} }; },
  resume() {}
};
const fenetre = { AudioContext: function () { return ctx; }, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => 0.75 } };
fenetre.window = fenetre;
vm.runInNewContext(sons, fenetre, { filename: "yggdrasil-sons-v1.js" });
const S = fenetre.__SOREAL_IDLE_YGG_SONS_V1__;
const cout = (option) => { const avant = noeuds; assert.equal(S.jouer("manger", option), true); return noeuds - avant; };
const un = cout({ n: 1, pas: 0.2 }), dix = cout({ n: 10, pas: 0.2 }), vingtQuatre = cout({ n: 24, pas: 0.11 });
assert.ok(un >= 6, "un coup de mâchoire = craquement + bloc + grave");
assert.ok(dix >= 9 * un && vingtQuatre > dix, "autant de coups que de fruits (n coups = n fois le motif)");
assert.ok(cout() > 0, "sans option : quelques coups");

// 2. page : rétrécissement à tour de rôle, particules au sol
const anim = page.slice(page.indexOf("function animer_(id,mode)"), page.indexOf("function lancerUsage_"));
assert.ok(anim.includes("var d=recolte?rang*0.05:rang*pas,dur=0.3;") && anim.includes("delay:d*1000") && anim.includes("base+'0)'"), "manger : chaque fruit rétrécit jusqu'à rien, l'un après l'autre (retard i × pas)");
assert.ok(anim.includes("else if(nm)son_('manger',{n:nm,pas:pas})") && anim.includes("if(!recolte||!mur){") && anim.includes("rang=mur?im_++:nm"), "un coup de mâchoire par fruit COMPLET seulement, au rythme du rétrécissement ; le fruit qui pousse rétrécit en silence, sans graines (Norman, 2026-10-29)");
assert.ok(anim.includes("className='ygg-part'") && anim.includes("sol=H*0.88") && anim.includes("cubic-bezier(.5,0,.9,.6)"), "récolter : mini particules qui tombent (accélération) jusqu'au sol");
assert.ok(anim.includes("if(recolte)son_('recolter')"), "récolter garde son son");
assert.ok(anim.includes("data-morph-garder") && anim.includes("img.style.visibility='hidden'"), "couche épargnée par le redessin (règle n°4) ; le fruit réel est masqué");
assert.ok(anim.includes("prefers-reduced-motion"), "réduire les animations : seulement le son");
assert.ok(page.includes("animer_(id,c.mode==='harvest'?'harvest':'eat');") && !/son_\(c\.mode==='harvest'\?'recolter':'manger'\)/.test(page), "le son et l'animation partent ensemble, une seule fois (manger un par un et « tout » compris)");
assert.ok(page.includes("if(etat.anim&&etat.anim[id]&&Date.now()<etat.anim[id])return '';"), "la porte attend la fin de l'animation pour se refermer");
assert.ok(page.includes("rafraichir_();\n    },fin*1000+160);"), "la page est redessinée à la fin (la porte se referme alors)");

// 3. plein écran
const pe = readFileSync("cloudflare/public/modules/plein-ecran-v1.js", "utf8");
const bande = readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
assert.ok(bande.includes('class="soreal-idle-pe-v1"') && bande.includes("--nb-tuiles:${nbTuiles}") && bande.includes("${tempsRebirth}\n            ${boutonPleinEcran}"), "le bouton est la dernière case de la rangée des chiffres, après le cadre Temps");
assert.ok(pe.includes("@media (min-width:701px)") && pe.includes("38px!important") && pe.includes("html:fullscreen .soreal-idle-pe-v1 .pe-ent{display:none}"), "PC seulement, colonne fixe, dessin choisi par :fullscreen (aucun attribut réécrit : règle n°4)");
assert.ok(pe.includes("document.fullscreenEnabled") && pe.includes("pe-indispo"), "absent quand le navigateur ne sait pas (WebView Android)");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes('/modules/plein-ecran-v1.js?v='), "chargé par la page");

// 4. Machine temporelle : prix du niveau suivant
const aug = readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const moteur = readFileSync("cloudflare/src/idle-ngu-pistes.js", "utf8");
assert.ok(moteur.includes("speedGoldCost: tmLevelGoldCost(speedLevel + 1)") && moteur.includes("goldGoldCost: state.systems.bloodMagic?.unlocked ? tmLevelGoldCost(goldLevel + 1) : null"), "le moteur donne le prix ; celui de la Magie n'existe qu'une fois Blood Magic débloqué (anti-spoil)");
assert.ok(aug.includes("data-tm-prix=") && aug.includes("[['vitesse',vue.speedGoldCost],['or',vue.goldGoldCost]]"), "ligne sous la barre, mise à jour à chaque synchro");
assert.ok(readFileSync("cloudflare/public/soreal-idle-machine.css", "utf8").includes(".tmm-prix{"), "style de la ligne");
console.log("idle-ygg-usage-animation-v1: OK");

/* Norman (2026-10-29) : le bouton Activer est grisé tant que l'Énergie ou la Magie nécessaire n'est pas générée ET disponible dans la barre du haut ; bleuté quand il coûte de la Magie */
{
  const y = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8");
  assert.ok(y.includes("function manqueActiver_(ressource,cout)") && y.includes("window.__SOREAL_IDLE_DISPONIBLE_V2__") && y.includes("libre<nb_(cout)"), "la disponibilité est celle de la barre du haut (énergie / magie libres)");
  assert.ok(y.includes("(manque?'disabled title=\"'+html_(titreManque_(def.resource))+'\" '") && y.includes("data-ygg-act=") && y.includes("data-ygg-cout="), "rendu : bouton grisé (disabled) quand il manque de quoi payer");
  assert.ok(y.includes("function majActiver_()") && y.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(majActiver_)") && y.includes("setInterval(function(){if(!document.hidden&&document.querySelector('.ygg-btn[data-ygg-act]'))majActiver_();},500)"), "dégrisé / regrisé en direct (toutes les 500 ms et juste après chaque redessin), sans attendre la synchro");
  assert.ok(y.includes("if(b&&b.disabled)return;son_('activer')"), "un clic sur un bouton grisé n'envoie rien");
  assert.ok(y.includes(".ygg-btn.vert.ygg-act-magie{") && y.includes(".ygg-btn.vert.ygg-act-magie:disabled{") && y.includes("(def.resource==='magic'?' ygg-act-magie':'')"), "Activer d'un fruit de Magic : teinte bleutée, y compris grisé");
  console.log("idle-ygg-usage-animation-v1 (Activer grisé, bleuté): OK");
}
