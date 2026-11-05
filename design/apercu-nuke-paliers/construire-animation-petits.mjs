import fs from "node:fs";
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/<\/script>/g, "<\/script>");
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuke : scènes comiques, chat et chien</title>
<style>body{margin:0;background:#0b0b10;color:#e8e8ee;font:15px/1.4 system-ui,sans-serif;padding:16px}h1{font-size:18px;margin:0 0 10px}
.barre{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}button{background:#2b2b38;color:#fff;border:1px solid #555;border-radius:6px;padding:8px 14px;font:inherit;cursor:pointer}#play{background:#1c8a3a;border-color:#6fe08f;font-weight:700;padding:8px 22px}button.on{background:#c47a0a;border-color:#ffb24a}
#cadre{max-width:900px;margin:0 auto}canvas{width:100%;display:block;background:#000;border:2px solid #333;border-radius:6px}.note{opacity:.7;font-size:13px;margin-top:8px}</style></head><body>
<h1>Nuke sur l’écran LED : animations réelles du jeu</h1>
<div class="barre" id="scenes"></div><div class="barre" id="tailles"></div>
<div id="cadre"><canvas id="cv"></canvas></div><div class="note" id="info"></div>
<script>${led}</script>
<script>
var SC=[{nom:"Ballon : tour dans le ciel",v:22,d:4.7},{nom:"Chat qui saute",v:5,d:3.4},{nom:"Chien qui pisse",v:12,d:4.8}],TA=[{nom:"PC (140×34)",W:140,H:34},{nom:"Téléphone (120×16)",W:120,H:16}];
var iS=0,iT=0,t0=0,boucle=0,raf=0,cv=document.getElementById("cv");
function rendre(t){window.__SOREAL_IDLE_BORNE_NUKE_VARIANTE_FORCEE__=SC[iS].v;try{window.__SOREAL_IDLE_BORNE_LED_V1__.dessinerSceneEssai(cv,"nuke",t,1,TA[iT].W,TA[iT].H,{essai:1,n:1});}catch(e){document.getElementById("info").textContent="Erreur : "+e.message;}}
function lancer(){cancelAnimationFrame(raf);t0=performance.now();(function f(now){var t=(now-t0)/1000;if(t>SC[iS].d+0.8){rendre(SC[iS].d+0.8);return;}rendre(t);raf=requestAnimationFrame(f);})(t0);}function image0(){cancelAnimationFrame(raf);rendre(0.02);}
function bouton(parent,liste,cle,cb){liste.forEach(function(x,i){var b=document.createElement("button");b.textContent=x.nom;b.onclick=function(){window[cle]=i;maj();cb();};b.dataset.i=i;parent.appendChild(b);});}
function maj(){[].forEach.call(document.querySelectorAll("#scenes button"),function(b){b.className=(+b.dataset.i===iS)?"on":"";});[].forEach.call(document.querySelectorAll("#tailles button"),function(b){b.className=(+b.dataset.i===iT)?"on":"";});}
var bs=document.getElementById("scenes");SC.forEach(function(x,i){var b=document.createElement("button");b.textContent=x.nom;b.dataset.i=i;b.onclick=function(){iS=i;maj();image0();};bs.appendChild(b);});
var rb=document.createElement("button");rb.textContent="▶ PLAY";rb.id="play";rb.onclick=lancer;bs.appendChild(rb);
var bt=document.getElementById("tailles");TA.forEach(function(x,i){var b=document.createElement("button");b.textContent=x.nom;b.dataset.i=i;b.onclick=function(){iT=i;maj();image0();};bt.appendChild(b);});
document.getElementById("info").textContent="Choisis une scène puis appuie sur PLAY : elle se joue une fois. Elle utilise le vrai code de la borne ; l'amorce du clic n'est pas montrée.";
maj();image0();
</script></body></html>`;
fs.writeFileSync("design/apercu-nuke-paliers/animation-nuke-petits.html", html);
console.log("ok", Math.round(html.length / 1024) + " Ko");
