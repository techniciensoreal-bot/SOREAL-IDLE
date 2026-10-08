import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Règle n°2 (AGENTS.md) : aucun spoil dans le monolithe UI. Analyse du source :
// les chaînes interdites ne doivent plus exister dans le chemin actif.
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

const interdits = [
  ["🏆 ???????", "titre de collection verrouillée"],
  ["Ce registre n’est pas encore accessible", "registre verrouillé"],
  ["Entrée inconnue", "carte de bestiaire inconnue"],
  ["bestiary-card-v110 unknown", "carte de bestiaire inconnue"],
  ["<span>❔</span>", "case ❔ non découverte"],
  [">???<", "case ??? non découverte"],
  [">???????<", "nom ??????? non découvert"],
  ["🔒 ???????", "compétence verrouillée"],
  ["Adventure verrouillé", "Adventure verrouillé"],
  ["Bats le boss 4", "condition de déblocage Adventure"],
  ["se débloque avec Adventure", "condition de déblocage Inventory"],
  ["🔒 Sceau", "cadenas sur Sceau"],
  ["🔒 Niveau", "cadenas de niveau"],
  ["Niveau ${idleEntier_(b.niveauRequis", "niveau requis du bestiaire"],
  ["Effet pas encore actif", "achat AP inactif"],
  ["soreal-idle-exp-lock-v210\"", "cadenas boutique AP"],
  ["Dernier emplacement d’accessoire", "nom révélant le dernier emplacement"],
  ["dernier emplacement d’accessoire achetable", "texte révélant le dernier emplacement"],
  ["difficulté Evil", "texte révélant Evil"],
  ["Emplacement d’accessoire Evil", "nom révélant Evil"],
  ["Attaque régulière se débloque", "condition de déblocage d'une compétence"],
  ["idleEntier_(item.max)", "compteur (acheté/max) de la boutique AP"],
];
for (const [chaine, raison] of interdits) {
  assert.ok(!ui.includes(chaine), `spoil interdit (${raison}) : ${JSON.stringify(chaine)}`);
}

// Aucun « Maximum : N achats » dans les textes de la boutique AP.
assert.ok(!/Maximum : \d+ achats/.test(ui), "aucun maximum d'achats affiché dans les textes de la boutique AP");

// Aucun total révélateur « x / N boss|emplacements|pièces ».
assert.ok(!/\/\s*(?:301|284)\b/.test(ui), "aucun total codé en dur de boss/emplacements");

// Liste blanche explicite des 🔒 restants (volontaires) : badge de version et verrou d'objet d'inventaire,
// messages d'administration (accès public).
const cadenas = ui.split("\n").filter((l) => l.includes("🔒"));
const autorises = [
  /versionBadgeIdleV1_\(\)/,                    // badge de version
  /estVerrouille\?'🔓 Déverrouiller':'🔒 Verrouiller'/, // verrou que le joueur pose lui-même sur un objet
  /Accès public (ouvert|fermé)|Accès fermé : SOREAL IDLE/, // toasts d'administration
  /^\s*\*|^\s*\/\*|^\s*\/\//,                    // commentaires
];
for (const l of cadenas) {
  assert.ok(autorises.some((re) => re.test(l)), `🔒 non autorisé dans le chemin actif : ${l.trim().slice(0, 120)}`);
}

// Comportement : les cartes inconnues sont filtrées avant le rendu.
assert.match(ui, /function rendreCollectionCreaturesIdleV1_\(entrees,vide\)\{[\s\S]{0,300}entrees=entrees\.filter\(function\(e\)\{return e&&e\.decouvert;\}\)/, "bestiaire : seules les entrées découvertes");
assert.match(ui, /function rendreCoffreAdventureIdleV1_\(slots\)\{[\s\S]{0,300}slots=slots\.filter\(function\(s\)\{return s&&s\.decouvert;\}\)/, "coffre : seules les cases découvertes");
assert.match(ui, /catalog\)\?shop\.catalog:\[\]\)\.filter\(function\(item\)\{return articleApVisibleIdleV1_\(j,item\);\}\)/, "boutique AP : seuls les achats actifs et liés à un système débloqué");
assert.match(ui, /const compteur=item\.purchased>0\?' \(x'\+idleEntier_\(item\.purchased\)\+'\)':'';/, "boutique AP : seul le nombre acheté");

// Observer « 69 lol » : jamais de balayage complet du body à chaque mutation.
const obs = ui.slice(ui.indexOf("function noeudTexte69LolIdleV183_"), ui.indexOf("function chargerMenuIdleV28_"));
assert.ok(obs.includes("indexOf('69')"), "l'observer ne traite que les nœuds texte contenant 69");
assert.equal((obs.match(/appliquer69LolNoeudIdleV183_\(document\.body\)/g) || []).length, 1, "un seul balayage du body (installation)");

console.log("idle anti-spoil UI monolith: OK");
