import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-26) : (1) « le menu Achievements n'apparaît que quand on débloque le premier achievement » ;
 * (2) « un bruit de Gold pour un achat dans EXP Shop ; pour l'AP, un bruit de pierre précieuse ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
const achat = readFileSync("cloudflare/public/modules/purchase-sound-v1.js", "utf8");

// --- Menu Achievements : caché tant qu'aucun succès n'est débloqué ---
{
  const i = ui.indexOf("function menuSuccesVisibleIdleV1_(j){");
  assert.ok(i > 0, "règle propre au menu Achievements");
  const bloc = ui.slice(i, ui.indexOf("function generationJoueurIdleV75_(", i));
  assert.ok(bloc.includes("j.systemes.achievements") && bloc.includes(".list.some(function(a){return a&&a.unlocked;})"), "vrai seulement quand au moins un succès est débloqué");
}

// --- Sons d'achat : or (EXP Shop), gemme (Boutique AP), caisse pour les autres ---
{
  const fenetre = { google: undefined };
  new Function("window", "setInterval", "clearInterval", achat)(fenetre, () => 0, () => {});
  const p = fenetre.__SOREAL_IDLE_PURCHASE_SOUND_V1__;
  const action = (a) => ["agirProgressionSorealIdle", ["joueur", { action: a }]];
  assert.equal(p.sonAchat("agirProgressionSorealIdle", ["joueur", { action: "buyExpShop" }]), "purchaseGold");
  assert.equal(p.sonAchat("agirProgressionSorealIdle", ["joueur", { action: "sellShopBuy" }]), "purchaseGem");
  for (const a of ["buyPerk", "buyQuirk", "buyResource", "buyDigger"]) assert.equal(p.sonAchat(...action(a)), "purchase", a);
  assert.equal(p.sonAchat("acheterAmeliorationSorealIdle", []), "purchase");
  assert.equal(p.estAchat("agirProgressionSorealIdle", ["joueur", { action: "buyExpShop" }], { ok: false }), false, "achat refusé : muet");
}
for (const nom of ["purchaseGold", "purchaseGem"]) {
  assert.ok(audio.includes(nom + ":{group:\"purchase\""), nom + " déclaré (même groupe que la caisse : jamais deux achats superposés)");
  assert.ok(audio.includes(nom + ":function(){return demander_(\"" + nom + "\");}"), nom + " jouable");
  assert.ok(audio.includes(nom + ":{duree:"), nom + " exposé pour le rendu hors ligne");
}
assert.ok(/function gemmeConstruire_[\s\S]*?2\.32[\s\S]*?4\.25/.test(audio) && !/function gemmeConstruire_[\s\S]{0,900}type:"square"/.test(audio), "la gemme est un carillon de cristal (partiels inharmoniques), sans son de métal");

// --- Transport réel : les actions de progression passent par window.__SOREAL_IDLE_CALL_V1__ (promesse), pas par google.script.run ---
{
  const joues = [];
  let reponse = { ok: true, joueur: {} };
  const fenetre = {
    __SOREAL_IDLE_AUDIO_V199__: { play: (n) => joues.push(n) },
    __SOREAL_IDLE_CALL_V1__: async () => reponse
  };
  new Function("window", "setInterval", "clearInterval", "Promise", achat)(fenetre, () => 0, () => {}, Promise);
  const attendre = () => new Promise((r) => setTimeout(r, 5));
  const res = await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyExpShop", item: "x", quantity: 1 }]);
  assert.equal(res, reponse, "la réponse d'origine est rendue telle quelle");
  await attendre();
  assert.deepEqual(joues, ["purchaseGold"], "achat EXP Shop par l'appel direct : pièces d'or");
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "sellShopBuy", itemId: "x" }]);
  await attendre();
  assert.deepEqual(joues, ["purchaseGold", "purchaseGem"], "achat Boutique AP par l'appel direct : gemme");
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyPerk", perkId: 1 }]);
  await attendre();
  assert.equal(joues[2], "purchase", "autre achat : caisse");
  reponse = { ok: false };
  await fenetre.__SOREAL_IDLE_CALL_V1__("agirProgressionSorealIdle", ["s", { action: "buyExpShop" }]);
  await attendre();
  assert.equal(joues.length, 3, "achat refusé : muet");
  assert.equal(fenetre.__SOREAL_IDLE_CALL_V1__.__sorealAchat, true);
}

