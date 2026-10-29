/*
 * Banc d'essai « les barres du bandeau partent sans jamais faire bouger la page » (Norman, 2026-10-29).
 * Une partie avec TROIS ressources visibles (énergie, magie, 3e ressource) ; elles disparaissent une à une (3e ressource, puis énergie, puis magie) ; on mesure, à chaque livraison du ResizeObserver du bandeau
 * (donc APRÈS la compensation, ce qui est peint) et toutes les 30 ms, de combien bougent 6 éléments de la page, et le défilement.
 *
 * Lancer :
 *   1. PARTIE_B=1 PORT=8831 PARTIE_B_OPTIONS='{"boss":150,"energieCap":1e9,"energie":1e8,"magieCap":1e9,"magie":1e8}' node cloudflare/tools/local-dev-server.mjs
 *      (boss 150 : la magie est débloquée ; la 3e ressource est imposée par ce script dans l'état du client)
 *   2. ouvrir http://localhost:8831/ ; console : sessionStorage.setItem('soreal_idle_session_v1','local'); location.reload()
 *   3. coller ce fichier dans la console, puis : await __banc(0)   (en haut de page)   et   await __banc(300)   (page défilée)
 *      téléphone : outils de développement, mode mobile (375 px), recharger, même commande.
 * Attendu : maxDecalage <= 0.1 px dans toutes les étapes, partout ; défilé, le défilement recule (la réserve est retirée d'un coup, sans que le contenu bouge) ; en haut, le défilement reste à 0.
 */
window.__banc = async function (defile) {
  const R = window.__SOREAL_IDLE_REG__; const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  const rendre = () => { try { R.rendreIdleEtat_({ ok: true, joueur: R.idleEtat }); } catch (e) { window.__err = String(e); } };
  const original = window.__SOREAL_IDLE_DISPONIBLE_V2__; const dispo = { energie: 1e8, magie: 1e8 };
  let r3 = 50; const imposer = setInterval(() => { try { R.idleEtat.systemes.resources.r3.current = r3; } catch (e) { /* état pas prêt */ } }, 30);
  window.scrollTo(0, 0); await attendre(200); rendre(); await attendre(6500);
  window.scrollTo(0, defile); await attendre(1200);
  const racine = document.querySelector('.soreal-idle-page-root-v28');
  const els = [...racine.querySelectorAll('h1,h2,h3,button,section,article,div')].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 20 && r.width > 60 && !e.closest('#sorealIdleHudV2') && !e.closest('.soreal-idle-nav-v28') && r.top > 200 && r.top < innerHeight; }).slice(0, 6);
  const base = els.map((e) => e.getBoundingClientRect().top); let etape = 'depart'; const res = {}; const sy0 = scrollY;
  const hud = document.getElementById('sorealIdleHudV2');
  const noter = () => { const r = res[etape] || (res[etape] = { livraisons: 0, maxDecalage: 0, sy: [1e9, -1e9] }); els.forEach((e, i) => { if (e.isConnected) r.maxDecalage = Math.max(r.maxDecalage, Math.abs(e.getBoundingClientRect().top - base[i])); }); r.sy[0] = Math.min(r.sy[0], scrollY); r.sy[1] = Math.max(r.sy[1], scrollY); return r; };
  const ro = new ResizeObserver(() => { noter().livraisons++; }); ro.observe(hud);
  const tic = setInterval(noter, 30);
  await attendre(800);
  etape = 'r3 a zero'; r3 = 0; clearInterval(imposer); R.idleEtat.systemes.resources.r3.current = 0; rendre(); await attendre(5500);
  window.__SOREAL_IDLE_DISPONIBLE_V2__ = function () { return { energie: dispo.energie, magie: dispo.magie, magieEnCours: false }; };
  etape = 'energie vide'; dispo.energie = 0; await attendre(5500);
  etape = 'magie vide'; dispo.magie = 0; await attendre(5500);
  ro.disconnect(); clearInterval(tic); window.__SOREAL_IDLE_DISPONIBLE_V2__ = original;
  for (const k in res) res[k].maxDecalage = +res[k].maxDecalage.toFixed(2);
  const rs = document.getElementById('sorealIdleHudReserveV2');
  return JSON.stringify({ defile, sy0, res, syFin: scrollY, hud: Math.round(hud.getBoundingClientRect().height), reserve: rs ? rs.style.display + '/' + rs.style.height : '-' });
};
