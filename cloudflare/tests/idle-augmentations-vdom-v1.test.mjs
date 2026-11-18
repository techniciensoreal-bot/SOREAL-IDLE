import assert from "node:assert/strict";
import { evenement, serialiser } from "./_faux-dom-vdom.mjs";
import { creerAugmentations, partieAugmentations } from "./_aug-vdom.mjs";

/*
 * Page Augmentations rendue par composants Preact (modules/augmentations-vdom-v1.js, chantier 2026-11-18) : le VRAI Preact, le VRAI pont, les VRAIS modules sur un faux DOM. Garanties :
 *  - les nœuds (cartes, pistes, boutons, tubes) gardent leur identité d'un rendu à l'autre ; les nœuds-feuilles vivants (niveau, prix, énergie placée, bonus total) ne reçoivent la valeur du serveur que si elle a
 *    CHANGÉ depuis le dernier rendu : ce que le tick du jeu y a écrit (et le canvas LED posé dans un tube) n'est jamais écrasé ;
 *  - un champ de saisie qui a le focus garde ce que le joueur tape ;
 *  - clic -> action (+ / − / Max / 0, Cible, Faire suivre l'énergie, Input) ;
 *  - après un redessin complet (conteneur recréé par le morph) la page se remet en place ;
 *  - anti-spoil (règle n°2) : seules les paires débloquées + la prochaine (« ???????? » et le numéro du boss, 5e exception) ; l'emplacement de l'Upgrade non possédée est UNE div vide (4e exception) ;
 *  - cas particuliers (défi « No Augmentations », système verrouillé) et absence de Preact : rendu historique en chaîne HTML.
 */
function monter(options) {
  const e = creerAugmentations(options);
  const racine = e.document.createElement("div"); racine.className = "soreal-idle-page-root-v28"; racine.setAttribute("data-menu", "augmentations");
  e.document.body.appendChild(racine);
  e.redessiner = (j) => {
    e.hote.etat = j;
    const chaine = e.AP.pageAugmentationsIdleV48_(j);
    if (!racine.querySelector("[data-vdom]")) { const t = e.document.createElement("template"); t.innerHTML = chaine; racine.appendChild(t.content.childNodes[0]); }
    e.pont.appliquer();
  };
  e.racine = racine;
  return e;
}
const un = (r, s) => { const x = r.querySelector(s); assert.ok(x, "introuvable : " + s); return x; };
const vivant = (r, attr, cle) => un(r, "[" + attr + '="' + cle + '"]');

