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
  "systemes.portraits"
]);

/*
 * Pièces d'ÉTAT stables d'une synchro à l'autre (mesuré en production le 2026-10-02 : identiques entre deux synchros consécutives tant que le joueur ne fait rien
 * qui les touche). Même mécanisme que les catalogues, avec une différence : le pont du client en garde une copie TEXTE et en rend une copie neuve à chaque
 * remise en place (le jeu modifie ces objets sur place pour répondre tout de suite aux clics ; une copie partagée garderait ces modifications locales).
 * Un enfant de systemes.systems de plus de 1 000 caractères est lui aussi une pièce (chaque système change séparément).
 */
export const IDLE_PIECES_ETAT_CHEMINS_V1 = Object.freeze([
  "systemes.adventure.zones",
  "systemes.adventure.titans",
  "systemes.achievements",
  "systemes.ngus",
  "systemes.bonuses",
  "systemes.expShop",
  "systemes.augmentations",
  "systemes.yggExtra",
  "systemes.yggFruits",
  /* Mesurés sur le compte réel le 2026-10-02 (stables entre deux synchros) : sac, coffre, liste d'objets, cartes, collections. */
  "systemes.adventure.inventory",
  "systemes.adventure.coffreSlots",
  "systemes.adventure.itemList",
  "systemes.cards",
  "collections"
]);
export const IDLE_PIECE_SYSTEME_TAILLE_MIN_V1 = 1000;

function cheminsSystemesV1(joueur) {
  const systems = joueur && joueur.systemes && joueur.systemes.systems;
  /* En production `systems` est un tableau (un élément par système) ; un objet indexé par identifiant est géré de la même façon. */
  if (!systems || typeof systems !== "object") return [];
  return Object.keys(systems).filter((id) => /^[A-Za-z0-9_-]+$/.test(id) && JSON.stringify(systems[id]).length > IDLE_PIECE_SYSTEME_TAILLE_MIN_V1).map((id) => "systemes.systems." + id);
}

/*
 * Tableaux omis LIGNE PAR LIGNE (Norman, 2026-10-02) : `bossCatalogue` pèse 320 Ko (300 boss, dont 215 Ko d'histoires) mais seules quelques lignes changent
 * d'une synchro à l'autre (ex. puissanceMinimum). Une empreinte par ligne : le client annonce `catalogHashes["<chemin>[]"]` = « h0,h1,… » (ce qu'il possède) ;
 * les lignes identiques sont remplacées par `null` dans la réponse, qui indique en plus `tableauxGardes[<chemin>]` = indices des lignes réellement envoyées.
 * Le pont du client remet les lignes en place (copies neuves, comme les pièces d'état) avant que le jeu ne voie la réponse.
 */
export const IDLE_TABLEAUX_CHEMINS_V1 = Object.freeze(["bossCatalogue", "bestiaire.entrees"]);
export const IDLE_TABLEAU_LIGNES_MIN_V1 = 20;

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
  const copier = (o) => (Array.isArray(o) ? o.slice() : Object.assign({}, o));
  const copie = copier(objet);
  let courant = copie;
  for (let i = 0; i < parties.length - 1; i += 1) {
    const suivant = courant[parties[i]];
    if (!suivant || typeof suivant !== "object") return null;
    courant[parties[i]] = copier(suivant);
    courant = courant[parties[i]];
  }
  /* Dans un tableau, l'élément omis devient `null` (jamais un trou) : le pont du client le remet en place avant que le jeu ne le voie. */
  if (Array.isArray(courant)) courant[Number(parties[parties.length - 1])] = null;
  else delete courant[parties[parties.length - 1]];
  return copie;
}

/* Remplace `chemin` par `valeur` dans une COPIE (copie à l'écriture le long du chemin). */
function avecValeur(objet, chemin, valeur) {
  const parties = chemin.split(".");
  const copier = (o) => (Array.isArray(o) ? o.slice() : Object.assign({}, o));
  const copie = copier(objet);
  let courant = copie;
  for (let i = 0; i < parties.length - 1; i += 1) {
    const suivant = courant[parties[i]];
    if (!suivant || typeof suivant !== "object") return null;
    courant[parties[i]] = copier(suivant);
    courant = courant[parties[i]];
  }
  courant[parties[parties.length - 1]] = valeur;
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
  const etat = IDLE_PIECES_ETAT_CHEMINS_V1.concat(cheminsSystemesV1(joueur));
  const vifs = [];
  for (const chemin of IDLE_CATALOGUES_CHEMINS_V1.concat(etat)) {
    const valeur = lire(joueur, chemin);
    if (valeur === undefined) continue;
    if (etat.includes(chemin)) vifs.push(chemin);
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
  const gardes = {};
  for (const chemin of IDLE_TABLEAUX_CHEMINS_V1) {
    const tableau = lire(joueur, chemin);
    if (!Array.isArray(tableau) || tableau.length < IDLE_TABLEAU_LIGNES_MIN_V1) continue;
    const lignes = tableau.map((ligne) => empreinteTexteV1(JSON.stringify(ligne === undefined ? null : ligne)));
    hashes[chemin + "[]"] = lignes.join(",");
    const connues = typeof connus[chemin + "[]"] === "string" ? connus[chemin + "[]"].split(",") : [];
    if (!connues.length) continue;
    const envoyees = [];
    const copie = tableau.map((ligne, i) => {
      if (connues[i] === lignes[i]) return null;
      envoyees.push(i);
      return ligne;
    });
    if (envoyees.length === tableau.length) continue;
    const allege = avecValeur(joueur, chemin, copie);
    if (allege) {
      joueur = allege;
      gardes[chemin] = envoyees;
    }
  }
  const sortie = Object.assign({}, reponse, { joueur, cataloguesHashes: hashes });
  if (omis.length) sortie.cataloguesOmis = omis;
  if (vifs.length) sortie.cataloguesVifs = vifs;
  if (Object.keys(gardes).length) sortie.tableauxGardes = gardes;
  return sortie;
}