// --- Équiper un objet : son « equip » (Adventure, ancien inventaire, MacGuffins) ---
{
  assert.ok(audio.includes('equip:{group:"inventory-equip"') && audio.includes("equip:equipJouer_") && audio.includes('equip:function(){return demander_("equip");}') && audio.includes("equip:{duree:520,construire:equipConstruire_}"), "son equip déclaré, jouable, exposé");
  const eq1 = ui.slice(ui.indexOf("function equiperObjetAdventureIdleV47_(id,slot){"), ui.indexOf("function desequiperObjetAdventureIdleV47_("));
  assert.ok(eq1.includes("jouerEffetAudioIdleV199_('equip');"), "équiper depuis Adventure (bouton, glisser-déposer, équiper par identifiant) joue le son");
  const eq2 = ui.slice(ui.indexOf("function equiperObjetIdleV10_("), ui.indexOf("const inventaire=", ui.indexOf("function equiperObjetIdleV10_(")));
  assert.ok(eq2.includes("jouerEffetAudioIdleV199_('equip');"), "équiper depuis l'ancien inventaire joue le son");
  assert.ok(readFileSync("cloudflare/public/modules/macguffins-v1.js", "utf8").includes("play('equip')"), "équiper un MacGuffin joue le son");
}

// --- Chiffres de vie du duel : ne dépassent jamais de la pastille (police qui rétrécit, puis retour à la ligne en dernier recours) ---
{
  const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
  const fit = ui.slice(ui.indexOf("function ajusterVieDuelIdleV1_("), ui.indexOf("window.addEventListener('resize',function(){", ui.indexOf("function ajusterVieDuelIdleV1_(")));
  assert.ok(fit.includes("element.scrollWidth>element.clientWidth+0.5") && fit.includes("taille-=0.5") && fit.includes("'white-space','normal','important'"), "ajustement de la police puis repli sur deux lignes");
  assert.ok(ui.includes("ajusterVieDuelIdleV1_(element,change);"), "appelé à chaque mise à jour du texte de combat");
  assert.ok(/soreal-idle-duel-hp-v41 \.soreal-idle-note-v4\{\s+overflow:hidden;/.test(css), "la pastille ne laisse rien sortir");
}

// --- Le texte de narration ne dépend pas d'un second texte : voir idle-voice-pregenerated-v1 (histoire du boss 4) ---
// --- Sans identifiant client Google : pas de barre de chargement figée à 94 %, un message clair (APK) ---
{
  const pont = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
  const i = pont.indexOf("La connexion directe n");
  assert.ok(i > 0 && pont.slice(i - 260, i).includes("masquerProgressionV1();"), "la progression est masquée avec le message");
}

// --- Aventure : nom du monstre / du joueur sur une seule ligne ; plaque du joueur = pseudo ---
{
  const scene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
  assert.ok(scene.includes(".soreal-idle-v79-stat-card .soreal-idle-v79-card-name{white-space:nowrap;overflow:hidden;text-overflow:ellipsis"), "nom sur une seule ligne");
  assert.ok(scene.includes("uneLigneIdleV1_(nomMonstre);") && scene.includes("uneLigneIdleV1_(playerName);"), "la police rétrécit pour que le nom tienne");
  assert.ok(scene.includes("window.__nomJoueurIdleV1__()") && !scene.includes("playerName.textContent='Joueur'"), "la scène Adventure affiche le pseudo, plus « Joueur »");
  assert.ok(ui.includes("window.__nomJoueurIdleV1__=function(){"), "le jeu expose le nom du joueur à la scène");
}

// --- Aventure Idle Mode OFF : un son par bouton de compétence ; double tap sur une pièce équipée = A + clic (boost) ---
{
  const ids = [];
  for (const m of ui.matchAll(/\{id:'([A-Za-z0-9]+)',label:'[^']+',icon:'[^']+'(?:,btIndex:\d+)?,cooldown:\d+/g)) ids.push(m[1]);
  assert.equal(ids.length, 17, "17 boutons de compétence dans le jeu : " + ids.join(","));
  for (const id of ids) {
    assert.ok(audio.includes('{id:"' + id + '",duree:'), "un son pour la compétence " + id);
  }
  assert.ok(audio.includes('DEFINITIONS["skill_"+son.id]={group:"adventure-skill"') && audio.includes('JOUEURS["skill_"+son.id]=jouerCompetence_(son);'), "sons déclarés et jouables (skill_<id>)");
  assert.ok(audio.includes("skills:SONS_COMPETENCE.map("), "exposés pour le rendu hors ligne");
  const util = ui.slice(ui.indexOf("function utiliserCompetenceAdventureIdleV3_(id){"), ui.indexOf("attaqueBase=group==='attack';"));
  assert.ok(util.indexOf("cooldownRestantAdventureIdleV3_(def.id,maintenant)>0") < util.length && !util.includes("jouerEffetAudioIdleV199_('skill_'"), "le son est joué après les garde-fous (recharge, verrou)");
  const debutCompetence = ui.indexOf("function utiliserCompetenceAdventureIdleV3_(id){");
  const posCooldown = ui.indexOf("idleAdventureManualStateV3.cooldownUntil[def.id]=", debutCompetence);
  const apres = ui.slice(posCooldown, posCooldown + 400);
  assert.ok(apres.includes("jouerEffetAudioIdleV199_('skill_'+def.id);"), "le son part quand la compétence est lancée");
  const dt = ui.slice(ui.indexOf("function boosterObjetEquipeAdventureIdleV1_(id){"), ui.indexOf("function executerTapObjetAdventureIdleV196_(element,id){"));
  assert.ok(dt.includes("action:'inventoryAuto',mode:'boostAll',targetId:objet") && dt.includes("item.kind==='boost'"), "boost de la pièce équipée (jamais un boost)");
  assert.ok(/boosterObjetEquipeAdventureIdleV1_\(id\)\s*\)\{\s*return;/.test(ui), "branché sur le double tap des pièces équipées");
}

// --- Zoom accessible ; plus d'éclat blanc sur la barre verte ; popup Achievements au premier succès ---
{
  const index = readFileSync("cloudflare/public/index.html", "utf8");
  const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
  assert.ok(!index.includes("user-scalable=no") && !index.includes("maximum-scale=1"), "viewport : zoom navigateur autorisé");
  assert.ok(!index.includes("touch-action:pan-x pan-y") && !index.includes('"gesturestart"'), "aucun bloqueur JS/CSS du pincement");
  assert.ok(!index.includes("sorealIdleEnergyShineV11") && !ui.includes('id="sorealIdleEnergyShineV11"'), "l'éclat blanc n'est plus dans la barre");
  assert.ok(/soreal-idle-energybar-shine-v11,\s*\.soreal-idle-energybar-shine-v11\.tick\{\s*display:none !important;/.test(css), "l'éclat est masqué même s'il subsistait");
  assert.ok(!ui.includes("jouerEclatEnergieTickIdleV13_"), "plus d'animation d'éclat à chaque tick (fonction et appel supprimés)");
  assert.ok(ui.includes("(s.id!=='achievements'||menuSuccesVisibleIdleV1_(j))"), "la nouveauté Achievements (popup + voix) n'existe qu'au premier succès");
  assert.ok(ui.includes("if(id==='succes'&&!menuSuccesVisibleIdleV1_(j))return false;"), "le menu Achievements suit la même règle");
}

console.log("idle-shop-sounds-achievements-menu-v1 OK");
