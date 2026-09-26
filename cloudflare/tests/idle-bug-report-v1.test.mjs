import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { idleBugMailV1, IDLE_BUG_MAIL_OBJET_V1 } from "../src/idle-worker-entry-v1.js";

/*
 * « Signaler un bug » (2026-09-26, Norman) : bouton dans Settings, mail « Soreal IDLE Bug signalé » vers reeeedruuuum@gmail.com avec le message de la
 * personne ; impossible d'envoyer sans message. Le mail part par la passerelle Apps Script (secrets SOREAL_IDLE_BUG_MAIL_URL / _SECRET).
 */
assert.equal(IDLE_BUG_MAIL_OBJET_V1, "Soreal IDLE Bug signalé");

const rapport = { id: 7, at: 1, email: "joueur@x.be", prenom: "Alex", message: "Ça plante", contexte: { version: "1.8" } };
const reponse = (data, ok = true) => new Response(JSON.stringify(data), { status: ok ? 200 : 400 });

// Worker : envoi vers la passerelle, rapport (avec l'adresse e-mail) jamais renvoyé au navigateur
{
  const appels = [];
  const fetchFn = async (url, init) => { appels.push({ url, init }); return new Response(JSON.stringify({ ok: true }), { status: 200 }); };
  const env = { SOREAL_IDLE_BUG_MAIL_URL: "https://script.example/exec", SOREAL_IDLE_BUG_MAIL_SECRET: "s3", SOREAL_IDLE: null };
  const r = await idleBugMailV1(reponse({ ok: true, id: 7, rapport }), env, "tok", fetchFn);
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.equal(j.mailEnvoye, true);
  assert.equal("rapport" in j, false);
  assert.equal(JSON.stringify(j).includes("joueur@x.be"), false, "aucune adresse e-mail renvoyée au navigateur");
  assert.equal(appels[0].url, "https://script.example/exec");
  const corps = JSON.parse(appels[0].init.body);
  assert.equal(corps.subject, "Soreal IDLE Bug signalé");
  assert.equal(corps.secret, "s3");
  assert.equal(corps.rapport.message, "Ça plante");
}
// Sans secret configuré : enregistré, pas d'appel réseau
{
  let n = 0;
  const r = await idleBugMailV1(reponse({ ok: true, id: 8, rapport }), {}, "tok", async () => { n++; return new Response("{}"); });
  const j = await r.json();
  assert.equal(j.mailEnvoye, false);
  assert.equal(n, 0);
  assert.equal("rapport" in j, false);
}
// Passerelle en échec : le signalement reste accepté, mailEnvoye false
{
  const env = { SOREAL_IDLE_BUG_MAIL_URL: "https://script.example/exec" };
  const j = await (await idleBugMailV1(reponse({ ok: true, id: 9, rapport }), env, "tok", async () => { throw new Error("réseau"); })).json();
  assert.equal(j.ok, true);
  assert.equal(j.mailEnvoye, false);
}
// Refus du moteur (message vide, limite) : réponse inchangée
{
  const refus = reponse({ ok: false, message: "Écris un message avant d’envoyer." });
  const r = await idleBugMailV1(refus, { SOREAL_IDLE_BUG_MAIL_URL: "https://x" }, "tok", async () => { throw new Error("ne doit pas partir"); });
  assert.equal((await r.json()).ok, false);
}

// Passerelle Apps Script : destinataire et objet fixes, jamais lus dans la requête
{
  const gs = readFileSync("integrations/idle-bug-mail/Code.gs", "utf8");
  assert.match(gs, /const DESTINATAIRE = 'reeeedruuuum@gmail\.com';/);
  assert.match(gs, /const OBJET = 'Soreal IDLE Bug signalé';/);
  assert.match(gs, /to: DESTINATAIRE, subject: OBJET/);
  assert.equal(/payload\.(to|subject|destinataire)/.test(gs), false);
  assert.match(gs, /if \(!message\) throw new Error\('MESSAGE_VIDE'\)/);
}

// Moteur : enregistrement, message vide refusé, limite horaire
{
  const { runSorealIdleOperation } = await import("../src/idle-sqlite-runtime.js");
  const ops = (await import("../src/idle-sqlite-runtime.js")).idleOperationNames();
  for (const nom of ["signalerBugSorealIdle", "lireBugsSorealIdle", "marquerBugMailSorealIdle"]) assert.ok(ops.includes(nom), nom);
  assert.equal(typeof runSorealIdleOperation, "function");
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
  assert.ok(html.includes("Signaler un bug") && !html.includes("Signalements reçus"));
  assert.ok(fenetre.__SOREAL_IDLE_BUG_REPORT_V1__.html(true).includes("Signalements reçus"), "l'administrateur lit les signalements");
}
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.match(ui, /window\.__SOREAL_IDLE_BUG_REPORT_V1__\.html\(estAdminSorealIdle_\(\)\)/);
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes("/modules/bug-report-v1.js?v=1"));

// Boutons + / − / Cap de Basic Training : grands et colorés
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.match(css, /\.soreal-idle-bt-actions-v120 button\{\s*min-height:44px;\s*font-size:22px;/);
assert.match(css, /\.soreal-idle-bt-actions-v120 button:nth-child\(3\)\{background:linear-gradient\(180deg,#3d72d6/);
console.log("idle-bug-report-v1: OK");
