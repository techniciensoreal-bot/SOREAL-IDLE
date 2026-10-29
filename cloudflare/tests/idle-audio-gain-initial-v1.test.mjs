// Norman (2026-10-29) : « le son de la boutique crachouille encore un peu par moment » : un GainNode vaut 1 tant que sa première consigne n'est pas atteinte ; quand une rafale de bruit démarre une image avant (alignement variable, donc « par moment »), un échantillon sort à pleine amplitude (0,85 mesuré sur la porte de la boutique) = un claquement. Chaque gain d'enveloppe prend donc sa valeur de départ dès sa création.
import fs from "node:fs";
import assert from "node:assert/strict";
const dossier = "cloudflare/public/modules/";
const lire = (f) => fs.readFileSync(dossier + f, "utf8");
for (const [f, fn] of [["audio-effects-v199.js", "function gainEnv_"], ["audio-effects-v199.js", "function nappe_"], ["audio-effects-v199.js", "function bruitMonte_"]]) {
  const s = lire(f), i = s.indexOf(fn), corps = s.slice(i, i + 1600);
  const k = corps.indexOf("createGain()"), v = corps.indexOf(".gain.value=");
  assert.ok(k > 0 && v > k, fn + " : valeur de départ posée dès la création du gain");
  assert.ok(v < corps.indexOf(".gain.setValueAtTime("), fn + " : avant la première consigne");
}
/* tous les modules sonores : un gain créé puis automatisé commence par .gain.value= (sauf deux bus volontaires de audio-effects / nuke) */
const exclus = new Set(["audio-effects-v199.js", "nuke-blindage-v1.js"]);
const manquants = [];
for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith(".js") && !exclus.has(x))) {
  const s = lire(f), re = /(\b[A-Za-z_$][\w$]*)\s*=\s*[\w$.]+\.createGain\(\)/g; let m;
  while ((m = re.exec(s))) {
    const nom = m[1], fen = s.slice(m.index + m[0].length, m.index + m[0].length + 900);
    const is = fen.indexOf(nom + ".gain.setValueAtTime("), iv = fen.indexOf(nom + ".gain.value=");
    if (is >= 0 && !(iv >= 0 && iv < is) && fen.slice(0, is).search(new RegExp("\b" + nom + "\s*=\s*[\w$.]+\.createGain")) < 0) manquants.push(f + " : " + nom);
  }
}
assert.deepEqual(manquants, [], "gain sans valeur de départ : " + manquants.join(", "));
for (const f of ["morts-boss-nouvelles-v1.js", "morts-joueur-nouvelles-v1.js"]) assert.ok(/function env(eloppe)?\(g,t0,att,dec,pic\)\{g\.gain\.value=0\.0001;/.test(lire(f)), f + " : enveloppe partagée");
console.log("idle-audio-gain-initial-v1 : OK");
