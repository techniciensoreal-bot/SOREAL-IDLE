/*
 * SOREAL IDLE — écritures de texte inutiles supprimées (Norman, 2026-10-07 : « l'application lagge pas mal sur mon téléphone »).
 * Mesure en direct : sans rien faire, la page recevait ~175 modifications du DOM par seconde, car chaque compteur (statistiques, énergie, Magic, PV...) réécrivait son texte à chaque
 * image même quand il n'avait pas changé : chaque réécriture détruit et recrée le nœud de texte, donc relance le calcul de style, de mise en page et de dessin. Sur un téléphone moyen,
 * c'est le premier poste de dépense. Ce petit garde ne fait rien quand le texte demandé est déjà celui qui est affiché : le résultat visible est strictement le même.
 */
(function(){
  'use strict';
  try{
    var d=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
    if(!d||!d.set||d.set.__perfTexteV1)return;
    var ecrire=d.set;
    var garde=function(valeur){
      if(this.nodeType===1){
        var s=valeur==null?'':String(valeur);
        if(this.__dsnTexte!==undefined&&this.__dsnTexte===s&&this.innerHTML===this.__dsnHtml)return;
        var f=this.firstChild;
        if(f&&f===this.lastChild&&f.nodeType===3&&f.nodeValue===s)return;
        if(!f&&s==='')return;
      }
      return ecrire.call(this,valeur);
    };
    garde.__perfTexteV1=true;
    Object.defineProperty(Node.prototype,'textContent',{configurable:true,enumerable:d.enumerable,get:d.get,set:garde});
  }catch(_e){}
})();
