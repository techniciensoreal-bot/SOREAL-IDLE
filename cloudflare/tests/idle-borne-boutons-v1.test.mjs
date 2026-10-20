import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-20) : (1) le gros bouton rouge Fight CLIGNOTE lentement tant qu'il attend d'être pressé ; (2) Nuke illisible : il prend le jaune et noir (liseré de danger, disque jaune, texte noir épais) et Fuite le bleu.
 * Garde : mêmes règles que le rendu vérifié dans le navigateur (luminosité du bouton mesurée de 59 à 159 sur 2,8 s, sur téléphone et sur ordinateur).
 */
const css = readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
const ui = readFileSync(new URL("../public/soreal-idle-ui.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
const regle = (sel) => { const i = css.indexOf(sel); assert.ok(i >= 0, "règle : " + sel); return css.slice(i, css.indexOf("}", i) + 1); };

// Clignotement : 0 % et 100 % identiques (boucle parfaite), lent (2,8 s), sur le bouton et sa bague.
assert.match(css, /@keyframes bnFightClignote\{0%,100%\{filter:brightness\(1\.4\) saturate\(1\.3\)\}50%\{filter:brightness\(\.45\) saturate\(\.8\)\}\}/);
assert.match(css, /@keyframes bnFightBague\{0%,100%\{opacity:1;transform:scale\(1\.1\)\}50%\{opacity:\.06;transform:scale\(\.94\)\}\}/);
assert.ok(/boss-control-v39\.start:not\(:disabled\)\{animation:bnFightClignote 2\.8s ease-in-out infinite\}/.test(css), "Fight actif clignote");
assert.ok(/boss-control-v39\.start:not\(:disabled\)::after\{animation:bnFightBague 2\.8s ease-in-out infinite\}/.test(css), "la bague clignote avec lui");
assert.ok(/bnFightClignote 2\.8s ease-in-out calc\(2\.65s/.test(css), "après l'allumage de la borne aussi");
assert.ok(/prefers-reduced-motion:reduce\)\{\s*[^{]*start:not\(:disabled\)[^{]*\{animation:none\}/.test(css), "mouvement réduit : pas de clignotement");
// Rien ne coupe l'animation de Fight, ni sur téléphone, ni par un filtre imposé.
assert.ok(!/@media \(max-width:700px\)\{[^@]*button\.soreal-idle-boss-control-v39\.start,\.soreal-idle-duel-v41::before[^@]*animation:none!important/.test(css.replace(/\n/g, " ")), "plus d'animation coupée sur téléphone");
assert.ok(!/boss-control-v39\.start:disabled\{[^}]*filter:none[^}]*\}\s*$/.test(ui.split(".soreal-idle-boss-control-v39.start,")[1] ? ui.split(".soreal-idle-boss-control-v39.start,")[1].split("}")[0] + "}" : ""), "le filtre n'est plus imposé au bouton actif");
assert.ok(/\.soreal-idle-boss-control-v39\.start:disabled\{\s*filter:none !important;\s*\}/.test(ui), "inactif : toujours neutre");

// Couleurs : Fuite bleue, Nuke jaune et noir.
const stop = regle(".soreal-idle-boss-control-v39.stop{left:calc(50% - var(--bc)/2 - var(--g) - var(--b))!important;");
const nuke = regle(".soreal-idle-boss-control-v39.nuke{left:calc(50% + var(--bc)/2 + var(--g))!important;");
assert.ok(stop.includes("#5a6aff") && !stop.includes("#ffd400"), "Fuite : bleue");
assert.ok(nuke.includes("#ffd400") && nuke.includes("repeating-linear-gradient(45deg,#ffd400 0 8px,#17140a 8px 16px)") && nuke.includes("color:#14110a!important"), "Nuke : jaune et noir (liseré de danger, texte noir)");
assert.ok(js.includes('<span class="nk-txt">NUKE</span>') && /nuke \.nk-txt\{font-size:1\.4em[^}]*-webkit-text-stroke:\.7px/.test(css), "texte NUKE gros et épais");
assert.ok(/nuke:disabled\{filter:brightness\(\.72\) saturate\(\.85\)\}/.test(css), "Nuke inactif reste lisible");
console.log("idle-borne-boutons-v1: OK");
