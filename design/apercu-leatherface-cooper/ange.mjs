import fs from "node:fs";
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/<\/script>/g, "<\/script>");
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Ange</title><style>body{margin:0;background:#0b0b10;color:#e8e8ee;font:14px system-ui;padding:14px}h2{font-size:15px;margin:12px 0 4px}canvas{width:100%;max-width:1000px;display:block;background:#000;border:2px solid #333;border-radius:6px}</style></head><body><div id="o"></div><script>${led}</script><script>
var L=window.__SOREAL_IDLE_BORNE_LED_V1__,o=document.getElementById("o");
[[2.4,140,34],[3.6,140,34],[3.0,44,15]].forEach(function(x){var h=document.createElement("h2");h.textContent="Victoire Red Room, l'ange ("+x[0]+" s, grille "+x[1]+"x"+x[2]+")";o.appendChild(h);var c=document.createElement("canvas");o.appendChild(c);L.dessinerSceneEssai(c,"win",x[0],0,x[1],x[2],{anim:"redroom",fin:true,ange:true,tg0:0});});
</script></body></html>`;
fs.writeFileSync("design/apercu-leatherface-cooper/ange.html", html); console.log("ok");
