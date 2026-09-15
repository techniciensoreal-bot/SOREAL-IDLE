import assert from "node:assert/strict";
import {
  bigNormalizeV1,
  bigFromNumberV1,
  bigFromLog10V1,
  bigMultiplyV1,
  bigDivideV1,
  bigProductV1,
  bigPowV1,
  bigCompareV1,
  bigToNumberV1,
  bigFormatV1,
  bigIsFiniteV1
} from "../src/idle-big-number-v1.js";

/*
 * Mission NGU (2026-09-08) : idle-ngu-progression.js::safePow()/safeProduct()
 * écrêtaient tout résultat à [1e-300, 1e300], rendant 1e400 et 1e900
 * indiscernables (les deux valent exactement 1e300). Ce module remplace ce
 * plafond arbitraire par une vraie représentation mantisse/exposant.
 * Chaque test ici vérifie une propriété mathématique précise, pas une
 * approximation "ça a l'air correct".
 */

// --- Round-trip pour les valeurs représentables en Number JS classique ---
for (const n of [0, 1, -1, 42, 0.001, 500, 1e18, -1e18, 9e18, 1e300, 1e-300]) {
  const big = bigFromNumberV1(n);
  const back = bigToNumberV1(big);
  const relError = n === 0 ? Math.abs(back) : Math.abs(back - n) / Math.abs(n);
  assert.ok(
    relError < 1e-9,
    "Round-trip Number->Big->Number doit préserver la valeur pour " + n + " (obtenu " + back + ")"
  );
}

// --- La normalisation garantit toujours 1 <= |m| < 10 (ou m===0) ---
for (const [m, e] of [[9.9999999999, 5], [10, 3], [0.5, 7], [-10, 2], [1, 0], [0, 42]]) {
  const norm = bigNormalizeV1(m, e);
  if (norm.m !== 0) {
    assert.ok(
      Math.abs(norm.m) >= 1 && Math.abs(norm.m) < 10,
      "bigNormalizeV1(" + m + "," + e + ") doit garder |m| dans [1,10), obtenu m=" + norm.m
    );
  }
}

// --- LE bug corrigé : deux magnitudes très différentes au-delà de 1e300 ---
// restent DISTINGUABLES et correctement ORDONNÉES (ancien bug : toutes deux
// valaient exactement 1e300, donc "égales" à tort).
{
  const petit = bigFromLog10V1(400, 1);   // ~1e400
  const grand = bigFromLog10V1(900, 1);   // ~1e900
  assert.notEqual(
    bigCompareV1(petit, grand), 0,
    "1e400 et 1e900 ne doivent jamais comparer comme égaux (c'était le bug)."
  );
  assert.equal(
    bigCompareV1(petit, grand), -1,
    "1e400 doit rester strictement inférieur à 1e900."
  );
  assert.equal(petit.e, 400, "L'exposant de 1e400 doit être exactement 400, pas écrêté à 300.");
  assert.equal(grand.e, 900, "L'exposant de 1e900 doit être exactement 900, pas écrêté à 300.");
}

// --- Multiplication en espace mantisse/exposant ---
{
  const a = bigFromNumberV1(2e150);
  const b = bigFromNumberV1(3e200);
  const produit = bigMultiplyV1(a, b);
  // 2e150 * 3e200 = 6e350 (exactement, pas d'écrêtage)
  assert.equal(produit.e, 350, "2e150 * 3e200 doit avoir l'exposant 350.");
  assert.ok(Math.abs(produit.m - 6) < 1e-9, "2e150 * 3e200 doit avoir la mantisse 6.");
}

// --- Division en espace mantisse/exposant ---
// NB : 6e350 est au-delà de ce qu'un littéral Number JS peut représenter
// (déjà Infinity au moment du parsing) — on construit donc directement la
// valeur en mantisse/exposant plutôt que via un littéral impossible.
{
  const a = { m: 6, e: 350 };
  const b = bigFromNumberV1(3e200);
  const quotient = bigDivideV1(a, b);
  assert.equal(quotient.e, 150, "6e350 / 3e200 doit avoir l'exposant 150.");
  assert.ok(Math.abs(quotient.m - 2) < 1e-9, "6e350 / 3e200 doit avoir la mantisse 2.");
}

