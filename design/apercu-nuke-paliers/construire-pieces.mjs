import fs from "node:fs";
const css = fs.readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const i0 = css.indexOf(".mp3-pieces{"), i1 = css.indexOf("@media (max-width:760px){.mp3-titre-nom");
const regles = css.slice(i0, i1);
const js = fs.readFileSync("cloudflare/public/modules/money-pit-page-v1.js", "utf8");
const j0 = js.indexOf("let compteurPiecesIdleV1_=0;"), j1 = js.indexOf("/* Les yeux n'apparaissent");
const part1 = js.slice(j0, j1);
const k0 = js.indexOf("window.__jeterOrSalveV1__=function(n){"), k1 = js.indexOf("window.__SOREAL_IDLE_MONEY_PIT_V1__=");
const part2 = js.slice(k0, k1);
const img = fs.readFileSync("cloudflare/public/trou/trou-sans-fond-v1.webp").toString("base64");
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pièces du trou sans fond</title>
<style>body{margin:0;background:#0b0b10;color:#e8e8ee;font:15px system-ui,sans-serif;padding:16px;text-align:center}button{background:#1c8a3a;color:#fff;border:1px solid #6fe08f;border-radius:6px;padding:10px 26px;font:700 16px system-ui;cursor:pointer;margin:8px 4px}
#sc{position:relative;width:min(92vw,520px);margin:0 auto}#sc img{width:100%;display:block;border-radius:17px}.mp3-calques{position:absolute;inset:0;aspect-ratio:1/1;container-type:inline-size;overflow:hidden;border-radius:17px;pointer-events:none}
${regles}</style></head><body><h1 style="font-size:18px">Pièces du trou sans fond</h1><div id="sc"><img src="data:image/webp;base64,${img}" alt=""><div class="mp3-calques"></div></div>
<div><button onclick="window.__jeterOrSalveV1__(4)">▶ 4 pièces</button><button onclick="window.__jeterOrSalveV1__(8)">▶ 8 pièces</button><button onclick="window.__jeterOrSalveV1__(14)">▶ 14 pièces</button></div>
<script>(function(){${part1}${part2}})();</script></body></html>`;
fs.writeFileSync("design/apercu-nuke-paliers/pieces-trou.html", html); console.log("ok", Math.round(html.length / 1024) + " Ko", part2.length > 100, part1.length > 100);
