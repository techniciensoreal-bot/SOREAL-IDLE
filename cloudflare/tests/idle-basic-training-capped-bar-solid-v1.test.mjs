import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « Dans NGU Idle, quand une barre est CAP, elle ne clignote plus. Elle reste complètement remplie de la couleur qu'elle
 * possède (Attaque passive : barre rouge -> complètement rouge). »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function animerBarreBasicTrainingIdleV220_");
const fin = ui.indexOf("function allocationsBasicTrainingIdleV120_", debut);
const src = ui.slice(debut, fin);

function barre() {
  const b = { style: { props: {}, setProperty(k, v) { this.props[k] = v; } }, dataset: {}, anims: [], __idleBtAnimationV220: null,
    animate(frames, opts) { const a = { frames, opts, cancelled: false, currentTime: 0, cancel() { this.cancelled = true; } }; b.anims.push(a); return a; } };
  return b;
}
const anim = new Function("idleNombre_", "idleEntier_", src + "return animerBarreBasicTrainingIdleV220_;")(
  (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
  (v) => Math.max(0, Math.floor(Number(v) || 0))
);

// Sous le cap : dents de scie habituelles (barre qui se remplit et repart)
{
  const b = barre();
  anim(b, { allocation: 1000, cap: 2500, progress: 0.3 }, 20);
  assert.equal(b.anims.length, 1, "animation de remplissage");
  assert.equal(b.style.transform, undefined);
}

// Au cap : barre pleine, aucune animation, l'ancienne est annulée
{
  const b = barre();
  anim(b, { allocation: 1000, cap: 2500, progress: 0.3 }, 20);
  const ancienne = b.anims[0];
  anim(b, { allocation: 2500, cap: 2500, progress: 0.4 }, 50);
  assert.equal(ancienne.cancelled, true, "l'animation en dents de scie est arrêtée");
  assert.equal(b.__idleBtAnimationV220, null);
  assert.equal(b.style.transform, "scaleX(1)", "barre entièrement remplie");
  assert.equal(b.style.width, "100%");
  assert.equal(b.anims.length, 1, "aucune nouvelle animation au cap");
  // Repassé au cap plusieurs fois (chaque tick) : reste pleine et calme
  anim(b, { allocation: 3000, cap: 2500, progress: 0.9 }, 50);
  assert.equal(b.style.transform, "scaleX(1)");
  assert.equal(b.anims.length, 1);
  // Cap qui remonte (Renaissance) : l'animation reprend
  anim(b, { allocation: 2500, cap: 4000, progress: 0.1 }, 31);
  assert.equal(b.anims.length, 2, "sous le cap : l'animation reprend");
}

// Sans énergie allouée : jamais « pleine » (allocation 0 >= cap 1 serait faux)
{
  const b = barre();
  anim(b, { allocation: 0, cap: 1, progress: 0 }, 0);
  assert.equal(b.style.transform, "scaleX(0)");
}

// Rendu initial : pleine dès le premier affichage
assert.match(ui, /idleEntier_\(skill\.allocation\)>=Math\.max\(1,idleEntier_\(skill\.cap\)\)\s*\?100/);

// Augmentations : au maximum de vitesse (1 niveau / tick = 0,02 s) la barre reste pleine aussi
const bloc = ui.slice(ui.indexOf("if(seconds<=0.0201){"));
assert.ok(bloc.startsWith("if(seconds<=0.0201){") && bloc.slice(0, 400).includes("el.style.transform='scaleX(1)';"), "barre d'Augmentation pleine à 50 niveaux/s");

console.log("idle-basic-training-capped-bar-solid-v1: OK");
