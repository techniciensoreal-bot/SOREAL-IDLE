import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) :
 *  1. « Quand on termine un défi, le popup n'apparaît qu'en allant dans le menu Défis : il doit apparaître dès que le défi est validé » ;
 *  2. « Supprime le bouton Tous les boosts dans le Cube : un clic droit sur le Cube suffit » ;
 *  3. « Un panneau parle de l'Auto Boost alors que je ne l'ai pas débloqué, j'ai seulement l'Auto Merge » ;
 *  4. « Le clic droit sur une pièce pour absorber les pièces identiques doit faire le même son que lorsqu'on glisse une pièce sur une pièce identique ».
 */
const lire = (p) => readFileSync(p, "utf8");
const defis = lire("cloudflare/public/modules/challenges-v1.js");
const ui = lire("cloudflare/public/soreal-idle-ui.js");
const auto = lire("cloudflare/public/modules/inventory-auto-v1.js");
const meta = lire("cloudflare/public/modules/meta-progression-v130.js");

// 1. Annonce de fin de défi : vérifiée aussi chaque seconde, sans attendre un rendu complet.
assert.ok(defis.includes("function verifierFin(j){") && defis.includes("verifierFin:verifierFin"), "verifierFin exposée");
assert.match(ui, /setInterval\(function\(\)\{\s*if\(!idleEtat\|\|document\.hidden\)return;\s*const defis=window\.__SOREAL_IDLE_DEFIS_V1__;\s*if\(defis&&typeof defis\.verifierFin==='function'\)/, "contrôle chaque seconde");
{
  const annonces = [];
  const fenetre = { __sorealFadeNoticeV1__: (t, l) => annonces.push([t, l]) };
  const f = new Function("window", "document", defis + "\nreturn window.__SOREAL_IDLE_DEFIS_V1__;")(fenetre, { body: {}, createElement() { return { style: {} }; }, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return null; }, addEventListener() {} });
  const etat = (seq) => ({ systemes: { challenge: { lastCompletion: seq ? { seq, completed: "basic", rewarded: true, reward: { experience: 5, ap: 2 }, completion: 1, tier: "normal" } : null }, challengeDefinitions: [] } });
  f.verifierFin(etat(0));
  assert.equal(annonces.length, 0, "premier passage : rien n'est rejoué");
  f.verifierFin(etat(1));
  assert.equal(annonces.length, 1, "défi terminé : annonce immédiate");
  assert.equal(annonces[0][0], "🏁 Défi réussi !");
  f.verifierFin(etat(1));
  assert.equal(annonces.length, 1, "jamais deux fois la même fin");
}

// 2. Plus de bouton « Tous les boosts dans le Cube ».
assert.ok(!auto.includes("Tous les boosts dans le Cube") && !auto.includes("__inventaireAutoBoosterCubeV1__") && !auto.includes("boutonCube"), "bouton supprimé");
assert.ok(ui.includes("clicDroitCubeIdleV1_"), "le clic droit sur le Cube reste");

// 3. Panneau Automatisation : l'Auto Boost n'est mentionné qu'une fois débloqué.
{
  const bloc = auto.slice(auto.indexOf("    var autoItems="), auto.indexOf("    /* Anti-spoil : on n'affiche que le nombre déjà obtenu"));
  assert.match(bloc, /\(u\.autoBoost\s*\?' · Recyclage des boosts[\s\S]*?l’Auto Boost ne verse[\s\S]*?:'<br>Les objets équipés passent d’abord[^']*ne sont jamais consommés\.'\)/, "texte Auto Boost seulement si débloqué");
  assert.ok(auto.includes("(u.autoBoost?caseACocher('Boost automatique'"), "case « Boost automatique » seulement si l'Auto Boost est débloqué");
}

// 4. Son de la fusion de toutes les pièces identiques = son du glisser-déposer.
assert.match(meta, /payload\.mode==='mergeAll'&&\s*window\.__SOREAL_IDLE_META_HOST_V130__\.idleNombre_\(res\.resultat\.merged\)>0/, "joué seulement si quelque chose est fusionné");
assert.ok(meta.includes("'mergeWeapon':(['head','chest','legs','boots'].indexOf(empl)!==-1?'mergeArmor':'mergeAccessory')"), "mêmes sons que le glisser-déposer (arme, armure, accessoire)");
assert.ok(ui.includes("if(slot==='weapon')return 'mergeWeapon';") && ui.includes("return 'mergeArmor';") && ui.includes("return 'mergeAccessory';"), "cues du glisser-déposer inchangés");
console.log("idle-defis-cube-automerge-son-v1: OK");
process.exit(0);
