import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { lireUiComplet } from "./_ui-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, idleNguSnapshot, applyIdleNguAction, IDLE_NGU_EXP_SHOP_V1 } from "../src/idle-ngu-progression.js";
import { migrerEtatV1 } from "../src/idle-migrations-v1.js";

/*
 * Rayon « Toc » (Norman, 2026-10-02) et RETRAIT de la « Synchro Basic Training » (2026-11-16) : l'Insta Training Cap du jeu place déjà 6 en attaque ET 6 en défense à chaque Rebirth
 * (Rebirth::instaTrain, build 1260) ; l'achat, la case sous Input et le plan de répartition des paires n'existent plus. Les parties qui l'avaient achetée sont remboursées (migration 53 -> 54).
 */
const ui = lireUiComplet();
const meta = (readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta());
const runtime = lireSrc("idle-sqlite-runtime.js");

// 1. Serveur : le tri reste, la Synchro n'existe plus ni dans le catalogue ni dans l'état annoncé.
{
  assert.equal(IDLE_NGU_EXP_SHOP_V1.sortInventory.cost(0), 20, "Trier l'inventaire : 20 EXP");
  assert.equal(IDLE_NGU_EXP_SHOP_V1.syncBasicTraining, undefined, "plus d'achat Synchro Basic Training");
  const ctx = { bosses: 100 };
  let etat = normalizeIdleNguState({}, ctx, 1_000_000);
  etat.currencies.experience = 500;
  assert.throws(() => applyIdleNguAction(etat, { action: "buyExpShop", item: "syncBasicTraining", quantity: 1 }, ctx, 0), /ACHAT_EXP_INCONNU/);
  const snap = idleNguSnapshot(etat, ctx, 2_000_000);
  assert.equal(Object.prototype.hasOwnProperty.call(snap.bonuses, "basicTrainingSync"), false);
  assert.ok(!snap.expShop.some((it) => it.id === "syncBasicTraining"));
  assert.ok(!runtime.includes("basicTrainingSynchro:"), "plus de drapeau annoncé au client");
}

// 2. Migration : un compte qui avait acheté la Synchro est remboursé (50 EXP) une seule fois, l'achat disparaît.
{
  const ctx = { bosses: 100 };
  const ancien = normalizeIdleNguState({}, ctx, 1_000_000);
  ancien.etatVersion = 53;
  ancien.bonuses.expShop = { syncBasicTraining: 1, sortInventory: 1 };
  ancien.currencies.experience = 10;
  const r = migrerEtatV1(JSON.parse(JSON.stringify(ancien)), { now: 2_000_000, jeu: ctx, phase: "normalise" });
  assert.ok(r.jouees.includes("retrait-synchro-basic-training-v54"));
  assert.equal(r.etat.currencies.experience, 60, "remboursé de 50 EXP");
  assert.equal(r.etat.bonuses.expShop.syncBasicTraining, undefined);
  assert.equal(r.etat.bonuses.expShop.sortInventory, 1, "les autres achats restent");
  const encore = migrerEtatV1(r.etat, { now: 2_000_000, jeu: ctx, phase: "normalise" });
  assert.equal(encore.etat.currencies.experience, 60, "idempotent : jamais remboursé deux fois");
  // sans achat : aucun EXP ajouté
  const sans = normalizeIdleNguState({}, ctx, 1_000_000);
  sans.etatVersion = 53; sans.currencies.experience = 10;
  assert.equal(migrerEtatV1(JSON.parse(JSON.stringify(sans)), { now: 2_000_000, jeu: ctx, phase: "normalise" }).etat.currencies.experience, 10);
}

// 3. Client : plus de case, plus de plan de paire, plus de clé.
{
  for (const mort of ["sorealIdleTrainingSynchroV1", "planSynchroBasicTrainingIdleV1_", "synchroBasicTrainingAcheteIdleV1_", "IDLE_BT_SYNCHRO_CLE_V1", "basculerSynchroBasicTrainingIdleV1", "IDLE_BT_JUMELLES_V1", "basicTrainingSynchro"]) {
    assert.ok(!ui.includes(mort), mort + " a disparu du client");
  }
}

// 4. Boutique : rayon Toc (Trier l'inventaire, Synchro Wandoos, Menus animés), plus dans Débuts.
{
  assert.ok(meta.includes("{id:'toc',icone:'🧰',nom:'Toc'}"));
  assert.ok(meta.includes("const IDLE_EXP_TOC_V1=['sortInventory','syncWandoos','menuAnimations'];"));
  const debuts = meta.match(/const IDLE_EXP_DEBUTS_V1=\[[^\]]*\]/)[0];
  assert.ok(!debuts.includes("sortInventory"), "Trier l'inventaire a quitté Débuts");
  assert.ok(!meta.includes("Synchro Basic Training"));
}

// 5. Chiffres de vie fixes : case des PV actuels à largeur constante, alignée à droite.
{
  assert.ok(ui.includes("soreal-idle-hp-cur-v1") && ui.includes("'calc('+(Math.max(m[3].length,6)+1)+'ch + .5em)'"), "largeur constante de la case des PV actuels");
  const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
  assert.ok(/\.soreal-idle-hp-cur-v1\{[^}]*display:inline-block;[^}]*text-align:right;/.test(css));
}

// 6. Le bouton Max d'une barre redescend au cap (Norman, 2026-10-04) ; pas de faux message quand de l'énergie est rendue.
{
  assert.ok(ui.includes("cible=capBasicTrainingLocalIdleV120_(skill);\n\n            if(cible>courant){"), "cible = cap");
  assert.ok(ui.includes("action!=='moins'&&\n          delta===0&&\n          idleAvant<=0"), "pas de faux message quand l'énergie est rendue");
}
console.log("idle-bt-synchro-v1: OK");
