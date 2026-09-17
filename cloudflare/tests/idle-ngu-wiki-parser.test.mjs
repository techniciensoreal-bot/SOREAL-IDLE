import assert from "node:assert/strict";
import {
  extractTemplateBlock,
  splitTemplateParams,
  unwrapWikiText,
  parseNguNumber,
  parseEnemyWikitext,
  extractPageWikitext
} from "../../design/parse-ngu-wiki.mjs";

/*
 * Norman (2026-09-17) : miroir local complet du wiki NGU Idle déjà sur le
 * disque (C:\Users\n0rma\Documents\NGU-Wiki\pages, 1109 pages, export API
 * MediaWiki brut). Ce test verrouille le parseur (design/parse-ngu-wiki.mjs)
 * contre des extraits RÉELS de wikitext (copiés depuis le miroir, pas
 * inventés), couvrant les 3 formes rencontrées :
 *  1) template simple, un paramètre par ligne (A Small Piece of Fluff) ;
 *  2) template dont la fermeture "}}" est sur la MÊME ligne que le
 *     dernier paramètre, params sur une seule ligne séparés par "|"
 *     (A Bulldozer) ;
 *  3) template avec `boss=yes` (ennemi couronné d'Aventure) et des
 *     wikiliens `[[Page|Affichage]]` en bf_prev/bf_next (A Bird Person).
 */

// --- 1) A Small Piece of Fluff : boss 1, déjà vérifié à la main cette
// session (hp=40, power=7, toughness=6, attack_rate=1, hp_regen=1,
// bf_hp=500000, bf_power=50000, bf_toughness=40000, bf_hp_regen=40,
// bf_exp="0 (2 first time ever)").
const WIKITEXT_FLUFF = `{{stub}}
{{Enemy
|location=Tutorial Zone
|type=normal
|attack_rate=1
|power=7
|toughness=6
|hp_regen=1
|hp=40
|bf_number=1
|bf_exp=0 (2 first time ever)
|bf_power=5.000E+04
|bf_toughness=4.000E+04
|bf_hp_regen=4.000E+01
|bf_hp=5.000E+05
|bf_next = [[Floating Sewage]]
|bf_prev = None
}}

'''A Small Piece of Fluff''' is the 1st boss you encounter in [[Boss Fights]].`;

const fluff = parseEnemyWikitext(WIKITEXT_FLUFF, "A Small Piece of Fluff");
assert.ok(fluff, "Le template Enemy de A Small Piece of Fluff doit être reconnu.");
assert.equal(fluff.location, "Tutorial Zone");
assert.equal(fluff.type, "normal");
assert.equal(fluff.attackRate, 1);
assert.equal(fluff.power, 7);
assert.equal(fluff.toughness, 6);
assert.equal(fluff.hpRegen, 1);
assert.equal(fluff.hp, 40);
assert.equal(fluff.bfNumber, 1);
assert.equal(fluff.bfExp, "0 (2 first time ever)");
assert.equal(fluff.bfExpValue, 0);
assert.equal(fluff.bfPower, 50000);
assert.equal(fluff.bfToughness, 40000);
assert.equal(fluff.bfHpRegen, 40);
assert.equal(fluff.bfHp, 500000);
assert.equal(fluff.bfNext, "Floating Sewage");
assert.equal(fluff.bfPrev, "None");
assert.equal(fluff.isAdventureBoss, false);

// --- 2) A Bulldozer : fermeture "}}" sur la même ligne que le dernier
// paramètre, plusieurs paramètres séparés par "|" sur une seule ligne --
// vérifie que le découpage ne dépend jamais des retours à la ligne.
const WIKITEXT_BULLDOZER = `{{stub}}
{{Enemy
|image=228.png
|location=Construction Zone
|type=normal
|attack_rate=1.0
|power=4.000E+31
|toughness=4.200E+31
|hp_regen=4.200E+30
|hp=2.700E+33|bf_number=228
|bf_prev=[[A Cement Truck]]
|bf_next=[[3 Guys Carrying a Beam]]}}

'''A Bulldozer''' is a monster you battle in [[Adventure Mode]].`;

