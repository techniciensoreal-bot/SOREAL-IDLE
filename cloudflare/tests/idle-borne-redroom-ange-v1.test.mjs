import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/*
 * Victoire en Red Room (Norman, 2026-11-03) : la scène de la course CONTINUE ; quand le fuyard est sorti par la porte, un ange DESSINÉ À LA MAIN en pixel-art LED (de profil, mains jointes, grande aile relevée,
 * deux tailles) apparaît DEVANT la porte, flotte au-dessus de la frise (ombre et halo blanc crème) et oscille doucement de haut en bas, avec les effets numériques (neige, balayage, parasites, éclairs fins)
 * limités à sa zone, puis « VICTOIRE ! ». Couleurs chaudes uniquement (jamais de bleu ni de violet autour de l'ange). Plus de bitmap converti, ni photo ni GIF dans le dépôt.
 */
const lire = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const src = lire("public/modules/borne-led-v1.js");
const code = src.replace(/\/\*[\s\S]*?\*\//g, "");

const toile = () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) });
const fen = { innerWidth: 1000, addEventListener() {}, devicePixelRatio: 1, localStorage: { getItem: () => "fr" }, matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => 0 }, document: { hidden: false, createElement: toile, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, getElementById: () => null } };
fen.window = fen;
const c = vm.createContext({ ...fen, window: fen, document: fen.document, localStorage: fen.localStorage, Math, Uint8Array, Uint32Array, String, Number, Boolean, parseInt, isFinite, JSON, setTimeout, clearTimeout });
const idx = src.lastIndexOf("})();");
vm.runInContext(src.slice(0, idx) + "window.__EV__=function(e){return eval(e);};" + src.slice(idx), c);
const ev = (e) => fen.__EV__(e);

/* 1. sprites dessinés à la main : deux tailles, lettres de la palette, couleurs chaudes */
const bloc = src.slice(src.indexOf("var ANG_GRAND="), src.indexOf("function sKO(t)"));
assert.ok(!/ANG_BM|convertir-ange/.test(src), "plus de bitmap converti de l'ange");
const grand = ev("ANG_GRAND"), petit = ev("ANG_PETIT"), lettres = Object.keys(ev("ANG_COUL"));
for (const [nom, rows, h] of [["grand", grand, 20], ["petit", petit, 17]]) {
  assert.equal(rows.length, h, `${nom} : ${h} rangées`);
  assert.ok(rows.every((r) => r.length === rows[0].length), `${nom} : rangées de même largeur`);
  assert.ok(rows.every((r) => [...r].every((x) => x === "." || lettres.includes(x))), `${nom} : seulement les lettres de la palette`);
  assert.ok(rows.join("").replace(/\./g, "").length > rows.length * 5, `${nom} : sprite plein`);
  const col = (l) => rows.some((r) => r.includes(l));
  assert.ok(col("H") && col("S") && col("W") && col("G"), `${nom} : cheveux, peau, robe claire et plis`);
}
const coul = ev("Object.values(ANG_COUL).map(function(q){return RGB[q[0]];})");
assert.ok(coul.every(([r, g, b]) => r >= g && g >= b && r >= 60), "palette de l'ange : tons chauds, jamais de bleu ni de violet");
const rb = ev("RGB[IMG_ANGE.ble]"), rw = ev("RGB[IMG_ANGE.bla]");
assert.ok(rb[0] >= rb[2] && rw[0] >= rw[2], "neige et éclairs de l'ange : blanc crème et gris chaud");
const interdits = [/twin/i, /peaks/i, /lynch/i, /\bbob\b/i, /killer/i, /laura/i, /cooper/i, /david/i, /\.gif/i, /photo\.png/i];
for (const re of interdits) assert.ok(!re.test(bloc), "aucun nom propre ni fichier d'origine dans le code de l'ange : " + re);
const fichiers = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (["node_modules", ".git"].includes(e.name) ? [] : fichiers(d + "/" + e.name)) : [d + "/" + e.name]);
const racine = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const depot = fichiers(racine + "cloudflare").concat(fichiers(racine + "design"));
assert.ok(!depot.some((f) => /angel.*\.(gif|webp)$/i.test(f)), "ni GIF ni image de référence de l'ange dans le dépôt");

