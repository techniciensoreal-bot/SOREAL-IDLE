import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-09-27) : « Uniquement quand on est dans la zone tutoriel. Au dessus de l'inventaire, je veux une
 * phrase qui explique aux gens comment ça fonctionne. "Double tape pour équiper/fusionner des items" Boostez vos
 * items avec les boosts "1" que vous recevez. »
 *
 * Vérifié dans le code (inventory-auto-v1.js: TOUCHES={a:'boost',...}) : il n'existe PAS de touche « 1 » pour les
 * boosts. La vraie mécanique est la touche A + clic (PC), ou le double-tap sur un objet déjà équipé (mobile). Le
 * texte affiché doit donc décrire la mécanique réelle, jamais la touche « 1 » mentionnée par erreur par Norman.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// --- La fonction existe, est appelée dans la section sac, et ne mentionne jamais une touche "1". ---
{
  const debut = ui.indexOf("function indiceSacZoneTutorielIdleV1_(a){");
  assert.ok(debut > 0, "fonction d'indice introuvable");
  const fin = ui.indexOf("function pageInventaireIdleV28_(j){", debut);
  assert.ok(fin > debut, "fin de fonction introuvable");
  const bloc = ui.slice(debut, fin);

  assert.match(bloc, /zone!=='tutorial'\)return ''/, "l'indice ne doit s'afficher que dans la Zone Tutoriel");
  assert.match(bloc, /a&&a\.selectedZone/);
  assert.match(bloc, /a&&a\.lastCombatZone/, "doit retomber sur lastCombatZone comme safeZoneVisualZone_");
  assert.ok(!/Double-tapez un objet du sac pour l’équiper/.test(bloc), "plus de double-tap de base (2026-10-04) : il s'achète dans la boutique EXP");
  assert.match(bloc, /glissez-le sur un emplacement|clic droit sur PC/i, "explique les gestes de base : toucher, glisser, clic droit");
  assert.match(bloc, /g\.double\?'[^']*Double tap/i, "le Double tap n'est rappelé que si on l'a acheté");
  assert.match(bloc, /g\.triple\?'[^']*Triple tap/i, "le Triple tap n'est rappelé que si on l'a acheté");
  assert.match(bloc, /touche A/i, "doit expliquer la vraie mécanique de boost (touche A), jamais une touche « 1 »");
  assert.ok(!/touche\s*«?\s*1\s*»?/i.test(bloc), "ne doit jamais mentionner une touche « 1 » (mécanique inexistante)");
  assert.ok(!bloc.includes("boosts \"1\""), "ne doit jamais reprendre littéralement la formulation erronée de Norman");
}

assert.match(ui, /indiceSacZoneTutorielIdleV1_\(a\)\+/, "l'indice doit être inséré dans la page inventaire");

// --- Style associé présent et cache-busté ---
assert.ok(css.includes(".soreal-idle-v138-bag-indice-v1{"), "style de l'indice manquant");

// --- Comportement isolé : safe->tutorial affiche, safe->autre zone masque, zone explicite non-tutorial masque ---
{
  const debut = ui.indexOf("function indiceSacZoneTutorielIdleV1_(a){");
  const fin = ui.indexOf("\n      }\n", debut) + "\n      }\n".length;
  const source = ui.slice(debut, fin);
  let gestes = { double: false, triple: false };
  const sandbox = { gestesAchetesIdleV1_: () => gestes };
  vm.runInNewContext(source, sandbox);
  const fn = sandbox.indiceSacZoneTutorielIdleV1_;

  assert.notEqual(fn({ selectedZone: "safe", lastCombatZone: "tutorial" }), "", "safe + dernier combat tutoriel -> affiché");
  assert.equal(fn({ selectedZone: "safe", lastCombatZone: "forest" }), "", "safe + dernier combat ailleurs -> masqué");
  assert.equal(fn({ selectedZone: "forest" }), "", "zone explicite non-tutoriel -> masqué");
  assert.notEqual(fn({ selectedZone: "tutorial" }), "", "zone explicite tutoriel -> affiché");
  assert.notEqual(fn({}), "", "aucune zone connue (fallback tutorial via lastCombatZone par défaut) -> affiché");
  assert.notEqual(fn(null), "", "ne doit jamais planter sans données aventure (fallback tutorial)");
  // Gestes achetés : rappelés seulement si achetés.
  assert.ok(!/Double tap|Triple tap/.test(fn({ selectedZone: "tutorial" })), "sans achat : aucun rappel de geste");
  gestes = { double: true, triple: false };
  assert.ok(/Double tap sur un objet/.test(fn({ selectedZone: "tutorial" })) && !/Triple tap/.test(fn({ selectedZone: "tutorial" })));
  gestes = { double: true, triple: true };
  assert.ok(/Triple tap/.test(fn({ selectedZone: "tutorial" })));
}

console.log("idle-inventaire-indice-zone-tutoriel-v1: OK");
