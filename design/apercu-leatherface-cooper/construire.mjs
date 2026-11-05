import fs from "node:fs";
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/<\/script>/g, "<\/script>");
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Leatherface et Cooper</title>
<style>body{margin:0;background:#0b0b10;color:#e8e8ee;font:14px system-ui;padding:14px}h2{font-size:15px;margin:14px 0 4px}canvas{width:100%;max-width:1000px;display:block;background:#000;border:2px solid #333;border-radius:6px;margin-bottom:6px}</style></head><body>
<div id="o"></div>
<script>${led}</script>
<script>
var L=window.__SOREAL_IDLE_BORNE_LED_V1__,o=document.getElementById("o");
function bloc(titre,id,t,pct,p,W,H){var h=document.createElement("h2");h.textContent=titre;o.appendChild(h);var c=document.createElement("canvas");o.appendChild(c);L.dessinerSceneEssai(c,id,t,pct,W||140,H||34,p||{});}
[[0.2,"0,2 s : la voiture entre seule"],[0.7,"0,7 s : la voiture arrive"],[1.2,"1,2 s : voiture entièrement à l'écran, Leatherface commence à entrer"],[1.8,"1,8 s : Leatherface la poursuit"],[3,"3 s : la poursuite"]].forEach(function(x){bloc("Leatherface — "+x[1],"sweep",x[0],0.8,{});});
[[0.6,"pc 0.5"],[1.4,"pc 0.5"]].forEach(function(x){bloc("Red Room — course ("+x[0]+" s)","redroom",x[0],0.5,{});});
[0.5,1.1].forEach(function(x){bloc("Red Room — grille 44x15 agrandie ("+x+" s) : les deux Cooper","redroom",x,0.08,{},44,15);});
</script></body></html>`;
fs.writeFileSync("design/apercu-leatherface-cooper/apercu.html", html);
console.log("ok", Math.round(html.length / 1024) + " Ko");
