/*
 * Pont entre le jeu (la page) et l'application Windows : seulement ce que le jeu a le droit de demander (ajout à Steam). Rien d'autre n'est exposé, aucun accès au système de fichiers ni à Node.
 */
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("sorealDesktop", {
  version: 1,
  steamEtat: () => ipcRenderer.invoke("steam:etat"),
  /* art : { grille, portrait, hero } en images PNG (adresses « data: »), composées par la page à partir de la bannière du jeu */
  steamAjouter: (art) => ipcRenderer.invoke("steam:ajouter", art),
  /* mises à jour : « maj proposée » (ou rien), installation, et les événements (proposition, progression) */
  majEtat: () => ipcRenderer.invoke("maj:etat"),
  majInstaller: () => ipcRenderer.invoke("maj:installer"),
  /* liaison au compte Google (Réglages > Ma partie) */
  liaisonEtat: () => ipcRenderer.invoke("liaison:etat"),
  /* quel cœur de l'application tourne (absent du cœur d'origine : la page s'en sert pour dire quoi faire) */
  coeurVersion: () => ipcRenderer.invoke("coeur:version"),
  liaisonDemarrer: () => ipcRenderer.invoke("liaison:demarrer"),
  liaisonSur: (rappel) => {
    ipcRenderer.on("liaison:progression", (_ev, p) => rappel({ type: "progression", progression: p }));
    ipcRenderer.on("liaison:expiree", () => rappel({ type: "expiree" }));
  },
  majSur: (rappel) => {
    ipcRenderer.on("maj:proposee", (_ev, m) => rappel({ type: "proposee", maj: m }));
    ipcRenderer.on("maj:progression", (_ev, p) => rappel({ type: "progression", progression: p }));
  }
});
