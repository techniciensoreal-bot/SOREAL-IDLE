/*
 * SOREAL IDLE : cadenas à cinq lettres du Greasy Nerd (Norman, 2026-11-20 ; Character::Update du jeu, build 1260 ; moteur : cloudflare/src/idle-nerd-secret-v1.js).
 * La page « Combat de boss » (menu `combat`) est affichée, le nombre de boss vaincus est celui que le serveur attend et la touche est la lettre attendue : la lettre est envoyée au moteur (action titan7Lettre)
 * et le raccourci habituel de cette touche (R : énergie, T : magie ; modules/ui-aventure-2-v1.js) n'a PAS lieu, comme dans le jeu (la lettre acceptée prend sa place).
 * Anti-spoil (règle n°2) : la lettre attendue et son boss viennent du serveur (`titan7Cadenas` du snapshot de l'Aventure), absents tant que la Maman du Nerd n'est pas vaincue : avant, aucune touche n'est regardée
 * et rien n'est affiché. Le message du jeu (« COMBINATION LOCK n DISENGAGED ») est affiché par meta-progression-v130.js à la réponse du moteur.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_CADENAS_NERD_V1__)return;
  function entier(v){var n=Math.floor(Number(v));return isFinite(n)?n:0;}
  /* Vrai quand la touche est la lettre attendue : l'envoi est fait, le raccourci doit être ignoré. */
  function accepte(touche){
    var REG=window.__SOREAL_IDLE_REG__||{};
    var etat=REG.idleEtat;
    var adv=etat&&etat.systemes&&etat.systemes.adventure;
    var cad=adv&&adv.titan7Cadenas;
    if(!cad||typeof cad!=='object'||REG.idleMenuActifV28!=='combat')return false;
    if(touche!==cad.lettre||entier(etat.bossVaincus)!==entier(cad.boss))return false;
    if(typeof window.__actionMetaV47__!=='function')return false;
    window.__actionMetaV47__({action:'titan7Lettre',lettre:touche,menuBoss:true});
    return true;
  }
  /* Phase de capture : avant le raccourci R / T du document ; une lettre acceptée l'empêche d'arriver jusqu'à lui. */
  document.addEventListener('keydown',function(ev){
    if(ev.ctrlKey||ev.metaKey||ev.altKey||ev.repeat)return;
    var cible=ev.target;
    if(cible&&(cible.tagName==='INPUT'||cible.tagName==='TEXTAREA'||cible.tagName==='SELECT'||cible.isContentEditable))return;
    if(!accepte(String(ev.key||'').toLowerCase()))return;
    ev.preventDefault();ev.stopPropagation();
  },true);
  window.__SOREAL_IDLE_CADENAS_NERD_V1__={accepte:accepte};
})();
