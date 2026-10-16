/*
 * Aventure : petites constantes sans dépendance partagées par les fichiers du découpage (audit d'architecture, 2026-10-16 : découpage de idle-adventure-v47.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
export const MAX=100, H=3600000;

export const N=(v,d=0)=>Number.isFinite(+v)?+v:d,I=(v,d=0)=>Math.floor(N(v,d)),C=(v,a,b)=>Math.max(a,Math.min(b,N(v,a))),X=v=>JSON.parse(JSON.stringify(v));

/*
 * Norman (2026-09-16) : "mets à jour les stats des objets avant notre
 * update des chiffres" — wiki NGU (page Boost) confirme 13 vrais paliers :
 * "1, 2, 5, 10, 20, 50, 100, 200, 500, 1k, 2k, 5k and 10k." Il n'en
 * manquait que les 6 derniers (200 à 10k), plafonnant à tort la
 * progression des boosts bien avant le vrai jeu. rollKill() (plus bas)
 * pioche déjà un INDEX dans ce tableau, borné par boss tués — l'étendre
 * suffit, aucune autre formule à toucher.
 */
export const BOOSTS=Object.freeze([1,2,5,10,20,50,100,200,500,1000,2000,5000,10000]);

export const unlockMap={aNumber:"ngu",giantSeed:"yggdrasil",scrapPaper:"diggers",uugHair:"beards",pissedOffKey:"tower",wandoos98:"wandoos"};

/*
 * Utiliser l'OBJET du sac pour débloquer un système (Norman, 2026-10-04 : « dans le jeu de base, c'est en utilisant un objet, pas avec un menu du genre »). Wiki « A Number » : « Upon acquiring A Number you are able to
 * consume it by CTRL + Left Click on it to permanently unlock NGU » ; « A Scrap of Paper » : « First time you Ctrl + Click it to unlock Gold Diggers » ; « A busted copy of Wandoos 98 » : « CTRL + Click to permanently
 * unlock Wandoos 98 ». Le premier usage consomme l'objet (il quitte le sac) et débloque le système pour toujours ; une fois le système débloqué, l'objet garde ses autres usages (Wandoos : niveaux d'OS ; Giant Seed :
 * graines) et le fusionner jusqu'au niveau 100 donne sa récompense de complétion. L'ancien menu « Objets de déblocage » (drapeaux unlockItems) ne sert plus que de secours quand l'objet réel manque au sac.
 */
export const UNLOCK_PAR_OBJET_V1=Object.freeze({aNumber:"aNumber",giantSeed:"giantSeed","scrap:paper":"scrapPaper",uugHair:"uugHair",pissedOffKey:"pissedOffKey",wandoos98:"wandoos98"});

/* Compteurs de travail (lecture seule, pour les tests de non-régression de performance : voir idle-bonus-memo-v1.test.mjs). */
export const __perfCompteursV1={normalisations:0,calculsEquipement:0};
