import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-04) : « je n'ai pas les images dans la boutique EXP » : le wiki n'en publie pas, l'emoji du titre devient une vignette (même place que les images de l'AP). */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const debut = meta.indexOf("      const IDLE_EXP_EMOJI_DEBUT_V1=");
const fin = meta.indexOf("      function idleExpShopItemCarteIdleV1_(it,aide){");
assert.ok(debut > 0 && fin > debut);
const titre = new Function(meta.slice(debut, fin) + "\nreturn idleExpTitreAvecImageIdleV1_;")();
assert.equal(titre("⚔️ Puissance d’aventure"), '<span class="soreal-idle-exp-img-v1" aria-hidden="true">⚔️</span><span class="soreal-idle-exp-titre-v1">Puissance d’aventure</span>');
assert.match(titre("🛠️ Item Daycare (1er slot)"), />🛠️<\/span><span class="soreal-idle-exp-titre-v1">Item Daycare/);
assert.match(titre("Achat sans emoji"), />✦<\/span><span class="soreal-idle-exp-titre-v1">Achat sans emoji</, "vignette neutre");
// Les quatre rendus de carte passent par la vignette.
assert.equal(meta.split("idleExpTitreAvecImageIdleV1_(").length - 1, 5, "définition + 4 rendus");
assert.ok(meta.includes(".soreal-idle-exp-img-v1{") && meta.includes("{id:'toc',icone:'🧰',nom:'Toc'}") && meta.includes("🧰 <b>J’ai des TOC, mais au moins ils sont bien rangés.</b>"));
console.log("idle-exp-shop-images-v1: OK");

// Illustrations du rayon Toc (Norman, 2026-10-04) : trois images, une par achat, servies depuis /shop/ ; l'emoji reste dessous si l'image manque.
{
  const { existsSync, readFileSync: lire } = await import("node:fs");
  for (const [achat, fichier] of [["sortInventory", "exp-inventaire"], ["syncBasicTraining", "exp-basic-training"], ["menuAnimations", "exp-menus"]]) {
    assert.ok(existsSync(`cloudflare/public/shop/${fichier}.png`), `image ${fichier}.png présente`);
    const png = lire(`cloudflare/public/shop/${fichier}.png`);
    assert.equal(png.readUInt32BE(0), 0x89504e47, `${fichier}.png est bien un PNG`);
    assert.ok(meta.includes(`${achat}:'${fichier}'`), `${achat} -> ${fichier}`);
  }
  const debutP = meta.indexOf("      const IDLE_EXP_PHOTOS_V1=");
  const finP = meta.indexOf("      function idleExpShopItemCarteIdleV1_(it,aide){");
  const t2 = new Function(meta.slice(debut, debutP) + meta.slice(debutP, finP) + "\nreturn idleExpTitreAvecImageIdleV1_;")();
  assert.match(t2("🗂️ Trier l’inventaire", "sortInventory"), /avec-photo[^>]*>🗂️<img src="\/shop\/exp-inventaire\.png"[^>]*onerror="this\.remove\(\)">/, "photo par-dessus l'emoji");
  assert.ok(!t2("⚔️ Puissance", "adventurePower").includes("<img"), "un achat sans illustration garde sa vignette");
}
