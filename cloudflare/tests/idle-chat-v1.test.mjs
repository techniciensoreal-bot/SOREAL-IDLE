import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-30) : « supprimer le chat tel qu'il est. Un chat uniquement réservé aux gens qui jouent au jeu, accessible via le jeu,
 * pour voir qui est en ligne SUR SOREAL IDLE (APP et TV ne doivent pas nous signaler en ligne), avec des infos en plus du genre
 * "Farm dans <zone d'Aventure>". » Ancien chat (pont postMessage vers APP/TV) supprimé ; serveur : idle-chat-v1.js.
 */
const mod = readFileSync("cloudflare/public/modules/chat-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");

// --- Plus aucun lien avec APP/TV : pas de postMessage, pas de page parente, pas de salon « général » ---
const modSansCommentaires = mod.replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!/postMessage|window\.parent|salon/i.test(modSansCommentaires), "l'ancien pont vers APP/TV est supprimé");
assert.ok(!mod.includes("SOREAL_PHOTO"), "plus de pièces jointes APP/TV");

function charger({ interaction = true, visible = true, contexte = null, appelEchec = false, sansSession = false } = {}) {
  const appels = [];
  const minuteries = [];
  const ecouteurs = {};
  const win = {
    __SOREAL_IDLE_STANDALONE_V1__: { session: () => (sansSession ? "" : "jeton") },
    __SOREAL_IDLE_CALL_V1__: (nom, args) => {
      appels.push([nom, args]);
      if (appelEchec) return Promise.reject(new Error("hors ligne"));
      if (nom === "battementSorealIdle") return Promise.resolve({ ok: true, enLigne: [{ nom: "Alice", actif: true, moi: true, activite: { t: "libre" } }], dernierChatId: 0, estAdmin: false });
      if (nom === "lireChatSorealIdle") return Promise.resolve({ ok: true, items: [] });
      return Promise.resolve({ ok: true });
    },
    __SOREAL_IDLE_ACTIVITE_V1__: contexte ? () => contexte : undefined
  };
  const doc = {
    addEventListener: (t, h) => { (ecouteurs[t] = ecouteurs[t] || []).push(h); },
    visibilityState: visible ? "visible" : "hidden",
    hidden: !visible,
    querySelector: () => null,
    getElementById: () => null
  };
  const ctx = {
    window: win, document: doc, localStorage: { getItem: () => "0", setItem() {} },
    setTimeout: (fn, ms) => { minuteries.push({ fn, ms }); return minuteries.length; }, clearTimeout() {},
    setInterval: (fn, ms) => { minuteries.push({ fn, ms, repete: true }); return minuteries.length; }, clearInterval() {},
    Date, Promise
  };
  vm.runInNewContext(mod, ctx);
  if (interaction) (ecouteurs.pointerdown || []).forEach((h) => h({}));
  return { api: win.__SOREAL_IDLE_CHAT_V1__, appels, minuteries, win };
}

// 1. Disponible dès que le jeu est connecté (plus besoin d'être dans un cadre APP/TV) ; un battement est envoyé tout de suite, puis toutes les ~20 s.
{
  const { api, appels, minuteries } = charger({ contexte: { farm: null, boss: 0, zones: [], bossMax: 0 } });
  assert.equal(api.disponible(), true);
  assert.equal(appels[0][0], "battementSorealIdle", "un battement dès la connexion");
  assert.equal(appels[0][1][0].actif, false, "tant que le joueur n'a rien touché : pas actif");
  const battement = minuteries.find((m) => m.repete && m.ms === 20000);
  assert.ok(battement, "battement toutes les 20 s, y compris onglet en arrière-plan (le joueur reste « en ligne »)");
  battement.fn();
  const dernier = appels.filter((a) => a[0] === "battementSorealIdle").pop();
  assert.equal(dernier[1][0].actif, true, "interaction récente + page visible = actif");
  assert.deepEqual(JSON.parse(JSON.stringify(dernier[1][0].activite)), { t: "libre" });
}

// 2. Non connecté (pas de session) : indisponible, aucun appel.
{
  const r = charger({ sansSession: true });
  assert.equal(r.api.disponible(), false);
  assert.equal(r.appels.length, 0);
}

// 3. Temps de jeu ACTIF : jamais « actif » sans interaction récente ni page visible.
{
  const sansGeste = charger({ interaction: false });
  assert.equal(sansGeste.api.estActif(), false, "aucune interaction : pas actif");
  sansGeste.minuteries.find((m) => m.repete && m.ms === 20000).fn();
  assert.equal(sansGeste.appels.filter((a) => a[0] === "battementSorealIdle").pop()[1][0].actif, false);
  const cachee = charger({ visible: false });
  assert.equal(cachee.api.estActif(), false, "page cachée : pas actif");
}

