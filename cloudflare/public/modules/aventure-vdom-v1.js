/*
 * SOREAL IDLE — page Aventure rendue par composants Preact (chantier de fluidité, 2026-11-18 ; plan : design/PREACT-AVENTURE-PLAN.md).
 *
 * Migrés ici : la bascule Aventure / Titans, le sélecteur de zone et la section « Un objet t'attend ». Mêmes classes, mêmes attributs, mêmes textes et mêmes ponts
 * `window.__…__` que l'ancienne chaîne HTML de pageAventureIdleV28_ (ui-aventure-1-v1.js), qui la garde en repli si Preact n'est pas chargé.
 *
 * NE PASSENT JAMAIS PAR PREACT (haute fréquence, nœuds persistants écrits à la main) : la scène de combat (adventure-scene-v79.js), les barres de vie, le journal, la note de
 * combat, les boutons de compétence et d'Idle Mode (cooldowns). Aucun de ces nœuds n'est dans un conteneur Preact : le conteneur de la scène n'est donc jamais recréé.
 *
 * Règle n°4 : le sélecteur est un élément persistant ; l'état « ouvert » (classe `open`, posée par toggleMenuZoneAdventureIdleV1_ et retirée au clic extérieur) reste impératif :
 * la classe du composant est CONSTANTE, Preact ne la réécrit donc jamais. Les données arrivent déjà calculées (props) : aucune lecture de la page.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AVENTURE_VDOM_V1__)return;
  function P_(){return window.preact||null;}
  function pont_(){return window.__SOREAL_IDLE_VDOM_V1__||null;}
  function pret_(){return Boolean(P_()&&pont_());}
  function appeler_(nom){
    var f=window[nom];
    if(typeof f==='function'){
      var args=Array.prototype.slice.call(arguments,1);
      return f.apply(window,args);
    }
  }
  /* HTML déjà échappé et fabriqué par un autre module (icône de zone, icône de titan) : posé tel quel, réécrit seulement s'il change. */
  function brut_(h,balise,props,html){
    var p=Object.assign({},props||{});
    p.dangerouslySetInnerHTML={__html:html||''};
    return h(balise,p);
  }

  /* Bascule Aventure / Titans. props : {ferme, bossAcces, vueTitans, brille, iconeHtml} */
  function Bascule(props){
    var h=P_().h;
    if(props.ferme){
      /* Exception à la règle n°2 voulue par Norman (2026-10-10) : bouton Titans visible avant l'accès, en ???, avec le boss à vaincre ; il n'ouvre rien. */
      return h('div',{class:'soreal-idle-bascule-aventure-v1'},
        h('button',{type:'button',class:'soreal-idle-expand-button-v25 actif',onClick:function(){appeler_('__vueAventureIdleV1__','zones');}},'🗺️ Aventure'),
        h('button',{type:'button',class:'soreal-idle-expand-button-v25 soreal-idle-titans-ferme-v1',disabled:true,'aria-disabled':'true'},
          h('b',null,'???'),h('small',null,'Vaincs le boss '+props.bossAcces)));
    }
    return h('div',{class:'soreal-idle-bascule-aventure-v1'+(props.iconeHtml?' avec-icone':'')},
      h('button',{type:'button',class:'soreal-idle-expand-button-v25'+(props.vueTitans?'':' actif'),onClick:function(){appeler_('__vueAventureIdleV1__','zones');}},'🗺️ Aventure'),
      h('button',{type:'button',class:'soreal-idle-expand-button-v25'+(props.vueTitans?' actif':'')+(props.brille?' soreal-idle-titan-brille-v1':''),onClick:function(){appeler_('__vueAventureIdleV1__','titans');}},'👹 Titans'),
      props.iconeHtml?brut_(h,'span',{style:'display:contents'},props.iconeHtml):null);
  }

  /* Section « Zones » : flèches, déclencheur, liste des zones DÉBLOQUÉES seulement (règle n°2 : le serveur et l'appelant filtrent). props : {nom, styleDeclencheur, iconeHtml, options:[{id,nom,actif,style,iconeHtml,titre}]} */
  function Zones(props){
    var h=P_().h;
    return h('div',{class:'soreal-idle-section-v8'},
      h('div',{class:'soreal-idle-window-title-v31'},'🗺️ Zones'),
      h('div',{class:'soreal-idle-zone-picker-v1'},
        h('button',{type:'button',class:'soreal-idle-zone-arrow-v1','aria-label':'Zone précédente',onClick:function(){appeler_('__zoneAdventurePrecedenteV1__');}},'◀'),
        h('div',{class:'team-sort-custom soreal-idle-zone-custom-v1',id:'idleZoneSelectCustom'},
          h('button',{type:'button',class:'team-sort-trigger',style:props.styleDeclencheur||undefined,onClick:function(e){appeler_('__toggleMenuZoneAdventureIdleV1__',e);}},
            h('span',{class:'team-sort-trigger-main'},
              h('span',{class:'team-sort-trigger-label'},'Zone'),
              h('span',{class:'team-sort-trigger-value'},
                props.iconeHtml?brut_(h,'span',{class:'zone-ico-v1','aria-hidden':'true'},props.iconeHtml):null,
                props.nom)),
            h('span',{class:'team-sort-arrow'},'▼')),
          h('div',{class:'team-sort-menu'},
            props.options.map(function(o){
              return h('button',{key:o.id,type:'button','data-zone-id':o.id,class:'team-sort-option zone-perso-v1'+(o.actif?' active':''),style:o.style||undefined,title:o.titre,
                /* L'ancienne page se refermait d'elle-même au redessin suivant (la chaîne n'avait pas la classe « open ») ; ici le menu est persistant, on le referme donc explicitement. */
                onClick:function(){appeler_('__selectionnerZoneAdventureIdleV47__',o.id);var p=document.getElementById('idleZoneSelectCustom');if(p)p.classList.remove('open');}},
                o.iconeHtml?brut_(h,'span',{class:'zone-ico-v1','aria-hidden':'true'},o.iconeHtml):null,
                h('span',null,o.nom),
                o.actif?h('span',{class:'team-sort-option-arrow'},'✓'):null);
            }))),
        h('button',{type:'button',class:'soreal-idle-zone-arrow-v1','aria-label':'Zone suivante',onClick:function(){appeler_('__zoneAdventureSuivanteV1__');}},'▶')));
  }

  /* « Un objet t'attend : ton sac est plein ». props : {lignes:[{id,nom,systeme}]} */
  function Deblocages(props){
    var h=P_().h;
    return h('div',{class:'soreal-idle-section-v8'},
      h('div',{class:'soreal-idle-window-title-v31'},'🎒 Un objet t’attend : ton sac est plein'),
      h('div',{style:'display:grid;gap:8px'},
        props.lignes.map(function(d){
          return h('div',{key:d.id,style:'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:12px;background:rgba(255,200,120,.08);border:1px solid rgba(255,200,120,.35)'},
            h('span',null,h('b',null,d.nom),h('br',null),h('small',null,'Libère une place dans ton sac : l’objet y arrivera, puis utilise-le pour débloquer '+d.systeme+'.')));
        })));
  }

  /* ---- Données des composants : tout est calculé ici à partir de l'état (jamais lu dans la page). ---- */
  /* Bascule : j = joueur, a = état Aventure, titans = titans débloqués (déjà filtrés), iconeTitan = HTML de l'icône (modules/titans-v1.js). */
  function bascule_(j,a,titans,iconeTitan,vueTitans){
    var T=window.__SOREAL_IDLE_TITANS_V1__;
    if(titans.length){
      return pont_().monter('aventure-bascule',Bascule,{ferme:false,vueTitans:Boolean(vueTitans),brille:Boolean(T&&T.disponible&&T.disponible(j)),iconeHtml:iconeTitan||''});
    }
    if(Number(a.titansAccesBoss)>0)return pont_().monter('aventure-bascule',Bascule,{ferme:true,bossAcces:String(Math.floor(Number(a.titansAccesBoss)))});
    return '';
  }
  /* Zones : seules les zones DÉBLOQUÉES sont listées (règle n°2). formater = formatGrandNombreIdleV70_. */
  function zones_(zones,selected,zone,formater){
    var perso=window.__SOREAL_IDLE_ZONES_STYLE_V1__;
    return pont_().monter('aventure-zones',Zones,{
      nom:String((zone&&(zone.name||zone.id))||'—'),
      styleDeclencheur:perso&&zone?perso.style(zone.id,false):'',
      iconeHtml:perso&&zone?perso.icone(zone.id):'',
      options:zones.filter(function(z){return z&&z.unlocked;}).map(function(z){
        var actif=String(z.id)===selected;
        var idleInfo=(z.idleP!=null&&z.idleT!=null)?' · Puissance Idle '+formater(z.idleP)+' · Endurance Idle '+formater(z.idleT):'';
        return {id:String(z.id),nom:String(z.name||z.id),actif:actif,style:perso?perso.style(z.id,actif):'',iconeHtml:perso?perso.icone(z.id):'',
          titre:'Puissance '+formater(z.p||0)+' · Endurance '+formater(z.t||0)+idleInfo};
      })
    });
  }
  function deblocages_(lignes){return pont_().monter('aventure-deblocages',Deblocages,{lignes:lignes});}
  function zonesMontees_(){var p=pont_();return Boolean(p&&p.registre&&p.registre['aventure-zones']);}

  window.__SOREAL_IDLE_AVENTURE_VDOM_V1__={pret:pret_,Bascule:Bascule,Zones:Zones,Deblocages:Deblocages,bascule:bascule_,zones:zones_,deblocages:deblocages_,zonesMontees:zonesMontees_};
})();
