/*
 * Réponses plus légères (Norman, 2026-10-02 : « le jeu est très lent par moment »). Chaque réponse du serveur contenait ~326 Ko dont ~140 Ko de catalogues qui
 * ne changent presque jamais (objets, sets, perks, quirks, boutique Sellout, portraits) : renvoyés à CHAQUE action (boost, allocation, synchro…).
 *
 * Principe (aucune opération n'est renommée, aucun champ retiré : le contrat client/serveur ne change pas) : le client dit ce qu'il a déjà
 * (`catalogHashes` : empreinte de chaque pièce) ; le serveur n'envoie que les pièces dont l'empreinte diffère et indique les autres dans
 * `cataloguesOmis`. Le pont du client (public/standalone-bridge.js) les remet en place AVANT de rendre la réponse au jeu : le reste du client voit
 * toujours la réponse complète. Sans `catalogHashes` (premier appel, ancien client), la réponse est complète, comme avant.
 *
 * Les pièces sont comparées par empreinte de leur contenu réel : si une pièce dépend du joueur (ex. boutique Sellout après un achat), elle est renvoyée
 * dès qu'elle change ; aucune règle de jeu n'est en cause.
 */

/* Chemins (dans la réponse) des pièces candidates. Ajouter une ligne ici suffit : le pont du client est générique. */
export const IDLE_CATALOGUES_CHEMINS_V1 = Object.freeze([
  "systemes.adventure.itemCatalog",
  "systemes.adventure.setCatalog",
  "systemes.perkDefinitions",
  "systemes.quirkDefinitions",
  "systemes.selloutShop",
  "systemes.portraits",
  /* Mesuré en production le 2026-10-02 : 320 Ko sur les 526 Ko de CHAQUE réponse de synchro (une entrée par boss découvert, histoires comprises). La pièce est renvoyée dès que son contenu change (nouveau boss découvert). */
  "bossCatalogue"
]);

/* Empreinte cyrb53 : synchrone, identique côté serveur et dans les tests. */
export function empreinteTexteV1(texte) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < texte.length; i += 1) {
    const ch = texte.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function lire(objet, chemin) {
  let courant = objet;
  const parties = chemin.split(".");
  for (let i = 0; i < parties.length; i += 1) {
    if (!courant || typeof courant !== "object") return undefined;
    courant = courant[parties[i]];
  }
  return courant;
}

/* Retire `chemin` d'une COPIE (copie à l'écriture le long du chemin) : les objets d'origine, peut-être partagés ou mis en cache par le moteur, ne sont jamais modifiés. */
function sansChemin(objet, chemin) {
  const parties = chemin.split(".");
  const copie = Object.assign({}, objet);
  let courant = copie;
  for (let i = 0; i < parties.length - 1; i += 1) {
    const suivant = courant[parties[i]];
    if (!suivant || typeof suivant !== "object") return null;
    courant[parties[i]] = Object.assign({}, suivant);
    courant = courant[parties[i]];
  }
  delete courant[parties[parties.length - 1]];
  return copie;
}

/*
 * Retire de `reponse.joueur` les pièces que le client possède déjà et ajoute `cataloguesHashes` (empreinte de CHAQUE pièce présente) et `cataloguesOmis`
 * (chemins retirés). Renvoie une COPIE de `reponse` (l'originale n'est jamais modifiée). Sans objet `joueur` : renvoyée telle quelle.
 */
export function allegerCataloguesV1(reponse, hashesClient) {
  let joueur = reponse && typeof reponse === "object" ? reponse.joueur : null;
  if (!joueur || typeof joueur !== "object") return reponse;
  const connus = hashesClient && typeof hashesClient === "object" ? hashesClient : {};
  const hashes = {};
  const omis = [];
  for (const chemin of IDLE_CATALOGUES_CHEMINS_V1) {
    const valeur = lire(joueur, chemin);
    if (valeur === undefined) continue;
    const h = empreinteTexteV1(JSON.stringify(valeur));
    hashes[chemin] = h;
    if (connus[chemin] === h) {
      const allege = sansChemin(joueur, chemin);
      if (allege) {
        joueur = allege;
        omis.push(chemin);
      }
    }
  }
  const sortie = Object.assign({}, reponse, { joueur, cataloguesHashes: hashes });
  if (omis.length) sortie.cataloguesOmis = omis;
  return sortie;
}
