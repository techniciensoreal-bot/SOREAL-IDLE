import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : un fond peint par zone d'Aventure derrière tout le cadre de combat (R2 idle/backgrounds/adventure/<id>.webp).
 * Le module pose le fond sur le cadre de la zone ; zone sans fond (zone sûre, titans) : rien ne change.
 */
const src = readFileSync("cloudflare/public/modules/adventure-fond-zone-v1.js", "utf8");

function charger() {
  const styles = [];
  const doc = {
    getElementById: (id) => styles.find((s) => s.id === id) || null,
    createElement: () => ({ id: "", textContent: "" }),
    head: { appendChild: (s) => styles.push(s) },
  };
  const win = {};
  new Function("window", "document", src)(win, doc);
  return { api: win.__SOREAL_IDLE_FOND_ZONE_V1__, styles };
}
function bloc() {
  const attrs = {}, props = {};
  return { attrs, props, style: { setProperty: (k, v) => { props[k] = v; } }, setAttribute: (k, v) => { attrs[k] = v; } };
}

const { api, styles } = charger();

// Les 32 zones d'Aventure ont un fond : mêmes identifiants que le jeu (hors zone sûre).
const jeu = readFileSync("cloudflare/src/idle-adventure-zones.js", "utf8");
const idsJeu = [...jeu.matchAll(/^\{id:"([a-z0-9]+)",name:"[^"]*",boss:\d+,p:[\d.e+]+,t:[\d.e+]+,/gm)].map((m) => m[1]).filter((id) => id !== "safe" && !/^t\d$/.test(id));
assert.ok(idsJeu.length >= 30, "zones lues dans le jeu : " + idsJeu.length);
for (const id of idsJeu) assert.equal(api.zones[id], 1, "fond prévu pour la zone " + id);
assert.equal(Object.keys(api.zones).length, 32, "32 fonds");

// Application sur un cadre.
const b = bloc();
assert.equal(api.appliquer(b, "ancient"), true);
assert.equal(b.attrs["data-fond-zone"], "ancient");
assert.equal(b.props["--fond-zone-v1"], 'url("/api/idle/media/adventure-zone?name=ancient")');
assert.equal(styles.length, 1, "feuille de style posée une seule fois");
assert.match(styles[0].textContent, /\[data-fond-zone\]\{background-image:radial-gradient\([^)]*\)[^;]*,var\(--fond-zone-v1\)!important/, "bat le dégradé brun du thème, sous un voile sombre (décors assombris, Norman 2026-10-26)");
assert.match(styles[0].textContent, /rgba\(4,6,14,\.78\) 0%/, "voile plus dense au centre");
assert.match(styles[0].textContent, /\.soreal-idle-v79-arena\{background:transparent!important\}/, "l'arène laisse voir le fond");
api.appliquer(bloc(), "sewers");
assert.equal(styles.length, 1, "toujours une seule feuille");
assert.equal(api.url("2d"), "/api/idle/media/adventure-zone?name=2d");

// Zones sans fond, ou cadre absent : rien ne change.
for (const id of ["safe", "t1", "", "inconnue", undefined]) { const c = bloc(); assert.equal(api.appliquer(c, id), false); assert.deepEqual(c.attrs, {}); assert.deepEqual(c.props, {}); }
assert.equal(api.appliquer(null, "forest"), false);

// Branchements : le cadre appelle le module, la page charge le module AVANT la scène.
const scene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(scene.includes("window.__SOREAL_IDLE_FOND_ZONE_V1__.appliquer(block,String(zone.id||''))"), "la scène applique le fond à chaque création du cadre");
const html = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(html.indexOf("/modules/adventure-fond-zone-v1.js") > 0 && html.indexOf("/modules/adventure-fond-zone-v1.js") < html.indexOf("/modules/adventure-scene-v79.js"), "module chargé avant la scène");

console.log("idle-fond-zone-v1: OK");
