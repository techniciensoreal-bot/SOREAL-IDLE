import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : « les panneaux de quantités de la boutique doivent être plus clairs : 0,1 de vitesse pour 3 EXP ; 1 niveau de vitesse pour 30 EXP. Dans quantité personnalisée, 1 = 30 EXP, 0,1 = 3 EXP. »
 */
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// Lignes de prix : « +gain Nom ➜ coût », avec le nom de la statistique.
assert.ok(meta.includes("'<u>'+l.nom+'</u><s class=\"fl\" aria-hidden=\"true\"></s><b>'+l.cout+' '+(unite||'EXP')+'</b>"), "ligne « +gain Nom ➜ coût »");
assert.ok(meta.includes("idleExpShopBoutonsLotIdleV1_(res.id,stat.id,achat,stat)") && meta.includes("idleExpShopLotPersonnaliseIdleV1_(res.id,stat.id,achat,stat,"));

// Saisie personnalisée : en unités de la statistique (saisie ÷ gain par achat).
const debut = meta.indexOf("function idleExpAchatsDepuisSaisieIdleV1_");
const fn = new Function(meta.slice(debut, meta.indexOf("function idleExpShopLotPersonnaliseIdleV1_")) + "\nreturn idleExpAchatsDepuisSaisieIdleV1_;")();
assert.equal(fn("0.1", 0.1), 1, "0,1 de vitesse = 1 achat = 3 EXP");
assert.equal(fn("0,1", 0.1), 1, "virgule acceptée");
assert.equal(fn("1", 0.1), 10, "1 de vitesse = 10 achats = 30 EXP");
assert.equal(fn("0.3", 0.1), 3, "pas d'erreur d'arrondi flottant");
assert.equal(fn("5", 1), 5, "statistique à gain 1 : la saisie est le nombre d'achats");
assert.equal(fn("", 0.1), 1);
assert.equal(fn("abc", 0.1), 1);
assert.equal(fn("-4", 1), 1);
assert.ok(!meta.includes("Quantité personnalisée ·"), "plus de libellé de traitement de texte");
// Tuiles d'achat (« le B avec les couleurs du A ») : gain vert et prix or dans le bouton, grisée si l'EXP ne suffit pas.
assert.ok(meta.includes("function idleExpTuileAchatIdleV1_(") && meta.includes("soreal-idle-exp-tuile-v1 rang'+rang+(abordable?'':' off')"));
assert.ok(meta.includes(".soreal-idle-exp-tuile-v1 .g{position:relative;font-size:24px!important;font-weight:1000;color:#8ff0a6!important") && meta.includes("color:#ffd45e!important"), "gain vert et prix or");
assert.ok(meta.includes('<div class="carre">') && meta.includes(">Acheter</button></div>'"), "carré avec le bouton Acheter dessous");
assert.ok(meta.includes("[1,10,100].forEach(function(q){if(tiers.indexOf(q)===-1)tiers.push(q);})"), "paliers +0,1 / +1 / +10");
// Offres débutant : tickets, dans le rayon Débuts, seulement pour les ressources et achats déjà débloqués.
assert.ok(meta.includes("soreal-idle-exp-ticket-v1") && meta.includes("idleExpShopTicketsDebutantIdleV1_(j,m)+cartes"), "tickets dans le rayon Débuts");
assert.ok(!meta.includes("idleExpShopNewbieOffersIdleV1_(res.id,stat.id"), "plus d'offres dans chaque statistique");
assert.ok(meta.includes("visibles.some(function(o){return o.id===r;})") && meta.includes("achat.unlockBoss&&verrou&&verrou.unlocked===false"), "anti-spoil : ressource et achat connus");
assert.equal(meta.split("idleExpTuileAchatIdleV1_(").length - 1, 3, "définition + lots de statistiques + articles");
assert.ok(!meta.includes('class="fond" src="/shop/') && !meta.includes(".soreal-idle-exp-tuile-v1 .emo{"), "pas d'image ni de pictogramme géant dans les carrés d'achat");
// Quantité personnalisée détaillée : −, +, Max, récapitulatif (gain, avant · après, coût, reste), flèche dessinée en CSS.
assert.ok(meta.includes("__idleExpShopAjusterLot__") && meta.includes('class="recap"') && meta.includes("Avant · après") && meta.includes("Il te restera") && meta.includes("Il te manque"));
assert.ok(meta.includes(".soreal-idle-exp-custom-v210 .fl::after") && !meta.includes('<span class="soreal-idle-exp-prix-custom-v1">➜'), "plus de flèche emoji dans le panneau");
assert.ok(meta.includes("idleExpShopLotPersonnaliseIdleV1_(res.id,stat.id,achat,stat,x[stat.id])"), "valeur actuelle passée au récapitulatif");
console.log("idle-boutique-exp-quantites-claires-v1: OK");
