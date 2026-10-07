import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Jamais de retour en arrière (Norman, 2026-10-08) : une réponse calculée AVANT un état déjà reçu, mais arrivée APRÈS, ne doit jamais atteindre le jeu (boss qui revient, barres qui reculent, titan absent).
 */
const pont = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
const debut = pont.indexOf("const gardeRetourArriereBaseV1=");
const fin = pont.indexOf("window.__SOREAL_IDLE_GARDE_RETOUR_V1__=", debut);
assert.ok(debut > 0 && fin > debut, "garde présente dans le pont");
const traces = [];
const fenetre = { __SOREAL_IDLE_DIAG_V1__: { signaler: (cle, msg) => traces.push([cle, msg]) } };
function nouvelleGarde() {
  return new Function("window", pont.slice(debut, fin) + "\nreturn gardeRetourArriereV1_;")(fenetre);
}
const etat = (at, extra = {}) => Object.assign({ __serveurAtV1: at, bossVaincus: 66 }, extra);

// 1. Dans l'ordre : tout passe
{
  const g = nouvelleGarde();
  const a = etat(100), b = etat(200), c = etat(300);
  assert.equal(g("s", a).perimee, false);
  assert.equal(g("s", b).perimee, false);
  assert.equal(g("s", c).perimee, false);
}
// 2. Dans le désordre : la réponse ancienne arrivée en retard est remplacée par le dernier état connu
{
  const g = nouvelleGarde();
  const avant = etat(100, { bossVaincus: 66 });          // calculée avant la victoire
  const apres = etat(300, { bossVaincus: 67 });          // calculée après la victoire, arrivée en premier
  assert.equal(g("s", apres).perimee, false);
  const r = g("s", avant);                                // arrive en retard
  assert.equal(r.perimee, true, "réponse périmée détectée");
  assert.equal(r.joueur, apres, "le jeu reçoit le dernier état, jamais l'ancien");
  assert.equal(r.joueur.bossVaincus, 67, "le boss vaincu le reste");
  assert.equal(r.retardMs, 200);
}
// 3. Le même objet rejoué, ou un état de même instant, n'est pas périmé
{
  const g = nouvelleGarde();
  const a = etat(500);
  assert.equal(g("s", a).perimee, false);
  assert.equal(g("s", a).perimee, false);
  assert.equal(g("s", etat(500)).perimee, false, "même instant : accepté");
}
// 4. Autre session (changement de compte / partie) : repart de zéro ; état sans instant serveur : jamais touché
{
  const g = nouvelleGarde();
  assert.equal(g("A", etat(900)).perimee, false);
  assert.equal(g("B", etat(100)).perimee, false, "autre session : pas de comparaison avec l'autre compte");
  assert.equal(g("B", { bossVaincus: 1 }).perimee, false, "sans __serveurAtV1 : jamais ignoré");
}
// 5. Branchement dans l'appel réseau : l'état périmé est remplacé AVANT d'atteindre le jeu, les messages de l'action restent
const appel = pont.slice(pont.indexOf("const garde=gardeRetourArriereV1_(session,data.joueur);"));
assert.ok(appel.includes("if(garde.perimee){") && appel.indexOf("data.joueur=garde.joueur;") > 0 && appel.indexOf("data.joueur=garde.joueur;") < appel.indexOf("return data;"), "branché dans callIdleV1 sans toucher au reste de la réponse");

// 6. Détecteur de recul (diagnostic) : un état PLUS RÉCENT dont une valeur croissante a reculé est noté ; rien n'est noté sans recul ni lors d'une Renaissance
{
  const g = nouvelleGarde();
  const ren = (n, extra = {}) => Object.assign({ renaissance: { renaissances: n }, bossVaincus: 66, systemes: { adventure: { revision: 10 } } }, extra);
  g("d", Object.assign(ren(0), { __serveurAtV1: 100 }));
  g("d", Object.assign(ren(0, { bossVaincus: 67 }), { __serveurAtV1: 200 }));
  assert.equal(traces.length, 0, "progression normale : rien à signaler");
  g("d", Object.assign(ren(0, { bossVaincus: 66 }), { __serveurAtV1: 300 }));
  assert.equal(traces.length, 1, "boss vaincus en recul : signalé");
  assert.match(traces[0][1], /bossVaincus : 67 -> 66/);
  g("d", Object.assign(ren(1, { bossVaincus: 3 }), { __serveurAtV1: 400 }));
  assert.equal(traces.length, 1, "Renaissance : le nombre de boss vaincus peut retomber sans alerte");
  g("d", Object.assign(ren(1, { bossVaincus: 3, systemes: { adventure: { revision: 4 } } }), { __serveurAtV1: 500 }));
  assert.equal(traces.length, 2, "révision d'Aventure en recul : signalée");
  assert.ok(pont.includes("window.__SOREAL_IDLE_DERNIER_ETAT_SERVEUR_V1__="), "dernier état serveur exposé pour la trace des victoires");
}
console.log("idle-garde-retour-arriere-v1: OK");
