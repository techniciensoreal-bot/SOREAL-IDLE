/*
 * Banc d'essai « le bandeau se déploie par-dessus la page et ne la pousse jamais » (Norman, 2026-10-29).
 * Partie avec TROIS ressources visibles (énergie, magie, 3e ressource, toutes pleines : « 100 / 100 ») ; pour CHAQUE page du jeu : l'énergie disparaît puis revient, la magie disparaît puis revient, la 3e ressource disparaît puis revient.
 * À chaque livraison du ResizeObserver du bandeau (donc APRÈS sa compensation, ce qui est peint) et toutes les 30 ms, on mesure de combien bougent : les cases de chiffres (attaque, défense, or…), le menu et 12 éléments de la page.
 *
 * Lancer :
 *   1. PARTIE_B=1 PORT=8831 PARTIE_B_OPTIONS='{"boss":150,"energieCap":100,"energie":100,"magieCap":100,"magie":100}' node cloudflare/tools/local-dev-server.mjs
 *   2. http://localhost:8831/ ; console : sessionStorage.setItem('soreal_idle_session_v1','local'); location.reload()
 *   3. coller ce fichier ; puis, deux pages à la fois (la console coupe à 45 s) : window.__defile=0; await __banc(1); await __banc(2) ...   (0 à 19 ; __defile=300 : page défilée)
 * Attendu : « pire » = { t: 0, m: 0, c <= 0.02 } (t = chiffres, m = menu, c = contenu ; 0,02 px = une unité de mise en page). Une page dont le contenu bouge seul (ex. Trou sans fond : ~9 px d'animation) se repère en mesurant 6 s SANS rien changer.
 */
window.__banc = async function (idx) {
  const R = window.__SOREAL_IDLE_REG__; const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const rendre = () => { try { R.rendreIdleEtat_({ ok: true, joueur: R.idleEtat }); } catch (e) { window.__err = String(e); } };
  const boutons = [...document.querySelectorAll('.soreal-idle-nav-v28 button')];
  const nomMenu = (boutons[idx].getAttribute('title') || boutons[idx].textContent || '').toString().trim().slice(0, 22);
  boutons[idx].click(); await attendre(1500);
  const original = window.__SOREAL_IDLE_DISPONIBLE_V2__; const dispo = { energie: 100, magie: 100 };
  window.__SOREAL_IDLE_DISPONIBLE_V2__ = function () { return { energie: dispo.energie, magie: dispo.magie, magieEnCours: false }; };
  const poserR3 = (v) => { try { const r = R.idleEtat.systemes.resources.r3; r.current = v; r.cap = 100; } catch (e) { /* état pas prêt */ } };
  let r3 = 100; const imposer = setInterval(() => poserR3(r3), 30);
  window.scrollTo(0, 0); await attendre(100); rendre(); await attendre(2500); window.scrollTo(0, window.__defile || 0); await attendre(400);
  const racine = document.querySelector('.soreal-idle-page-root-v28'); const hud = document.getElementById('sorealIdleHudV2'); const nav = document.querySelector('.soreal-idle-nav-v28');
  const tuiles = [...hud.querySelectorAll('.soreal-idle-summary-grid-v28, .soreal-idle-summary-grid-v28 > *')];
  const contenu = [...racine.querySelectorAll('h1,h2,h3,button,section,article,div')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 12 && r.width > 40 && !e.closest('#sorealIdleHudV2') && !e.closest('.soreal-idle-nav-v28') && r.top > 150 && r.top < innerHeight - 20; }).slice(0, 12);
  const pos = (e) => { const r = e.getBoundingClientRect(); return [r.top, r.left, r.height]; };
  const bT = tuiles.map(pos), bC = contenu.map(pos), bN = pos(nav); let etape = 'depart'; const res = {};
  const noter = () => {
    const r = res[etape] || (res[etape] = { tuiles: 0, contenu: 0, menu: 0, pan: new Set() });
    r.pan.add(hud.querySelectorAll('.soreal-idle-energy-panel-v34:not(.soreal-idle-vide-v2)').length);
    tuiles.forEach((e, i) => { if (!e.isConnected) return; const p = pos(e); r.tuiles = Math.max(r.tuiles, Math.abs(p[0] - bT[i][0]), Math.abs(p[2] - bT[i][2]), Math.abs(p[1] - bT[i][1])); });
    contenu.forEach((e, i) => { if (!e.isConnected) return; const p = pos(e); r.contenu = Math.max(r.contenu, Math.abs(p[0] - bC[i][0]), Math.abs(p[1] - bC[i][1])); });
    const pn = pos(nav); r.menu = Math.max(r.menu, Math.abs(pn[0] - bN[0]), Math.abs(pn[2] - bN[2]));
  };
  const ro = new ResizeObserver(noter); ro.observe(hud); const tic = setInterval(noter, 30);
  const pas = async (nom, f, ms) => { etape = nom; f(); await attendre(ms); };
  await pas('energie-', () => { dispo.energie = 0; }, 2100); await pas('energie+', () => { dispo.energie = 100; }, 1500);
  await pas('magie-', () => { dispo.magie = 0; }, 2100); await pas('magie+', () => { dispo.magie = 100; }, 1500);
  await pas('r3-', () => { r3 = 0; clearInterval(imposer); poserR3(0); rendre(); }, 1500);
  const imposer2 = setInterval(() => poserR3(r3), 30);
  await pas('r3+', () => { r3 = 100; poserR3(100); rendre(); }, 1500);
  ro.disconnect(); clearInterval(tic); clearInterval(imposer2); window.__SOREAL_IDLE_DISPONIBLE_V2__ = original;
  const pire = { t: 0, c: 0, m: 0 };
  for (const k in res) { const r = res[k]; ['tuiles', 'contenu', 'menu'].forEach((c) => { r[c] = +r[c].toFixed(2); }); pire.t = Math.max(pire.t, r.tuiles); pire.c = Math.max(pire.c, r.contenu); pire.m = Math.max(pire.m, r.menu); }
  return JSON.stringify({ menu: nomMenu, pire, barres: Object.fromEntries(Object.entries(res).map(([k, v]) => [k, [...v.pan].join('/')])) });
};
