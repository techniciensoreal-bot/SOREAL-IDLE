import fs from "node:fs";
const led = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8").replace(/<\/script>/g, "<\/script>");
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Scène de l'égout</title>
<style>body{margin:0;background:#0b0b10;color:#e8e8ee;font:15px/1.4 system-ui,sans-serif;padding:16px}h1{font-size:18px;margin:0 0 10px}
.barre{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}button{background:#2b2b38;color:#fff;border:1px solid #555;border-radius:6px;padding:8px 14px;font:inherit;cursor:pointer}#play{background:#1c8a3a;border-color:#6fe08f;font-weight:700;padding:8px 22px}button.on{background:#c47a0a;border-color:#ffb24a}
#cadre{max-width:900px;margin:0 auto}canvas{width:100%;display:block;background:#000;border:2px solid #333;border-radius:6px}.note{opacity:.7;font-size:13px;margin-top:8px}</style></head><body>
<h1>L'égout : le garçon, le bateau en papier et le clown</h1>
<div class="barre" id="scenes"></div><div class="barre" id="tailles"></div>
<div id="cadre"><canvas id="cv"></canvas></div><div class="note" id="info"></div>
<script>${led}</script>
<script>
var SC=[{nom:"Course (boss à 100 %)",id:"egout",pct:1,p:{},d:4},{nom:"Course (boss à 50 %)",id:"egout",pct:0.5,p:{},d:4},{nom:"Course (boss à 10 %)",id:"egout",pct:0.1,p:{},d:4},{nom:"VICTOIRE",id:"win",pct:0,p:{anim:"egout",fin:true},d:8.6},{nom:"DÉFAITE (boss à 60 %)",id:"ko",pct:0.6,p:{anim:"egout",pc0:0.6},d:10.7},{nom:"DÉFAITE (boss à 15 %)",id:"ko",pct:0.15,p:{anim:"egout",pc0:0.15},d:10.7}],
TA=[{nom:"PC (140×34)",W:140,H:34},{nom:"Téléphone (120×16)",W:120,H:16}];
var iS=0,iT=0,t0=0,raf=0,cv=document.getElementById("cv");
function rendre(t){try{window.__SOREAL_IDLE_BORNE_LED_V1__.dessinerSceneEssai(cv,SC[iS].id,t,SC[iS].pct,TA[iT].W,TA[iT].H,JSON.parse(JSON.stringify(SC[iS].p)));}catch(e){document.getElementById("info").textContent="Erreur : "+e.message;}}
function lancer(){cancelAnimationFrame(raf);t0=performance.now();(function f(now){var t=(now-t0)/1000;if(t>SC[iS].d){rendre(SC[iS].d);return;}rendre(t);raf=requestAnimationFrame(f);})(t0);}
function image0(){cancelAnimationFrame(raf);rendre(0.2);}
function maj(){[].forEach.call(document.querySelectorAll("#scenes button.sc"),function(b){b.className="sc"+((+b.dataset.i===iS)?" on":"");});[].forEach.call(document.querySelectorAll("#tailles button"),function(b){b.className=(+b.dataset.i===iT)?"on":"";});}
var bs=document.getElementById("scenes");SC.forEach(function(x,i){var b=document.createElement("button");b.textContent=x.nom;b.className="sc";b.dataset.i=i;b.onclick=function(){iS=i;maj();image0();};bs.appendChild(b);});
var rb=document.createElement("button");rb.textContent="▶ PLAY";rb.id="play";rb.onclick=lancer;bs.appendChild(rb);
var bt=document.getElementById("tailles");TA.forEach(function(x,i){var b=document.createElement("button");b.textContent=x.nom;b.dataset.i=i;b.onclick=function(){iT=i;maj();image0();};bt.appendChild(b);});
document.getElementById("info").textContent="Choisis une scène puis PLAY : elle se joue une fois, avec le vrai code de la borne.";
maj();image0();
</script></body></html>`;
fs.writeFileSync("design/apercu-nuke-paliers/animation-egout.html", html);
console.log("ok", Math.round(html.length / 1024) + " Ko");
