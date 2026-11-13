import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { lireUiComplet } from "./_ui-sources.mjs";
import { choisirCleTitanR2_ } from "../src/idle-media-v1.js";

/*
 * Cache-cache de Walderp « comme dans le vrai jeu » (Norman, 2026-11-13). Wiki NGU Idle, page Walderp : « he will hide in a random UI. You will have 3
 * minutes to find him as he becomes more visible in the screen he is hiding in, as he starts out nearly invisible each 3 minute cycle. [...] After 3
 * minutes he will reset his visibility and change menus. » Le vrai module (modules/walderp-cachette-v1.js) est exécuté sur un faux navigateur.
 */
const lire = (chemin) => readFileSync(new URL(chemin, import.meta.url), "utf8");
const source = lire("../public/modules/walderp-cachette-v1.js");

/* --- faux navigateur minimal --- */
function fauxNavigateur() {
  const minuteries = [];
  const creer = (tag) => {
    const el = {
      tagName: String(tag).toUpperCase(), children: [], style: {}, attributs: {}, hidden: false, isConnected: false, ecouteurs: {}, animations: [],
      setAttribute(k, v) { this.attributs[k] = String(v); },
      addEventListener(type, f) { this.ecouteurs[type] = f; },
      appendChild(e) { this.children.push(e); e.isConnected = true; return e; },
      get firstChild() { return this.children[0] || null; },
      set textContent(v) { this.children = []; this.texte = String(v); },
      get textContent() { return this.texte || ""; },
      animate(images, options) { const a = { images, options, currentTime: 0, annulee: false, cancel() { this.annulee = true; } }; this.animations.push(a); return a; },
    };
    return el;
  };
  const document = {
    hidden: false, head: creer("head"), body: creer("body"), ecouteurs: {},
    createElement: creer,
    getElementById(id) { return this.head.children.find((e) => e.id === id) || null; },
    addEventListener(type, f) { this.ecouteurs[type] = f; },
  };
  const window = { document };
  const contexte = vm.createContext({
    window, document, Math, Number, String, Array, Date, encodeURIComponent, Promise,
    setTimeout: (f, ms) => { minuteries.push({ f, ms }); return minuteries.length; },
    clearTimeout: (n) => { if (minuteries[n - 1]) minuteries[n - 1].annulee = true; },
  });
  vm.runInContext(source, contexte);
  return { window, document, minuteries, api: window.__SOREAL_IDLE_WALDERP_CACHETTE_V1__ };
}

const { api } = fauxNavigateur();
assert.ok(api, "le module s'expose");
assert.equal(api.CYCLE_MS, 180000, "cycle de 3 minutes du wiki (valeur de repli)");

/* --- cycle de 3 minutes --- */
{
  const c = api.cycleEnCours(1000, 180000, 1000 + 2 * 180000 + 5);
  assert.deepEqual({ ...c }, { numero: 2, debut: 1000 + 2 * 180000, duree: 180000 });
  assert.equal(api.cycleEnCours(1000, 180000, 500).numero, 0, "jamais de cycle négatif (horloge en avance)");
  assert.equal(api.cycleEnCours(1000, 0, 1000).duree, 180000, "durée absente : 3 minutes");
}

/* --- visibilité : presque invisible au début de chaque cycle, puis de plus en plus visible --- */
{
  assert.ok(api.opacite(0, 180000) <= 0.05, "presque invisible au début du cycle");
  assert.equal(api.opacite(180000, 180000), 1, "bien visible à la fin");
  let avant = -1;
  for (let ms = 0; ms <= 180000; ms += 9000) { const o = api.opacite(ms, 180000); assert.ok(o > avant, "la visibilité ne fait que monter"); avant = o; }
}

