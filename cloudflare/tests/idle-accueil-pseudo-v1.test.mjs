import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

/*
 * Écran d'accueil (Norman, 2026-10-26) : une nouvelle partie (première ouverture ou remise à zéro) commence par un écran où le pseudo est OBLIGATOIRE ; bouton « Entrer dans Soreal IDLE » ; l'introduction ne part qu'ensuite ; pseudos uniques.
 */
const popups = readFileSync("cloudflare/public/modules/ui-popups-v1.js", "utf8");

// Client : l'écran existe, ne se ferme que sur la réponse du serveur, et passe AVANT l'introduction.
assert.ok(popups.includes("function afficherAccueilPseudoIdleV1_(j)") && popups.includes("Entrer dans Soreal IDLE"), "écran d'accueil et bouton");
assert.ok(popups.includes(".definirPseudoSorealIdle(SOREAL_SESSION,valeur)"), "le pseudo est validé par le serveur (unicité)");
assert.ok(popups.includes("if(!valeur){err.textContent="), "champ vide refusé côté écran aussi");
const corps = popups.slice(popups.indexOf("function gererPopupsProgressionIdleV75_(j)"));
const iAccueil = corps.indexOf("afficherAccueilPseudoIdleV1_(j)");
const iIntro = corps.indexOf("introductionPeutDemarrerIdleV1_()");
assert.ok(iAccueil > 0 && iIntro > iAccueil, "l'accueil passe avant l'introduction");
assert.ok(corps.includes("document.getElementById('sorealIdleAccueilV1'))return;"), "tant que l'écran est ouvert, rien d'autre ne démarre");
assert.ok(popups.includes("'soreal_idle_accueil_v1_'+generationJoueurIdleV75_(j)"), "une fois par partie (clé liée à la génération : rejoué après une remise à zéro)");
assert.ok(corps.includes("j.identite.externe"), "seulement les joueurs Google (les joueurs SOREAL gardent leur prénom)");
assert.ok(popups.includes("value=\"'+idleHtml_(id.pseudo||'')+'\""), "le pseudo existant est proposé d'office");

// Serveur : pseudo vide refusé, unique, jamais retiré.
const profil = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-profile-v1.js").href);
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
assert.equal(profil.definirPseudoProfilIdleV1(sql, "a@x.fr", "").ok, false, "pseudo vide refusé");
assert.equal(profil.definirPseudoProfilIdleV1(sql, "a@x.fr", "  ").code, "PSEUDO_VIDE");
assert.equal(profil.definirPseudoProfilIdleV1(sql, "a@x.fr", "Saka").ok, true);
assert.equal(profil.definirPseudoProfilIdleV1(sql, "b@x.fr", "saka").code, "PSEUDO_PRIS", "unique, sans tenir compte de la casse");
assert.equal(profil.definirPseudoProfilIdleV1(sql, "b@x.fr", "Sàkà").code, "PSEUDO_PRIS", "unique, sans tenir compte des accents");
assert.equal(profil.definirPseudoProfilIdleV1(sql, "a@x.fr", "Saka").ok, true, "garder son propre pseudo est permis");
assert.equal(profil.definirPseudoProfilIdleV1(sql, "a@x.fr", "").ok, false, "on ne peut pas retirer son pseudo");
assert.equal(profil.lireProfilIdleV1(sql, "a@x.fr").pseudo, "Saka", "le pseudo reste");

console.log("idle-accueil-pseudo-v1: OK");