/* --- 1. Premier rendu et anti-spoil --- */
{
  const e = monter();
  e.redessiner(partieAugmentations({ boss: 12 }));
  const r = e.racine;
  assert.equal(r.querySelectorAll("[data-vdom]").length, 1);
  assert.ok(un(r, ".soreal-idle-page-title-v28").textContent.includes("Augmentations"));
  assert.equal(r.querySelectorAll(".aug-paire-v2").length, 3, "trois paires débloquées (boss 0, 4, 10)");
  /* 5e exception : la prochaine paire est « ???????? » + le numéro du boss, rien d'autre */
  const verrou = r.querySelectorAll(".aug-verrou-boss-v1");
  assert.equal(verrou.length, 1, "une seule paire verrouillée montrée : la prochaine");
  assert.equal(verrou[0].textContent, "Bats le boss 20 pour l’obtenir.");
  const txt = serialiser(r);
  assert.ok(txt.includes("🔒 ????????"));
  for (const secret of ["Minigun", "Shoulder", "Buster", "buster", "Tir chargé", "Vraies munitions", "Boss 30", "boss 30", "Bats le boss 30", "minigun"]) assert.ok(!txt.includes(secret), "aucune trace de : " + secret);
  /* 4e exception : emplacement de l'Upgrade non possédée (cannon, upgrade au boss 14) = UNE div vide */
  const vides = r.querySelectorAll(".aug-emplacement-v2");
  assert.equal(vides.length, 1, "un emplacement vide (l'Upgrade du Canon n'est pas encore atteinte)");
  assert.equal(vides[0].childNodes.length, 0, "aucun enfant");
  assert.equal(vides[0].getAttribute("aria-hidden"), "true");
  assert.ok(!vides[0].hasAttribute("data-morph-garder") && !vides[0].hasAttribute("title") && !vides[0].textContent, "ni texte, ni nom, ni condition");
  assert.ok(!txt.includes("Lance-missiles") && !txt.includes("missileLauncher"), "le nom de l'Upgrade non possédée n'apparaît pas");
  assert.equal(r.querySelectorAll(".aug-piste-v2.upgrade").length, 2, "deux Upgrades débloquées");
  assert.ok(txt.includes("Ciseaux dangereux") && txt.includes("Boire aussi le lait"));
  /* aucun total « x / y » */
  const sansStyle = txt.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
  const reste = sansStyle.replace(/\b1\/[248]\b/g, "");   /* les boutons de fraction 1/2 et 1/4 ne sont pas des totaux */
  assert.ok(!/\d+\s*\/\s*\d+/.test(reste), "aucun total x / y : " + (/.{0,20}\d+\s*\/\s*\d+.{0,20}/.exec(reste) || [""])[0]);
  /* repères et ponts conservés */
  assert.ok(un(r, "[id=\"sorealIdleAugInputV1\"]") && un(r, "[id=\"sorealIdleAugMultV1\"]") && un(r, "[id=\"sorealIdleAugEnergieLibreV1\"]") && un(r, "[id=\"sorealIdleAugAllocV1_scissors_main\"]"));
  assert.equal(vivant(r, "data-idle-aug-niv-v1", "scissors:main").textContent, "3");
  assert.equal(vivant(r, "data-idle-aug-cout-v1", "scissors:main").textContent, "100 Or");
  assert.ok(vivant(r, "data-idle-aug-cout-v1", "scissors:main").className.includes("ok"), "assez d'Or : vert");
  assert.ok(vivant(r, "data-idle-aug-cout-v1", "milk:upgrade").className.includes("non"), "pas assez d'Or : rouge");
  assert.ok(un(r, "[data-bt-groupe-v1=\"energy\"]").innerHTML.includes("Tout reprendre") || un(r, "[data-bt-groupe-v1=\"energy\"]").textContent.includes("Tout reprendre"), "cadre d'allocation (îlot)");
  assert.ok(vivant(r, "data-idle-aug-eta-v1", "scissors:main").textContent.length > 0, "durée du niveau suivant");
}

/* --- 2. Déblocage : l'emplacement devient la vraie piste ; la prochaine paire se dévoile --- */
{
  const e = monter();
  e.redessiner(partieAugmentations({ boss: 12 }));
  const r = e.racine;
  const vide = un(r, ".aug-emplacement-v2"), carte = un(r, ".aug-paire-v2");
  e.redessiner(partieAugmentations({ boss: 20 }));
  assert.ok(!vide.isConnected, "l'emplacement vide a disparu au déblocage (remplacé par la vraie piste)");
  assert.equal(r.querySelectorAll(".aug-piste-v2.upgrade").length, 3, "l'Upgrade du Canon est là");
  assert.equal(r.querySelectorAll(".aug-paire-v2").length, 4, "le Minigun est débloqué");
  assert.equal(r.querySelectorAll(".aug-verrou-boss-v1")[0].textContent, "Bats le boss 30 pour l’obtenir.");
  assert.equal(un(r, ".aug-paire-v2"), carte, "la première carte garde son nœud");
}