// --- Produit d'une longue liste (le cas d'usage réel de safeProduct) ---
{
  // Reproduit approximativement une chaîne de facteurs NUMBER (8-10 termes)
  // dont le produit dépasse largement 1e300, pour vérifier qu'aucune étape
  // intermédiaire ne perd d'information.
  const facteurs = [2, 1.5, 1e50, 1e60, 1e70, 1e80, 1e90, 1e30];
  const attendu = 2 * 1.5; // partie non-exponentielle
  const sommeExposants = 50 + 60 + 70 + 80 + 90 + 30;
  const resultat = bigProductV1(facteurs);
  assert.equal(
    resultat.e, sommeExposants,
    "Le produit d'une longue chaîne de facteurs doit conserver la somme exacte des exposants."
  );
  assert.ok(
    Math.abs(resultat.m - attendu) < 1e-6,
    "Le produit doit conserver la mantisse correcte : attendu " + attendu + ", obtenu " + resultat.m
  );
}

// --- Puissance ---
{
  const base = bigFromNumberV1(10);
  const resultat = bigPowV1(base, 350);
  assert.equal(resultat.e, 350, "10^350 doit avoir l'exposant 350.");
  assert.ok(Math.abs(resultat.m - 1) < 1e-9, "10^350 doit avoir la mantisse 1.");
}
{
  const base = bigFromNumberV1(2);
  const resultat = bigPowV1(base, 1000);
  // 2^1000 ≈ 1.0715e301 (valeur mathématique connue)
  assert.equal(resultat.e, 301, "2^1000 doit avoir l'exposant 301.");
  assert.ok(Math.abs(resultat.m - 1.0715) < 0.001, "2^1000 doit avoir la mantisse ~1.0715, obtenu " + resultat.m);
}

// --- bigToNumberV1 renvoie Infinity (pas une fausse valeur finie) hors plage double ---
{
  const enormissime = bigFromLog10V1(1000, 1);
  assert.equal(bigToNumberV1(enormissime), Infinity, "Une magnitude au-delà de 1.79e308 doit devenir Infinity, jamais une fausse valeur finie.");
  assert.equal(bigIsFiniteV1(enormissime), false, "bigIsFiniteV1 doit détecter le dépassement.");
}
{
  const zero = bigFromNumberV1(0);
  assert.equal(bigToNumberV1(zero), 0);
  assert.equal(bigIsFiniteV1(zero), true);
}

// --- Ordre total cohérent sur une large plage (0, positifs, négatifs, extrêmes) ---
{
  const valeurs = [
    bigFromLog10V1(500, -1),
    bigFromNumberV1(-1),
    bigFromNumberV1(0),
    bigFromNumberV1(1),
    bigFromLog10V1(500, 1)
  ];
  for (let i = 0; i < valeurs.length - 1; i++) {
    assert.equal(
      bigCompareV1(valeurs[i], valeurs[i + 1]), -1,
      "L'ordre croissant attendu (−1e500 < −1 < 0 < 1 < 1e500) doit être respecté à l'index " + i
    );
  }
}

// --- Formatage : jamais utilisé pour du calcul, juste vérifié lisible ---
{
  const grand = bigFromLog10V1(350.3, 1);
  const formatted = bigFormatV1(grand, 2);
  assert.ok(/^\d\.\d{2}e\+350$/.test(formatted), "Le format d'un grand nombre doit ressembler à '1.99e+350', obtenu: " + formatted);
  assert.equal(bigFormatV1(bigFromNumberV1(42)), "42", "Un petit nombre entier doit s'afficher sans notation exponentielle.");
}

console.log("idle-big-number-v1: OK");
