import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { lireValidationsVoixV1, definirValidationVoixV1, lireTextesV1, surchargesPourJoueurV1 } from "../src/idle-textes-v1.js";
import { lireSrc } from "./_src-sources.mjs";

/*
 * Norman (2026-10-28) : « dans l'éditeur de voix, pour n'importe quel texte, un bouton rouge de base ; un clic = jaune (validé mais peut mieux faire) ; un autre = vert (totalement validé) ; un autre = retour au rouge.
 * Dans la liste des voix de l'Admin, retrouver l'état de la chronique : uniquement la loupiotte rouge / jaune / verte, sans texte. »
 */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };

// 1. serveur : rouge = rien d'enregistré ; 1 jaune ; 2 vert ; 0 efface ; table à part (un texte d'origine peut être validé sans devenir « modifié »)
assert.deepEqual(lireValidationsVoixV1(sql), {}, "tout est rouge au départ");
assert.equal(definirValidationVoixV1(sql, "boss:1", 1), 1);
assert.equal(definirValidationVoixV1(sql, "sandwich", 2), 2);
assert.deepEqual(lireValidationsVoixV1(sql), { "boss:1": 1, sandwich: 2 });
assert.equal(definirValidationVoixV1(sql, "boss:1", 0), 0);
assert.deepEqual(lireValidationsVoixV1(sql), { sandwich: 2 }, "retour au rouge : la ligne disparaît");
assert.deepEqual(lireTextesV1(sql), [], "valider ne crée jamais un texte modifié");
for (const mauvais of [3, -1, "x", NaN]) assert.throws(() => definirValidationVoixV1(sql, "boss:1", mauvais), /TEXTE_VALIDATION_INVALIDE/);
for (const cle of ["", "a b", "x".repeat(81), "../etc"]) assert.throws(() => definirValidationVoixV1(sql, cle, 1), /TEXTE_CLE_INVALIDE/);

// 2. jamais envoyée aux joueurs
assert.ok(!JSON.stringify(surchargesPourJoueurV1(sql)).includes("sandwich"), "les joueurs ne reçoivent pas les validations");

// 3. opération administrateur, enregistrée et dans le contrat ; la liste Admin renvoie les validations
const runtime = lireSrc("idle-sqlite-runtime.js");
const contrat = JSON.parse(readFileSync("cloudflare/contracts/idle-protocol.json", "utf8")).operations;
assert.match(runtime, /^  definirValidationVoixAdminSorealIdle,$/m);
assert.ok(contrat.includes("definirValidationVoixAdminSorealIdle"));
const admin = readFileSync("cloudflare/src/idle-runtime-admin.js", "utf8");
const f = admin.slice(admin.indexOf("export function definirValidationVoixAdminSorealIdle"));
assert.ok(f.slice(0, f.indexOf("\n}")).includes("exigerAdminHistoiresSorealIdle_(sessionToken)"), "réservée à l'administrateur");
assert.ok(admin.includes("validations: lireValidationsVoixV1(__idleCtx.__idleSql)"), "la liste Admin renvoie les validations");

// 4. client : feu sans texte dans les listes, bouton à trois états dans l'éditeur, cycle rouge -> jaune -> vert -> rouge
const ui = readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
assert.ok(ui.includes("function etatFeu_(cle)") && ui.includes("(avant+1)%3"), "cycle à trois états");
assert.ok(ui.includes("feuHtml_('boss:'+b.numero)") && ui.includes("feuHtml_(cle)+'<span class=\"nom\">'"), "feu dans la liste des chroniques et des popups");
assert.ok(ui.includes("feuHtml_(edition.cle,true)") && ui.includes("if(act==='feu'){changerFeu_(edition.cle);return;}"), "bouton dans l'éditeur, pour n'importe quel texte");
assert.ok(!/<span class="stx-feu"[^>]*>[^<]+</.test(ui) && ui.includes("aria-hidden=\"true\"></span>"), "le feu de la liste ne contient aucun texte");
assert.ok(ui.includes("'#'+EDITEUR_ID+' button.stx-feu[data-etat=\"2\"]{background:#2fbf4a"), "couleurs reprises dans l'éditeur (la règle « #éditeur button » imposait sinon son fond)");
console.log("idle-voix-validation-v1: OK");
