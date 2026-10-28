/*
 * SOREAL IDLE — mode HORS LIGNE (Norman, 2026-10-28 : « hier j'ai eu une déconnexion internet et je n'ai plus pu jouer ; pourtant je voulais le jeu totalement en local »).
 *
 * Le moteur tourne déjà dans la page (règle n°7), mais la page elle-même, ses scripts, le moteur et sa base SQL venaient du serveur : sans internet, impossible de rouvrir le jeu.
 * Ce service worker garde une copie de tout ce que le jeu charge :
 *  - la page (index.html) : réseau d'abord (un joueur en ligne a toujours la dernière version), copie de l'appareil si le réseau est absent ou répond en plus de 3 s ;
 *  - les fichiers versionnés par ?v=N (scripts, styles, moteur local, base SQL, dictionnaire) : copie d'abord. Leur adresse change à chaque modification (cloudflare/tools/maj-pins.mjs), donc la copie n'est jamais périmée ;
 *  - les polices, icônes et images (y compris celles qui viennent de /api/) : copie d'abord, rafraîchie en arrière-plan ;
 *  - JAMAIS les appels du jeu (/api/ hors images), ni les sons et musiques (requêtes partielles).
 * Au démarrage hors ligne le moteur reprend le dernier export du serveur gardé sur l'appareil (modules/moteur-local-v1.js).
 *
 * Arrêt d'urgence : ouvrir le jeu avec ?sw=0 supprime ce service worker et ses copies (standalone-bridge.js).
 */
'use strict';
var VERSION = '1';
var CACHE = 'soreal-idle-coque-v' + VERSION;

function memeOrigine_(u) { return u.origin === self.location.origin; }
function estPage_(u) { return u.pathname === '/' || u.pathname === '/index.html'; }

/* Adresses citées par la page : src="…" et href="…" qui commencent par « / ». */
function adressesDe_(texte) {
  var urls = {}, re = /(?:src|href)="(\/[^"#]+)"/g, m;
  while ((m = re.exec(texte))) urls[m[1]] = true;
  return Object.keys(urls);
}

function mettre_(cache, url, reponse) {
  if (!reponse || !reponse.ok || reponse.type === 'opaque' || reponse.status !== 200) return Promise.resolve();
  return cache.put(url, reponse).catch(function () {});
}

/* Récupère une liste d'adresses par petits groupes, sans jamais échouer (une adresse manquante ne doit pas empêcher les autres). */
function telecharger_(cache, urls) {
  var i = 0;
  function groupe() {
    var lot = urls.slice(i, i + 8);
    i += 8;
    if (!lot.length) return Promise.resolve();
    return Promise.all(lot.map(function (u) {
      return cache.match(u).then(function (deja) {
        if (deja) return null;
        return fetch(u).then(function (r) { return mettre_(cache, u, r); }, function () {});
      });
    })).then(groupe);
  }
  return groupe();
}

function precharger_() {
  return caches.open(CACHE).then(function (cache) {
    return fetch('/index.html', { cache: 'reload' }).then(function (rep) {
      if (!rep.ok) return null;
      var copie = rep.clone();
      return rep.text().then(function (texte) {
        return Promise.all([mettre_(cache, '/index.html', copie.clone()), mettre_(cache, '/', copie)]).then(function () {
          var urls = adressesDe_(texte);
          urls.push('/manifest.webmanifest', '/fonts/fonts.css');
          return telecharger_(cache, urls).then(function () {
            /* le moteur local et sa base SQL sont cités par modules/moteur-local-v1.js, pas par la page */
            var script = urls.filter(function (u) { return /\/moteur-local-v1\.js/.test(u); })[0];
            if (!script) return null;
            return cache.match(script).then(function (r) { return r ? r.text() : ''; }).then(function (js) {
              var extra = [], re = /\/(?:moteur-local-worker-v1\.js|sql-wasm-v1\.wasm)\?v=[0-9a-f]+/g, m;
              while ((m = re.exec(js))) extra.push(m[0]);
              return telecharger_(cache, extra);
            });
          }).then(function () { return nettoyer_(cache, urls); });
        });
      });
    });
  });
}

/* Anciennes versions d'un fichier (même chemin, autre ?v=) : supprimées dès que la page n'y fait plus référence. */
function nettoyer_(cache, urls) {
  var gardes = {}, chemins = {};
  urls.forEach(function (u) { gardes[u] = true; chemins[u.split('?')[0]] = true; });
  return cache.keys().then(function (cles) {
    return Promise.all(cles.map(function (req) {
      var u = new URL(req.url);
      var relatif = u.pathname + u.search;
      if (chemins[u.pathname] && u.search && !gardes[relatif] && /\.(js|css|json)$/.test(u.pathname) && /[?&]v=\d+$/.test(u.search)) return cache.delete(req);
      return null;
    }));
  });
}

self.addEventListener('install', function (e) {
  e.waitUntil(precharger_().then(function () { return self.skipWaiting(); }, function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (noms) {
    return Promise.all(noms.filter(function (n) { return n.indexOf('soreal-idle-coque-') === 0 && n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Page : réseau d'abord (3 s), sinon la copie. La copie est rafraîchie à chaque réponse du réseau. */
function page_(e) {
  var reseau = fetch(e.request).then(function (rep) {
    if (rep && rep.ok) {
      var copie = rep.clone();
      e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all([mettre_(c, '/index.html', copie.clone()), mettre_(c, '/', copie)]); }));
    }
    return rep;
  });
  var limite = new Promise(function (_ok, ko) { setTimeout(function () { ko(new Error('LENT')); }, 3000); });
  return Promise.race([reseau, limite]).catch(function () {
    return caches.match('/index.html').then(function (c) { return c || reseau; });
  });
}

/* Copie d'abord ; le réseau seulement si elle manque. */
function copieDabord_(e, cle) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(cle).then(function (c) {
      if (c) return c;
      return fetch(e.request).then(function (rep) {
        var copie = rep.clone();
        e.waitUntil(mettre_(cache, cle, copie));
        return rep;
      });
    });
  });
}

/* Copie tout de suite, mise à jour en arrière-plan. */
function copieEtMiseAJour_(e, cle) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(cle).then(function (c) {
      var reseau = fetch(e.request).then(function (rep) {
        var copie = rep.clone();
        e.waitUntil(mettre_(cache, cle, copie));
        return rep;
      });
      if (c) { reseau.catch(function () {}); return c; }
      return reseau;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (!memeOrigine_(u)) return;
  if (r.headers.get('range')) return;   /* sons et musiques : requêtes partielles, jamais gardées */
  if (r.mode === 'navigate') {
    if (estPage_(u)) e.respondWith(page_(e));
    return;
  }
  if (u.pathname.indexOf('/api/') === 0) {
    /* Les appels du jeu ne passent jamais par la copie ; seules les images servies par /api/ (boss, objets) sont gardées. */
    if (r.destination === 'image') e.respondWith(copieEtMiseAJour_(e, u.pathname + u.search));
    return;
  }
  var cle = u.pathname + u.search;
  if (/[?&]v=[0-9a-zA-Z]+/.test(u.search)) { e.respondWith(copieDabord_(e, cle)); return; }
  if (/\.(?:css|woff2?|png|jpe?g|webp|gif|svg|ico|webmanifest)$/.test(u.pathname)) e.respondWith(copieEtMiseAJour_(e, cle));
});
