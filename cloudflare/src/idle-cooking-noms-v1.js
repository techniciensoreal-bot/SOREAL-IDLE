/*
 * SOREAL IDLE — noms et unités des ingrédients de la cuisine (page Cooking).
 *
 * Source : le jeu NGU Idle (build 1260), CookingController.ingredientProperties (valeurs sérialisées de la scène, lues avec cloudflare/tools/banc-vrai-jeu/scene) : 20 ingrédients,
 * chacun avec son nom, son unité et son multiplicateur d'unité. Le jeu tire 8 noms parmi les 20 pour chaque plat (CookingController::assignNewDish : tirage sans remise) ; la quantité affichée
 * d'un ingrédient est getIngredientAmount = multiplicateur d'unité x niveau choisi (ex. 50 ml, 1 Kg, 2 Cups).
 *
 * Le moteur ne garde pas ces noms dans l'état du repas ; ils sont DÉRIVÉS du numéro du repas (mélange déterministe), donc stables d'un appareil et d'un chargement à l'autre,
 * sans champ de plus à migrer. Cosmétique seulement : aucun effet sur l'efficacité ni le gain d'EXP.
 */
export const IDLE_COOKING_INGREDIENTS_V1 = Object.freeze([
  { nom: "Hot Sauce", unite: "ml", facteur: 50 },
  { nom: "Lobster", unite: "Kg", facteur: 1 },
  { nom: "Toothpaste", unite: "Tubes", facteur: 1 },
  { nom: "Rice", unite: "Cups", facteur: 2 },
  { nom: "MALK", unite: "Cartons", facteur: 1 },
  { nom: "Snake Oil", unite: "Bottle", facteur: 1 },
  { nom: "Mystery Meat", unite: "Handfuls", facteur: 1 },
  { nom: "A Pretzel", unite: "Pretzel", facteur: 1 },
  { nom: "Candy Canes", unite: "Canes", facteur: 1 },
  { nom: "Carrot", unite: "Carats", facteur: 1 },
  { nom: "Coconut Milk", unite: "ml", facteur: 50 },
  { nom: "Dry Spaghetti", unite: "Handfuls", facteur: 1 },
  { nom: "Eggs", unite: "Egg", facteur: 1 },
  { nom: "Flour", unite: "Cups", facteur: 1 },
  { nom: "Garlic", unite: "Cloves", facteur: 1 },
  { nom: "Lemon Juice", unite: "ml", facteur: 50 },
  { nom: "Onion", unite: "Onions", facteur: 1 },
  { nom: "Tomato", unite: "Tomatoes", facteur: 1 },
  { nom: "Bread", unite: "Loaves", facteur: 1 },
  { nom: "Coffee Grounds", unite: "Tbsp", facteur: 1 }
]);

/* Les 8 ingrédients (indices dans IDLE_COOKING_INGREDIENTS_V1) d'un repas : mélange de Fisher-Yates graine = numéro du repas, sans remise comme le jeu. */
export function idleCookingIndicesRepasV1(mealNumber, nombre = 8) {
  let g = (Math.floor(Number(mealNumber) || 0) * 2654435761 + 0x9e3779b9) >>> 0;
  const rnd = () => {
    g = (g + 0x6d2b79f5) | 0;
    let t = Math.imul(g ^ (g >>> 15), 1 | g);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const liste = IDLE_COOKING_INGREDIENTS_V1.map((_, i) => i);
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste.slice(0, nombre);
}

/* Ajoute nom, unité et facteur d'unité à chaque ingrédient DÉJÀ débloqué de la vue publique de la cuisine (jamais un emplacement verrouillé : règle n°2). */
export function idleCookingAjouterNomsV1(snapshot) {
  const d = snapshot && snapshot.data;
  if (!d || !Array.isArray(d.ingredients) || !d.hasMeal) return snapshot;
  const indices = idleCookingIndicesRepasV1(d.mealNumber, d.ingredients.length);
  d.ingredients = d.ingredients.map((ing, i) => {
    if (!ing.unlocked) return ing;
    const def = IDLE_COOKING_INGREDIENTS_V1[indices[i]];
    return Object.assign({}, ing, { nom: def.nom, unite: def.unite, facteur: def.facteur });
  });
  return snapshot;
}
