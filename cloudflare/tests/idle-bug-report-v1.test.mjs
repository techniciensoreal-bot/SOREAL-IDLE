import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * « Signaler un bug » (2026-09-26, Norman) : bouton dans Settings ; PAS de mail. Le message est enregistré, l'administrateur les lit dans l'appli et les
 * supprime une fois le souci réglé. Impossible d'envoyer sans message.
 */
const worker = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");
assert.equal(/BUG_MAIL|idleBugMail|signalerBugSorealIdle/.test(worker), false, "aucun envoi de mail depuis le Worker");
assert.equal(existsSync("integrations/idle-bug-mail"), false, "passerelle mail retirée");

// Moteur : enregistrement, message vide refusé, limite horaire
{
  const { runSorealIdleOperation } = await import("../src/idle-sqlite-runtime.js");
  const ops = (await import("../src/idle-sqlite-runtime.js")).idleOperationNames();
  for (const nom of ["signalerBugSorealIdle", "lireBugsSorealIdle", "supprimerBugSorealIdle"]) assert.ok(ops.includes(nom), nom);
  assert.equal(typeof runSorealIdleOperation, "function");
  assert.equal(ops.includes("marquerBugMailSorealIdle"), false);
  const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "latin1");
  const supp = rt.slice(rt.indexOf("function supprimerBugSorealIdle"), rt.indexOf("const IDLE_OPERATIONS"));
  assert.ok(supp.includes("ADMIN_SOREAL_IDLE_EMAIL) throw"), "suppression réservée à l'administrateur");
  assert.ok(supp.includes("DELETE FROM idle_bug_reports WHERE id=?"));
}

// Interface : bouton grisé sans message, fenêtre hors de #app, aucun envoi d'un texte vide
{
  const src = readFileSync("cloudflare/public/modules/bug-report-v1.js", "utf8");
  assert.match(src, /bt\.disabled=!ta\.value\.trim\(\)/);
  assert.match(src, /id="soreal-idle-bug-envoyer-v1" disabled/);
  assert.match(src, /if\(!msg\)return;/);
  assert.match(src, /maxlength="'\+MAX\+'"/);
  const fenetre = {};
  vm.runInNewContext(src, { window: fenetre, document: {}, navigator: {} });
  const html = fenetre.__SOREAL_IDLE_BUG_REPORT_V1__.html(false);
  assert.match(src, /supprimerBugSorealIdle/);
  assert.ok(html.includes("Signaler un bug") && !html.includes("Signalements reçus"));
  assert.ok(fenetre.__SOREAL_IDLE_BUG_REPORT_V1__.html(true).includes("Signalements reçus"), "l'administrateur lit les signalements");
}
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.match(ui, /window\.__SOREAL_IDLE_BUG_REPORT_V1__\.html\(estAdminSorealIdle_\(\)\)/);
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes("/modules/bug-report-v1.js?v=2"));

// Boutons + / − / Cap de Basic Training : grands et colorés
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.match(css, /\.soreal-idle-bt-actions-v120 button\{\s*min-height:44px;\s*font-size:22px;/);
assert.match(css, /\.soreal-idle-bt-actions-v120 button:nth-child\(3\)\{background:linear-gradient\(180deg,#3d72d6/);
console.log("idle-bug-report-v1: OK");
