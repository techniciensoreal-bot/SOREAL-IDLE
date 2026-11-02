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
        /* Anglais (audit de fluidité du 2026-11-02) : le traducteur du DOM change en place le texte affiché d'un compteur (nodeValue du MÊME nœud) : la comparaison avec le DOM échoue donc à chaque image et le compteur était réécrit (et retraduit) ~60 fois par seconde (10 400 réécritures en 13 s sur Augmentations). On retient la dernière valeur demandée et le nœud de texte créé : tant que c'est le même nœud et que son texte est soit la valeur demandée, soit UNE traduction stable de celle-ci, on ne réécrit pas ; tout autre texte (réécrit par un autre module) est remplacé comme avant. */
        if(this.__tcDernierV1===s&&f&&f===this.lastChild&&f===this.__tcNoeudV1&&f.nodeType===3){
          if(f.nodeValue===s||f.nodeValue===this.__tcTradV1)return;
          if(this.__tcTradV1===undefined){this.__tcTradV1=f.nodeValue;return;}
        }
      }
      var res=ecrire.call(this,valeur);
      if(this.nodeType===1){var g=this.firstChild;this.__tcDernierV1=valeur==null?'':String(valeur);this.__tcNoeudV1=(g&&g===this.lastChild&&g.nodeType===3)?g:null;this.__tcTradV1=undefined;}
      return res;
    };
    garde.__perfTexteV1=true;
    Object.defineProperty(Node.prototype,'textContent',{configurable:true,enumerable:d.enumerable,get:d.get,set:garde});
  }catch(_e){}
})();
