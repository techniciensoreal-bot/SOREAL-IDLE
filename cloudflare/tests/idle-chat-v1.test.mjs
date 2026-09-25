import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « le chat normal, celui dans lequel tout le monde parle, mais accessible dans SOREAL IDLE, avec le bouton de gens en ligne ».
 * Le jeu ne reçoit jamais la session : il passe par la page parente APP/TV (postMessage), donc pas de chat hors de ce cadre.
 */
const mod = readFileSync("cloudflare/public/modules/chat-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

// Hors cadre (window.parent === window) : indisponible, aucun appel, aucune erreur
{
  const win = { addEventListener() {} };
  win.parent = win;
  const ctx = { window: win, document: { addEventListener() {} }, localStorage: {}, setTimeout, clearTimeout, setInterval, clearInterval };
  vm.runInNewContext(mod, ctx);
  assert.equal(win.__SOREAL_IDLE_CHAT_V1__.disponible(), false);
  win.__SOREAL_IDLE_CHAT_V1__.ouvrir(); // sans effet
}

// Dans un cadre : la poignée de main passe par postMessage vers le parent, puis le chat devient disponible
{
  const envoyes = [];
  const ecouteurs = {};
  const parent = { postMessage: (msg) => envoyes.push(msg) };
  const win = { parent, addEventListener: (t, h) => { ecouteurs[t] = h; } };
  const ctx = { window: win, document: { addEventListener() {}, hidden: false, querySelector: () => null }, localStorage: { getItem: () => "0", setItem() {} }, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {} };
  vm.runInNewContext(mod, ctx);
  assert.equal(envoyes.length, 1);
  assert.deepEqual({ soreal: envoyes[0].soreal, op: envoyes[0].op }, { soreal: "idle-chat-v1", op: "hello" });
  // Une réponse d'une autre fenêtre est ignorée
  ecouteurs.message({ source: {}, data: { soreal: "idle-chat-v1", id: envoyes[0].id, ok: true, data: { email: "a@b.c" } } });
  assert.equal(win.__SOREAL_IDLE_CHAT_V1__.disponible(), false, "seule la fenêtre parente est crue");
  ecouteurs.message({ source: parent, data: { soreal: "idle-chat-v1", id: envoyes[0].id, ok: true, data: { email: "a@b.c", nom: "A" } } });
  await new Promise((r) => setTimeout(r, 20)); // hello résolu, puis « list » demandé
  assert.equal(win.__SOREAL_IDLE_CHAT_V1__.disponible(), true);
  assert.equal(envoyes[1].op, "list");
}

// Le salon Responsables n'est jamais demandé ; messages de pièces jointes remplacés par un texte neutre
assert.ok(!/responsables/i.test(mod.replace(/jamais au salon Responsables/gi, "")), "le module ne parle que du salon général");
assert.ok(mod.includes("📷 Photo") && mod.includes("🎤 Message vocal"));
assert.ok(mod.includes('maxlength="280"') && mod.includes("slice(0,280)"));

// Menu : bouton Chat entre Achievements et Shop, panneau (pas une page), badge, jamais atteint par le balayage
assert.ok(ui.includes("{id:'chat',icon:'💬',nom:'Chat'}"));
assert.ok(ui.includes("window.__SOREAL_IDLE_CHAT_V1__.ouvrir()"));
assert.ok(ui.includes("window.__SOREAL_IDLE_CHAT_V1__.badgeHtml()"));
assert.ok(ui.includes("m.id!=='chat'&&menuDisponibleIdleV28_(m.id,j)"));
assert.ok(ui.includes("window.__SOREAL_IDLE_CHAT_V1__.disponible()"), "pas de bouton hors APP/TV");
assert.ok(index.includes("/modules/chat-v1.js"));
// Les raccourcis du jeu ne se déclenchent pas pendant la frappe
assert.ok(mod.includes("event.stopPropagation()"));

console.log("idle-chat-v1 OK");
