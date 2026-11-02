import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-02) : « sous "énergie placée" et "magie placée" il y a un petit espace vide dans le cadre : mets-les contre le bord inférieur et agrandis "plafond d'énergie" et "magie". Pareil pour toutes les pages. »
 * Cause : le groupe d'une ressource est étiré à la hauteur du cadre Input voisin mais gardait ses lignes en haut (align-content:start), donc le vide tombait sous le total placé.
 * Règle commune (feuille des entêtes compacts) : 1re ligne (Plafond + Idle) = toute la place libre, total placé contre le bord inférieur, boutons étirés ; la hauteur naturelle ne change pas.
 */
const css = readFileSync("cloudflare/public/soreal-idle-entetes-compactes-v1.css", "utf8");
const sans = css.replace(/\/\*[\s\S]*?\*\//g, "");

/* 1. Le groupe ne range plus ses lignes en haut ; la ligne du haut absorbe la hauteur, le total (ligne auto) reste en bas. */
assert.ok(/\.soreal-idle-bt-groupe-v1\{[^}]*align-content:stretch/.test(sans), "groupe : align-content:stretch (plus de vide sous le total)");
assert.ok(!/\.soreal-idle-bt-groupe-v1\{[^}]*align-content:start/.test(sans), "groupe : plus d'align-content:start");
assert.ok(/\.soreal-idle-bt-groupe-v1:has\(>\.soreal-idle-bt-total-v1\)\{grid-template-rows:minmax\(0,1fr\) auto\}/.test(sans), "groupe avec total : ligne du haut 1fr, total en ligne auto");
assert.ok(/\.soreal-idle-bt-groupe-v1>\.soreal-idle-bt-total-v1\{align-self:end\}/.test(sans), "total placé aligné contre le bord inférieur");

/* 2. Les petits cadres Plafond / Idle sont étirés, les boutons prennent la hauteur gagnée (le libellé garde la sienne). */
assert.ok(/\.soreal-idle-bt-groupe-v1>\.soreal-idle-bt-presets-v120:not\(\.soreal-idle-bt-total-v1\)\{align-self:stretch;grid-template-rows:auto minmax\(var\(--bt-btn-h,28px\),1fr\)\}/.test(sans), "Plafond/Idle : étirés, rangée des boutons en 1fr");

/* 3. Téléphone : pile naturelle, aucune ligne forcée (la hauteur ne grandit pas). */
assert.ok(/@media \(max-width:700px\)\{[\s\S]*\.soreal-idle-bt-groupe-v1:has\(>\.soreal-idle-bt-total-v1\)\{grid-template-columns:minmax\(0,1fr\);grid-template-rows:none\}/.test(sans), "téléphone : pas de lignes imposées");

/* 4. NGU (cadres sans total dedans, totaux dessous) : même étirement des boutons. */
assert.ok(/\.nl-barre-outils \.soreal-idle-bt-groupe-v1>\.nl-ligne\{[^}]*grid-template-rows:auto minmax\(var\(--bt-btn-h,28px\),1fr\)[^}]*align-content:stretch/.test(sans), "NGU : boutons étirés dans les cadres");

/* 5. Pas de !important ajouté, pas de texte joueur, et les règles gagnantes de grille ne touchent pas aux rangées. */
assert.ok(!/!important/.test(sans), "aucun !important dans la feuille");
const itopod = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(!/bt-presets-v120:not\(\.soreal-idle-bt-total-v1\)\{[^}]*grid-template-rows[^}]*!important/.test(itopod), "aucune règle prioritaire ne fige les rangées des cadres");

console.log("idle-entetes-allocation-bas-v1: OK");

/* 6. Une seule rangée de cadres sur PC (2026-11-02, 2e demande) : Input >= 360 px et « Mes nombres » sur UNE rangée (colonnes de 34 px), seuils en largeur de fenêtre ; repli ancien dessous ; marges réduites sur PC seulement. */
assert.ok(/@media \(min-width:1480px\)\{[^@]*--bt-cols:minmax\(360px,\.9fr\) repeat\(var\(--bt-n,1\),minmax\(0,1\.2fr\)\)/.test(sans), "2 ressources : Input >= 360 px sur une seule rangée dès 1480 px");
assert.ok(/@media \(min-width:1200px\)\{[^@]*--bt-cols:minmax\(360px,\.8fr\) minmax\(0,1\.6fr\)/.test(sans), "1 ressource : Input >= 360 px dès 1200 px");
assert.ok((sans.match(/\[data-perso-input-rangee\]\{--bt-col-min:34px\}/g) || []).length === 2, "« Mes nombres » : 8 colonnes de 34 px donc 4 paires sur une rangée (les deux seuils)");
assert.ok(/@media \(min-width:1360px\)\{[^@]*--bt-cols:minmax\(0,\.8fr\) repeat/.test(sans), "repli propre entre 1360 et 1480 px (ancienne disposition)");
assert.ok(/@media \(min-width:1200px\)\{[^@]*--bt-cadre-pad:3px 6px;--bt-cadre-gap:3px;--bt-total-pad:2px 10px/.test(sans), "PC : marges intérieures réduites des cadres");
assert.ok(!/min-width:1200px\)\{[^@]*--bt-btn-h/.test(sans), "la hauteur des boutons (cible tactile) n'est pas réduite");
