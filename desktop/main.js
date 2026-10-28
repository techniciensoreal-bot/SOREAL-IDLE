/*
 * SOREAL IDLE pour Windows — lanceur (Norman, 2026-10-28 : « je ne dois plus jamais avoir à réinstaller l'exe, il recevra juste des mises à jour »).
 * Ce fichier est le SEUL qui ne change plus jamais : il choisit le cœur de l'application (coeur.js, le processus principal) et le charge. Le cœur de la dernière mise à jour installée est préféré à celui de l'installateur,
 * mais seulement s'il a déjà prouvé qu'il démarre : avant de le charger, on écrit un témoin (maj/coeur-essai.json) que le cœur efface lui-même quand la fenêtre est restée ouverte 20 s. Si un témoin est encore là au
 * démarrage suivant, ce cœur n'a pas tenu : il est mis sur la liste des refusés (maj/coeur-refuse.json) et on revient au cœur de l'installateur ; un cœur qui plante dès son chargement est refusé tout de suite.
 * Ce qui ne peut PAS être mis à jour : ce lanceur, l'exécutable Electron lui-même et l'installateur (donc l'icône de l'exécutable : celle de la fenêtre et de la barre des tâches, elle, vient de la mise à jour).
 */
const { app } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

global.__SOREAL_RACINE_APP__ = __dirname;

const lireJson = (f, defaut) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (_e) { return defaut; } };
const ecrireJson = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch (_e) { /* disque plein ou droits : pas de surveillance, on continue */ } };

function refuser(dossierMaj, dossier) {
  const f = path.join(dossierMaj, "coeur-refuse.json");
  const liste = lireJson(f, []);
  if (Array.isArray(liste) && !liste.includes(dossier)) ecrireJson(f, liste.concat([dossier]).slice(-20));
}

/* Le cœur à charger : { chemin, dossier } ; dossier est vide pour celui de l'installateur. */
function choisirCoeur() {
  const embarque = { chemin: path.join(__dirname, "coeur.js"), dossier: "" };
  try {
    const dossierMaj = path.join(app.getPath("userData"), "maj");
    const etat = lireJson(path.join(dossierMaj, "etat.json"), null);
    const d = etat && typeof etat.codeDossier === "string" ? etat.codeDossier : "";
    if (!d || !/^[A-Za-z0-9._-]+$/.test(d)) return embarque;
    if (!fs.existsSync(path.join(dossierMaj, d, ".ok"))) return embarque;
    const chemin = path.join(dossierMaj, d, "code", "desktop", "coeur.js");
    if (!fs.existsSync(chemin)) return embarque;
    const refuses = lireJson(path.join(dossierMaj, "coeur-refuse.json"), []);
    if (Array.isArray(refuses) && refuses.includes(d)) return embarque;
    const temoin = path.join(dossierMaj, "coeur-essai.json");
    const precedent = lireJson(temoin, null);
    if (precedent && precedent.dossier === d) {          /* l'essai précédent n'a jamais été validé : ce cœur ne tient pas */
      refuser(dossierMaj, d);
      try { fs.rmSync(temoin, { force: true }); } catch (_e) { /* tant pis */ }
      return embarque;
    }
    ecrireJson(temoin, { dossier: d });
    global.__SOREAL_COEUR_VALIDE__ = () => { try { fs.rmSync(temoin, { force: true }); } catch (_e) { /* tant pis */ } };
    return { chemin, dossier: d, dossierMaj };
  } catch (_e) {
    return embarque;
  }
}

/* Une seule instance : le témoin d'essai ne doit être posé que par l'instance qui joue (une seconde instance se contente de passer la main à la première). */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  const coeur = choisirCoeur();
  try {
    require(coeur.chemin);
  } catch (e) {
    if (!coeur.dossier) throw e;
    console.error("Le cœur de la mise à jour ne se charge pas, retour à celui de l'installateur :", e && e.message || e);
    refuser(coeur.dossierMaj, coeur.dossier);
    global.__SOREAL_COEUR_VALIDE__ = undefined;
    try { fs.rmSync(path.join(coeur.dossierMaj, "coeur-essai.json"), { force: true }); } catch (_e) { /* tant pis */ }
    require(path.join(__dirname, "coeur.js"));
  }
}
