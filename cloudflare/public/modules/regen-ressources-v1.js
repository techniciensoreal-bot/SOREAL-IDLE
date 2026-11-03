/*
 * SOREAL IDLE — régénération d'énergie et de magie : la page prévoit EXACTEMENT ce que le moteur donne (Norman, 2026-11-03 : « pourquoi ta regen de magie et d'énergie fait des rollback en local ? », « si un nombre recule,
 * c'est une erreur de calcul ou une latence : supprime-le à la racine »).
 *
 * Cause MESURÉE (jeu local, énergie et magie à +1/s, réponses toutes les 1,5 s) : un recul de 1, exactement toutes les 3,0 s, sur les deux barres. Le moteur crédite l'énergie par REMPLISSAGES de la barre
 * (`resources.<r>.bars` points à chaque remplissage, `fillProgress` = part du remplissage en cours) ; la page, elle, compte ses propres ticks (`energieTick` : gain, dureeMs) sur une horloge locale. Les deux
 * « réseaux de ticks » n'avaient aucune raison de coïncider : le moteur publiait `energieTick.resteMs = 0` (il ignorait sa propre phase), la page gardait la sienne d'une réponse à l'autre. Quand la page
 * franchissait l'entier suivant avant le moteur (de 0 à 1 tick d'avance selon la phase), la réponse suivante (valeur du moteur à son instant) était PLUS BASSE d'une unité : un recul affiché, puis la page
 * repassait l'entier. Deux auteurs pour un même nombre, avec deux phases différentes.
 *
 * Correction à la source : à chaque réponse du moteur, la page se cale sur la phase RÉELLE du moteur (fillProgress, bars, vitesse) et l'avance de l'âge de la réponse (temps écoulé entre l'instant où le moteur a
 * calculé et maintenant) avec la même arithmétique de remplissages. Ses ticks tombent alors aux instants où le moteur crédite : à la réponse suivante, la valeur du moteur est celle que la page affiche déjà.
 * Aucune tolérance ni retenue : la page et le moteur appliquent la même règle.
 *   window.__SOREAL_IDLE_REGEN_V1__ = { projeter(p) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_REGEN_V1__)return;

  function nb(v){v=Number(v);return isFinite(v)?v:0;}

  /*
   * p = { base: valeur affichée au moment où le moteur a calculé (entier),
   *       fp: fillProgress (0 à 1, part du remplissage en cours), bars: points par remplissage, perSecond: points par seconde du moteur,
   *       gain, dureeMs: le tick de la page (même formule que metaTickEnergieIdleV114_ / metaTickMagieIdleV1_),
   *       ageMs: temps écoulé depuis l'instant du moteur, max: plafond (Infinity si inconnu) }
   * Renvoie { valeur, resteMs } : la valeur à afficher MAINTENANT et le temps déjà écoulé dans le tick de page en cours (le prochain tick tombe à dureeMs - resteMs).
   */
  function projeter(p){
    var bars=Math.max(1,nb(p.bars)||1),ps=nb(p.perSecond),dur=nb(p.dureeMs),gain=Math.max(1,nb(p.gain)||1);
    if(!(ps>0)||!(dur>0))return null;
    var P=1000*bars/ps;                                        /* durée d'un remplissage du moteur */
    var u=Math.min(Math.max(0,nb(p.fp)),0.999999999999)*P+Math.max(0,nb(p.ageMs));   /* temps écoulé depuis le dernier remplissage, à maintenant */
    var n=Math.floor((u+1e-7)/P);                              /* remplissages terminés depuis l'instant du moteur */
    var up=Math.max(0,u-n*P);                                  /* part du remplissage en cours */
    var k=Math.floor((up+1e-7)/dur);                           /* ticks de la page déjà tombés dans ce remplissage (compte-gouttes) */
    var base=Math.floor(nb(p.base)+1e-9);
    var valeur=Math.floor(base+n*bars+k*gain+1e-9);
    var max=typeof p.max==='number'&&!isNaN(p.max)?p.max:Infinity;
    if(isFinite(max)&&valeur>=max)return {valeur:Math.max(base,Math.floor(max+1e-9)),resteMs:0};
    return {valeur:valeur,resteMs:Math.max(0,up-k*dur)};
  }

  window.__SOREAL_IDLE_REGEN_V1__={projeter:projeter};
})();
