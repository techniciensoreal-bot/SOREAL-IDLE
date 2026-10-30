/* Genere cloudflare/public/soreal-idle-ngu-labo-entetes-v1.css : les deux en-tetes du laboratoire NGU (onglet Energie = jour, onglet Magie = nuit) au style du cadre de titre du menu NGU / du petit bouton de la barre.
 * Les dessins (soleil, lune, nuages, etoiles, collines) ne sont PAS redessines : ils sont lus dans soreal-idle-entetes-d.css (bloc ngu, ::before) puis redistribues : jour = soleil + nuages clairs + collines vertes, nuit = lune + etoiles + nuages sombres + collines sombres.
 * Statique : aucune animation (regles n°3 et n°4). Relancer apres tout changement de entetes-d.css : node cloudflare/tools/gen-ngu-labo-entetes-v1.mjs puis maj-pins. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(ici, "../public/soreal-idle-entetes-d.css"), "utf8").split("\n");
const debut = src.findIndex((l) => l.includes('[data-menu="ngu"]') && l.includes("::before{content"));
if (debut < 0) throw new Error("bloc ngu introuvable");
const couches = [];
for (let i = debut + 1; i < debut + 10; i += 1) {
  const l = src[i].trim();
  const fin = l.indexOf('")');
  if (!l.startsWith('url("data:image/svg+xml,') || fin < 0) throw new Error("couche inattendue ligne " + (i + 1));
  couches.push(l.slice(0, fin + 2));
}
const [soleil, lune, nuage1, nuage2, , nuitA, nuitB, etoiles, collines] = couches;

const RACINE = "html body .nl-v1";
const E = (o) => RACINE + '[data-nl-onglet="' + o + '"] .nl-entete';
const calque = (u, pos, taille) => u + " " + pos + "/" + taille + " no-repeat";
const commun = ["radial-gradient(ellipse 34% 66% at 50% 46%,rgba(12,16,56,.6),transparent 78%)", "linear-gradient(180deg,rgba(255,255,255,.2) 0,transparent 30%,rgba(0,0,0,.22) 100%)"];

function ciel(onglet, mobile) {
  const k = mobile ? 0.7 : 1;
  const px = (n) => Math.round(n * k) + "px";
  const dessins = onglet === "energy"
    ? [
        calque(soleil, "8px -6px", px(104) + " " + px(104)),
        calque(nuage1, "27% 14%", px(84) + " " + px(38)),
        calque(nuage1, "74% 8%", px(66) + " " + px(30)),
        calque(nuage2, "4% 88%", px(60) + " " + px(27)),
        calque(nuage2, "88% 80%", px(56) + " " + px(25)),
        calque(collines, "0 100%", "200% 38%"),
      ]
    : [
        calque(lune, "calc(100% - 10px) -4px", px(100) + " " + px(100)),
        calque(nuitA, "14% 22%", px(84) + " " + px(38)),
        calque(nuitB, "66% 62%", px(64) + " " + px(29)),
        calque(etoiles, "0 0", "100% 100%"),
        calque(collines, "100% 100%", "200% 38%"),
      ];
  const fond = onglet === "energy"
    ? "linear-gradient(90deg,#3a98e2 0%,#6fbdf3 50%,#a8dcff 100%)"
    : "linear-gradient(90deg,#262c78 0%,#121847 55%,#060a28 100%)";
  return dessins.concat(commun, [fond]).join(",\n  ");
}

function bloc(mobile) {
  const m = mobile;
  let css = "";
  for (const o of ["energy", "magic"]) {
    css += E(o) + "::before{background:\n  " + ciel(o, m) + "}\n";
  }
  return css;
}

let css = "/* GENERE par cloudflare/tools/gen-ngu-labo-entetes-v1.mjs : ne pas editer a la main. Cadre des deux en-tetes du laboratoire NGU = le cadre de titre du menu NGU (ciel, soleil, lune, nuages, etoiles ; liserés or et bleu ; titre blanc cerne). */\n";
css += RACINE + " .nl-entete{position:relative;isolation:isolate;box-sizing:border-box;min-height:104px;margin:2px 0 8px;padding:10px 18px;border:3px solid #000;border-radius:4px 18px 4px 18px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;text-align:center;box-shadow:-10px 0 20px -6px rgba(255,214,90,.5),10px 0 20px -6px rgba(110,130,255,.55),0 6px 0 #05060f,inset 0 0 22px rgba(0,0,0,.4)}\n";
css += RACINE + " .nl-entete::before{content:\"\";position:absolute;inset:0;z-index:-1;border-radius:inherit}\n";
css += RACINE + " .nl-entete::after{content:\"\";position:absolute;inset:0;z-index:-1;border:3px solid transparent;border-radius:inherit;background:linear-gradient(90deg,#ffe27a 0%,#fff0b0 30%,#d8dcff 62%,#8a98ff 100%) border-box;-webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) padding-box exclude,linear-gradient(#000 0 0);pointer-events:none}\n";
css += bloc(false);
css += RACINE + " .nl-entete .nl-titre{display:block;max-width:100%;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:950 40px/1.04 \"Segoe UI Black\",\"Segoe UI\",system-ui,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#fff;background:none;filter:none;-webkit-text-fill-color:#fff;text-shadow:0 3px 0 rgba(0,0,0,.78),0 0 20px rgba(255,255,255,.38);-webkit-text-stroke:1.4px rgba(8,12,50,.6);paint-order:stroke fill}\n";
css += RACINE + " .nl-entete .nl-titre::before," + RACINE + " .nl-entete .nl-titre::after{content:\"\";display:inline-block;width:clamp(22px,7vw,110px);height:4px;border-radius:2px;vertical-align:middle;box-shadow:0 0 10px rgba(255,255,255,.7)}\n";
css += RACINE + " .nl-entete .nl-titre::before{margin-right:clamp(8px,2vw,18px);background:linear-gradient(90deg,transparent,#ffe27a 55%,#fff6c8);box-shadow:0 0 8px #ffe27a}\n";
css += RACINE + " .nl-entete .nl-titre::after{margin-left:clamp(8px,2vw,18px);background:linear-gradient(270deg,transparent,#9fb0ff 55%,#e6ecff);box-shadow:0 0 8px #9fb0ff}\n";
css += RACINE + " .nl-entete p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:min(100%,780px);margin:0;font:700 clamp(13px,1.9vw,17px)/1.25 \"Segoe UI\",system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#fff;text-shadow:0 1px 0 rgba(8,12,50,.95),0 0 8px rgba(8,12,50,.9)}\n";
css += "@media (max-width:560px){\n";
css += RACINE + " .nl-entete{min-height:86px;padding:8px 12px;gap:3px}\n";
css += RACINE + " .nl-entete .nl-titre{font-size:clamp(24px,7vw,30px);letter-spacing:1.5px}\n";
css += RACINE + " .nl-entete .nl-titre::before," + RACINE + " .nl-entete .nl-titre::after{display:none}\n";
css += RACINE + " .nl-entete p{font-size:13px}\n";
css += bloc(true);
css += "}\n";
fs.writeFileSync(path.join(ici, "../public/soreal-idle-ngu-labo-entetes-v1.css"), css);
console.log("ecrit", css.length, "octets");
