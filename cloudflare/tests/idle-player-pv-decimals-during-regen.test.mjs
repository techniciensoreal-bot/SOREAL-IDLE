import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « la barre grisée rétrécit non stop pendant la regen : une fois à 14 il n'y a plus la virgule pour 13.9 »,
 * puis (2026-10-02) : « de 35,04 à 35 les chiffres bougent ; 35,5 au lieu de 35,50 aussi ». Règle finale : les PV du duel (joueur ET boss, PV actuels et max)
 * ont TOUJOURS deux décimales, regen ou non (formaterPvFixeIdleV1_) ; le nombre de caractères ne dépend que de l'ordre de grandeur.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// Le formateur : fonction pure extraite du jeu.
{
  const debut = ui.indexOf("function formaterPvFixeIdleV1_(valeur){");
  const fin = ui.indexOf("function formaterDecimalesFixesIdleV1_(", debut);
  assert.ok(debut > 0 && fin > debut);
  const f = new Function("idleNombre_", ui.slice(debut, fin) + "\nreturn formaterPvFixeIdleV1_;")((v) => (Number.isFinite(Number(v)) ? Number(v) : 0));
  assert.equal(f(35.04), "35,04");
  assert.equal(f(35), "35,00", "35 reste 35,00 : les chiffres ne bougent pas");
  assert.equal(f(35.5), "35,50", "35,5 reste 35,50");
  assert.equal(f(0), "0,00");
  assert.equal(f(999.999), "1000,00", "pas de saut de format surprenant sous le millier");
  assert.equal(f(1500), "1.50K");
  assert.equal(f(1000), "1.00K");
  assert.equal(f(34610000000), "34.61B");
  assert.equal(f(395000000000), "395.00B");
  assert.equal(f(-3), "0,00");
}

// Les deux jauges utilisent ce formateur partout (texte initial, mise à jour, victoire) et passent la regen à part.
const start = ui.indexOf("const regenJoueurVisibleV176=");
assert.ok(start >= 0, "bloc de calcul du PV joueur introuvable.");
const bloc = ui.slice(start, ui.indexOf("const joueurBarre=", start));
assert.ok(bloc.includes("formaterPvFixeIdleV1_(idleEtat.pvJoueur)") && bloc.includes("formaterPvFixeIdleV1_(idleEtat.pvJoueurMax)"));
assert.ok(bloc.includes("regenJoueurVisibleV176>0?'+'+formaterPvFixeIdleV1_(regenJoueurVisibleV176)+'/s':''"), "regen du joueur : petit texte séparé");
const bossStart = ui.indexOf("const bossPvEl=");
const bossBloc = ui.slice(bossStart, ui.indexOf("const barre=", bossStart));
assert.ok(bossBloc.includes("formaterPvFixeIdleV1_(idleEtat.bossPv)") && bossBloc.includes("formaterPvFixeIdleV1_(idleEtat.bossPvMax)"));
assert.ok(bossBloc.includes("bossEnRegenV174?'+'+formaterPvFixeIdleV1_(idleEtat.regenBoss)+'/s':''"), "regen du boss : petit texte séparé");
assert.ok(ui.includes("formaterPvFixeIdleV1_(j.bossPv)"), "texte initial du boss au même format");
/* La vie du joueur s'affiche dans le bandeau du haut avec EXACTEMENT les mêmes formats (PV et régénération). */
assert.ok(ui.includes("window.__SOREAL_IDLE_TEXTE_PV_V2__=function(pv,max){return formaterPvFixeIdleV1_(pv)+' / '+formaterPvFixeIdleV1_(max);};"), "bandeau : PV au même format");
assert.ok(ui.includes("window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__=function(r){return r>0?'+'+formaterPvFixeIdleV1_(r)+'/s':'';};"), "bandeau : régénération au même format");

// Mise en page : cadres à la largeur des portraits, angles de 10 px, regen vert lumineux à droite.
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.ok(/width:calc\(100% \+ 4px\) !important;[\s\S]{0,300}border-radius:10px !important;/.test(css), "cadre vert/rouge : largeur du portrait, angles du cadre joueur");
assert.ok(/\.soreal-idle-hp-regen-v1\{[^}]*position:absolute;[^}]*right:8px;[^}]*color:#8dffb4;[^}]*text-shadow:/.test(css), "regen : petit, vert, lumineux, tout à droite");
// Smartphone : la régénération passe sous les PV (petite, alignée à droite), les PV gardent toute la largeur, les deux cadres ont la même taille.
assert.ok(/@media\(max-width:700px\)\{[\s\S]*display:grid !important;[\s\S]*font-size:clamp\(12px,3\.5vw,14px\) !important;[\s\S]*\.soreal-idle-hp-regen-v1\{[\s\S]*position:static;[\s\S]*justify-self:end;/.test(css), "mobile : régénération sous les PV, à droite");
assert.ok(/font-size:max\(9px,\.55em\);/.test(css), "la régénération est toujours plus petite que les PV");
console.log("idle-player-pv-decimals-during-regen: OK");