const bulldozer = parseEnemyWikitext(WIKITEXT_BULLDOZER, "A Bulldozer");
assert.ok(bulldozer, "Le template Enemy de A Bulldozer doit être reconnu malgré la fermeture '}}' collée au dernier paramètre.");
assert.equal(bulldozer.location, "Construction Zone");
assert.equal(bulldozer.hp, 2.7e33);
assert.equal(bulldozer.bfNumber, 228);
assert.equal(bulldozer.bfPrev, "A Cement Truck");
assert.equal(bulldozer.bfNext, "3 Guys Carrying a Beam");
// Pas d'onglet Boss Fight complet sur cette fiche (pas de bf_power/etc.) :
// jamais une valeur inventée pour combler l'absence.
assert.equal(bulldozer.bfPower, null);

// --- 3) A Bird Person : boss=yes (ennemi couronné d'Aventure) + lien
// wiki avec libellé différent en bf_prev.
const WIKITEXT_BIRD_PERSON = `{{Enemy
|boss=yes
|location=The Sky
|type=rapid
|attack_rate=1.3
|power=340
|toughness=340
|hp_regen=25
|hp=9000
|bf_number=47
|bf_exp=3
|bf_power=1.984E+44
|bf_toughness=1.068E+44
|bf_hp_regen=3.052E+40
|bf_hp=1.984E+45
|bf_prev = [[A Weird Two-Headed Guy]]
|bf_next = [[The Bouncer]]
}}`;

const birdPerson = parseEnemyWikitext(WIKITEXT_BIRD_PERSON, "A Bird Person");
assert.ok(birdPerson, "Le template Enemy de A Bird Person doit être reconnu.");
assert.equal(birdPerson.isAdventureBoss, true, "boss=yes doit être détecté comme ennemi couronné d'Aventure.");
assert.equal(birdPerson.location, "The Sky");
assert.equal(birdPerson.bfExpValue, 3);

// --- Fonctions utilitaires isolées ---
assert.equal(unwrapWikiText("[[Floating Sewage]]"), "Floating Sewage");
assert.equal(unwrapWikiText("[[Michelangelo, Leonardo, Raphael and Donatello (Again)|Michelangelo, Leonardo, Raphael and Donatello]]"), "Michelangelo, Leonardo, Raphael and Donatello");
assert.equal(unwrapWikiText("None"), "None");

assert.equal(parseNguNumber("5.000E+04").value, 50000);
assert.equal(parseNguNumber("40").value, 40);
assert.equal(parseNguNumber("0 (2 first time ever)").value, 0);
assert.equal(parseNguNumber("").value, null);

// splitTemplateParams : un "|" à l'intérieur d'un lien wiki ne doit pas
// être traité comme un séparateur de paramètre.
const block = extractTemplateBlock("{{Enemy|bf_prev=[[Page|Affichage avec | dedans]]|hp=1}}", "Enemy");
assert.ok(block, "extractTemplateBlock doit trouver le bloc complet.");
const params = splitTemplateParams(block);
const byKey = Object.fromEntries(params.map(p => [p.key, p.value]));
assert.equal(byKey.hp, "1", "Le paramètre après un lien contenant '|' doit rester correctement séparé.");
assert.equal(byKey.bf_prev, "[[Page|Affichage avec | dedans]]");

// extractPageWikitext : forme exacte d'un export API MediaWiki.
const pageJson = {
  query: { pages: { "3887": { title: "A Small Piece of Fluff", revisions: [{ slots: { main: { "*": WIKITEXT_FLUFF } } }] } } }
};
const extracted = extractPageWikitext(pageJson);
assert.equal(extracted.title, "A Small Piece of Fluff");
assert.ok(extracted.wikitext.includes("{{Enemy"));

// Une page sans template Enemy exploitable (aucun champ utile) doit être
// ignorée, jamais faire planter le parseur.
assert.equal(parseEnemyWikitext("{{stub}}\nAucun contenu utile.", "Page vide"), null);
assert.equal(parseEnemyWikitext("{{Enemy}}", "Enemy vide"), null);

console.log("idle-ngu-wiki-parser: OK");