// 4. Activité envoyée : farm dans la zone en combat automatique, boss combattu, sinon libre.
{
  const farm = charger({ contexte: { farm: { zoneId: 7, zoneNom: "Forêt" }, boss: 0, zones: [{ id: 7, nom: "Forêt" }], bossMax: 10 } });
  assert.deepEqual(JSON.parse(JSON.stringify(farm.api.activiteActuelle())), { t: "farm", zoneId: 7, zoneNom: "Forêt" });
  const boss = charger({ contexte: { farm: null, boss: 12, zones: [], bossMax: 11 } });
  assert.deepEqual(JSON.parse(JSON.stringify(boss.api.activiteActuelle())), { t: "boss", boss: 12 });
  assert.deepEqual(JSON.parse(JSON.stringify(charger().api.activiteActuelle())), { t: "libre" });
}

// 5. Anti-spoil (AGENTS.md règle n°2) : le nom d'une zone / le numéro d'un boss d'un AUTRE joueur n'apparaît que s'il est déjà découvert par le lecteur.
{
  const connu = charger({ contexte: { farm: null, boss: 0, zones: [{ id: 7, nom: "Forêt" }], bossMax: 30 } }).api;
  assert.equal(connu.texteActivite({ actif: true, activite: { t: "farm", zoneId: 7, zoneNom: "Forêt" } }), "⚔️ Farm dans Forêt");
  assert.equal(connu.texteActivite({ actif: true, activite: { t: "farm", zoneId: 99, zoneNom: "Zone Secrète" } }), "⚔️ Farm en Aventure", "zone inconnue du lecteur : aucun nom");
  assert.ok(!connu.texteActivite({ actif: true, activite: { t: "farm", zoneId: 99, zoneNom: "Zone Secrète" } }).includes("Secrète"));
  assert.equal(connu.texteActivite({ actif: true, activite: { t: "boss", boss: 25 } }), "👹 Combat le boss 25");
  assert.equal(connu.texteActivite({ actif: true, activite: { t: "boss", boss: 200 } }), "👹 Combat un boss", "boss trop avancé : aucun numéro");
  assert.equal(connu.texteActivite({ actif: true, activite: { t: "libre" } }), "🎮 En jeu");
  assert.equal(connu.texteActivite({ actif: false, activite: { t: "farm", zoneId: 7, zoneNom: "Forêt" } }), "💤 Inactif", "inactif : on ne détaille pas");
  const sansContexte = charger().api;
  assert.equal(sansContexte.texteActivite({ actif: true, activite: { t: "farm", zoneId: 7, zoneNom: "Forêt" } }), "⚔️ Farm en Aventure");
}

// 6. Contenu du module : appels serveur, échappement HTML, suppression réservée à l'admin, saisie isolée des raccourcis du jeu.
{
  for (const nom of ["battementSorealIdle", "lireChatSorealIdle", "envoyerChatSorealIdle", "supprimerMessageChatSorealIdle"]) assert.ok(mod.includes("'" + nom + "'"), nom);
  assert.ok(mod.includes("echapper(it.message)") && mod.includes("echapper(u.nom||'?')") && mod.includes("echapper(texteActivite(u))"), "tout texte de joueur est échappé");
  assert.ok(mod.includes("estAdmin?'<button") , "bouton de suppression visible de l'administrateur seulement");
  assert.ok(mod.includes('maxlength="280"') && mod.includes("slice(0,280)"));
  assert.ok(mod.includes("event.stopPropagation()"), "les raccourcis du jeu ne se déclenchent pas pendant la frappe");
  assert.ok(mod.includes("Joueurs connectés à SOREAL IDLE"));
}

// 7. Menu : bouton Chat, PAGE du menu en pleine page (2026-10-01 : plus de fenêtre volante), badge, activité exposée au chat, classement = temps de jeu ACTIF.
assert.ok(ui.includes("{id:'chat',icon:'💬',nom:'Chat'}"));
assert.ok(ui.includes("case 'chat':") && ui.includes("window.__SOREAL_IDLE_CHAT_V1__.pageHtml()"), "page du menu Chat");
assert.ok(!ui.includes("window.__SOREAL_IDLE_CHAT_V1__.ouvrir()"), "plus d'ouverture en fenêtre volante");
{
  const mod2 = readFileSync("cloudflare/public/modules/chat-v1.js", "utf8");
  assert.ok(!mod2.includes("position:fixed") && !mod2.includes('aria-modal'), "le chat n'est plus un dialogue plein écran");
  assert.ok(mod2.includes("function apresRendu()") && mod2.includes("function pageHtml()"), "monté dans la page après chaque rendu");
  assert.ok(mod2.includes("elChat"), "le chat est construit une fois et re-monté (garde la saisie)");
}
assert.ok(ui.includes("window.__SOREAL_IDLE_CHAT_V1__.badgeHtml()"));
assert.ok(ui.includes("m.id!=='chat'&&menuDisponibleIdleV28_(m.id,j)"));
assert.ok(ui.includes("window.__SOREAL_IDLE_ACTIVITE_V1__=function(){"));
assert.ok(ui.includes("{id:'playSeconds',nom:'⏱️ Temps de jeu actif'}"));
assert.ok(index.includes("/modules/chat-v1.js"));

console.log("idle-chat-v1 OK");
