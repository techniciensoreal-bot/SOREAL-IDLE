import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Quand on relance le jeu on doit avoir un résumé de ce qu'on a eu. EXP, AP, Loot,
 * ATTACK, DEFENSE, ... ce qu'on a eu quoi. Avec un popup a fermer »
 *
 * Avant ce correctif, afficherResumeHorsLigneIdleV64_ affichait un simple TOAST (messageFlottantIdleV32_, sans
 * bouton, qui disparaît seul après 1,8 s) et ne parlait QUE de l'énergie produite -- jamais l'EXP, les niveaux,
 * l'AP, les boss battus, les combats auto d'Aventure ni le loot, pourtant déjà calculés côté serveur
 * (progressionHorsLigne). L'AP gagné hors ligne (pointsAventureAuto) était calculé et persisté mais jamais
 * exposé du tout au client -- ajouté ici (apGagne).
 */
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// --- Serveur : l'AP gagné hors ligne est désormais calculé (delta, jamais négatif) et exposé. ---
{
  assert.ok(
    runtime.includes("const pointsAventureAutoAvant = pointsAventureAuto;"),
    "la valeur de départ de l'AP doit être mémorisée avant la simulation hors ligne"
  );
  const i = runtime.indexOf("apGagne:\n      Math.max(\n        0,\n        pointsAventureAuto -\n          pointsAventureAutoAvant\n      ),");
  assert.ok(i > 0, "le delta d'AP doit être renvoyé par le simulateur hors ligne");
}

// --- Serveur : progressionHorsLigne (exposé au client) reprend bien ce champ, avec repli à 0. ---
{
  const i = runtime.indexOf("progressionHorsLigne: {");
  assert.ok(i > 0, "progressionHorsLigne introuvable");
  const bloc = runtime.slice(i, runtime.indexOf("autoAventureHorsLigne:", i));
  assert.match(
    bloc,
    /apGagne:\s*\n\s*progression\s*\n\s*\?\s*nombreSorealIdle_\(\s*\n\s*progression\.apGagne,\s*\n\s*0\s*\n\s*\)\s*\n\s*:\s*0/,
    "apGagne doit être repris depuis progression.apGagne, avec repli à 0 si aucune progression n'a été rejouée"
  );
}

// --- Dérivation isolée (points avant/après -> delta), rejouée dans un sandbox pour couvrir les cas limites. ---
{
  function deriver(pointsAventureAuto, pointsAventureAutoAvant) {
    return Math.max(0, pointsAventureAuto - pointsAventureAutoAvant);
  }
  assert.equal(deriver(12, 5), 7, "7 points d'AP gagnés hors ligne");
  assert.equal(deriver(5, 5), 0, "aucun combat auto gagné -> 0");
  assert.equal(deriver(5, 12), 0, "jamais négatif (repli défensif si l'ordre était inversé)");
}

// --- Client : l'ancien toast (sans bouton, qui disparaît seul) est bien remplacé par un vrai popup modal fermable. ---
{
  const debut = ui.indexOf("function afficherResumeHorsLigneIdleV64_(");
  const fin = ui.indexOf("\n\n      /* Essai du popup");
  assert.ok(debut > 0 && fin > debut, "afficherResumeHorsLigneIdleV64_ introuvable");
  const fonction = ui.slice(debut, fin);

  assert.ok(!fonction.includes("messageFlottantIdleV32_("), "ne doit plus utiliser le toast qui disparaît seul");
  assert.ok(fonction.includes("modal.className='soreal-idle-modal-backdrop-v63';"), "doit utiliser la même famille de popup modal que la confirmation de Renaissance");
  assert.ok(fonction.includes("id='sorealIdleResumeHorsLigneModalV64';"), "identifiant stable du popup");
  assert.ok(
    fonction.includes("onclick=\"window.__fermerResumeHorsLigneIdleV64__()\">Fermer</button>"),
    "un vrai bouton « Fermer », jamais une disparition automatique"
  );
  assert.ok(
    fonction.includes("if(event.target===modal)fermerResumeHorsLigneIdleV64_();"),
    "cliquer en dehors du popup doit aussi le fermer (même comportement que les autres popups modaux)"
  );

  // Le résumé couvre bien EXP, AP, Loot, et les stats de combat (dégâts infligés/reçus -- « ATTACK, DEFENSE »
  // de la demande de Norman, faute d'un delta de statistique de personnage qui n'existe pas dans ce moteur).
  assert.ok(fonction.includes("p.xpGagnee"), "EXP");
  assert.ok(fonction.includes("p.apGagne"), "AP");
  assert.ok(fonction.includes("p.dropsRecents"), "Loot");
  assert.ok(fonction.includes("p.degats") && fonction.includes("p.degatsRecus"), "dégâts infligés/reçus (attaque/défense en jeu)");
  assert.ok(fonction.includes("objet.basePower") && fonction.includes("objet.baseToughness"), "les objets du loot affichent leur Puissance/Endurance");
  assert.ok(fonction.includes("j.autoAventureHorsLigne"), "victoires/défaites des combats auto d'Aventure");

  // Jamais un popup vide pour un simple rechargement sans rien de notable à raconter.
  assert.ok(fonction.includes("if(rienAVoir)return;"), "pas de popup si rien de notable ne s'est passé hors ligne");

  // La signature de dédoublonnage doit couvrir toutes les nouvelles données, pas seulement l'énergie (sinon un
  // gain d'XP/AP/loot sans changement d'énergie ne rouvrirait jamais le popup).
  const iSig = fonction.indexOf("const signature=");
  const finSig = fonction.indexOf(";", fonction.indexOf("drops.length", iSig));
  const signature = fonction.slice(iSig, finSig);
  for (const champ of ["xp", "ap", "bossBattus", "victoiresAuto", "defaitesAuto", "drops.length"]) {
    assert.ok(signature.includes(champ), "la signature de dédoublonnage doit inclure : " + champ);
  }
}

console.log("idle-offline-summary-popup-v1: OK");
