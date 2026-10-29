// Norman (2026-10-29) : le jeu s'appelle « SOREAL NGU IDLE » dans l'entièreté du jeu ; sur la borne d'arcade : « NGU IDLE » avec un autocollant SOREAL collé à l'avant ; au lancement : l'affiche verticale de Steam avec le logo bien placé et la barre de chargement.
import fs from "node:fs";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");

// 1. plus aucun texte affiché sous l'ancien nom (hors commentaires, hors fichiers volontairement laissés : voir le script de renommage)
const fichiers = execSync("git ls-files cloudflare/public cloudflare/src", { encoding: "utf8" }).split("\n").filter((f) => /\.(js|html|css|webmanifest)$/.test(f) && !/moteur-local-worker-v1\.js$|^cloudflare\/public\/(fonts|icons|intro|voice|shop|perks)\//.test(f));
const restes = [];
for (const f of fichiers) lire(f).split("\n").forEach((l, i) => { if (l.includes("SOREAL IDLE") && !/^\s*(\*|\/\*|\/\/|<!--)/.test(l)) restes.push(f + ":" + (i + 1)); });
assert.deepEqual(restes, [], "ancien nom encore affiché : " + restes.slice(0, 5).join(", "));
const dico = JSON.parse(lire("cloudflare/public/modules/traduction-anglais-dict-v1.json"));
assert.ok(!Object.keys(dico).some((k) => k.includes("SOREAL IDLE")) && !Object.values(dico).some((v) => String(v).includes("SOREAL IDLE")), "dictionnaire anglais : plus d'ancien nom");
assert.ok(Object.keys(dico).some((k) => k.includes("SOREAL NGU IDLE")), "dictionnaire : le nouveau nom est traduit");
assert.match(lire("cloudflare/public/index.html"), /<title>SOREAL NGU IDLE<\/title>/);
assert.equal(JSON.parse(lire("cloudflare/public/manifest.webmanifest")).name, "SOREAL NGU IDLE");

// 2. la borne : « NGU IDLE » et l'autocollant SOREAL par-dessus (placé après le texte : à l'avant)
const borne = lire("cloudflare/public/modules/ui-combat-2-v1.js");
const i = borne.indexOf("const BORNE_FRONTON_IDLE_V2=");
const fronton = borne.slice(i, borne.indexOf("\n", i));
assert.equal(fronton.split(">NGU IDLE</text>").length - 1, 2, "enseigne : « NGU IDLE » (lueur et texte)");
assert.ok(!fronton.includes(">SOREAL NGU IDLE</text>") && !fronton.includes(">SOREAL IDLE</text>"), "plus l'ancien nom sur l'enseigne");
const a = fronton.indexOf("class='bn-autocollant'"), t = fronton.lastIndexOf(">NGU IDLE</text>");
assert.ok(a > t, "l'autocollant est dessiné APRÈS le texte : il est collé à l'avant");
assert.ok(fronton.slice(a, a + 1400).includes(">SOREAL</text>") && fronton.slice(a, a + 200).includes("rotate(-9"), "autocollant SOREAL, légèrement penché");

// 3. l'écran de lancement : l'affiche verticale de Steam, le logo, la barre (mêmes identifiants qu'avant)
const index = lire("cloudflare/public/index.html");
for (const motif of ["/chargement/affiche-600x900.webp", "/chargement/logo-800x450.webp", 'class="ls-logo"', 'id="standaloneProgress"', 'id="standalonePercent"', 'id="standaloneStatus"', "aspect-ratio:2/3"]) assert.ok(index.includes(motif), "écran de lancement : " + motif);
assert.ok(!index.includes("soreal-idle-loading-banner") && !index.includes("/api/idle/media/banner?name=soreal-idle.webp"), "plus la bannière horizontale");
for (const [f, l, h] of [["affiche-600x900.webp", 600, 900], ["logo-800x450.webp", 800, 450]]) {
  const b = fs.readFileSync("cloudflare/public/chargement/" + f);
  assert.equal(b.subarray(0, 4).toString(), "RIFF", f + " est un WebP");
  assert.equal(b.subarray(8, 12).toString(), "WEBP");
}
console.log("idle-nom-soreal-ngu-idle-v1 : OK");