/* --- 3. Identité des nœuds ; feuilles vivantes ; calques d'autres modules --- */
{
  const e = monter();
  e.redessiner(partieAugmentations({ boss: 12 }));
  const r = e.racine;
  const garde = { carte: un(r, ".aug-paire-v2"), piste: un(r, ".aug-piste-v2"), tube: un(r, ".aug-tube-v2"), liquide: un(r, ".aug-liquide-v2"), niv: vivant(r, "data-idle-aug-niv-v1", "scissors:main"), input: un(r, "[id=\"sorealIdleAugInputV1\"]"), boutons: r.querySelectorAll(".soreal-idle-bt-actions-v120 button") };
  /* le tick du jeu réécrit niveau, énergie, remplissage ; le module LED pose un canvas dans le tube ; un module pose une classe */
  const nivNoeud = garde.niv;
  nivNoeud.textContent = "42";
  const alloc = un(r, "[id=\"sorealIdleAugAllocV1_scissors_main\"]"); alloc.textContent = "777⚡";
  garde.liquide.style.transform = "scaleX(0.9)";
  const cv = e.document.createElement("canvas"); cv.className = "aug-led-cv-v1"; garde.tube.appendChild(cv);
  garde.piste.classList.add("actif-x");
  /* nouvelle synchro, MÊMES valeurs serveur pour cette piste : rien n'est écrasé */
  const j2 = partieAugmentations({ boss: 12 });
  e.redessiner(j2);
  assert.equal(un(r, ".aug-paire-v2"), garde.carte); assert.equal(un(r, ".aug-piste-v2"), garde.piste); assert.equal(un(r, ".aug-tube-v2"), garde.tube); assert.equal(un(r, ".aug-liquide-v2"), garde.liquide);
  r.querySelectorAll(".soreal-idle-bt-actions-v120 button").forEach((b, i) => assert.equal(b, garde.boutons[i], "bouton " + i + " : même nœud"));
  assert.equal(un(r, "[id=\"sorealIdleAugInputV1\"]"), garde.input);
  assert.equal(vivant(r, "data-idle-aug-niv-v1", "scissors:main").textContent, "42", "ce que le tick a écrit n'est pas écrasé (valeur serveur inchangée)");
  assert.equal(alloc.textContent, "777⚡");
  assert.equal(garde.liquide.style.transform, "scaleX(0.9)", "le remplissage de la barre posé par le tick est conservé");
  assert.ok(garde.tube.querySelector(".aug-led-cv-v1"), "le canvas LED du tube est conservé");
  assert.ok(garde.piste.classList.contains("actif-x"), "classe posée par un autre module conservée");
  /* le serveur change la valeur : elle est écrite */
  const j3 = partieAugmentations({ boss: 12, niveau: 9 });
  j3.systemes.currencies.gold = 20000;
  e.redessiner(j3);
  assert.equal(vivant(r, "data-idle-aug-niv-v1", "scissors:main").textContent, "9", "niveau du serveur écrit quand il change");
  assert.ok(vivant(r, "data-idle-aug-cout-v1", "milk:upgrade").className.includes("ok"), "la couleur du prix suit l'Or");
  /* un rendu identique ne touche à rien */
  e.redessiner(j3);
  assert.equal(un(r, ".aug-paire-v2"), garde.carte);
}

/* --- 4. Champ de saisie : le focus protège ce que le joueur tape --- */
{
  const e = monter();
  e.redessiner(partieAugmentations({ boss: 12 }));
  const r = e.racine;
  const champ = un(r, "[id=\"sorealIdleAugInputV1\"]");
  assert.equal(champ.value, "125", "valeur de l'Input à l'ouverture");
  champ.value = "1/8"; e.document.activeElement = champ;
  e.window.__lireMontantAugmentIdleV1__ = () => 500;
  e.redessiner(partieAugmentations({ boss: 12, libre: 6000 }));
  assert.equal(champ.value, "1/8", "champ actif : la saisie n'est pas écrasée");
  e.document.activeElement = null;
  e.redessiner(partieAugmentations({ boss: 12, libre: 6001 }));
  assert.equal(champ.value, "500", "champ sans focus : la valeur du jeu est posée");
  assert.equal(un(r, "[id=\"sorealIdleAugEnergieLibreV1\"]").textContent, "6001");
}

