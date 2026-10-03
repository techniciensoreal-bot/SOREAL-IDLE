import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, idleNguSnapshot, applyIdleNguAction, IDLE_NGU_EXP_SHOP_V1 } from "../src/idle-ngu-progression.js";

/*
 * Rayon « Toc » + « Synchro Basic Training » + chiffres de vie fixes (Norman, 2026-10-02).
 * Le prix de la Synchro (50 EXP) est un choix SOREAL (achat original, absent du wiki NGU Idle).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// 1. Serveur : prix du tri, nouvel achat, drapeau annoncé au client.
{
  assert.equal(IDLE_NGU_EXP_SHOP_V1.sortInventory.cost(0), 20, "Trier l'inventaire : 20 EXP");
  assert.equal(IDLE_NGU_EXP_SHOP_V1.syncBasicTraining.max, 1, "achat unique");
  assert.ok(IDLE_NGU_EXP_SHOP_V1.syncBasicTraining.cost(0) > 0);
  const ctx = { bosses: 100 };
  let etat = normalizeIdleNguState({}, ctx, 1_000_000);
  etat.currencies.experience = 500;
  assert.equal(idleNguSnapshot(etat, ctx, 2_000_000).bonuses.basicTrainingSync, false, "pas d'achat : pas de synchro");
  etat = applyIdleNguAction(etat, { action: "buyExpShop", item: "syncBasicTraining", quantity: 1 }, ctx, 0).state;
  const achete = idleNguSnapshot(etat, ctx, 2_000_000);
  assert.equal(achete.bonuses.basicTrainingSync, true);
  assert.equal(etat.bonuses.expShop.syncBasicTraining, 1, "état stocké lu par le moteur pour annoncer basicTrainingSynchro");
  assert.ok(achete.expShop.some((it) => it.id === "syncBasicTraining"));
  assert.ok(runtime.includes("basicTrainingSynchro:"), "le drapeau est un champ de premier niveau de l'état joueur");
}

// 2. Client : la logique de répartition de la paire (fonction pure extraite du jeu).
{
  const debut = ui.indexOf("function planSynchroBasicTrainingIdleV1_(");
  const fin = ui.indexOf("function presetBasicTrainingIdleV120_(");
  assert.ok(debut > 0 && fin > debut);
  const plan = new Function(ui.slice(debut, fin) + "\nreturn planSynchroBasicTrainingIdleV1_;")();
  const sk = (courant, cap) => ({ courant, cap });

  // Exemple de Norman : cap 241 chacune, 482 d'énergie générée -> les deux au plafond.
  assert.deepEqual(plan("cap", sk(0, 241), sk(0, 241), 482, 1), { a: 241, b: 241 });
  // Surplus laissé dans l'énergie disponible (jamais consommé).
  assert.deepEqual(plan("cap", sk(0, 241), sk(0, 241), 1000, 1), { a: 241, b: 241 });
  // Pas assez pour les deux : l'énergie disponible est coupée en deux parts égales.
  assert.deepEqual(plan("cap", sk(0, 241), sk(0, 241), 200, 1), { a: 100, b: 100 });
  assert.deepEqual(plan("cap", sk(0, 241), sk(0, 241), 201, 1), { a: 100, b: 100 }, "le reste impair reste libre");
  // Une barre déjà pleine ne reçoit rien.
  assert.deepEqual(plan("cap", sk(241, 241), sk(40, 241), 1000, 1), { a: 241, b: 241 });
  // + : l'Input est ajouté aux deux au même moment.
  assert.deepEqual(plan("plus", sk(10, 241), sk(10, 241), 482, 125), { a: 135, b: 135 });
  assert.deepEqual(plan("plus", sk(10, 241), sk(10, 241), 100, 125), { a: 60, b: 60 }, "pas assez : deux parts égales");
  assert.deepEqual(plan("plus", sk(10, 241), sk(10, 241), 0, 125), { a: 10, b: 10 });
  // − : l'Input est retiré des deux, jamais sous 0.
  assert.deepEqual(plan("moins", sk(200, 241), sk(50, 241), 0, 125), { a: 75, b: 0 });
}

// 3. Câblage client : paires, case sous Input réservée à l'achat, branche de synchro.
{
  for (const [a, b] of [["attaque_passive", "blocage"], ["attaque_reguliere", "defense_renforcee"], ["attaque_renforcee", "recuperation"], ["contre_palette", "boost_offensif"], ["percee_quai", "charge_logistique"], ["ultime_soreal", "ultime_logistique"]]) {
    assert.ok(ui.includes(a + ":'" + b + "'," + "") || ui.includes(a + ":'" + b + "'\n") || ui.includes(a + ":'" + b + "',"), "paire " + a + " / " + b);
    assert.ok(ui.includes(b + ":'" + a + "'"), "paire inverse " + b + " / " + a);
  }
  assert.ok(ui.includes("${synchroBasicTrainingAcheteIdleV1_()?`") && ui.includes('id="sorealIdleTrainingSynchroV1"'), "case sous Input, seulement après l'achat");
  assert.ok(ui.includes("if(!idleEtat||!synchroBasicTrainingAcheteIdleV1_())return false;"), "sans achat, jamais de synchro même si une ancienne préférence existe");
  /* Après un Rebirth (Norman, 2026-10-03) : un champ absent ne fait pas perdre l'achat ; seul un « non » explicite l'efface. */
  assert.ok(ui.includes("if(idleEtat&&typeof idleEtat.basicTrainingSynchro==='boolean')idleBtSynchroAcheteV1=idleEtat.basicTrainingSynchro;"), "achat mémorisé, effacé seulement par un « non » explicite");
  assert.ok(ui.includes("const synchro=!!(jumelle&&jumelle.unlocked);"), "la jumelle doit être débloquée");
}

// 4. Boutique : rayon Toc (Trier l'inventaire + Synchro), plus dans Débuts.
{
  assert.ok(meta.includes("{id:'toc',icone:'🧰',nom:'Toc'}"));
  assert.ok(meta.includes("const IDLE_EXP_TOC_V1=['sortInventory','syncBasicTraining'];"));
  const debuts = meta.match(/const IDLE_EXP_DEBUTS_V1=\[[^\]]*\]/)[0];
  assert.ok(!debuts.includes("sortInventory"), "Trier l'inventaire a quitté Débuts");
  assert.ok(meta.includes("syncBasicTraining:'🔗 Synchro Basic Training'"));
}

// 5. Chiffres de vie fixes : case des PV actuels à largeur constante, alignée à droite.
{
  assert.ok(ui.includes("soreal-idle-hp-cur-v1") && ui.includes("'calc('+(Math.max(m[3].length,6)+1)+'ch + .5em)'"), "largeur constante de la case des PV actuels");
  const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
  assert.ok(/\.soreal-idle-hp-cur-v1\{[^}]*display:inline-block;[^}]*text-align:right;/.test(css));
}
console.log("idle-bt-synchro-v1: OK");