/* --- menu du cycle : déterministe, change à chaque cycle, tous les menus possibles, jamais hors de la liste --- */
{
  const menus = ["entrainement", "combat", "aventure", "renaissance", "moneyPit", "augmentations", "machine", "sang", "chroniques", "parametres"];
  const vus = new Set();
  for (const graine of [0, 1, 7, 123456789, 2147483646]) {
    let precedent = "";
    for (let k = 0; k < 400; k++) {
      const m = api.menuDuCycle(graine, k, menus);
      assert.ok(menus.includes(m), "toujours un menu ouvert au joueur");
      assert.equal(m, api.menuDuCycle(graine, k, menus), "même graine, même cycle : même menu (tous les appareils du compte)");
      assert.notEqual(m, precedent, "« change menus » : jamais deux cycles de suite au même endroit");
      precedent = m; vus.add(m);
    }
  }
  assert.equal(vus.size, menus.length, "il peut se cacher dans n'importe quel menu ouvert");
  assert.equal(api.menuDuCycle(5, 3, []), "", "aucun menu : rien");
  assert.equal(api.menuDuCycle(5, 3, ["combat"]), "combat", "un seul menu : celui-là");
  for (let k = 0; k < 50; k++) assert.notEqual(api.menuDuCycle(9, k, ["a", "b"]), api.menuDuCycle(9, k + 1, ["a", "b"]), "deux menus : il alterne");
  for (let k = 0; k < 200; k++) {
    const p = api.placeDuCycle(42, k);
    assert.ok(p.gauche >= 5 && p.gauche <= 88 && p.haut >= 24 && p.haut <= 78, "l'image reste dans l'écran, sous le bandeau du haut");
  }
}

/* --- le vrai module : image seulement dans le bon menu, aucun texte, clic = débusquer, changement de menu à la fin du cycle --- */
{
  const nav = fauxNavigateur();
  const MENUS = [{ id: "entrainement" }, { id: "combat" }, { id: "aventure" }, { id: "hacks" }, { id: "parametres" }, { id: "admin" }];
  const ouverts = ["entrainement", "combat", "aventure", "parametres"];
  let maintenant = 10_000;
  const etat = { titans: [{ id: "t5", hideCycleMs: 180000, state: { kills: 2, hiddenPanel: "menu", hiddenSince: 10_000, hiddenSeed: 777 } }] };
  const REG = { IDLE_MENUS_V1: MENUS, idleEtat: {}, idleMenuActifV28: "", menuDisponibleIdleV28_: (id) => id === "admin" || ouverts.includes(id) };
  nav.window.__SOREAL_IDLE_REG__ = REG;
  nav.window.__SOREAL_IDLE_META_HOST_V130__ = { aventureMetaIdleV47_: () => etat };
  nav.window.__SOREAL_IDLE_HEURE_V1__ = () => maintenant;
  let debusques = 0;
  nav.window.__trouverWalderpIdleV147__ = () => { debusques++; };

  const s0 = nav.api.situation(REG.idleEtat, maintenant);
  assert.ok(ouverts.includes(s0.menu), "jamais un menu fermé au joueur (hacks) ni l'outil d'administration");
  for (let k = 0; k < 300; k++) assert.ok(ouverts.includes(nav.api.situation(REG.idleEtat, 10_000 + k * 180000).menu));

  /* ailleurs : rien à l'écran */
  REG.idleMenuActifV28 = ouverts.find((m) => m !== s0.menu);
  nav.api.mettreAJour();
  const bouton = () => nav.document.body.children[0];
  assert.ok(!bouton() || bouton().hidden, "dans un autre menu : aucune image, aucun indice");

  /* dans le bon menu : l'image, presque invisible, puis de plus en plus visible */
  REG.idleMenuActifV28 = s0.menu;
  nav.api.mettreAJour();
  assert.ok(bouton() && !bouton().hidden, "dans le bon menu : l'image est là");
  assert.equal(nav.document.body.children.length, 1, "un seul nœud, accroché à <body> (hors de la page redessinée)");
  const img = bouton().children[0];
  assert.match(img.src, /\/api\/idle\/media\/titan\?id=t5&sprite=menu$/, "le sprite « dans les menus » du wiki");
  assert.equal(bouton().textContent, "", "aucun texte");
  const anim = bouton().animations[0];
  assert.equal(anim.options.duration, 180000);
  assert.ok(anim.images[0].opacity <= 0.05 && anim.images[1].opacity === 1);
  assert.equal(anim.currentTime, 0);
  maintenant += 90_000;
  nav.api.mettreAJour();
  assert.equal(bouton().animations.length, 1, "un redessin ne relance pas l'animation");
  assert.equal(anim.currentTime, 90_000, "la visibilité suit le temps réel du cycle");

  /* image absente : image de la forme en cours, puis un fantôme (jamais une cachette vide) */
  img.onerror();
  assert.match(img.src, /id=t5&form=2$/);
  img.onerror();
  assert.equal(bouton().children[0].textContent, "👻");

  /* clic = action titanFound de l'interface */
  bouton().ecouteurs.click();
  assert.equal(debusques, 1);

  /* fin du cycle : une minuterie attend ce moment, puis il change de menu et redevient presque invisible */
  const attente = nav.minuteries.filter((m) => !m.annulee);
  assert.equal(attente.length, 1, "une seule minuterie en attente");
  assert.ok(attente[0].ms >= 90_000 && attente[0].ms <= 90_100, "elle tombe à la fin du cycle de 3 minutes");
  maintenant = 10_000 + 180_000 + 1;
  attente[0].annulee = true; /* elle se déclenche : elle n'est plus en attente */
  attente[0].f();
  const s1 = nav.api.situation(REG.idleEtat, maintenant);
  assert.notEqual(s1.menu, s0.menu, "il a changé de menu");
  assert.ok(bouton().hidden, "il n'est plus dans ce menu");
  REG.idleMenuActifV28 = s1.menu;
  nav.api.mettreAJour();
  assert.ok(!bouton().hidden);
  assert.equal(bouton().animations.length, 2, "nouveau cycle : la visibilité repart de presque rien");
  assert.equal(bouton().animations[1].currentTime, 1);

  /* débusqué : plus d'image, plus de minuterie */
  etat.titans[0].state = { kills: 2, hiddenPanel: "", hiddenSince: 0, hiddenSeed: 0, nextAt: maintenant + 3 * 3600000 };
  nav.api.mettreAJour();
  assert.ok(bouton().hidden);
  assert.equal(nav.minuteries.filter((m) => !m.annulee).length, 0, "aucune minuterie quand il n'est pas caché");
}