/* --- 5. Clics -> actions --- */
{
  const e = monter();
  e.redessiner(partieAugmentations({ boss: 12 }));
  const r = e.racine;
  const piste = un(r, ".aug-piste-v2");
  const boutons = piste.querySelectorAll(".soreal-idle-bt-actions-v120 button");
  assert.deepEqual(boutons.map((b) => b.textContent), ["+", "−", "Max", "0"]);
  assert.equal(boutons[3].getAttribute("title"), "Retirer toute l’énergie de cette barre");
  evenement(boutons[0], "click"); evenement(boutons[2], "click"); evenement(boutons[3], "click");
  assert.equal(JSON.stringify(e.appels), JSON.stringify([["ajuster", "scissors", false, "plus"], ["ajuster", "scissors", false, "max"], ["ajuster", "scissors", false, "zero"]]));
  e.appels.length = 0;
  const up = un(r, ".aug-piste-v2.upgrade");
  evenement(up.querySelectorAll(".soreal-idle-bt-actions-v120 button")[1], "click");
  assert.equal(JSON.stringify(e.appels[0]), JSON.stringify(["ajuster", "scissors", true, "moins"]), "l'Upgrade passe upgrade=true");
  e.appels.length = 0;
  const cible = up.querySelector(".aug-cible-v2 input");
  cible.value = "30"; evenement(cible, "change");
  assert.equal(JSON.stringify(e.appels[0]), JSON.stringify(["cible", "scissors", true, "30"]));
  e.appels.length = 0;
  const case_ = un(r, ".aug-avance-v2 input");
  case_.checked = true; evenement(case_, "change");
  assert.equal(JSON.stringify(e.appels[0]), JSON.stringify(["avance", true]));
  e.appels.length = 0;
  const input = un(r, "[id=\"sorealIdleAugInputV1\"]");
  input.value = "2k"; evenement(input, "input"); evenement(input, "blur", { bubbles: false });
  assert.equal(JSON.stringify(e.appels.map((a) => a[0])), JSON.stringify(["saisir", "fraction", "saisir"]));
  /* l'aide repliable mémorise son état (lié au compte) */
  const aide = un(r, ".soreal-idle-aide-v1");
  aide.open = true; aide.setAttribute("open", ""); evenement(aide, "toggle", { bubbles: false });
  assert.equal(e.stockage["soreal_idle_aide_v1_augmentations"], "1");
}

/* --- 6. Redessin complet --- */
{
  const e = monter();
  const j = partieAugmentations({ boss: 12 });
  e.redessiner(j);
  const avant = un(e.racine, ".aug-paire-v2");
  while (e.racine.firstChild) e.racine.removeChild(e.racine.firstChild);
  e.redessiner(j);
  assert.notEqual(un(e.racine, ".aug-paire-v2"), avant);
  assert.equal(e.racine.querySelectorAll(".aug-paire-v2").length, 3);
  while (e.racine.firstChild) e.racine.removeChild(e.racine.firstChild);
  e.pont.appliquer();
  assert.ok(!e.pont.registre.augmentations, "page quittée : composant démonté");
}

/* --- 7. Cas particuliers et repli sans Preact : rendu historique --- */
{
  const e = monter();
  const j = partieAugmentations({ boss: 12 }); e.hote.etat = j;
  j.systemes.challenge = { active: "noAugmentations" };
  assert.ok(e.AP.pageAugmentationsIdleV48_(j).includes("No Augmentations Challenge"), "défi : texte fixe, pas de conteneur Preact");
  const j2 = partieAugmentations({ boss: 12 }); j2.__meta.augmentations.state.unlocked = false;
  assert.ok(e.AP.pageAugmentationsIdleV48_(j2).includes("Rien à afficher"), "système verrouillé : rien d'autre");
  const sans = creerAugmentations({ sansPreact: true });
  const j3 = partieAugmentations({ boss: 12 }); sans.hote.etat = j3;
  const html = sans.AP.pageAugmentationsIdleV48_(j3);
  assert.ok(html.includes("aug-piste-v2") && !html.includes("data-vdom"), "sans Preact : chaîne HTML historique");
  assert.ok(html.includes('class="aug-emplacement-v2" aria-hidden="true"></div>'), "emplacement vide aussi dans le repli");
}

console.log("idle-augmentations-vdom-v1: ok");