/* 2. simulation image par image à 60 images/s : [luminosité, points de l'ange (teintes chaudes), points de la scène, rangée la plus haute des cheveux] */
const toutes = (W, H) => JSON.parse(ev(`(function(){var W=${W},H=${H},N=W*H,p={anim:'redroom',tg0:3,ange:true},pn=new Panel(document.createElement('canvas'),W,H,true),R0=[],t,i,s,dur=SC.win.dur(p),S={},hair={};
  Object.keys(ANG_COUL).forEach(function(k){S[ANG_COUL[k][0]]=1;});hair[ANG_COUL.H[0]]=1;hair[ANG_COUL.h[0]]=1;S[IMG_ANGE.ble]=1;S[IMG_ANGE.bla]=1;
  for(t=0;t<dur;t+=1/60){P=pn;pn.p=p;pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=H-1;pn.YM=H;pn.reduced=false;
    SC.win.fn(t);var g=Math.min(1,Math.min(t,dur-t)/0.2);if(g<0)g=0;
    s=0;var an=0,sc=0,top=-1;for(i=0;i<N;i++){s+=pn.v[i]*g;if(pn.v[i]>0){if(S[pn.c[i]]){an++;if(hair[pn.c[i]]&&pn.v[i]>150&&top<0&&(i%W)<30)top=Math.floor(i/W);}else sc++;}}
    R0.push([s/(255*N),an,sc,top]);P=null;}
  return JSON.stringify({dur:dur,L:R0});})()`));
