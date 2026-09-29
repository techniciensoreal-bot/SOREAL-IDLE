import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « J'ai toujours l'émoji à la place de Tuba of Time »
 * — alors que l'image existe bien sur le R2 et que le Worker média la
 * résout correctement par wikiItemId (vérifié en production : réponse
 * image/webp pour /api/idle/media/item?wikiItemId=432).
 *
 * Cause réelle, trouvée en traçant le VRAI chemin de rendu du paperdoll/des
 * accessoires Aventure (rendreSlotPaperdollAdventureIdleV138_ /
 * rendreEmplacementAccessoireAdventureIdleV138_ -> iconeObjetAdventureIdleV138_
 * -> iconeBaseObjetAdventureIdleV138_) : ce chemin exigeait `item.set` pour
 * même tenter une image. Un Special (Tuba of Time, Cheese Grater, A Dragon's
 * Left Ball…) n'a jamais de `.set` (exclusif aux pièces d'équipement de
 * set) — repli immédiat et permanent sur l'émoji générique du slot, quelle
 * que soit la disponibilité réelle de l'image sur le R2.
 *
 * (item-specials-early-v75.js / item-images-r2-v74.js, les modules qui
 * avaient déjà un correctif wikiItemId, ciblent .soreal-idle-equip-slot-v10
 * / .soreal-idle-inventory-slot-v78 : les classes de l'ANCIEN écran
 * d'équipement (Sac/forge, rendreSlotEquipeIdleV10_/rendreInventaireIdleV10_,
 * objet.rarete/objet.fusion) — jamais celles du paperdoll Aventure V138.
 * Ils ne s'appliquaient donc jamais à Tuba of Time.)
 */

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

function extraire(debut) {
  const i = ui.indexOf(debut);
  assert.ok(i >= 0, "introuvable : " + debut);
  let p = 0;
  let k = ui.indexOf("{", i);
  for (; k < ui.length; k += 1) {
    if (ui[k] === "{") p += 1;
    else if (ui[k] === "}") {
      p -= 1;
      if (!p) break;
    }
  }
  return ui.slice(i, k + 1);
}

const code = [
  extraire("function urlImageObjetAdventureIdleV138_(item){"),
  extraire("function urlImageBoostAdventureIdleV138_(boost){"),
  extraire("function iconeSlotAdventureIdleV138_(slot){"),
  extraire("function nombreEmojisIdleV1_(texte){"),
  extraire("function emojiRepliObjetIdleV1_(emoji){"),
  (() => {
    const debut = ui.indexOf("const ONERROR_EMOJI_OBJET_IDLE_V1=");
    assert.ok(debut >= 0, "ONERROR_EMOJI_OBJET_IDLE_V1 introuvable");
    const fin = ui.indexOf("\n", debut);
    return ui.slice(debut, fin);
  })(),
  extraire("function iconeBaseObjetAdventureIdleV138_(item){"),
  "return {base:iconeBaseObjetAdventureIdleV138_,url:urlImageObjetAdventureIdleV138_};"
].join("\n");

const { base, url } = new Function("window", "idleHtml_", code)(
  { __SOREAL_IDLE_INVENTORY_PRESENTATION_V1__: { iconeAdventure: (slot) => (slot === "accessory" ? "💍" : "📦") } },
  (v) => String(v == null ? "" : v)
);

// --- Cas réel de Norman : Tuba of Time (special, sans .set, wikiItemId=432) ---
const tuba = { id: "x1", definitionId: "tubaTime", name: "Tuba of Time", kind: "special", slot: "accessory", wikiItemId: 432, level: 5 };
assert.ok(url(tuba).includes("wikiItemId=432"), "l'URL doit porter le wikiItemId : " + url(tuba));
assert.match(base(tuba), /^<img src="/, "un Special avec wikiItemId doit tenter une vraie image, pas retomber direct sur l'émoji du slot");
assert.ok(base(tuba).includes(url(tuba)), "l'image affichée doit utiliser urlImageObjetAdventureIdleV138_");

// --- Une pièce de set (avec .set) continue de fonctionner comme avant ---
const setPiece = { id: "x2", definitionId: "training:head", name: "Training Helmet", kind: "equipment", set: "training", slot: "head", wikiItemId: 0 };
assert.match(base(setPiece), /^<img src="/, "une pièce de set doit toujours tenter une image");

// --- Un objet sans .set ET sans wikiItemId retombe sur l'émoji du slot (comportement inchangé, jamais de régression) ---
const inconnu = { id: "x3", definitionId: "trucInconnu", name: "Truc", kind: "special", slot: "accessory" };
assert.equal(base(inconnu), "💍", "sans set ni wikiItemId, on garde l'émoji générique du slot (jamais de régression)");
assert.equal(base(null), "📦");

console.log("idle-adventure-special-item-image-v1: OK");
