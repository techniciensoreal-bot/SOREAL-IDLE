import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-24) : les icônes d'objets passent en 3D (Evil) et en photo (Sadistic). Le module ajoute `difficulty` aux adresses d'objets et de boosts,
 * uniquement pour ces deux routes et uniquement en Evil/Sadistic. L'observation des images insérées en HTML se vérifie dans un navigateur.
 */
const src = readFileSync("cloudflare/public/modules/item-difficulte-v1.js", "utf8");

function charger(difficulty) {
  const win = { __SOREAL_IDLE_REG__: { idleEtat: { systemes: { difficulty } } } };
  new Function("window", "document", src)(win, { readyState: "complete", body: null });
  return win.__SOREAL_IDLE_ITEM_DIFFICULTE_V1__;
}

{
  const evil = charger("difficile");
  assert.equal(evil.adapter("/api/idle/media/item?wikiItemId=43"), "/api/idle/media/item?wikiItemId=43&difficulty=difficile");
  assert.equal(evil.adapter("/api/idle/media/boost?boostType=power&strength=5"), "/api/idle/media/boost?boostType=power&strength=5&difficulty=difficile");
  assert.equal(evil.adapter("/api/idle/media/item?wikiItemId=43&difficulty=extreme"), "/api/idle/media/item?wikiItemId=43&difficulty=extreme", "déjà précisé : inchangé");
  assert.equal(evil.adapter("/api/idle/media/boss?id=3"), "/api/idle/media/boss?id=3", "les boss ont leur propre mécanisme");
  assert.equal(evil.adapter("/shop/fertilizer.png"), "/shop/fertilizer.png");
  assert.equal(evil.adapter(""), "");
}
{
  const sadistic = charger("extreme");
  assert.equal(sadistic.adapter("/api/idle/media/item?wikiItemId=92"), "/api/idle/media/item?wikiItemId=92&difficulty=extreme");
}
for (const d of ["", "normal", "facile", undefined]) {
  const autre = charger(d);
  assert.equal(autre.adapter("/api/idle/media/item?wikiItemId=43"), "/api/idle/media/item?wikiItemId=43", "difficulté « " + d + " » : rien ne change");
}

console.log("idle-item-difficulte-v1 ok");
