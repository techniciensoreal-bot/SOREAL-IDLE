import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lireUiComplet } from "./_ui-sources.mjs";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const ui = lireUiComplet(), css = lire("public/soreal-idle-renaissance.css"), ngu = lireSrc("idle-ngu-progression.js"), live = lire("public/modules/rebirth-live-v1.js");
/* Norman (2026-10-15) : page Renaissance en deux colonnes (Partie précédente / Partie en cours), lignes à émojis, calculs en bas */
assert.ok(ui.includes("💀 Partie précédente") && ui.includes("🌱 Partie en cours") && ui.includes("Ce qui s’est éteint") && ui.includes("Ce qui vit encore") && ui.includes('class="rb2-colonnes"'), "deux colonnes");
for (const l of ["'🩸','Sang dépensé dans le rituel Boost du nombre par le sang'", "'⏱️','Durée'", "'👹','Boss le plus haut battu'", "'🔢','Number actif'"]) assert.ok(ui.includes("ligne(" + l), "ligne " + l);
assert.ok(ui.includes("sysSang.state.unlocked") && ui.includes("(sangDebloque?ligne('🩸'"), "anti-spoil : le sang seulement si Blood Magic est débloquée (règle n°2)");
assert.ok(ui.includes('id="sorealIdleRebirthTotalV1"') && ui.includes("sorealIdleRebirthRunV1"), "ids mis à jour par la synchro conservés");
assert.ok(ui.indexOf("rb2-colonnes") < ui.indexOf("Comment c’est calculé") && ui.indexOf("Comment c’est calculé") < ui.indexOf("Renaissances effectuées"), "les calculs restent tout en bas");
assert.ok(ui.includes("Nombre si tu renais maintenant") && ui.includes(">Variation<") && live.includes("'Nombre si tu renais maintenant'") && live.includes("valeurDe(bloc,'Variation')"), "libellés repris par le module de mise à jour en direct");
assert.ok(css.includes(".rb2-colonnes{display:grid;grid-template-columns:1fr 1fr") && css.includes("@media (max-width:480px)"), "style des colonnes (téléphone compris)");
/* Serveur : sang dépensé dans le sort Number mémorisé au Rebirth */
assert.ok(ngu.includes("const sangDepenseRun=Math.max(0,num(state.systems.bloodMagic?.data?.spells?.numberBoost,1)-1);") && ngu.includes("rb.lastBlood=sangDepenseRun;") && ngu.includes("out.lastBlood = Math.max(0, num(out.lastBlood, 0));"), "sang de la partie précédente gardé au Rebirth");
assert.ok(ngu.indexOf("const sangDepenseRun") < ngu.indexOf("rb.lastBlood=sangDepenseRun;"), "capturé avant la remise à zéro");
console.log("idle-renaissance-colonnes-v1: OK");

/* Style « les cieux, la vie, la mort » */
assert.ok(css.includes("rb2-prec::after{content:\"☠️\"}") && css.includes('rb2-cours::after{content:"🌿"}') && css.includes("#sorealIdleBlocRenaissanceV27{background:radial-gradient(ellipse 62% 22%"), "ciel, mort, vie (le halo permanent du bouton est retiré : Norman, 2026-10-17)");
/* Le bonus de Magie du sang est toujours montré en bas une fois Blood Magic débloquée, même à ×1 */
assert.ok(ui.includes("(f.id==='bloodMagicBonus'&&sangDebloque)||") && ui.indexOf("const sangDebloque=") < ui.indexOf("const detailsFacteurs=IDLE_REBIRTH_FACTOR_LABELS_V1"), "bonus de Magie du sang toujours listé (si Blood Magic débloquée)");
