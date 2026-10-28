/*
 * Pont entre le jeu (la page) et l'application Windows : seulement ce que le jeu a le droit de demander (ajout à Steam). Rien d'autre n'est exposé, aucun accès au système de fichiers ni à Node.
 */
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("sorealDesktop", {
  version: 1,
  steamEtat: () => ipcRenderer.invoke("steam:etat"),
  /* art : { grille, portrait, hero } en images PNG (adresses « data: »), composées par la page à partir de la bannière du jeu */
  steamAjouter: (art) => ipcRenderer.invoke("steam:ajouter", art)
});
