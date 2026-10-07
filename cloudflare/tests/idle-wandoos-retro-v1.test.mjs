import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Page Wandoos « ordinateur rétro » (Norman, 2026-10-06), puis (2026-10-07) :
 *  - énergie et magie placées en QUANTITÉS (saisie, 0 − + MAX) ;
 *  - ÉCRAN D'ALLUMAGE (nom de l'OS, courte barre) affiché une seule fois par Rebirth ;
 *  - CHARGEMENT de l'OS = le vrai démarrage du wiki, montré dans un cadre à part (style différent des barres à remplir) ; on peut déjà placer de l'énergie et de la magie pendant ce
 *    chargement (elles prennent de la vitesse avec lui, le moteur applique la rampe) ;
 *  - choix de l'OS parmi ceux débloqués.
 */
const src = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
const stockage = {};
const noeuds = [];
const ecouteurs = {};
let contextesCrees = 0;
const fauxContexte = () => ({
  state: "running", sampleRate: 8000, currentTime: 0, destination: {},
  createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
  createBufferSource: () => { const n = { type: "src", connect() {}, start() {} }; noeuds.push(n); return n; },
  createBiquadFilter: () => { const n = { type: "", frequency: {}, Q: {}, connect() {} }; noeuds.push(n); return n; },
  createGain: () => { const n = { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; noeuds.push(n); return n; },
  createOscillator: () => { const n = { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; noeuds.push(n); return n; },
  resume() {}
});
let volume = 0.75;
const poste = { dataset: {}, outerHTML: "", setAttribute(k, v) { poste.dataset[k.replace("data-", "")] = v; } };
const nomCouleur = { textContent: "" };
let maintenant = 1_000_000;
const minuteries = [];
const actions = [];
let joueurCourant = null;
const fenetre = {
  localStorage: { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); } },
  AudioContext: function () { contextesCrees += 1; return fauxContexte(); },
  __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
  __actionMetaIdleV130__: (payload) => { actions.push(JSON.parse(JSON.stringify(payload))); },
  __SOREAL_IDLE_META_HOST_V130__: {
    idleHtml_: (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    formatGrandNombreIdleV70_: (v) => { const n = Math.floor(Number(v) || 0); return n >= 1e6 ? (n / 1e6) + "M" : n >= 1e3 ? (n / 1e3) + "K" : String(n); },
    entetePageIdleV28_: (t) => "<h1>" + t + "</h1>",
    getIdleEtat: () => joueurCourant
  },
  __SOREAL_IDLE_META_V130__: { systemeMetaParIdIdleV130_: (j, id) => j.systems.find((x) => x.id === id) || null },
  setInterval: (fn) => { minuteries.push(fn); return minuteries.length; },
  clearInterval: () => {},
  Date: { now: () => maintenant }
};
fenetre.window = fenetre;
fenetre.document = {
  getElementById: () => null, head: { appendChild() {} }, createElement: () => ({}),
  querySelector: (sel) => (sel === ".wd-poste" ? poste : sel === ".wd-nomcouleur" ? nomCouleur : null),
  addEventListener: (nom, fn) => { (ecouteurs[nom] = ecouteurs[nom] || []).push(fn); }
};
vm.runInNewContext(src, Object.assign(fenetre, { localStorage: fenetre.localStorage }), { filename: "wandoos-retro-v1.js" });
const W = fenetre.__SOREAL_IDLE_WANDOOS_V1__;
assert.ok(W && typeof W.page === "function", "module exposé");

const CLE_ALLUMAGE = "soreal_idle_wandoos_allumage_v1";
const vueBase = { os: "98", osDisponibles: ["98"], exigence: 1e9, niveauOsTotal: 7, multiplicateurOs: 8, vitesseEnergie: 0.5, vitesseMagie: 0, bootSecondes: 3600, bootEcoule: 3600, bootFraction: 1, runId: 111, bonusCombat: 1.5, energieLibre: 1e6, magieLibre: 2e6 };
function joueur(debloque, actif, vue = {}, magieOk = true) {
  return {
    systems: [
      { id: "wandoos", name: "Wandoos", icon: "💻", unlock: { unlocked: debloque }, state: { active: actif, level: 1234, allocation: { energy: 600, magic: 0 }, data: { os: "98", dumpEnergyLevel: 812, dumpMagicLevel: 422, dumpEnergyProgress: 0.63, dumpMagicProgress: 0.25 } } },
      { id: "bloodMagic", unlock: { unlocked: magieOk } }
    ],
    systemes: { wandoosView: Object.assign({}, vueBase, vue) }
  };
}
const dejaAllume = () => { stockage[CLE_ALLUMAGE] = "111"; };
const CLE_SAISIE = "soreal_idle_wandoos_saisie_v1";
const saisir = (v) => { stockage[CLE_SAISIE] = String(v); };

// Anti-spoil : rien tant que le système n'est pas découvert.
assert.equal(W.page(joueur(false, true)), "", "système verrouillé : aucune page");

// 1. Éteint : écran noir, logo, DÉMARRER ; pas de barres ni de touches d'allocation.
joueurCourant = joueur(true, false);
let h = W.page(joueurCourant);
assert.ok(h.includes('data-phase="eteint"') && h.includes("ORDINATEUR ÉTEINT") && h.includes("wd-logo"), "écran éteint avec logo");
assert.ok(h.includes("DÉMARRER") && h.includes("window.__SOREAL_IDLE_WANDOOS_V1__.demarrer()"), "touche DÉMARRER");
assert.ok(!h.includes("wd-barre") && !h.includes("wd-input") && !h.includes(".place("), "éteint : pas de barres, de saisie ni de touches d'allocation");
assert.ok(h.includes("il met 1 h 00 min à charger"), "la vraie durée du chargement est annoncée");
assert.ok(!h.includes("vieux PC"), "plus de phrase inventée sur le vieux PC");
assert.ok(!h.includes("Choisis ton système"), "un seul OS : pas de choix à proposer");
assert.ok(!/MEH|XL/.test(h.replace(/Wandoos/g, "")), "anti-spoil : MEH et XL absents tant qu'ils ne sont pas débloqués");

// 2. Allumage : l'écran d'accueil de l'OS, court, UNE seule fois par Rebirth.
delete stockage[CLE_ALLUMAGE];
joueurCourant = joueur(true, true);
h = W.page(joueurCourant);
assert.ok(h.includes('data-phase="allumage"') && h.includes("wd-barre-boot") && h.includes("Wandoos <b>98</b>"), "premier affichage du Rebirth : écran d'allumage avec nom de l'OS et barre");
assert.ok(!h.includes("wd-input") && !h.includes(".place(") && !h.includes("PLACÉE"), "pendant l'allumage : pas encore de barres d'énergie et de magie");
assert.equal(stockage[CLE_ALLUMAGE], "111", "le Rebirth est mémorisé dès l'allumage (un rechargement de page ne le rejoue pas)");
assert.ok(W.dureesAllumage["98"] < W.dureesAllumage.meh && W.dureesAllumage.meh < W.dureesAllumage.xl, "plus l'OS est récent, plus l'allumage est long");
assert.ok(Math.max(...Object.values(W.dureesAllumage)) <= 5000, "allumage court (au plus 5 s)");
maintenant += 1000;
assert.ok(/id="wd-boot-pct">(3|4)\d%/.test(W.page(joueurCourant)), "la barre d'allumage avance");
maintenant += 5000;
minuteries.forEach((fn) => fn());
assert.ok(poste.outerHTML.includes('data-phase="bureau"'), "l'allumage fini, le bureau s'affiche");
h = W.page(joueurCourant);
assert.ok(h.includes('data-phase="bureau"') && !h.includes("data-phase=\"allumage\""), "le même Rebirth : jamais de second allumage");
joueurCourant = joueur(true, true, { runId: 222 });
assert.ok(W.page(joueurCourant).includes('data-phase="allumage"'), "nouveau Rebirth : l'allumage revient une fois");
maintenant += 6000;
minuteries.forEach((fn) => fn());

// 3. Bureau (OS chargé) : barres, quantités, saisie, touches 0 − + MAX pour l'énergie et la magie.
dejaAllume();
joueurCourant = joueur(true, true);
h = W.page(joueurCourant);
assert.ok(h.includes('data-phase="bureau"') && h.includes("EN MARCHE") && h.includes("wd-clavier"), "bureau");
assert.ok(h.includes("NIVEAU <b>812</b>") && h.includes("NIVEAU <b>422</b>"), "niveaux des deux Dumps");
assert.ok(h.includes("PLACÉE") && h.includes("LIBRE") && h.includes("1M") && h.includes("2M") && h.includes("0,5"), "quantités placées/libres et vitesse en niveaux par seconde");
assert.ok(!h.includes("wd-chargement") && !h.includes("CHARGEMENT"), "OS chargé : aucun cadre de chargement");
assert.ok(h.includes('id="wd-saisie"') && h.includes("C:\\&gt; SAISIE"), "champ de saisie dans l'écran");
assert.ok(/<input id="wd-saisie"[^>]*readonly[^>]*inputmode="none"/.test(h) && !h.includes("oninput"), "saisie en lecture seule : on la remplit avec les touches du clavier (pas de clavier du téléphone)");
for (const c of "0123456789/") assert.ok(h.includes(".chiffre('" + c + "')"), "touche " + c);
assert.ok(h.includes("wd-effacer") && h.includes("EFFACER") && !h.includes(".effacer()"), "touche EFFACER (gérée par appui prolongé, pas par un simple clic)");
for (const [res, mode] of [["energy", "zero"], ["energy", "moins"], ["energy", "plus"], ["energy", "tout"], ["magic", "zero"], ["magic", "moins"], ["magic", "plus"], ["magic", "tout"]]) {
  assert.ok(h.includes(".place('" + res + "','" + mode + "')"), "touche " + res + " " + mode);
}
assert.ok(h.includes("ÉTEINDRE") && h.includes(".eteindre()"), "touche espace : éteindre quand en marche");
assert.ok(!h.includes("AIDE :") && !h.includes("wd-aide"), "plus de texte d'aide sous la saisie (Norman, 2026-10-07)");
assert.ok(h.includes('data-couleur="vert"'), "vert par défaut");
assert.ok(!/<script|onerror=|javascript:/i.test(h), "rien d'exécutable dans les données");
const sansMagie = W.page(joueur(true, true, {}, false));
assert.ok(!sansMagie.includes("MAGIE") && !sansMagie.includes(".place('magic'"), "anti-spoil : pas de magie avant Blood Magic");

// 4. CHARGEMENT de l'OS (vrai démarrage du wiki) : cadre à part, style différent des barres à remplir ; on peut déjà placer de l'énergie.
joueurCourant = joueur(true, true, { bootSecondes: 3600, bootEcoule: 1800, bootFraction: 0.5 });
h = W.page(joueurCourant);
assert.ok(h.includes('class="wd-chargement"') && h.includes("⏳ CHARGEMENT DE L’OS") && h.includes('id="wd-ch-pct">50 %'), "cadre de chargement avec le pourcentage");
assert.ok(h.includes('class="wd-chargeur"') && !h.includes('class="wd-chargeur wd-barre"'), "barre de chargement d'une autre classe que les barres de dump");
assert.ok(h.includes("Vitesse de Wandoos : <b id=\"wd-ch-vit\">50 %</b> de son maximum") && h.includes("<b id=\"wd-ch-reste\">30 min 00 s</b>"), "vitesse actuelle et temps restant");
assert.ok(!h.includes("Ce n’est pas une barre à remplir"), "plus de phrase « ce n'est pas une barre à remplir »");
assert.ok(!h.includes("Tu peux déjà placer") && !h.includes("wd-ch-note"), "le cadre de chargement ne contient aucune phrase explicative (Norman, 2026-10-07)");
assert.ok(h.includes("wd-input") && h.includes(".place('energy','plus')") && h.includes("PLACÉE"), "pendant le chargement : l'énergie et la magie se placent déjà (barres du bureau visibles)");
maintenant += 600_000;
const plusTard = W.page(joueurCourant);
assert.ok(plusTard.includes('id="wd-ch-pct">66 %') && plusTard.includes("20 min 00 s"), "dix minutes plus tard : 66 %, il reste 20 min");
// Le minuteur met à jour le cadre ; à la fin du chargement le cadre disparaît (le poste est redessiné sans lui).
joueurCourant = joueur(true, true);
minuteries.forEach((fn) => fn()); // les minuteurs précédents s'arrêtent d'eux-mêmes quand il n'y a plus rien à animer
minuteries.length = 0;
joueurCourant = joueur(true, true, { bootSecondes: 3600, bootEcoule: 3590, bootFraction: 3590 / 3600 });
W.page(joueurCourant);
assert.ok(minuteries.length >= 1, "un minuteur suit le chargement");
maintenant += 20_000;
minuteries.forEach((fn) => fn());
assert.ok(poste.outerHTML.includes('data-phase="bureau"') && !poste.outerHTML.includes("wd-chargement"), "chargement terminé : plus de cadre de chargement");

// 5. Placer : quantités ABSOLUES (plus de 100 possible), cumul immédiat sans attendre le serveur, y compris pendant le chargement.
joueurCourant = joueur(true, true, { bootSecondes: 3600, bootEcoule: 100, bootFraction: 100 / 3600 });
saisir("5000");
actions.length = 0;
W.place("energy", "plus");
assert.deepEqual(actions[0], { action: "allocate", system: "wandoos", resource: "energy", value: 5600 }, "600 déjà placés + 5000 saisis (au-delà de 100), pendant le chargement");
W.place("energy", "plus");
assert.equal(actions[1].value, 10600, "deux appuis rapprochés s'additionnent");
W.place("energy", "moins");
assert.equal(actions[2].value, 5600, "moins retire la quantité saisie");
W.place("energy", "tout");
assert.equal(actions[3].value, 1e6 + 600, "MAX place tout ce qui est libre");
W.place("energy", "zero");
assert.equal(actions[4].value, 0, "0 retire tout");
const nb = actions.length;
W.place("energy", "zero");
assert.equal(actions.length, nb, "déjà à zéro : rien n'est envoyé");
saisir("1/4");
W.place("magic", "plus");
assert.equal(actions[actions.length - 1].value, 500000, "fraction : un quart de (libre + placé) = 2 000 000 / 4");
saisir("999999999999");
W.place("magic", "plus");
assert.equal(actions[actions.length - 1].value, 2e6, "jamais plus que ce qui est libre");
// Pendant l'écran d'allumage, rien ne se place (quelques secondes seulement).
delete stockage[CLE_ALLUMAGE];
joueurCourant = joueur(true, true);
W.page(joueurCourant);
const avantAllumage = actions.length;
W.place("energy", "tout");
assert.equal(actions.length, avantAllumage, "pendant l'allumage : pas de placement");
maintenant += 6000;
minuteries.forEach((fn) => fn());

// 6. Saisie : nombres, suffixes et fractions.
assert.equal(W.analyser("1000", 0), 1000);
assert.equal(W.analyser("2,5k", 0), 2500);
assert.equal(W.analyser("3M", 0), 3e6);
assert.equal(W.analyser("1e3", 0), 1000);
assert.equal(W.analyser("1/4", 1000), 250, "un quart du total");
assert.equal(W.analyser("3/8", 800), 300);
assert.equal(W.analyser("1/0", 800), 0, "division par zéro : rien");
assert.equal(W.analyser("abc", 800), 0, "texte : rien");

// 6b. Pavé : chiffres, « / », effacement (un appui = un caractère ; maintenu = répétition), limites.
saisir("1000");
W.effacer();
assert.equal(stockage[CLE_SAISIE], "100", "effacer retire le dernier caractère");
W.chiffre("7"); W.chiffre("5");
assert.equal(stockage[CLE_SAISIE], "10075", "les chiffres s'ajoutent");
W.chiffre("/"); W.chiffre("/"); W.chiffre("4");
assert.equal(stockage[CLE_SAISIE], "10075/4", "un seul « / »");
saisir("0"); W.chiffre("8");
assert.equal(stockage[CLE_SAISIE], "8", "un 0 initial est remplacé par le chiffre tapé");
// Bug signalé : « si j'efface tout et que je mets 1 il commence à 10001 » -> une saisie VIDE reste vide (elle ne retombe pas sur la valeur par défaut).
saisir("1000");
for (let i = 0; i < 4; i++) W.effacer();
assert.equal(stockage[CLE_SAISIE], "", "tout effacé : la saisie est vide");
W.chiffre("1");
assert.equal(stockage[CLE_SAISIE], "1", "tout effacé puis 1 : la saisie vaut 1 (et non 10001)");
delete stockage[CLE_SAISIE];
W.chiffre("5");
assert.equal(stockage[CLE_SAISIE], "10005", "sans saisie mémorisée : on part de la valeur proposée (1000)");
saisir(""); W.chiffre("/");
assert.equal(stockage[CLE_SAISIE], "", "pas de « / » en premier");
saisir("123456789012345678"); W.chiffre("9");
assert.equal(stockage[CLE_SAISIE], "123456789012345678", "18 caractères au plus");
W.chiffre("x"); W.chiffre("12");
assert.equal(stockage[CLE_SAISIE], "123456789012345678", "rien d'autre que 0-9 et « / »");
// Maintenir EFFACER : un caractère tout de suite, puis un toutes les 70 ms après 0,4 s ; relâcher arrête.
minuteries.length = 0;
const delais = [];
fenetre.setTimeout = (fn, ms) => { delais.push({ fn, ms }); return delais.length; };
fenetre.clearTimeout = () => {};
saisir("123456");
W.debutEffacer();
assert.equal(stockage[CLE_SAISIE], "12345", "dès l'appui : un caractère effacé");
assert.equal(delais[0].ms, 400, "la répétition démarre après 0,4 s");
delais[0].fn();
assert.equal(minuteries.length, 1, "puis un minuteur répète l'effacement");
minuteries[0]();
minuteries[0]();
assert.equal(stockage[CLE_SAISIE], "123", "chaque tic efface un caractère de plus");
W.finEffacer();

// 7. DÉMARRER / ÉTEINDRE n'activent que le système.
dejaAllume();
joueurCourant = joueur(true, false);
actions.length = 0;
W.demarrer();
assert.deepEqual(actions[0], { action: "toggle", system: "wandoos", active: true }, "DÉMARRER active le système");
joueurCourant = joueur(true, true);
actions.length = 0;
W.eteindre();
assert.deepEqual(actions[0], { action: "toggle", system: "wandoos", active: false }, "ÉTEINDRE désactive le système");

// 8. Choix de l'OS : seulement les OS débloqués (liste du serveur), jamais plus ; confirmation si des niveaux de Dump seraient perdus.
const deux = W.page(joueur(true, false, { osDisponibles: ["98", "meh"] }));
assert.ok(deux.includes(".os('98')") && deux.includes(".os('meh')") && !deux.includes(".os('xl')"), "98 et MEH proposés, XL absent");
assert.ok(deux.includes("Choisis ton système"), "plusieurs OS : on invite à choisir");
joueurCourant = joueur(true, true, { osDisponibles: ["98", "xl"] });
actions.length = 0;
W.os("xl");
assert.equal(actions.length, 0, "des niveaux de Dump existent : première pression = confirmation");
assert.ok(W.page(joueurCourant).includes("CONFIRMER ?"), "la touche demande confirmation");
W.os("xl");
assert.deepEqual(actions[0], { action: "selectWandoosOs", os: "xl" }, "seconde pression : changement d'OS");
joueurCourant.systems[0].state.data.dumpEnergyLevel = 0;
joueurCourant.systems[0].state.data.dumpMagicLevel = 0;
actions.length = 0;
W.os("xl");
assert.deepEqual(actions[0], { action: "selectWandoosOs", os: "xl" }, "aucun niveau à perdre : direct");
W.os("meh");
assert.equal(actions.length, 1, "un OS qui n'est pas dans la liste débloquée est refusé côté page");

// 9. Couleurs : vert -> bleu -> orange -> blanc -> vert, mémorisées.
assert.deepEqual(Array.from(W.couleurs), ["vert", "bleu", "orange", "blanc"]);
const vues = [];
for (let i = 0; i < 4; i++) { W.couleur(); vues.push(poste.dataset.couleur); }
assert.deepEqual(vues, ["bleu", "orange", "blanc", "vert"]);
W.couleur();
assert.equal(stockage.soreal_idle_wandoos_couleur_v1, "bleu", "couleur mémorisée");
assert.ok(W.page(joueur(true, true)).includes('data-couleur="bleu"'), "la page se redessine dans la couleur choisie");
assert.equal(nomCouleur.textContent, "BLEU");

// 10. Son : un clic de clavier au volume des sons de l'interface ; rien à volume 0.
volume = 0;
assert.equal(W.son(false, false), false, "volume à 0 : pas de son");
assert.equal(contextesCrees, 0, "volume à 0 : même pas de contexte audio");
volume = 0.75;
const avant = noeuds.length;
assert.equal(W.son(false, false), true, "volume normal : la touche claque");
assert.ok(noeuds.length - avant >= 5, "claquement + « thock » construits");
const apres = noeuds.length;
assert.equal(W.son(true, true), true, "relâchement");
assert.ok(noeuds.length - apres >= 4 && noeuds.length - apres < 8, "le relâchement est plus bref (sans « thock »)");
assert.ok(ecouteurs.pointerdown && ecouteurs.pointerup, "le son s'attache à l'appui et au relâchement des touches");

// 11. Branchements et style.
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/wandoos-retro-v1\.js\?v=\d+/.test(index), "module chargé par la page");
assert.ok(index.indexOf("wandoos-retro-v1.js") > index.indexOf("meta-progression-v130.js"), "chargé après la page générique");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("id==='wandoos'&&window.__SOREAL_IDLE_WANDOOS_V1__"), "la page générique délègue à la page rétro");
assert.ok(src.includes("/api/idle/media/banner?name=wandoos.webp"), "l'écran est celui de idle/banners/wandoos.webp");
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(src), "rien n'est envoyé");
assert.ok(!src.includes("__ajusterAllocationMetaIdleV130__"), "plus d'allocation en pourcentage (bornée à 100)");
assert.ok(src.includes(".wd-chargeur i{") && src.includes("#ffb000") && src.includes("wd-defile"), "cadre de chargement ambre à rayures qui défilent, différent des barres à blocs");
assert.ok(src.includes("prefers-reduced-motion:reduce){.wd-chargeur i{animation:none;}"), "rayures immobiles si l'appareil demande moins d'animations");
assert.ok(src.includes(".wd-crt::after{") && /\.wd-crt::after\{[^}]*pointer-events:none[^}]*border-image:url/.test(src) && !/\.wd-crt\{[^}]*border-image/.test(src), "l'image du moniteur est posée PAR-DESSUS l'écran, sans intercepter un clic");
assert.ok(src.includes(".wd-ecran{position:relative;z-index:1;"), "l'écran est sous l'image");
assert.ok(src.includes(".wd-titre{margin-top:2.2cqw;"), "le titre (Wandoos 98 / EN MARCHE) est descendu pour ne pas passer sous le bord de l'écran");
assert.ok(/\.wd-input\.wd-input\{[^}]*font-family:"Courier New",Courier,monospace!important/.test(src), "la saisie a la police de l'écran");

console.log("idle-wandoos-retro-v1: OK");
