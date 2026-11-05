/*
 * BANC DE PREUVE des barres (plan design/PLAN-MOTEUR-UNIQUE.md, étape 1 ; Norman, 2026-11-05 : « plus jamais un recul de barre » et « 60 FPS constant »).
 * Script de PAGE : à coller dans la console du navigateur (ou via l'outil javascript de Claude in Chrome) sur la page de la Machine temporelle, partie de Norman ouverte. Il joue un scénario de clics réels (Max, 0, Max...), enregistre à CHAQUE
 * image la durée de l'image et la largeur de chaque barre `.tmm-rempl`, puis rend un verdict :
 *   - RECUL : une barre qui baisse de plus de 1,5 point sans tour complet (passage de > 90 % à < 15 % = nouveau niveau, pas un recul) et sans que son allocation ait été mise à 0 ou changée dans les 150 ms qui précèdent un saut vers le BAS...
 *     (un recul « légitime » n'existe pas : une barre ne baisse jamais ; seul un changement de niveau la remet à 0 par le haut).
 *   - FLUIDITÉ : médiane, 95 %, 99 %, plus longue, part des images > 20 ms et > 34 ms, comparées au budget du plan (médiane <= 17 ms, > 20 ms < 1 %, > 34 ms < 0,1 %, aucune > 50 ms).
 * Retour : { verdict, reculs:[…], fluidite:{…}, budget:{…}, clics:[…] }. Aucune donnée n'est envoyée nulle part.
 *   const rapport = await window.__bancBarresV1__({ duree: 40000 });
 */
(function () {
  "use strict";
  const BUDGET = { mediane: 17.5, sup20: 1, sup34: 0.1, max: 50 };
  const sommeil = (ms) => new Promise((r) => setTimeout(r, ms));
  function stats(durees) {
    const d = durees.slice().sort((a, b) => a - b), n = d.length;
    const q = (p) => d[Math.min(n - 1, Math.floor(n * p))];
    return {
      images: n + 1, mediane: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), p99: +q(0.99).toFixed(1), max: +d[n - 1].toFixed(1),
      sup20: +((d.filter((x) => x > 20).length / n) * 100).toFixed(2), sup34: +((d.filter((x) => x > 34).length / n) * 100).toFixed(2)
    };
  }
  window.__bancBarresV1__ = async function (options) {
    const o = Object.assign({ duree: 40000 }, options || {});
    const bouton = (idx) => document.querySelectorAll(".tmm-boutons")[0] && [...document.querySelectorAll(".tmm-boutons")[0].querySelectorAll("button")][idx];
    /* scénario par défaut : Max, attente, Max, 0, Max, Max, Max (idx des boutons : 0 +, 1 −, 2 Max, 3 0) */
    const scenario = o.scenario || [[1500, 2], [7000, 2], [12000, 3], [14000, 2], [19000, 2], [24000, 2], [30000, 2]];
    const images = [];
    const clics = [];
    let stop = false;
    const t0 = performance.now();
    let prec = t0;
    (function image() {
      if (stop) return;
      const t = performance.now();
      const nivEl = document.querySelector('[data-tm-niveau="vitesse"]');
      const niv = nivEl ? parseFloat(String(nivEl.textContent).replace(/[^0-9.]/g, "")) : NaN;   /* niveau AFFICHÉ de la piste de vitesse : sert à suivre la barre à travers les tours */
      images.push({ t: t - t0, dt: t - prec, niv, w: [...document.querySelectorAll(".tmm-rempl")].map((e) => parseFloat(e.style.width)) });
      prec = t;
      requestAnimationFrame(image);
    })();
    /* idx : numéro de bouton de la première tour (0 +, 1 −, 2 Max, 3 0) ou « R » / « T » (touches « tout reprendre » énergie / magie) */
    scenario.forEach(([quand, idx]) => setTimeout(() => {
      if (idx === "R" || idx === "T") { clics.push({ t: Math.round(performance.now() - t0), bouton: idx }); document.dispatchEvent(new KeyboardEvent("keydown", { key: idx.toLowerCase(), bubbles: true })); return; }
      const b = bouton(idx); if (b) { clics.push({ t: Math.round(performance.now() - t0), bouton: idx }); b.click(); }
    }, quand));
    await sommeil(o.duree);
    stop = true;
    const reculs = [];
    for (let i = 1; i < images.length; i++) {
      const a = images[i - 1], b = images[i];
      if (a.w.length !== b.w.length) continue;
      for (let k = 0; k < a.w.length; k++) {
        if (!(Number.isFinite(a.w[k]) && Number.isFinite(b.w[k]))) continue;
        /* Position = niveau affiché + fraction : une barre rapide fait plusieurs tours par seconde (aliasing entre deux images), seule la POSITION ne doit jamais baisser. Sans niveau lisible : ancienne règle (tour complet toléré). */
        const posA = Number.isFinite(a.niv) && k === 0 ? a.niv * 100 + a.w[k] : null, posB = Number.isFinite(b.niv) && k === 0 ? b.niv * 100 + b.w[k] : null;
        const baisse = posA !== null && posB !== null ? posA - posB : a.w[k] - b.w[k];
        if (baisse > 1.5 && (posA !== null || !(a.w[k] > 90 && b.w[k] < 15))) {
          const dernierClic = clics.filter((c) => c.t <= b.t).pop();
          reculs.push({ t: Math.round(b.t), barre: k, de: +a.w[k].toFixed(2), a: +b.w[k].toFixed(2), apresClic: dernierClic ? Math.round(b.t - dernierClic.t) : null });
        }
      }
    }
    const fluidite = stats(images.slice(1).map((x) => x.dt));
    const hors = [];
    if (fluidite.mediane > BUDGET.mediane) hors.push("médiane " + fluidite.mediane + " ms");
    if (fluidite.sup20 >= BUDGET.sup20) hors.push(fluidite.sup20 + " % d'images > 20 ms");
    if (fluidite.sup34 >= BUDGET.sup34) hors.push(fluidite.sup34 + " % d'images > 34 ms");
    if (fluidite.max > BUDGET.max) hors.push("image la plus longue " + fluidite.max + " ms");
    const verdict = reculs.length === 0 && hors.length === 0 ? "OK" : "ECHEC : " + (reculs.length ? reculs.length + " recul(s) de barre ; " : "") + hors.join(" ; ");
    return { verdict, reculs: reculs.slice(0, 40), nbReculs: reculs.length, fluidite, budget: BUDGET, horsBudget: hors, clics };
  };
  return "banc prêt";
})();
