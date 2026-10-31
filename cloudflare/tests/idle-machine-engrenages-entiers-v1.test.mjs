/* Machine temporelle (Norman, 2026-10-31) : le grand engrenage etait COUPE DROIT a gauche (ses dents depassaient de 5,9 unites hors du viewBox 0..130). Chaque dessin des deux engrenages doit tenir ENTIEREMENT dans son viewBox, au trait pres. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

for (const f of ["soreal-idle-entetes-a.css", "soreal-idle-entetes-miniature-v1.css", "soreal-idle-menus-boutons-v1.css"]) {
  const css = readFileSync("cloudflare/public/" + f, "utf8");
  let vus = 0;
  for (const m of css.matchAll(/url\("data:image\/svg\+xml,([^"]+)"\)/g)) {
    const svg = decodeURIComponent(m[1]);
    if (!svg.includes("65.8,52.1")) continue; /* le dessin des deux engrenages */
    vus++;
    const [x0, y0, w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(" ").map(Number);
    const sw = 1.5; /* demi-trait compris : stroke-width 1,5 */
    const pts = [...svg.matchAll(/points="([^"]+)"/g)].flatMap((p) => p[1].trim().split(/\s+/).map((q) => q.split(",").map(Number)));
    assert.ok(pts.length > 40, f + " : les deux engrenages sont dessines");
    for (const [x, y] of pts) {
      assert.ok(x - sw / 2 >= x0 && x + sw / 2 <= x0 + w && y - sw / 2 >= y0 && y + sw / 2 <= y0 + h, `${f} : dent (${x},${y}) coupee par le viewBox`);
    }
  }
  assert.ok(vus >= 1, f + " : dessin des engrenages present");
}
console.log("ok idle-machine-engrenages-entiers-v1");
