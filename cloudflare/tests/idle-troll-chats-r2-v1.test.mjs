// Norman (2026-11-02) : « dans le troll, il dit qu'il a dessiné un chat pour nous et une tête de chat passe à l'écran : je veux que ce soit les chats dans ce dossier qui passent : idle/garderie-skins/TrollChallenge/ » ;
// « ils doivent être énormes et prendre tout l'écran pour nous empêcher de cliquer ».
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

const PREFIXE = "idle/garderie-skins/TrollChallenge/";

// --- liste : seulement les images directement dans le dossier, triées ---
{
  const fakeR2 = {
    async list(opts) {
      assert.equal(opts.prefix, PREFIXE, "liste bien sous idle/garderie-skins/TrollChallenge/");
      return { objects: [
        { key: PREFIXE + "chat-b.webp" }, { key: PREFIXE + "Chat-A.PNG" }, { key: PREFIXE + "sous-dossier/x.webp" },
        { key: PREFIXE + "notes.txt" }, { key: PREFIXE }
      ], truncated: false };
    }
  };
  const r = await traiterRequeteIdleMedia(new Request("https://idle.invalid/api/idle/media/troll-chats"), { SOREAL_R2: fakeR2 });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.ok, true);
  assert.deepEqual(d.noms, ["Chat-A.PNG", "chat-b.webp"], "seules les images du dossier, ni sous-dossier, ni texte, ni le dossier lui-même");
}
// --- liste : R2 indisponible -> réponse explicite (le client retombe sur le chaton dessiné) ---
{
  const r = await traiterRequeteIdleMedia(new Request("https://idle.invalid/api/idle/media/troll-chats"), {});
  assert.equal(r.status, 503);
  assert.equal((await r.json()).ok, false);
}
// --- image : sert un fichier du dossier ---
{
  const fakeR2 = { async get(key) { assert.equal(key, PREFIXE + "chat-b.webp"); return { body: new Uint8Array([1, 2, 3]), writeHttpMetadata(h) { h.set("content-type", "image/webp"); } }; } };
  const r = await traiterRequeteIdleMedia(new Request("https://idle.invalid/api/idle/media/troll-chat?f=chat-b.webp"), { SOREAL_R2: fakeR2 });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "image/webp");
}
// --- image : jamais un accès R2 arbitraire ---
{
  const fakeR2 = { async get() { throw new Error("ne doit jamais être appelé"); } };
  for (const f of ["", "../secret.webp", "a/b.webp", "..%2Fx.webp", "x.txt", "x.webp%5Cy", "chat.js"]) {
    const r = await traiterRequeteIdleMedia(new Request("https://idle.invalid/api/idle/media/troll-chat?f=" + f), { SOREAL_R2: fakeR2 });
    assert.equal(r.status, 404, "nom refusé : « " + f + " »");
  }
}
// --- image absente -> 404 ---
{
  const r = await traiterRequeteIdleMedia(new Request("https://idle.invalid/api/idle/media/troll-chat?f=absent.webp"), { SOREAL_R2: { async get() { return null; } } });
  assert.equal(r.status, 404);
}

// --- côté client : le troll montre ces chats, énormes, et bloque les clics ; repli sur le chaton dessiné hors ligne ---
const client = readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8").split(String.fromCharCode(13)).join("");
assert.ok(client.includes("fetch('/api/idle/media/troll-chats')") && client.includes("'/api/idle/media/troll-chat?f='+encodeURIComponent(nom)"), "le client liste puis charge les chats du dossier");
assert.ok(client.includes("var nom=noms[Math.floor(Math.random()*noms.length)];"), "un chat tiré au hasard dans le dossier");
assert.ok(client.includes("if(!noms.length){chatonDessine();return;}") && client.includes("img.onerror=function(){chatonDessine();};"), "repli sur le chaton dessiné si le dossier est injoignable ou vide");
assert.ok(client.includes("#sorealDefiChatonV1.gros{position:fixed;inset:0;") && !client.includes("#sorealDefiChatonV1.gros{position:fixed;inset:0;width:auto;height:auto;z-index:99990;pointer-events:auto"), "le chat couvre tout l'écran mais LAISSE PASSER les clics (Norman, 2026-11-02)");
assert.ok(client.includes("height:110vh") && client.includes("animation:sorealChatGrosV1 15s linear forwards"), "chat énorme (plus haut que l'écran), traversée de 14 s");
assert.ok(client.includes("setTimeout(function(){retirer('sorealDefiChatonV1');memoriser(CLE_CHATON,null);},15500);"), "retiré à la fin de la traversée : le jeu redevient cliquable");

console.log("idle-troll-chats-r2-v1 : OK");