function transitions(L) { const T = []; let ref = 0.0; L.forEach((x, i) => { if (Math.abs(x - ref) > 0.3) { T.push(i / 60); ref = x; } }); return T; }
function pire(T) { let m = 0; for (let i = 0; i < T.length; i++) { let k = 0; while (i + k < T.length && T[i + k] < T[i] + 1) k++; m = Math.max(m, k); } return m; }
function ecartMin(T) { let m = 9; for (let i = 1; i < T.length; i++) m = Math.min(m, T[i] - T[i - 1]); return m; }
const rap = [];
const T0 = ev("ANG_T0"), T1 = ev("ANG_T1"), TX = ev("ANG_TXT");
for (const [W, H] of [[140, 34], [120, 16], [140, 24]]) {
  const r = toutes(W, H), F = r.L, L = F.map((x) => x[0]);
  const im = (t) => F[Math.round(t * 60)];
  assert.equal(r.dur, ev("WIN_RR_DUR"), `${W}x${H} : durée`);
  assert.ok(im(0.3)[2] > 100, `${W}x${H} : la scène de la Red Room est là au début`);
  assert.equal(im(T0 - 0.1)[1], 0, `${W}x${H} : pas d'ange avant son apparition`);
  assert.ok(im(T0 + 0.15)[1] > 5, `${W}x${H} : apparition numérique (neige) dans la zone de l'ange`);
  let frames = 0, sceneMin = 1e9;
  const tops = [];
  for (let i = Math.round((T0 + 0.5) * 60); i < Math.round(T1 * 60); i++) { if (F[i][1] > 40) frames++; sceneMin = Math.min(sceneMin, F[i][2]); tops.push(F[i][3]); }
  assert.ok(frames / 60 >= 3, `${W}x${H} : l'ange reste au moins 3 s (${(frames / 60).toFixed(2)} s)`);
  assert.ok(sceneMin > 0.3 * W * H, `${W}x${H} : la scène CONTINUE pendant l'ange (${sceneMin} points)`);
  assert.ok(im(T0 + 0.15)[1] < 0.25 * W * H, `${W}x${H} : l'apparition reste limitée à la zone de l'ange`);
  /* oscillation : bornée (1 à 4 rangées) et périodique (1,8 s) */
  const ok = tops.filter((x) => x >= 0), amp = Math.max(...ok) - Math.min(...ok);
  assert.ok(amp >= 1 && amp <= 4, `${W}x${H} : oscillation de 1 à 4 rangées (${amp})`);
  for (const t of [T0 + 0.7, T0 + 1.05, T0 + 1.6, T0 + 2.13]) assert.equal(im(t)[3], im(t + 1.8)[3], `${W}x${H} : oscillation périodique de 1,8 s (t=${t.toFixed(2)})`);
  assert.equal(im(T1 + 0.6)[1] + im(T1 + 0.6)[2], 0, `${W}x${H} : noir entre l'ange et le texte`);
  assert.ok(im(TX + 0.9)[2] + im(TX + 0.9)[1] > 20, `${W}x${H} : « VICTOIRE ! » après l'ange`);
  const T = transitions(L), p = pire(T), e = ecartMin(T);
  let mo = 0, de = 0;
  for (let i = 1; i < L.length; i++) { const d = L[i] - L[i - 1]; mo = Math.max(mo, d * 60); de = Math.max(de, -d * 60); }
  assert.ok(p <= 3, `${W}x${H} : au plus 3 transitions par seconde (${p})`);
  assert.ok(e >= 0.34 - 1 / 60 - 1e-9, `${W}x${H} : au moins 0,34 s entre deux transitions (${e.toFixed(3)})`);
  assert.ok(mo <= 1 / 0.1 + 0.01, `${W}x${H} : montée >= 0,1 s (${mo.toFixed(2)}/s)`);
  assert.ok(de <= 1 / 0.28 + 0.01, `${W}x${H} : descente >= 0,28 s (${de.toFixed(2)}/s)`);
  rap.push(`${W}x${H}: transitions ${T.length}, pire seconde ${p}, montée max ${mo.toFixed(2)}/s, descente max ${de.toFixed(2)}/s, ange ${(frames / 60).toFixed(2)} s, oscillation ${amp} rangées`);
}
/* durées */
assert.ok(ev("WIN_RR_DUR") >= TX + 2 && T1 - T0 >= 3.5, "victoire en Red Room : ange (>= 3 s) puis texte");
assert.ok(ev("SC.win.dur({anim:'redroom'})") === ev("WIN_RR_DUR") && ev("SC.win.dur({anim:'redroom',ange:true})") === ev("WIN_RR_DUR"), "durée de la victoire en Red Room");
assert.ok(ev("SC.win.dur({anim:'redroom',ange:false})") === 8.6 && ev("SC.win.dur({anim:'mascot'})") === 8.6 && ev("SC.win.dur({anim:'sweep'})") === 8.6 && ev("SC.win.dur({})") === 7.2, "petit écran et autres victoires : durées inchangées");
assert.ok(ev("coupeApres({id:'win',p:{anim:'redroom'},dur:8.8})") === 8.8, "un nouveau combat n'interrompt pas l'ange");
assert.ok(/function mk\(id,now,p\)\{[\s\S]*if\(id==='win'&&combatAnim==='redroom'\)p\.ange=Boolean\(panel&&panel\.H>=15&&panel\.W>=44\)/.test(code), "la décision petit écran est prise à la création de la victoire");
assert.ok(ev("SC.ko.dur({anim:'redroom'})") === ev("KO_RR_DUR"), "durée de la défaite inchangée");

/* 3. structure : régulateur, éclairs espacés, plus de séquence plein écran */
assert.ok(/function winAnge\(t\)\{[\s\S]*sRedroom\(t\)[\s\S]*angDessiner\(t-ANG_T0,false,t\)[\s\S]*visGouverne\(t\)/.test(code), "la scène continue, l'ange est dessiné dedans, sous le régulateur du Nuke");
assert.ok(!/sceneRedroomFin/.test(code), "plus de séquence plein écran de l'ange");
assert.ok(/function koVisage\(t\)\{visSeq\(t,IMG_VIS,perduRedroom\);\}/.test(code), "visSeq reste la séquence du visage");
const ECL = ev("ANG_ECL.map(function(e){return e[0];})");
assert.ok(ECL.length >= 2 && ECL.length <= 3 && Math.min(...ECL.slice(1).map((x, i) => x - ECL[i])) >= 0.45 && ECL[0] > T0 + 0.5 && ECL[ECL.length - 1] + 0.3 < T1, "deux ou trois éclairs fins, espacés, pendant que l'ange est là");
assert.ok(/ANG_COUL\.C\[0\],110/.test(code), "ombre au sol blanc crème");

/* 4. mouvement réduit : ange fixe, identique à chaque instant avant le texte */
const fixe = (t) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),140,34,true);P=pn;pn.p={anim:'redroom'};pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=33;pn.YM=34;pn.reduced=true;SC.win.fn(${t});var s=Array.prototype.join.call(pn.v,',')+'|'+Array.prototype.join.call(pn.c,',');P=null;return s;})()`);
const f1 = fixe(3.9), f2 = fixe(5.2), f3 = fixe(0.1);
assert.equal(f1, f2); assert.equal(f1, f3);
assert.ok(f1.split("|")[0].split(",").filter((x) => +x > 0).length > 1500, "mouvement réduit : la scène et l'ange sont affichés");
assert.ok(fixe(8.5) !== f1 && fixe(8.5).split("|")[0].split(",").filter((x) => +x > 0).length > 20, "mouvement réduit : « VICTOIRE ! » fixe après l'ange");

/* 5. défaite et autres victoires inchangées ; petit écran = ancienne victoire */
assert.ok(src.includes("if(an==='redroom')sRedroom(t);else (an==='sweep'?sSweep:sMascot)(t);"), "ancienne victoire (petit écran, mascotte, balayeur) inchangée");
assert.ok(src.includes("if(an==='redroom'&&P.p.ange!==false&&angOk()){winAnge(t);return;}"), "l'ange n'intervient que pour la Red Room sur une grille assez grande");
assert.ok(src.includes("if(an)tueRie(t);else if(am)ecrase(t);else if(fv)koVisage(t);else if(rr)perduRedroom(t);"), "défaites inchangées");
const ancien = (W, H, anim, extra) => ev(`(function(){var pn=new Panel(document.createElement('canvas'),${W},${H},true);P=pn;pn.p={anim:${JSON.stringify(anim)},ange:${extra}};pn.c.fill(0);pn.v.fill(0);pn.yoff=0;pn.xoff=0;pn.cy0=0;pn.cy1=${H - 1};pn.YM=${H};pn.reduced=false;SC.win.fn(3.0);var s=Array.prototype.join.call(pn.v,',')+'|'+Array.prototype.join.call(pn.c,',');P=null;return s;})()`);
assert.notEqual(ancien(140, 34, "redroom", true), ancien(140, 34, "redroom", false), "grille normale : l'ange remplace l'ancienne victoire");
assert.equal(ancien(100, 12, "redroom", true), ancien(100, 12, "redroom", false), "grille de 12 rangées (pas de Red Room) : ancien comportement");
assert.equal(ancien(20, 10, "redroom", true), ancien(20, 10, "redroom", false), "grille trop petite : ancien comportement");
assert.equal(ancien(140, 34, "mascot", true), ancien(140, 34, "mascot", false), "autres victoires : ancien comportement");
assert.ok(!/setTimeout|setInterval/.test(bloc), "dessin calculé depuis le temps de la scène");
console.log("idle-borne-redroom-ange-v1: OK\n  " + rap.join("\n  "));
