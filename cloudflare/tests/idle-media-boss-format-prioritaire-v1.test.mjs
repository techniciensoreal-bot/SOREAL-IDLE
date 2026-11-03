import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { choisirCleBossR2ParNom_ } from "../src/idle-media-v1.js";

/*
 * Norman (2026-11-03) : « J'ai mis le webp et supprimé le PNG [sur R2], mais ils ont le même nom [hors extension] ... pour l'exe et l'apk, il doit prendre la nouvelle image du boss Hooloovoo ».
 * Sur l'exe, l'ancien Boss_049_Hooloovoo.png reste dans le dossier de l'appareil (seules les clés idle/voix/ et idle/story/ sont retirées des appareils) à côté du nouveau .webp : le choix
 * par ordre alphabétique prenait le .png. Quand une même image de boss existe en plusieurs formats, le .webp l'emporte (webp > avif > png > jpg > jpeg), quel que soit l'ordre des clés.
 */
const png = "idle/bosses/Boss_049_Hooloovoo.png", webp = "idle/bosses/Boss_049_Hooloovoo.webp", autre = "idle/bosses/Boss_048_The_Bouncer.png";
for (const ordre of [[png, webp, autre], [webp, png, autre], [autre, webp, png]]) {
  assert.equal(choisirCleBossR2ParNom_(ordre, "Hooloovoo"), webp, "par nom : le .webp l'emporte sur le .png, " + ordre.join(" "));
}
assert.equal(choisirCleBossR2ParNom_([png, autre], "Hooloovoo"), png, "sans .webp : le .png sert toujours");
assert.equal(choisirCleBossR2ParNom_([png, webp, autre], "The Bouncer"), autre, "un boss qui n'a qu'un format reste servi");
const src = readFileSync(new URL("../src/idle-media-v1.js", import.meta.url), "latin1");
assert.ok(src.includes('Object.freeze(["webp","avif","png","jpg","jpeg"])'), "ordre de priorité des formats déclaré");
assert.ok(/prefixe=\"boss_\"\+c\+\"_\";\s*const trouve=meilleureCleParFormatR2_\(/.test(src), "par numéro (route ?id=) : même règle de priorité des formats");
console.log("idle-media-boss-format-prioritaire-v1 : OK");
