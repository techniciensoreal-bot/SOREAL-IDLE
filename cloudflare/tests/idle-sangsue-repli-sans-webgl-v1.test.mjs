import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : la sangsue n'était pas animée depuis l'exe de TV (pas de WebGL ou CSS :has() absent), alors qu'elle l'est sur Chrome : le battement est aussi posé en JS sur l'image. */
const decor = readFileSync("cloudflare/public/modules/sang-rituel-decor-v1.js", "utf8");
assert.ok(decor.includes("function sgRepli(sc,sx,sy){") && decor.includes("img.style.transform=(sx===1&&sy===1)?'':'scale('"), "repli JS : échelle posée sur l'image");
assert.ok(decor.includes("if(sc.__gl===undefined)continue;") && decor.includes("if(sc.__gl)sgDessiner(sc,sc.__g==null?1:sc.__g);else sgRepli(sc,sx,sy);"), "la boucle de succion tourne aussi sans WebGL");
assert.ok(decor.includes("else sgRepli(sc,1,1);"), "retour au repos sans WebGL");
console.log("idle-sangsue-repli-sans-webgl-v1: OK");
