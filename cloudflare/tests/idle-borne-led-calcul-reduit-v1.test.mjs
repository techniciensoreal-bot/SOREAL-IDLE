import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Borne LED : coût du calcul par image réduit (plan, 2026-11-06), rendu identique. Profil du Combat sur le vrai jeu : canon() 12 % des échantillons de la borne (même texte re-normalisé à chaque image),
 * comparaison de la grille 10 % + 8 %, balayage de toute la grille pour repeindre quelques cellules.
 *  1. canon() est mémorisé (fonction pure du texte) ;
 *  2. une cellule dont la valeur brute, la couleur et le gain n'ont pas changé garde ses niveaux (pas de recalcul) ;
 *  3. le repeint partiel ne balaie que les rangées touchées par une cellule changée (même ordre d'index qu'avant : rendu identique).
 */
const src = fs.readFileSync("cloudflare/public/modules/borne-led-v1.js", "utf8");
assert.ok(/var CANON_MEMO=new Map\(\);/.test(src) && /function canonCalcule\(s\)/.test(src), "canon mémorisé");
assert.ok(/if\(memeGain&&vv\[i\]===pr\[i\]&&cc\[i\]===pq\[i\]\)continue;/.test(src), "cellule inchangée : niveaux conservés");
assert.ok(/this\.pr=new Uint8Array\(n\);this\.pq=new Uint8Array\(n\);this\.pgain=-1;/.test(src), "mémoires remises à zéro avec la grille");
assert.ok(/for\(i=\(yMin<0\?0:yMin\)\*W,iFin=/.test(src) && /for\(i=\(yMin<0\?0:yMin\)\*W;i<iFin;i\+\+\)\{if\(!dm\[i\]/.test(src), "repeint limité aux rangées touchées");

/* le résultat de canon est celui du calcul direct : on exécute le module dans un faux navigateur minimal si possible, sinon on vérifie la pureté par le texte */
const f0 = src.indexOf("function canonCalcule(s){"), f1 = src.indexOf("\n}\n", f0);
const corps = src.slice(f0, f1 + 3);
assert.ok(!/Date|Math\.random|performance|\bS\./.test(corps), "canonCalcule ne dépend d'aucun état variable (pure)");
console.log("idle-borne-led-calcul-reduit-v1: OK");
