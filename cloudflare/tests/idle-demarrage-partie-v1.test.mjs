import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-10-26) : « la partie ne doit réellement commencer qu'à la fermeture du texte du premier boss ; on arrive sur la borne avec 250 d'énergie qui regénère jusqu'à 500 ; elle ne doit pas commencer dès qu'on reset ».
 * Un joueur tout neuf est « en attente » (stats.partieAttente) : tant qu'il n'a pas démarré, il compte comme nouveau joueur quel que soit le temps passé ; demarrerPartieSorealIdle remet l'énergie à 250 et l'horloge à maintenant, une seule fois.
 */
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

const g = creerJoueurExterneV1("depart" + Math.random().toString(36).slice(2) + "@example.com");
const run = (op, ...a) => g.op(op, "x", ...a);
const etat0 = run("obtenirEtatSorealIdle").joueur;
assert.equal(etat0.profil.nouveauJoueur, true, "joueur tout neuf");
assert.equal(etat0.profil.stats.partieAttente, true, "partie en attente de départ");
assert.equal(Math.round(etat0.energie), 250, "250 d'énergie au départ");

// 20 minutes passent (pseudo, intro, chronique) : sans le départ, l'énergie monterait et le joueur ne serait plus « nouveau ».
horloge += 20 * 60 * 1000;
const etat1 = run("synchroniserSorealIdle").joueur;
assert.equal(etat1.profil.nouveauJoueur, true, "toujours nouveau joueur tant que la partie n'a pas démarré, même après 20 minutes");
assert.ok(etat1.energie > 250, "l'énergie a avancé pendant l'attente (c'est ce que le départ annule) : " + etat1.energie);

const depart = run("demarrerPartieSorealIdle");
assert.equal(depart.ok, true);
assert.equal(depart.demarre, true);
const etat2 = run("synchroniserSorealIdle").joueur;
assert.ok(etat2.energie >= 250 && etat2.energie < 262, "250 d'énergie à l'arrivée sur la borne (" + etat2.energie + ")");
assert.equal(etat2.profil.stats.partieAttente, false, "le drapeau tombe");
assert.equal(etat2.profil.nouveauJoueur, true, "nouveau joueur pendant le tutoriel de départ (horloge repartie de maintenant)");

// Ensuite l'énergie regénère vers 500.
horloge += 30 * 1000;
const etat3 = run("synchroniserSorealIdle").joueur;
assert.ok(etat3.energie > etat2.energie, "l'énergie regénère après le départ (" + etat2.energie + " -> " + etat3.energie + ")");

// Un joueur déjà en route ne peut jamais remettre son énergie à 250.
const encore = run("demarrerPartieSorealIdle");
assert.equal(encore.demarre, false, "second appel sans effet");
const etat4 = run("synchroniserSorealIdle").joueur;
assert.ok(etat4.energie >= etat3.energie, "aucune remise à 250 une fois la partie commencée");

globalThis.Date = VraiDate;
console.log("idle-demarrage-partie-v1: OK");
