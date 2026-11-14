import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Audit 2026-11-14 (règle n°2) : la réponse d'un joueur NEUF ne contient plus les zones legacy fermées, les sets (total, description, noms de pièces), les sorts d'une magie fermée ni les déblocages des menus fermés.
 * Mesuré avec la vraie graine de production quand elle est là (fichier local, absent en CI) ; sinon seules les garanties de structure sont vérifiées.
 */
const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const { creerEnvLocal } = await import(pathToFileURL(path.join(DEPOT, "desktop", "src", "env-local.mjs")).href);
const FICHIER_GRAINE = path.join(DEPOT, "desktop", "graine", "catalogue.json");
const graine = fs.existsSync(FICHIER_GRAINE) ? JSON.parse(fs.readFileSync(FICHIER_GRAINE, "utf8")) : null;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "soreal-spoil-"));
const env = await creerEnvLocal({ racineDepot: DEPOT, dossierPublic: path.join(DEPOT, "cloudflare", "public"), dossiersMedias: [path.join(tmp, "m")], fichierBase: path.join(tmp, "base", "soreal-idle.sqlite"), fichierIndex: path.join(tmp, "idx.json"), graine,
  utilisateur: { email: "joueur@soreal-idle.local", emailConnexion: "joueur@soreal-idle.local", emails: ["joueur@soreal-idle.local"], prenom: "Joueur" } });
const get = (c, init) => env.fetch(new Request("http://soreal-idle.local" + c, init));
const page = await (await get("/")).text();
const m = page.match(/setItem\("soreal_idle_google_session_v1","(.*?)"\)/);
const s = JSON.parse(JSON.parse('"' + m[1] + '"'));
const r = JSON.parse(await (await get("/api/v1/call", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + s.token }, body: JSON.stringify({ operation: "obtenirEtatSorealIdle", args: [s.token] }) })).text());
const j = r.joueur || (r.resultat && r.resultat.joueur) || r;
assert.ok(j && j.aventure, "état du joueur reçu");

assert.ok(j.aventure.zones.every((z) => z.debloquee === true), "aventure.zones : aucune zone fermée (nom, ennemi, boss requis, puissances)");
assert.ok(j.collections.zones.every((z) => z.total === undefined && z.description === undefined && z.objets.every((o) => o.decouvert)), "collections : ni total, ni description, ni pièce non découverte");
assert.equal(j.collections.zones.length, 0, "collections : aucun set pour un joueur neuf");
if (!j.magie.debloquee) assert.deepEqual(j.magie.sorts, [], "magie fermée : aucun sort envoyé");
assert.ok(Object.values(j.deblocages).every((d) => d.niveau <= Math.max(1, j.niveau)), "déblocages : seulement ceux déjà atteints");
for (const fermé of ["augmentations", "avance", "machine", "sang", "ngu"]) assert.equal(j.deblocages[fermé], undefined, "déblocage fermé non envoyé : " + fermé);
// Systèmes verrouillés : ni libellés de facteurs, ni « bats le boss N » des achats fermés, ni noms de sets des MacGuffins, ni réglages des cartes.
const sy = j.systemes;
assert.equal(sy.bonuses.facteursStats, undefined, "bonuses : pas de libellés de systèmes verrouillés");
for (const [res, stats] of Object.entries(sy.resourcePurchases)) for (const [stat, achat] of Object.entries(stats)) if (!(sy.resourcePurchaseUnlock[res] && sy.resourcePurchaseUnlock[res][stat] && sy.resourcePurchaseUnlock[res][stat].unlocked)) assert.equal(achat.unlockBoss, undefined, "achat fermé sans boss à battre : " + res + "." + stat);
for (const u of Object.values(sy.resourcePurchaseUnlock || {})) for (const v of Object.values(u)) assert.equal(v.neededBosses, undefined, "pas de neededBosses");
if (!sy.macguffins.unlocked) assert.deepEqual(sy.macguffins.slotBreakdown, {}, "MacGuffins fermés : aucun nom de set");
if (!sy.cards.unlocked) { assert.deepEqual(sy.cards.mayoCostRange, [0, 0]); assert.equal(sy.cards.chonkers, false); }
// Les compétences manuelles d'Aventure verrouillées ne sont pas dessinées (règle n°2).
const ui = fs.readFileSync(path.join(DEPOT, "cloudflare", "public", "modules", "ui-aventure-1-v1.js"), "utf8");
assert.ok(ui.includes("IDLE_ADVENTURE_MANUAL_ATTACKS_V3.filter(function(def){return competenceAdventureDisponibleIdleV4_(def,'attack',a);})") && ui.includes("IDLE_ADVENTURE_MANUAL_DEFENSE_V3.filter(function(def){return competenceAdventureDisponibleIdleV4_(def,'defense',a);})"), "compétences verrouillées non dessinées");
console.log("idle-anti-spoil-etat-joueur-neuf-v1 : OK");