/* --- l'interface : plus aucun indice, module chargé, menus réels --- */
{
  const ui = lireUiComplet();
  for (const interdit of ["Walderp se cache", "Le débusquer", "IDLE_WALDERP_PANEL_LABELS_V147", "soreal-idle-walderp-hide-v147"]) {
    assert.ok(!ui.includes(interdit), "plus de bandeau ni d'indice dans l'interface : " + interdit);
  }
  assert.ok(!lire("../public/soreal-idle-ui.css").includes("walderp-hide"), "styles du bandeau retirés");
  assert.ok(!lire("../public/modules/titans-v1.js").includes("MENUS_WALDERP"), "plus de noms de menus de cachette dans la page Titans");
  assert.match(lire("../public/index.html"), /<script defer src="\/modules\/walderp-cachette-v1\.js\?v=\d+"><\/script>/, "module chargé par la page");
  assert.ok(source.includes("menuDisponibleIdleV28_") && source.includes("IDLE_MENUS_V1"), "les cachettes sont les menus réellement ouverts au joueur");
  assert.ok(source.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "remis à jour après chaque redessin (règle n°4)");
  assert.ok(!/setInterval/.test(source), "aucune boucle : une seule minuterie, à la fin du cycle");
}

/* --- image : le sprite « dans les menus », jamais une image de combat à sa place --- */
{
  const cles = ["idle/Titans/t5_form1.png", "idle/Titans/t5_form5.png", "idle/Titans/Titan_WalderpFull.png", "idle/Titans/Titan_GreasyNerd_Bucket.png"];
  assert.equal(choisirCleTitanR2_(cles, "t5", "", -1, "menu"), "idle/Titans/Titan_WalderpFull.png");
  assert.equal(choisirCleTitanR2_([...cles, "idle/Titans/t5_menu.webp"], "t5", "", -1, "menu"), "idle/Titans/t5_menu.webp", "nom canonique prioritaire");
  assert.equal(choisirCleTitanR2_(["idle/Titans/t5_form1.png"], "t5", "", -1, "menu"), "", "sans sprite : rien (l'interface se replie)");
  assert.equal(choisirCleTitanR2_(cles, "t5", "", 4), "idle/Titans/t5_form5.png", "les images de combat ne changent pas");
}

console.log("idle-walderp-cachette-v1: OK");
