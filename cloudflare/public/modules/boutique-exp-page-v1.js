/*
 * SOREAL IDLE — page Boutique EXP (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe).
 * Extrait tel quel de meta-progression-v130.js (même code, mêmes ponts window.__x__ pour les onclick inline).
 * Dépendances : window.__SOREAL_IDLE_META_V130__ et window.__SOREAL_IDLE_META_HOST_V130__, relus seulement à l'exécution
 * (l'ordre de chargement des <script> n'a pas d'importance). Expose window.__SOREAL_IDLE_BOUTIQUE_EXP_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BOUTIQUE_EXP_PAGE_V1__)return;

      function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}
      function actionMetaIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.actionMetaIdleV130_.apply(null,arguments);}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-299 */
      const IDLE_SPEND_EXP_STATS_V1=[
        {
          id:'speed',
          nom:'Vitesse',
          icone:'⏩',
          /* Wiki NGU Idle, page « Energy » (Purchase) : Speed = « rate at which you generate Energy », plafonné à 50 : 1 point par tick (50 par seconde) et par barre. */
          explication:'Vitesse de remplissage de la barre de cette ressource : plus elle est élevée, plus vite tes points sont générés. Maximum : 50 remplissages par seconde.'
        },
        {
          id:'power',
          nom:'Puissance',
          icone:'💪',
          /* Wiki, page « Energy » : Power = « effect of each point of Energy put into a task » ; la production d'une activité vaut points placés × Power (sauf Basic Training et Wandoos). Elle ne change pas la génération. */
          explication:'Augmente la puissance de cette ressource : avec moins d’énergie placée, tu fais la même chose. N’a pas d’effet sur le menu Entraînement de base.'
        },
        {
          id:'cap',
          nom:'Plafond',
          icone:'📦',
          explication:'Augmente la quantité maximale de ressource que tu peux stocker.'
        },
        {
          id:'bars',
          nom:'Barres',
          icone:'📊',
          /* Wiki, page « Energy » : Bars = « increases the rate at which you generate Energy » ; moteur (advanceGeneratedResources) : chaque remplissage de la barre donne autant de points que de Barres, donc génération par seconde = vitesse × Barres. */
          explication:'Chaque remplissage de la barre te donne autant de points que de Barres : avec 3 Barres, un remplissage rapporte 3 points au lieu de 1. Ça multiplie la vitesse de génération (vitesse × Barres).'
        }
      ];

      function idleExpShopIdInput_(res,stat){
        return 'idle-exp-qty-'+res+'-'+stat;
      }

      function idleExpShopIdApercu_(res,stat){
        return 'idle-exp-cost-'+res+'-'+stat;
      }

      /*
       * Boutons d'achat (Norman, 2026-10-04) : « les prix ne doivent pas être dans les boutons ; boutons plus petits, qui montrent juste que l'achat sera effectué ; les explications, le prix etc. dans la partie sombre
       * du cadre ». Le bouton ne dit donc que « Acheter » (et la quantité) ; le prix et le gain de chaque quantité sont écrits dans la carte (idleExpPrixCarteIdleV1_).
       */
      function idleExpLibelleAchatIdleV1_(q){return q>1?'Acheter ×'+q:'Acheter';}

      function idleExpPrixCarteIdleV1_(lignes,unite){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const liste=(lignes||[]).filter(Boolean);
        if(!liste.length)return '';
        return '<div class="soreal-idle-exp-prix-v1">'+liste.map(function(l){
          /* Ligne claire, façon jeu (Norman, 2026-10-09 : « 0,1 de vitesse pour 3 EXP ; 1 niveau de vitesse pour 30 EXP ») : « +gain Nom ➜ coût ». Sans nom, l'ancien format « Prix / ×q ». */
          if(l.nom){
            const gainTxt=l.gain!=null&&l.gain!==''?'<em>+'+l.gain+'</em>':(l.q>1?'<i>×'+H.idleEntier_(l.q)+'</i>':'');
            return '<span class="soreal-idle-exp-prix-ligne-v1 jeu">'+gainTxt+'<u>'+l.nom+'</u><s class="fl" aria-hidden="true"></s><b>'+l.cout+' '+(unite||'EXP')+'</b></span>';
          }
          return '<span class="soreal-idle-exp-prix-ligne-v1">'+(l.q>1?'<i>×'+H.idleEntier_(l.q)+'</i>':'<i>Prix</i>')+(l.gain!=null&&l.gain!==''?'<em>+'+l.gain+'</em>':'')+'<b>'+l.cout+' '+(unite||'EXP')+'</b></span>';
        }).join('')+'</div>';
      }

      /*
       * Tuile d'achat (Norman, 2026-10-09 : « le B avec les couleurs du A ») : le gain en vert et le prix en or sont DANS le bouton, sur fond sombre ; la tuile est grisée quand l'EXP ne suffit pas
       * (elle reste cliquable : le serveur répond). Plus de ligne de prix séparée.
       */
      function idleExpExpDisponibleIdleV1_(){
        try{
          const H=window.__SOREAL_IDLE_META_HOST_V130__;
          const e=H.getIdleEtat();
          return H.idleNombre_(e&&e.systemes&&e.systemes.currencies&&e.systemes.currencies.experience);
        }catch(err){return 0;}
      }

      /*
       * Le carré a l'image de l'achat en fond (Norman, 2026-10-09 : « des carrés avec l'image en fond et les prix par-dessus ») : la vraie illustration quand elle existe (dossier /shop/), sinon le grand pictogramme de
       * l'achat ; le gain et le prix sont posés par-dessus, cernés pour rester lisibles.
       */
      /*
       * Carré d'achat « jeu » (Norman, 2026-10-09 : « un truc plus joli », sans image géante) : un petit médaillon avec le pictogramme de l'achat, le gain en grand, une étiquette de prix en pièce d'or, et un
       * cadre bronze, argent ou or selon le palier (rang 0, 1, 2). `opts` = { icone, rang }.
       */
      function idleExpTuileAchatIdleV1_(haut,coutTexte,coutNombre,onclick,opts){
        const abordable=idleExpExpDisponibleIdleV1_()>=coutNombre;
        const o=opts||{};
        const rang=Math.max(0,Math.min(2,Number(o.rang)||0));
        const medaillon=o.icone?'<span class="med" aria-hidden="true">'+o.icone+'</span>':'';
        return '<div class="soreal-idle-exp-tuile-v1 rang'+rang+(abordable?'':' off')+'"><div class="carre">'+medaillon+'<span class="g">'+haut+'</span><span class="p"><i aria-hidden="true">★</i>'+coutTexte+' <small>EXP</small></span></div>'+
          '<button type="button" class="soreal-idle-exp-buy-v210" onclick="'+onclick+'">Acheter</button></div>';
      }

      function idleExpShopBoutonsLotIdleV1_(res,stat,achat,statDef){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const tiers=(Array.isArray(achat.bulkTiers)&&achat.bulkTiers.length?achat.bulkTiers.slice():[1]);
        /* Norman (2026-10-09) : plusieurs carrés, +0,1 / +1 / +10 pour Vitesse : toujours les paliers ×1, ×10 et ×100 (le serveur accepte n'importe quelle quantité). */
        [1,10,100].forEach(function(q){if(tiers.indexOf(q)===-1)tiers.push(q);});
        tiers.sort(function(a,b){return a-b;});
        return '<div class="soreal-idle-exp-tuiles-v1">'+tiers.map(function(qty,rang){
          const cout=H.idleEntier_((achat.cost||0)*qty);
          return idleExpTuileAchatIdleV1_('+'+H.formatGrandNombreIdleV70_((achat.gain||0)*qty,2),H.formatGrandNombreIdleV70_(cout,2),cout,
            'window.__acheterRessourceMetaIdleV130__(\''+H.idleHtml_(res)+'\',\''+H.idleHtml_(stat)+'\','+qty+')',{icone:statDef?statDef.icone:'',rang:rang});
        }).join('')+'</div>';
      }

      /*
       * Quantité personnalisée (Norman, 2026-10-09) : la saisie est en UNITÉS DE LA STATISTIQUE, pas en nombre d'achats. Avec Vitesse (+0,1 pour 3 EXP) : « 1 » coûte 30 EXP, « 0,1 » coûte 3 EXP.
       * Le nombre d'achats envoyé au serveur vaut saisie ÷ gain par achat (arrondi, au moins 1).
       */
      /* Lecture d'une saisie « 30K », « 1,5 M », « 2.4B »… (les mêmes suffixes que l'affichage des grands nombres : K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, …). Rend NaN si le texte n'est pas un nombre. */
      const IDLE_EXP_SUFFIXES_V1=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qad','Qid','Sxd','Spd','Ocd','Nod','Vg','Uvg','Dvg','Tvg','Qavg','Qivg','Sxvg','Spvg','Ocvg','Novg','Tg'];

      function idleExpLireNombreSaisieIdleV1_(texte){
        const brut=String(texte==null?'':texte).trim().replace(/\s+/g,'');
        const m=/^([0-9]+(?:[.,][0-9]+)?)([A-Za-z]*)$/.exec(brut);
        if(!m)return NaN;
        const base=Number(m[1].replace(',','.'));
        if(!m[2])return base;
        const rang=IDLE_EXP_SUFFIXES_V1.findIndex(function(x){return x&&x.toLowerCase()===m[2].toLowerCase();});
        return rang>0?base*Math.pow(1000,rang):NaN;
      }

      function idleExpAchatsDepuisSaisieIdleV1_(texte,gain){
        const v=idleExpLireNombreSaisieIdleV1_(texte);
        const g=Number(gain)>0?Number(gain):1;
        if(!Number.isFinite(v)||v<=0)return 1;
        return Math.max(1,Math.round(v/g+1e-9));
      }

      /* Quantité d'achats d'un champ : la valeur posée par −, + ou Max est gardée telle quelle (le texte affiché est arrondi), une saisie à la main est relue. */
      function idleExpQuantiteChampIdleV1_(input,gain){
        if(input&&input.dataset&&input.dataset.qtxt===input.value&&Number(input.dataset.qty)>=1)return Math.floor(Number(input.dataset.qty));
        return idleExpAchatsDepuisSaisieIdleV1_(input?input.value:'',gain);
      }

      /*
       * Quantité personnalisée détaillée (Norman, 2026-10-09 : « plus détaillé, pas simplement une flèche ») : −, saisie, +, Max, puis un récapitulatif de l'achat : gain, valeur avant et après, coût, EXP restante
       * (ou EXP qui manque). Tout se met à jour pendant la frappe (idleExpShopApercuLotPersonnalise__).
       */
      function idleExpShopLotPersonnaliseIdleV1_(res,stat,achat,statDef,actuel){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const idInput=idleExpShopIdInput_(res,stat);
        const idApercu=idleExpShopIdApercu_(res,stat);
        const gain=Number(achat.gain)>0?Number(achat.gain):1;
        const coutUnitaire=H.idleEntier_(achat.cost||0);
        const nom=statDef?statDef.icone+' '+statDef.nom:'';
        const args='\''+H.idleHtml_(res)+'\',\''+H.idleHtml_(stat)+'\'';
        return '<div class="soreal-idle-exp-custom-v210 detail" id="'+idHtml_attr_(idInput)+'-panneau" data-gain="'+gain+'" data-cout="'+coutUnitaire+'" data-actuel="'+(Number(actuel)||0)+'" data-plafond="'+(Number(achat.hardCap)||0)+'">'+
          '<label>Quantité personnalisée'+(nom?' · <b>'+H.idleHtml_(nom)+'</b>':'')+'</label>'+
          '<div class="saisie">'+
            '<button type="button" class="pm" aria-label="Moins" onclick="window.__idleExpShopAjusterLot__('+args+',-1)">−</button>'+
            '<input type="text" inputmode="decimal" value="'+H.formatGrandNombreIdleV70_(gain,2)+'" data-gain="'+gain+'" id="'+idHtml_attr_(idInput)+'" oninput="window.__idleExpShopApercuLotPersonnalise__('+args+','+coutUnitaire+')">'+
            '<button type="button" class="pm" aria-label="Plus" onclick="window.__idleExpShopAjusterLot__('+args+',1)">+</button>'+
            '<button type="button" class="pm max" onclick="window.__idleExpShopAjusterLot__('+args+',0)">Max</button>'+
          '</div>'+
          '<div class="recap">'+
            '<div class="l"><span class="k">Tu gagnes</span><b class="gv" data-r="gain">+'+H.formatGrandNombreIdleV70_(gain,2)+'</b><span class="nm">'+H.idleHtml_(nom)+'</span></div>'+
            '<div class="l"><span class="k">Avant · après</span><span class="av" data-r="avant">'+H.formatGrandNombreIdleV70_(actuel||0,2)+'</span><i class="fl" aria-hidden="true"></i><b class="ap" data-r="apres">'+H.formatGrandNombreIdleV70_((Number(actuel)||0)+gain,2)+'</b></div>'+
            '<div class="l"><span class="k">Coût</span><b class="cv">★ <span id="'+idHtml_attr_(idApercu)+'">'+coutUnitaire+'</span> EXP</b></div>'+
            '<div class="l"><span class="k" data-r="restek">'+(idleExpExpDisponibleIdleV1_()>=coutUnitaire?'Il te restera':'Il te manque')+'</span><b class="rs" data-r="reste">★ '+H.formatGrandNombreIdleV70_(Math.round(Math.abs(idleExpExpDisponibleIdleV1_()-coutUnitaire)))+' EXP</b></div>'+
          '</div>'+
          '<button type="button" class="soreal-idle-exp-buy-v210 primary" onclick="window.__acheterRessourceLotPersonnaliseMetaIdleV130__('+args+')">Acheter</button>'+
        '</div>';
      }

      function idHtml_attr_(v){const a=window.__SOREAL_IDLE_TEXT_TRANSFORMS_V1__;return a&&a.attr?a.attr(v):String(v||'');}

      window.__idleExpShopApercuLotPersonnalise__=function(res,stat,coutUnitaire){
        const input=document.getElementById(idleExpShopIdInput_(res,stat));
        const apercu=document.getElementById(idleExpShopIdApercu_(res,stat));
        if(!input||!apercu)return;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const panneau=document.getElementById(idleExpShopIdInput_(res,stat)+'-panneau');
        const gain=Number(input.getAttribute('data-gain'))>0?Number(input.getAttribute('data-gain')):1;
        const qty=idleExpQuantiteChampIdleV1_(input,gain);
        const cout=H.idleEntier_(coutUnitaire*qty);
        apercu.textContent=H.formatGrandNombreIdleV70_(cout,2);
        if(!panneau)return;
        const ecrire=function(r,t){const e=panneau.querySelector('[data-r="'+r+'"]');if(e)e.textContent=t;};
        const actuel=Number(panneau.getAttribute('data-actuel'))||0;
        const plafond=Number(panneau.getAttribute('data-plafond'))||0;
        let apres=actuel+qty*gain;
        if(plafond>0&&apres>plafond)apres=plafond;
        ecrire('gain','+'+H.formatGrandNombreIdleV70_(qty*gain,2));
        ecrire('apres',H.formatGrandNombreIdleV70_(apres,2));
        const exp=idleExpExpDisponibleIdleV1_();
        const reste=exp-cout;
        ecrire('restek',reste>=0?'Il te restera':'Il te manque');
        ecrire('reste','★ '+H.formatGrandNombreIdleV70_(Math.round(Math.abs(reste)))+' EXP');
        panneau.classList.toggle('manque',reste<0);
      };
      /* −, + (un cran de la statistique) et Max (le plus grand achat que l'EXP permet, dans la limite du plafond). */
      window.__idleExpShopAjusterLot__=function(res,stat,sens){
        const input=document.getElementById(idleExpShopIdInput_(res,stat));
        const panneau=document.getElementById(idleExpShopIdInput_(res,stat)+'-panneau');
        if(!input||!panneau)return;
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const gain=Number(input.getAttribute('data-gain'))>0?Number(input.getAttribute('data-gain')):1;
        const cout=Number(panneau.getAttribute('data-cout'))||1;
        const actuel=Number(panneau.getAttribute('data-actuel'))||0;
        const plafond=Number(panneau.getAttribute('data-plafond'))||0;
        let qty=idleExpQuantiteChampIdleV1_(input,gain);
        if(sens===0){
          qty=Math.floor(idleExpExpDisponibleIdleV1_()/cout);
          if(plafond>0)qty=Math.min(qty,Math.floor((plafond-actuel)/gain+1e-9));
          qty=Math.max(1,qty);
        }else qty=Math.max(1,qty+sens);
        input.value=H.formatGrandNombreIdleV70_(Math.round(qty*gain*1e6)/1e6,2);
        input.dataset.qtxt=input.value;
        input.dataset.qty=String(qty);
        window.__idleExpShopApercuLotPersonnalise__(res,stat,cout);
      };

      /*
       * Offres débutant en « ticket » (Norman, 2026-10-09), rangées dans le rayon Débuts : souche à gauche (offre unique), gain et prix au centre, bouton à droite. Une offre n'apparaît que pour une ressource déjà
       * connue du joueur et pour un achat déjà débloqué (anti-spoil, règle n°2).
       */
      function idleExpShopNewbieOffersIdleV1_(res,stat,offres,utilisees,statDef,resNom){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const restantes=(offres||[]).filter(function(o){return utilisees.indexOf(o.id)===-1;});
        const exp=idleExpExpDisponibleIdleV1_();
        return restantes.map(function(o){
          const abordable=exp>=H.idleEntier_(o.cost);
          return '<div class="soreal-idle-exp-ticket-v1'+(abordable?'':' off')+'"><div class="souche"><i>🎟️</i>Offre unique</div><div class="corps">'+
            '<div class="quoi"><small>'+H.idleHtml_(resNom||'')+'</small><b>+'+H.formatGrandNombreIdleV70_(o.gain,2)+' '+H.idleHtml_(statDef?statDef.icone+' '+statDef.nom:'')+'</b></div>'+
            '<span class="prix">★ '+H.formatGrandNombreIdleV70_(H.idleEntier_(o.cost),2)+' EXP</span>'+
            '<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterNewbieOfferMetaIdleV130__(\''+
            H.idleHtml_(res)+'\',\''+H.idleHtml_(stat)+'\',\''+H.idleHtml_(o.id)+'\')">Acheter</button></div></div>';
        }).join('');
      }

      function idleExpShopTicketsDebutantIdleV1_(j,m){
        const newbie=m.newbieOffers||{};
        const utilisees=Array.isArray(newbie.used)?newbie.used:[];
        const visibles=idleExpOngletsVisiblesIdleV1_(j,m);
        const html=['energy','magic','r3'].filter(function(r){return visibles.some(function(o){return o.id===r;});}).map(function(r){
          const catalogue=(newbie.catalog||{})[r]||{};
          const couts=(m.resourcePurchases||{})[r]||{};
          const verrous=(m.resourcePurchaseUnlock||{})[r]||{};
          const onglet=IDLE_EXP_ONGLETS_V1.find(function(o){return o.id===r;});
          return IDLE_SPEND_EXP_STATS_V1.filter(function(stat){
            const achat=couts[stat.id],verrou=verrous[stat.id];
            return achat&&!(achat.unlockBoss&&verrou&&verrou.unlocked===false);
          }).map(function(stat){
            return idleExpShopNewbieOffersIdleV1_(r,stat.id,catalogue[stat.id]||null,utilisees,stat,onglet?onglet.nom:'');
          }).join('');
        }).join('');
        if(!html)return '';
        return '<div class="soreal-idle-exp-tickets-titre-v1">🎟️ Offres débutant</div><div class="soreal-idle-exp-tickets-note-v1">Offres à usage unique : elles disparaissent après achat.</div>'+html;
      }

      function idleExpShopStatBlocIdleV1_(res,stat,x,achat,verrou,newbieCatalogue,newbieUtilisees){
        const auMax=achat&&window.__SOREAL_IDLE_META_HOST_V130__.idleNombre_(x[stat.id])>=achat.hardCap-1e-9;
        const verrouille=achat&&achat.unlockBoss&&verrou&&verrou.unlocked===false;
        /* ANTI-SPOIL (2026-09-24) : un achat encore verrouillé (ex. Puissance / Plafond avant le boss requis) n'est pas montré du tout. */
        if(verrouille)return '';
        return '<div class="soreal-idle-exp-stat-v210">'+
          '<div class="soreal-idle-exp-stat-head-v210">'+
            '<span class="soreal-idle-exp-titrebloc-v1">'+idleExpTitreAvecImageIdleV1_(stat.icone+' '+stat.nom)+idleExpPointIdleV1_('res:'+res.id+':'+stat.id)+'</span>'+
            '<div class="soreal-idle-exp-current-v211"><small>Actuel</small><strong>'+window.__SOREAL_IDLE_META_HOST_V130__.formatGrandNombreIdleV70_(x[stat.id]||0,2)+'</strong></div>'+
          '</div>'+
          '<div class="soreal-idle-exp-help-v210">'+window.__SOREAL_IDLE_META_HOST_V130__.idleHtml_(stat.explication||'')+'</div>'+
          (!achat
            ?'<div class="soreal-idle-note-v4">Indisponible.</div>'
            :auMax
              ?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>'
              :idleExpShopBoutonsLotIdleV1_(res.id,stat.id,achat,stat)+
                idleExpShopLotPersonnaliseIdleV1_(res.id,stat.id,achat,stat,x[stat.id])
          )+
        '</div>';
      }

      /*
       * 2026-09-24 (Norman : « Exp shop a trop de catégories. On s'y perd… Il y a des choses qu'on doit acheter très tôt, du genre le
       * filtre à loot, mais il est perdu tout en bas. Un nouveau joueur ne le trouvera jamais. Je n'aime pas le blanc que tu as mis en
       * fond. Utilise le même bleu que dans la bannière "Boutique EXP" ») : la page est découpée en ONGLETS (un seul à l'écran), le
       * premier « 🚀 Débuts » regroupe les achats bon marché à faire tôt ; les cartes reprennent le bleu de la bannière de la page.
       */
      const IDLE_EXP_ONGLETS_V1=[
        {id:'debuts',icone:'🚀',nom:'Débuts'},
        {id:'toc',icone:'🧰',nom:'Toc'},
        {id:'energy',icone:'⚡',nom:'Énergie'},
        {id:'magic',icone:'✨',nom:'Magie'},
        {id:'r3',icone:'🧪',nom:'Ressource 3'},
        {id:'aventure',icone:'⚔️',nom:'Aventure'},
        {id:'slots',icone:'🎒',nom:'Slots & options'}
      ];

      /* Achats bon marché et utiles dès le début, dans l'ordre conseillé (du moins cher au plus cher). */
      const IDLE_EXP_DEBUTS_V1=['inventorySpace','basicLootFilter','boostRecycling','autoMerge','daycareSlot1','trainingAutoAdvance'];

      /* Rayon « Toc » (Norman, 2026-10-02) : les petits outils de confort, bon marché. */
      const IDLE_EXP_TOC_V1=['sortInventory','syncBasicTraining','menuAnimations'];

      const IDLE_EXP_STATS_AVENTURE_V1=['adventurePower','adventureToughness','adventureHp','adventureRegen'];

      /* Gestes du sac, rayon « Aventure » (Norman, 2026-10-04) : Double tap 20 EXP, Triple tap 30 EXP. */
      const IDLE_EXP_GESTES_V1=['doubleTap','tripleTap'];

      const IDLE_EXP_NOMS_V1=window.__SOREAL_IDLE_EXP_NOMS_V1__={customInput1:'🔢 Bouton Input personnalisé 1',customInput2:'🔢 Bouton Input personnalisé 2',customInput3:'🔢 Bouton Input personnalisé 3',customInput4:'🔢 Bouton Input personnalisé 4',adventurePower:'⚔️ Puissance d’aventure',adventureToughness:'🛡️ Robustesse d’aventure',adventureHp:'❤️ PV max d’aventure',adventureRegen:'💗 Régénération d’aventure',inventorySpace:'🎒 Espaces d’inventaire',accessorySlot1:'💍 Slot d’accessoire',accessorySlot2:'💍 Autre slot d’accessoire',diggerSlot:'⛏️ Slot de Digger',daycareSlot1:'🛠️ Item Daycare (1er slot de garderie)',daycareSlot2:'🛠️ Autre slot de garderie',daycareSlot3:'🛠️ Encore un slot de garderie',beardSlot:'🧔 Slot de Beard',autoMerge:'🔁 Auto Merge (fusion automatique)',sortInventory:'🗂️ Trier l’inventaire',menuAnimations:'🎞️ Menus animés',syncBasicTraining:'🔗 Synchro Basic Training',doubleTap:'👆 Double tap : boosts',tripleTap:'👆 Double tap : fusion',basicLootFilter:'🧹 Filtre de butin basique',loadoutSlots:'🎽 2 emplacements de configuration',loadoutSlot3:'🎽 Autre emplacement de configuration',boostRecycling:'♻️ Recyclage des boosts (+10 % par achat)',inventoryMergeSlot:'🟦 Slot d’automerge',trainingAutoAdvance:'🏋️ Avance automatique de l’entraînement'};

      /* Une ligne d'explication pour les achats de l'onglet Débuts (effets déjà décrits dans le jeu : panneau d'inventaire, Basic Training). */
      const IDLE_EXP_AIDES_V1={
        customInput1:'Ajoute un bouton à côté du champ Input qui y place le nombre que tu choisis (✎ pour le changer).',
        customInput2:'Un deuxième bouton personnalisé à côté du champ Input (✎ pour choisir son nombre).',
        customInput3:'Un troisième bouton personnalisé à côté du champ Input (✎ pour choisir son nombre).',
        customInput4:'Un quatrième bouton personnalisé à côté du champ Input (✎ pour choisir son nombre).',
        inventorySpace:'Plus de places dans ton sac : les premières sont les moins chères.',
        basicLootFilter:'Débloque le filtre de butin : choisis les types d’objets à ne plus ramasser (menu Inventory).',
        boostRecycling:'Un boost utilisé peut revenir avec un palier de moins : +10 % de chance par achat, 50 % au maximum.',
        autoMerge:'Fusionne automatiquement les doublons de ton équipement (menu Inventory).',
        sortInventory:'Débloque un bouton « Trier » dans ton sac (menu Inventory) qui range tes objets par catégorie.',
        menuAnimations:'Les boutons du menu du haut s’animent quand le menu est actif (énergie, magie ou ressource 3 placée dedans, combat en cours…) : tu vois d’un coup d’œil ce qui travaille.',
        syncBasicTraining:'Ajoute une case à cocher sous Input dans Basic Training : cochée, l’énergie que tu places dans une compétence est placée en même temps dans sa jumelle (Attaque passive et Blocage…), pour qu’elles montent exactement à la même vitesse.',
        daycareSlot1:'Débloque le premier slot de l’Item Daycare.',
        trainingAutoAdvance:'Basic Training passe tout seul à la compétence suivante.',
        doubleTap:'Appuie deux fois vite sur un objet (équipé ou non) ou sur le Cube de l’infini : il absorbe tous les boosts de ton inventaire. Sur PC : clic droit sur l’objet (au sac ou équipé) ; avec « Double tap : fusion », le double tap (ou le clic droit) fusionne d’abord les pièces identiques, puis absorbe les boosts quand il n’y en a plus.',
        tripleTap:'Appuie deux fois vite sur un objet (équipé ou non) : il fusionne automatiquement avec toutes les pièces identiques disponibles. Sur PC : clic droit sur l’objet (au sac ou équipé) ; avec « Double tap : boosts », quand plus aucune pièce n’est disponible, le double tap (ou le clic droit) absorbe les boosts.'
      };

      let idleExpOngletV1=(function(){try{return localStorage.getItem('soreal_idle_exp_onglet_v1')||'debuts';}catch(e){return 'debuts';}})();

      /*
       * ANTI-SPOIL (Norman, 2026-09-24 : « Magie, Ressource 3, ils ne doivent pas savoir que ça existe. Ils doivent être surpris quand ils
       * le débloquent. Pense toujours comme ça dans le jeu. ») : la boutique ne montre QUE ce que le joueur a déjà débloqué — un onglet
       * ou un achat lié à un système encore verrouillé n'apparaît pas du tout (ni onglet, ni cadenas, ni prix).
       */
      const IDLE_EXP_SYSTEME_DE_L_ACHAT_V1={
        adventurePower:'adventure',adventureToughness:'adventure',adventureHp:'adventure',adventureRegen:'adventure',
        customInput1:'adventure',customInput2:'adventure',customInput3:'adventure',customInput4:'adventure',
        inventorySpace:'adventure',accessorySlot1:'adventure',accessorySlot2:'adventure',autoMerge:'adventure',sortInventory:'adventure',syncBasicTraining:'adventure',doubleTap:'adventure',tripleTap:'adventure',basicLootFilter:'adventure',
        loadoutSlots:'adventure',loadoutSlot3:'adventure',boostRecycling:'adventure',inventoryMergeSlot:'adventure',
        diggerSlot:'diggers',beardSlot:'beards',daycareSlot1:'daycare',daycareSlot2:'daycare',daycareSlot3:'daycare',
        macguffinSlot1:'macguffins',macguffinSlot2:'macguffins'
      };

      function idleExpSystemeDebloqueIdleV1_(j,m,systeme){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        if(!systeme)return true;
        if(systeme==='adventure')return Boolean(m.records&&H.idleNombre_(m.records.highestBoss)>=4);
        const sys=systemeMetaParIdIdleV130_(j,systeme);
        return Boolean(sys&&sys.state&&sys.state.unlocked);
      }

      function idleExpAchatVisibleIdleV1_(j,m,it){
        if(!it)return false;
        const systeme=it.yggFruit?'yggdrasil':IDLE_EXP_SYSTEME_DE_L_ACHAT_V1[it.id];
        return idleExpSystemeDebloqueIdleV1_(j,m,systeme);
      }

      function idleExpOngletsVisiblesIdleV1_(j,m){
        const tous=Array.isArray(m.expShop)?m.expShop:[];
        const visible=function(it){return idleExpAchatVisibleIdleV1_(j,m,it);};
        const resteSlots=tous.some(function(it){
          return visible(it)&&IDLE_EXP_DEBUTS_V1.indexOf(it.id)===-1&&IDLE_EXP_TOC_V1.indexOf(it.id)===-1&&IDLE_EXP_STATS_AVENTURE_V1.indexOf(it.id)===-1&&IDLE_EXP_GESTES_V1.indexOf(it.id)===-1;
        });
        const resteToc=tous.some(function(it){return visible(it)&&IDLE_EXP_TOC_V1.indexOf(it.id)!==-1;});
        return IDLE_EXP_ONGLETS_V1.filter(function(o){
          if(o.id==='toc')return resteToc;
          if(o.id==='magic')return idleExpSystemeDebloqueIdleV1_(j,m,'bloodMagic');
          if(o.id==='r3')return idleExpSystemeDebloqueIdleV1_(j,m,'hacks');
          if(o.id==='aventure')return idleExpSystemeDebloqueIdleV1_(j,m,'adventure');
          if(o.id==='slots')return resteSlots;
          return true;
        });
      }

      /* Achats actuellement visibles de la boutique EXP, par rayon (point rouge « nouveau », modules/boutique-nouveautes-v1.js). Seuls les achats que le joueur voit déjà sont comptés. */
      function idleExpAchatsParRayonIdleV1_(j){
        const m=j&&j.systemes?j.systemes:null;
        if(!m||!Array.isArray(m.expShop))return {};
        const tous=m.expShop;
        const parId=function(id){return tous.find(function(it){return it.id===id;});};
        const visible=function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);};
        const ids=function(liste){return liste.map(parId).filter(visible).map(function(it){return it.id;});};
        const sortie={};
        sortie.debuts=ids(IDLE_EXP_DEBUTS_V1);
        sortie.toc=ids(IDLE_EXP_TOC_V1);
        sortie.aventure=ids(IDLE_EXP_STATS_AVENTURE_V1.concat(IDLE_EXP_GESTES_V1));
        sortie.slots=tous.filter(function(it){
          return visible(it)&&!it.yggFruit&&IDLE_EXP_DEBUTS_V1.indexOf(it.id)===-1&&IDLE_EXP_TOC_V1.indexOf(it.id)===-1&&IDLE_EXP_STATS_AVENTURE_V1.indexOf(it.id)===-1&&IDLE_EXP_GESTES_V1.indexOf(it.id)===-1;
        }).map(function(it){return it.id;}).concat(tous.filter(function(it){return it.yggFruit&&visible(it);}).map(function(it){return it.id;}));
        ['energy','magic','r3'].forEach(function(res){
          const couts=(m.resourcePurchases||{})[res]||{};
          const verrous=(m.resourcePurchaseUnlock||{})[res]||{};
          sortie[res]=IDLE_SPEND_EXP_STATS_V1.filter(function(stat){
            const achat=couts[stat.id],verrou=verrous[stat.id];
            return !(achat&&achat.unlockBoss&&verrou&&verrou.unlocked===false);
          }).map(function(stat){return 'res:'+res+':'+stat.id;});
        });
        /* Seuls les rayons que le joueur peut ouvrir comptent. */
        const ouverts={};
        idleExpOngletsVisiblesIdleV1_(j,m).forEach(function(o){if(sortie[o.id]&&sortie[o.id].length)ouverts[o.id]=sortie[o.id];});
        return ouverts;
      }
      window.__SOREAL_IDLE_EXP_ACHATS_V1__=idleExpAchatsParRayonIdleV1_;

      function idleExpPointIdleV1_(id){
        const B=window.__SOREAL_IDLE_BOUTIQUE_V1__;
        return B&&B.estNouveau('exp',id)?B.point('Nouvel achat'):'';
      }

      function idleExpOngletCourantV1_(visibles){
        const liste=visibles||IDLE_EXP_ONGLETS_V1;
        return liste.some(function(o){return o.id===idleExpOngletV1;})?idleExpOngletV1:'debuts';
      }
      window.__ongletExpShopIdleV1__=function(id){
        if(!IDLE_EXP_ONGLETS_V1.some(function(o){return o.id===id;}))return;
        idleExpOngletV1=id;
        try{localStorage.setItem('soreal_idle_exp_onglet_v1',id);}catch(e){}
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        if(H.getIdleEtat())H.rendreIdleEtat_({ok:true,joueur:H.getIdleEtat()});
      };

      /*
       * Image de chaque achat de la boutique EXP (Norman, 2026-10-04 : « je n'ai pas les images dans la boutique EXP ») : le wiki NGU Idle n'illustre pas ces achats, l'emoji du titre devient donc une vignette
       * (même place et même taille que les images de la boutique AP) et le titre garde le texte seul. Un achat sans emoji reçoit une vignette neutre.
       */
      const IDLE_EXP_EMOJI_DEBUT_V1=/^((?:\p{Extended_Pictographic}\uFE0F?(?:\u200D\p{Extended_Pictographic}\uFE0F?)*)+)\s*([\s\S]*)$/u;

      /* Vraies illustrations du rayon Toc (Norman, 2026-10-04 : trois images, une par achat, nommées d'après le menu qu'elles concernent) : fichiers de /shop/ ; si une image manque, la vignette à emoji reste. */
      const IDLE_EXP_PHOTOS_V1={sortInventory:'exp-inventaire',syncBasicTraining:'exp-basic-training',menuAnimations:'exp-menus'};

      function idleExpTitreAvecImageIdleV1_(titreHtml,id){
        const m=IDLE_EXP_EMOJI_DEBUT_V1.exec(String(titreHtml||''));
        const icone=m?m[1]:'✦';
        const texte=m?m[2]:String(titreHtml||'');
        const photo=id&&IDLE_EXP_PHOTOS_V1[id];
        const image=photo?'<img src="/shop/'+photo+'.png" alt="" width="64" height="64" loading="eager" decoding="async" onerror="this.remove()">':'';
        return '<span class="soreal-idle-exp-img-v1'+(photo?' avec-photo':'')+'" aria-hidden="true">'+icone+image+'</span><span class="soreal-idle-exp-titre-v1">'+texte+'</span>';
      }

      function idleExpShopItemCarteIdleV1_(it,aide){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const fini=it.nextCost==null;
        const restants=Array.isArray(it.remainingCosts)?it.remainingCosts:null;
        let tiers=it.max!=null&&it.max>1?[1,5,10]:it.max===1?[1]:[1,10,100];
        /* Jamais plus d'achats que ce qu'il en reste (Norman, 2026-10-05 : « Recyclage de boosts propose d'acheter par 10 alors que le maximum est 5 ») : les paliers qui dépassent le reste disparaissent, et le reste lui-même devient un palier s'il est inférieur à 10. */
        if(it.max!=null&&it.max>1){
          const reste=Math.max(1,it.max-H.idleEntier_(it.purchased));
          tiers=tiers.filter(function(q){return q<=reste;});
          if(reste>1&&reste<10&&tiers.indexOf(reste)===-1)tiers.push(reste);
        }
        /* Prix variable (espaces d'inventaire) : montants réellement payés, et bouton « tout » pour les places restantes. */
        if(restants&&restants.length>10)tiers=tiers.concat([restants.length]);
        const coutTotal=function(q){return restants?restants.slice(0,q).reduce(function(a,b){return a+b;},0):H.idleEntier_(it.nextCost)*q;};
        const emoNom=IDLE_EXP_EMOJI_DEBUT_V1.exec(String(IDLE_EXP_NOMS_V1[it.id]||it.name||''));
        const boutons=tiers.map(function(q,rang){
          const haut=(it.max===1&&q===1)?'Achat unique':(it.gain?'+'+H.formatGrandNombreIdleV70_((it.gain||0)*q,2):'×'+H.idleEntier_(q));
          return idleExpTuileAchatIdleV1_(haut,H.formatGrandNombreIdleV70_(coutTotal(q),2),coutTotal(q),"window.__acheterExpShopIdleV1__('"+H.idleHtml_(it.id)+"',"+q+")",{icone:emoNom?emoNom[1]:'',rang:rang});
        }).join('');
        /* Prix et gain de chaque quantité : écrits dans la carte (jamais dans les boutons). Prix variable : le total réellement payé. */
        const prixCarte='';
        return `<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span class="soreal-idle-exp-titrebloc-v1">${idleExpTitreAvecImageIdleV1_(IDLE_EXP_NOMS_V1[it.id]||H.idleHtml_(it.name),it.id)}${idleExpPointIdleV1_(it.id)}</span><div class="soreal-idle-exp-current-v211"><small>Acheté</small><strong>${H.idleEntier_(it.purchased)}${it.max!=null?' / '+H.idleEntier_(it.max):''}</strong></div></div>`+
          (aide?`<div class="soreal-idle-exp-help-v210">${H.idleHtml_(aide)}</div>`:'')+prixCarte+
          (fini?'<div class="soreal-idle-exp-max-v210">✔ Maximum atteint</div>':`<div class="soreal-idle-exp-tuiles-v1">${boutons}</div>`)+
          '</div>';
      }

      function idleExpShopRichJerksIdleV1_(m){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const rj=m.richJerks||{};
        return ['attack','defense'].map(function(stat){
          const niveau=stat==='attack'?rj.attackLevel:rj.defenseLevel;
          const boutons=[1,10,100].map(function(q){
            return `<button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterRichJerksIdleV1__('${stat}',${q})">${idleExpLibelleAchatIdleV1_(q)}</button>`;
          }).join('');
          return `<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span class="soreal-idle-exp-titrebloc-v1">${idleExpTitreAvecImageIdleV1_((stat==='attack'?'🗡️ Attaque':'🛡️ Défense')+' pour riches (Rich Jerks)')}</span><div class="soreal-idle-exp-current-v211"><small>Niveau</small><strong>${H.idleEntier_(niveau||0)}</strong></div></div><div class="soreal-idle-exp-help-v210">Conseil : n’achète ceci qu’une fois que tu as acheté tout le reste.</div>${idleExpPrixCarteIdleV1_([1,10,100].map(function(q){return {q:q,gain:H.idleEntier_((rj.pctPerLevel||10)*q)+' %',cout:H.idleEntier_((rj.cost||30)*q)};}),'EXP')}<div class="soreal-idle-exp-actions-v210">${boutons}</div></div>`;
        }).join('');
      }

      /* Wiki Experience, section Yggdrasil : activation automatique et gratuite ; cap Energy/Magic total >= 10x le coût d'activation. */
      function idleExpShopYggIdleV1_(items){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        if(!items.length)return '';
        return '<div class="soreal-idle-exp-resource-v210">🌱 Yggdrasil : Auto-Activate</div>'+
          items.map(function(it){
            const fini=it.nextCost==null;
            return `<div class="soreal-idle-exp-stat-v210"><div class="soreal-idle-exp-stat-head-v210"><span class="soreal-idle-exp-titrebloc-v1">${idleExpTitreAvecImageIdleV1_(H.idleHtml_(it.name))}${idleExpPointIdleV1_(it.id)}</span><div class="soreal-idle-exp-current-v211"><small>Cap requis</small><strong>${H.formatGrandNombreIdleV70_(it.requiredCap||0)} ${it.resource==='magic'?'Magic':'Energy'}</strong></div></div>`+
              (fini?'<div class="soreal-idle-exp-max-v210">✔ Acheté : activation automatique et gratuite</div>':idleExpPrixCarteIdleV1_([{q:1,gain:'',cout:H.formatGrandNombreIdleV70_(it.nextCost)}],'EXP')+`<div class="soreal-idle-exp-actions-v210"><button type="button" class="soreal-idle-exp-buy-v210" onclick="window.__acheterExpShopIdleV1__('${H.idleHtml_(it.id)}',1)">Acheter</button></div>`)+
              '</div>';
          }).join('');
      }

      /* Achats de l'onglet Débuts encore abordables avec l'EXP actuelle (pastille sur l'onglet). */
      function idleExpDebutsAbordablesIdleV1_(j,m,exp){
        const tous=Array.isArray(m.expShop)?m.expShop:[];
        return IDLE_EXP_DEBUTS_V1.filter(function(id){
          const it=tous.find(function(x){return x.id===id;});
          return it&&idleExpAchatVisibleIdleV1_(j,m,it)&&it.nextCost!=null&&it.nextCost<=exp;
        }).length;
      }

      function idleExpShopContenuOngletIdleV1_(j,m,onglet){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const tous=Array.isArray(m.expShop)?m.expShop:[];
        const parId=function(id){return tous.find(function(it){return it.id===id;});};
        if(onglet==='debuts'){
          const cartes=IDLE_EXP_DEBUTS_V1.map(parId).filter(function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);}).map(function(it){return idleExpShopItemCarteIdleV1_(it,IDLE_EXP_AIDES_V1[it.id]);}).join('');
          return '<div class="soreal-idle-exp-intro-v212">🚀 <b>À acheter tôt.</b> Ces achats sont peu chers et rendent la partie bien plus confortable ; dans l’ordre conseillé.</div>'+idleExpShopTicketsDebutantIdleV1_(j,m)+cartes;
        }
        if(onglet==='toc'){
          const cartes=IDLE_EXP_TOC_V1.map(parId).filter(function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);}).map(function(it){return idleExpShopItemCarteIdleV1_(it,IDLE_EXP_AIDES_V1[it.id]);}).join('');
          return '<div class="soreal-idle-exp-intro-v212">🧰 <b>J’ai des TOC, mais au moins ils sont bien rangés.</b></div>'+cartes;
        }
        if(onglet==='energy'||onglet==='magic'||onglet==='r3'){
          /* Un onglet de ressource verrouillé n'est jamais proposé (voir idleExpOngletsVisiblesIdleV1_) : aucun message « verrouillé ». */
          const x=(m.resources||{})[onglet]||{};
          const couts=(m.resourcePurchases||{})[onglet]||{};
          const verrous=(m.resourcePurchaseUnlock||{})[onglet]||{};
          const newbie=m.newbieOffers||{};
          const catalogue=((newbie.catalog||{})[onglet])||{};
          const utilisees=Array.isArray(newbie.used)?newbie.used:[];
          return IDLE_SPEND_EXP_STATS_V1.map(function(stat){
            return idleExpShopStatBlocIdleV1_({id:onglet},stat,x,couts[stat.id],verrous[stat.id],catalogue,utilisees);
          }).join('');
        }
        if(onglet==='aventure'){
          return IDLE_EXP_STATS_AVENTURE_V1.concat(IDLE_EXP_GESTES_V1).map(parId).filter(function(it){return it&&idleExpAchatVisibleIdleV1_(j,m,it);}).map(function(it){return idleExpShopItemCarteIdleV1_(it,null);}).join('')+idleExpShopRichJerksIdleV1_(m);
        }
        /* slots : tout le reste (hors Débuts et statistiques d'aventure), puis Yggdrasil */
        const reste=tous.filter(function(it){
          return idleExpAchatVisibleIdleV1_(j,m,it)&&!it.yggFruit&&IDLE_EXP_DEBUTS_V1.indexOf(it.id)===-1&&IDLE_EXP_TOC_V1.indexOf(it.id)===-1&&IDLE_EXP_STATS_AVENTURE_V1.indexOf(it.id)===-1&&IDLE_EXP_GESTES_V1.indexOf(it.id)===-1;
        });
        return reste.map(function(it){return idleExpShopItemCarteIdleV1_(it,null);}).join('')+idleExpShopYggIdleV1_(tous.filter(function(it){return it.yggFruit&&idleExpAchatVisibleIdleV1_(j,m,it);}));
      }

      /*
       * Style « boutique » partagé par la Boutique EXP et la Boutique AP (Norman, 2026-09-24 : « le même style pour la boutique AP que pour la
       * XP Shop, mais d'une autre couleur »). La couleur vient de --nav-color, posée sur la page par le menu (IDLE_NAV_COULEURS_V1).
       */
      function idleBoutiqueCssIdleV1_(){
        const bleu='var(--nav-color,#0891b2)';
        const fond1='color-mix(in srgb,'+bleu+' 60%,#0b1020)';
        const fond2='color-mix(in srgb,'+bleu+' 38%,#1a2340)';
        /*
         * 2026-09-24 (Norman : « Mets 2 nuances de couleurs dans EXP Shop. Essaie de le rendre joli. Ça doit nous faire penser à un
         * magasin ») : deux nuances = les deux extrémités du dégradé de la bannière (fond1 60 %, fond2 38 %), en alternance d'une carte
         * à l'autre ; décor de boutique : auvent rayé à festons, caisse (EXP disponible) avec enseigne « OUVERT », rayons (onglets)
         * suspendus, produits posés sur une étagère, boutons en étiquettes de prix, « épuisé » en tampon.
         */
        const css=[
          `.soreal-idle-exp-shop-v213{margin:0 0 14px;border-radius:18px;overflow:hidden;background:${fond2};border:1px solid color-mix(in srgb,${bleu} 55%,transparent);box-shadow:0 10px 26px rgba(0,0,0,.28)}`,
          `.soreal-idle-exp-awning-v213{position:relative;height:30px;margin-bottom:14px;background:repeating-linear-gradient(90deg,${bleu} 0 26px,${fond1} 26px 52px)}`,
          `.soreal-idle-exp-awning-v213::after{content:"";position:absolute;left:0;right:0;top:100%;height:14px;background:radial-gradient(circle at 13px 0,${bleu} 12.5px,transparent 13.5px) 0 0/52px 14px repeat-x,radial-gradient(circle at 13px 0,${fond1} 12.5px,transparent 13.5px) 26px 0/52px 14px repeat-x;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}`,
          `.soreal-idle-exp-balance-v210{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 14px 12px;padding:12px 14px;border-radius:14px;background:${fond1};color:#fff;border:2px solid rgba(255,255,255,.22);box-shadow:inset 0 2px 8px rgba(0,0,0,.35)}`,
          `.soreal-idle-exp-balance-v210 span{font-size:14px;font-weight:900;letter-spacing:.03em;color:#fff}.soreal-idle-exp-balance-v210 b{display:inline-flex;align-items:center;justify-content:center;min-width:72px;padding:6px 12px;border-radius:9px;background:#07111f;color:#7ff0c0;font-size:17px;font-family:ui-monospace,Consolas,monospace;letter-spacing:.04em;box-shadow:inset 0 0 0 2px rgba(255,255,255,.14)}`,
          `.soreal-idle-exp-open-v213{padding:2px 9px;border-radius:999px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.3);color:#c9f7dd;font-size:11px;font-weight:1000;letter-spacing:.14em}`,
          `.soreal-idle-exp-aisles-v213{display:flex;align-items:center;justify-content:space-between;margin:0 14px 4px;font-size:11px;font-weight:1000;letter-spacing:.16em;text-transform:uppercase;color:#a9cfdc}`,
          `.soreal-idle-exp-titrebloc-v1{display:inline-flex;align-items:center;gap:10px;min-width:0}`,
          `.soreal-idle-exp-img-v1{flex:0 0 auto;width:46px;height:46px;display:inline-flex;align-items:center;justify-content:center;font-size:27px;line-height:1;border-radius:12px;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.28),rgba(255,255,255,.04) 62%),linear-gradient(145deg,#27597a,#12304a);border:1px solid rgba(160,215,240,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 5px rgba(0,0,0,.4)}`,
          `.soreal-idle-exp-img-v1{position:relative}`,
          `.soreal-idle-exp-img-v1.avec-photo{width:64px;height:64px;padding:0;overflow:hidden}`,
          `.soreal-idle-exp-img-v1 img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;image-rendering:pixelated;border-radius:inherit}`,
          `.soreal-idle-exp-titre-v1{min-width:0}`,
          `.soreal-idle-exp-tabs-v212{display:flex;gap:7px;flex-wrap:wrap;margin:0 14px 16px;padding-top:6px}`,
          `.soreal-idle-exp-tab-v212{appearance:none;cursor:pointer;position:relative;padding:9px 13px;border-radius:4px 4px 14px 14px;border:1px solid rgba(255,255,255,.22);background:${fond1};color:#e8f4f8;font-size:14px;font-weight:900;display:inline-flex;align-items:center;gap:6px}`,
          `.soreal-idle-exp-tab-v212::before{content:"";position:absolute;left:50%;top:-8px;width:2px;height:8px;background:rgba(255,255,255,.4);transform:translateX(-50%)}`,
          `.soreal-idle-exp-tab-v212:hover{background:color-mix(in srgb,${bleu} 72%,#0b1020)}`,
          `.soreal-idle-exp-tab-v212.actif{background:${bleu};border-color:#fff;color:#fff;box-shadow:0 5px 14px color-mix(in srgb,${bleu} 55%,transparent)}`,
          `.soreal-idle-exp-pastille-v212{min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#f5c451;color:#3a2a00;font-size:13px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center}`,
          `.soreal-idle-exp-shelves-v213{padding:0 14px 14px}`,
          `.soreal-idle-exp-intro-v212{margin:0 0 12px;padding:11px 13px 11px 40px;position:relative;border-radius:12px;background:rgba(245,196,81,.13);border:2px dashed rgba(245,196,81,.5);color:#f7e6b0;font-size:14px;line-height:1.5;font-weight:750}.soreal-idle-exp-intro-v212::before{content:"🏷️";position:absolute;left:11px;top:9px;font-size:18px}`,
          `.soreal-idle-exp-resource-v210{margin:16px 0 8px;padding:10px 13px;border-radius:12px;background:${fond1};color:#fff;border-left:4px solid ${bleu};font-size:15px;font-weight:1000}`,
          `.soreal-idle-exp-stat-v210{position:relative;margin:0 0 16px;padding:0 0 12px;border-radius:14px 14px 4px 4px;background:${fond1};color:#f2f8fb;border:1px solid rgba(255,255,255,.14);border-bottom:7px solid ${bleu};box-shadow:0 7px 0 rgba(0,0,0,.3),0 12px 16px rgba(0,0,0,.18)}`,
          `.soreal-idle-exp-shelves-v213>.soreal-idle-exp-stat-v210:nth-of-type(even){background:${fond2};border-color:rgba(255,255,255,.14);border-bottom-color:${fond1}}`,
          `.soreal-idle-exp-stat-head-v210{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:13px 13px 0 0;background:rgba(0,0,0,.22);color:#fff;font-size:14px;font-weight:1000}.soreal-idle-exp-stat-head-v210>span{min-width:0}`,
          `.soreal-idle-exp-stat-v210>:not(.soreal-idle-exp-stat-head-v210){margin-left:12px;margin-right:12px}`,
          `.soreal-idle-exp-current-v211{display:flex;align-items:baseline;gap:6px;flex:0 0 auto;padding:4px 8px;border-radius:8px;background:#07111f;color:#fff;border:1px solid rgba(255,255,255,.14)}.soreal-idle-exp-current-v211 small{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#9fc6d3;font-weight:900}.soreal-idle-exp-current-v211 strong{font-size:15px;color:#7ff0c0}`,
          `.soreal-idle-exp-help-v210{margin-top:8px;margin-bottom:10px;color:#c2dde6;font-size:13px;line-height:1.5;font-weight:750}`,
          `.soreal-idle-exp-stat-v210>.soreal-idle-exp-actions-v210:first-of-type{margin-top:10px}`,
          `.soreal-idle-exp-actions-v210{display:grid;grid-template-columns:repeat(auto-fit,minmax(122px,1fr));gap:8px}`,
          `.soreal-idle-exp-buy-v210{appearance:none;position:relative;min-height:50px;border:1px solid rgba(255,255,255,.28);border-radius:6px 12px 12px 6px;padding:8px 10px 8px 22px;background:${bleu};color:#fff !important;cursor:pointer;text-align:left;display:flex;flex-direction:column;justify-content:center;gap:2px;outline:1px dashed rgba(255,255,255,.35);outline-offset:-4px}`,
          `.soreal-idle-exp-buy-v210{min-height:0!important;padding:6px 14px!important;flex-direction:row!important;align-items:center;justify-content:center;gap:0!important;font-size:13px;font-weight:1000;letter-spacing:.03em;outline:none!important;border-radius:10px!important;text-align:center}`,
          `.soreal-idle-exp-buy-v210::before{display:none!important}`,
          `.soreal-idle-exp-tuiles-v1{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:10px;margin:2px 0 8px}.soreal-idle-exp-tuile-v1{display:flex;flex-direction:column;gap:6px}`,
          `.soreal-idle-exp-tuile-v1{--r1:#c98a52;--r2:#8a5a2b}.soreal-idle-exp-tuile-v1.rang1{--r1:#d4e2f3;--r2:#6f86a3}.soreal-idle-exp-tuile-v1.rang2{--r1:#ffd45e;--r2:#b3801a}`,
          `.soreal-idle-exp-tuile-v1 .carre{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:4px;min-height:112px;padding:10px 6px 8px;border-radius:14px;border:2px solid var(--r1);background:radial-gradient(circle at 30% 12%,color-mix(in srgb,var(--r1) 30%,transparent),transparent 55%),linear-gradient(165deg,#2c1948,#140c20 80%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 0 12px color-mix(in srgb,var(--r1) 38%,transparent);line-height:1.2}`,
          `.soreal-idle-exp-tuile-v1 .carre::before{content:"";position:absolute;left:-30%;top:-60%;width:160%;height:90%;background:linear-gradient(180deg,rgba(255,255,255,.14),transparent);transform:rotate(-8deg);pointer-events:none}`,
          `.soreal-idle-exp-tuile-v1 .med{position:relative;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;font-size:17px;line-height:1;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--r1) 45%,#2c1948),#1b1030);border:1px solid var(--r1);box-shadow:0 0 8px color-mix(in srgb,var(--r1) 50%,transparent)}`,
          `.soreal-idle-exp-tuile-v1 .g{position:relative;font-size:24px!important;font-weight:1000;color:#8ff0a6!important;text-shadow:0 0 10px rgba(143,240,166,.45),0 2px 2px #000}`,
          `.soreal-idle-exp-tuile-v1 .p{position:relative;display:inline-flex;align-items:center;gap:5px;padding:3px 10px 3px 4px;border-radius:999px;background:#0d0716;border:1px solid var(--r2);font-size:13px!important;font-weight:1000;color:#ffd45e!important}`,
          `.soreal-idle-exp-tuile-v1 .p i{display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;font-style:normal;font-size:10px;color:#4a3000;background:radial-gradient(circle at 35% 30%,#fff1a8,#e0a31c)}.soreal-idle-exp-tuile-v1 .p small{font-size:10px;font-weight:900;opacity:.8}`,
          `.soreal-idle-exp-tuile-v1.off .carre{opacity:.5;filter:grayscale(.55)}.soreal-idle-exp-tuile-v1 .soreal-idle-exp-buy-v210{width:100%}`,
          `.soreal-idle-exp-ticket-v1{--cut:78px;display:flex;align-items:stretch;margin:0 0 10px;color:#3a2a00;background:#f5c451;border-radius:10px;-webkit-mask:radial-gradient(circle at var(--cut) 0,transparent 8px,#000 8.5px) top/100% 51% no-repeat,radial-gradient(circle at var(--cut) 100%,transparent 8px,#000 8.5px) bottom/100% 51% no-repeat;mask:radial-gradient(circle at var(--cut) 0,transparent 8px,#000 8.5px) top/100% 51% no-repeat,radial-gradient(circle at var(--cut) 100%,transparent 8px,#000 8.5px) bottom/100% 51% no-repeat}`,
          `.soreal-idle-exp-ticket-v1 .souche{flex:0 0 var(--cut);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 4px;border-right:2px dashed rgba(58,42,0,.55);font-size:11px;font-weight:1000;letter-spacing:.06em;text-transform:uppercase;text-align:center}.soreal-idle-exp-ticket-v1 .souche i{font-style:normal;font-size:22px;letter-spacing:0}`,
          `.soreal-idle-exp-ticket-v1 .corps{flex:1;min-width:0;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 12px}.soreal-idle-exp-ticket-v1 .quoi{flex:1;min-width:130px;display:flex;flex-direction:column;line-height:1.25}.soreal-idle-exp-ticket-v1 .quoi small{font-size:11px;font-weight:900;opacity:.75}`,
          `.soreal-idle-exp-ticket-v1 .quoi b{font-size:17px;font-weight:1000;color:#3a2a00}.soreal-idle-exp-ticket-v1 .prix{font-size:15px;font-weight:1000;color:#6b4500}`,
          `.soreal-idle-exp-ticket-v1 .soreal-idle-exp-buy-v210{background:#3a2a00;color:#ffd45e!important;border-color:#3a2a00}.soreal-idle-exp-ticket-v1.off{filter:grayscale(.5);opacity:.75}`,
          `.soreal-idle-exp-tickets-titre-v1{margin:14px 0 8px;font-size:14px;font-weight:1000;color:#f7e6b0}.soreal-idle-exp-tickets-note-v1{margin:0 0 10px;font-size:12.5px;font-weight:750;color:#c2dde6}`,
          `.soreal-idle-exp-custom-v210.detail{display:flex;flex-direction:column;gap:10px;align-items:stretch}.soreal-idle-exp-custom-v210.detail label{font-size:12.5px}`,
          `.soreal-idle-exp-custom-v210 .saisie{display:grid;grid-template-columns:44px minmax(0,1fr) 44px 64px;gap:6px}.soreal-idle-exp-custom-v210 .pm{appearance:none;border:1px solid rgba(255,255,255,.28);border-radius:9px;background:#3a2160;color:#fff;font-size:20px;font-weight:1000;cursor:pointer;padding:0}.soreal-idle-exp-custom-v210 .pm.max{font-size:13px}.soreal-idle-exp-custom-v210 .pm:hover{background:#5a3590}`,
          `.soreal-idle-exp-custom-v210 .recap{display:grid;gap:6px;padding:10px 12px;border-radius:12px;background:#140c20;border:1px solid rgba(255,255,255,.16)}.soreal-idle-exp-custom-v210 .recap .l{display:flex;align-items:center;gap:8px;font-size:14px}`,
          `.soreal-idle-exp-custom-v210 .recap .k{flex:0 0 112px;font-size:11.5px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#a893c9}.soreal-idle-exp-custom-v210 .recap .gv{color:#8ff0a6;font-size:17px}.soreal-idle-exp-custom-v210 .recap .nm{color:#d9ccf0;font-weight:800}`,
          `.soreal-idle-exp-custom-v210 .recap .av{color:#c9bde0;font-weight:900}.soreal-idle-exp-custom-v210 .recap .ap{color:#8ff0a6;font-size:16px}.soreal-idle-exp-custom-v210 .recap .cv,.soreal-idle-exp-custom-v210 .recap .rs{color:#ffd45e;font-size:15px}`,
          `.soreal-idle-exp-custom-v210 .fl{position:relative;display:inline-block;width:26px;height:2px;background:#a893c9;border-radius:2px}.soreal-idle-exp-custom-v210 .fl::after{content:"";position:absolute;right:-1px;top:-4px;width:8px;height:8px;border-top:2px solid #a893c9;border-right:2px solid #a893c9;transform:rotate(45deg)}`,
          `.soreal-idle-exp-custom-v210.manque .recap .rs{color:#ff8f8f}.soreal-idle-exp-custom-v210.detail>.soreal-idle-exp-buy-v210{width:100%}`,
          `.soreal-idle-exp-prix-v1{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 8px}`,
          `.soreal-idle-exp-prix-ligne-v1{display:inline-flex;align-items:baseline;gap:7px;padding:4px 10px;border-radius:8px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.16);font-size:12.5px;color:#e9dcff}`,
          `.soreal-idle-exp-prix-ligne-v1 i{font-style:normal;font-weight:1000;color:#cdbbf2}.soreal-idle-exp-prix-ligne-v1 em{font-style:normal;font-weight:900;color:#9df0b4}.soreal-idle-exp-prix-ligne-v1 b{font-weight:1000;color:#ffe38a}`,
          `.soreal-idle-exp-prix-ligne-v1.jeu{align-items:center;gap:8px;padding:6px 12px;font-size:14px}.soreal-idle-exp-prix-ligne-v1 u{text-decoration:none;font-weight:1000;color:#fff}.soreal-idle-exp-prix-ligne-v1 s.fl{position:relative;display:inline-block;width:22px;height:2px;background:#cdbbf2;border-radius:2px;text-decoration:none}.soreal-idle-exp-prix-ligne-v1 s.fl::after{content:"";position:absolute;right:-1px;top:-3px;width:7px;height:7px;border-top:2px solid #cdbbf2;border-right:2px solid #cdbbf2;transform:rotate(45deg)}`,
          `.soreal-idle-exp-prix-custom-v1 b{color:#ffe38a}.soreal-idle-exp-offre-v1{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0}.soreal-idle-exp-offre-v1 .soreal-idle-exp-prix-v1{margin:0}`,
          `.soreal-idle-exp-buy-v210::before{content:"";position:absolute;left:7px;top:50%;width:7px;height:7px;margin-top:-4px;border-radius:50%;background:${fond2};box-shadow:inset 0 0 0 1px rgba(255,255,255,.5)}`,
          `.soreal-idle-exp-buy-v210:hover{background:color-mix(in srgb,${bleu} 82%,#fff);transform:translateY(-1px)}.soreal-idle-exp-buy-v210:active{transform:translateY(0)}.soreal-idle-exp-buy-v210 b{font-size:14px;line-height:1.1;color:#fff !important}.soreal-idle-exp-buy-v210 small{font-size:12px;color:#e3f4fa !important;font-weight:900}`,
          `.soreal-idle-exp-buy-v210:disabled{opacity:.42;cursor:not-allowed;filter:grayscale(.45);transform:none}`,
          `.soreal-idle-exp-buy-v210.primary{background:#f5c451;border-color:#fff;color:#3a2a00 !important}.soreal-idle-exp-buy-v210.primary b,.soreal-idle-exp-buy-v210.primary small{color:#3a2a00 !important}.soreal-idle-exp-buy-v210.primary:hover{background:#ffd978}.soreal-idle-exp-buy-v210.offer{background:rgba(245,196,81,.22);border-color:rgba(245,196,81,.6);color:#ffeeb5 !important}.soreal-idle-exp-buy-v210.offer b,.soreal-idle-exp-buy-v210.offer small{color:#ffeeb5 !important}`,
          `.soreal-idle-exp-custom-v210{display:grid;grid-template-columns:minmax(120px,1fr) 90px minmax(112px,auto);gap:8px;align-items:end;margin-top:10px;padding-top:10px;border-top:2px dotted rgba(255,255,255,.2)}.soreal-idle-exp-custom-v210 label{grid-column:1/-1;font-size:12px;font-weight:900;color:#b9d6e0}.soreal-idle-exp-custom-v210 input{min-width:0;padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.28);color:#fff;font-weight:800}`,
          `.soreal-idle-exp-newbie-v210{margin-top:10px;padding:10px;border-radius:11px;background:rgba(245,196,81,.11);border:2px dashed rgba(245,196,81,.4)}.soreal-idle-exp-newbie-v210 .soreal-idle-window-title-v31{margin-bottom:5px;padding:0;background:transparent;border:0;box-shadow:none;color:#f7e6b0}.soreal-idle-exp-newbie-v210 .soreal-idle-note-v4{color:#e9d9a3}`,
          `.soreal-idle-exp-lock-v210,.soreal-idle-exp-max-v210{padding:9px 10px;border-radius:10px;background:rgba(0,0,0,.22);color:#cfe6ee;border:1px solid rgba(255,255,255,.12);font-size:13px;font-weight:850}.soreal-idle-exp-max-v210{width:fit-content;background:rgba(52,199,89,.14);color:#a6f0bb;border:2px solid rgba(52,199,89,.5);border-radius:8px;transform:rotate(-1.5deg);letter-spacing:.04em;text-transform:uppercase}`,
          `@media(max-width:560px){.soreal-idle-exp-stat-head-v210{align-items:flex-start}.soreal-idle-exp-current-v211{flex-direction:column;gap:1px;align-items:flex-end}.soreal-idle-exp-actions-v210{grid-template-columns:repeat(2,minmax(0,1fr))}.soreal-idle-exp-custom-v210{grid-template-columns:1fr 1fr}.soreal-idle-exp-custom-v210 .primary{grid-column:1/-1}.soreal-idle-exp-tab-v212{flex:1 1 calc(50% - 7px);justify-content:center}.soreal-idle-exp-tabs-v212,.soreal-idle-exp-aisles-v213{margin-left:10px;margin-right:10px}.soreal-idle-exp-balance-v210{margin-left:10px;margin-right:10px}.soreal-idle-exp-shelves-v213{padding:0 10px 12px}}`
        ].join('');
        return css;
      }

      /*
       * Rayon COMPLET (Norman, 2026-10-05 : « un petit V vert comme celui des sets quand on a acheté tout ce que contient le rayon ; si je rajoute des articles, le V disparaît tant qu'on n'a pas fait ce nouvel achat »). Calculé à chaque affichage
       * sur les achats VISIBLES du rayon : tous au maximum (plus de prix suivant). Un nouvel article qui devient visible rend donc le rayon incomplet. Les rayons de ressources (Énergie, Magie, Ressource 3) n'ont pas de maximum : jamais de V.
       */
      function idleExpRayonCompletIdleV1_(j,rayon,ids){
        if(rayon==='energy'||rayon==='magic'||rayon==='r3')return false;
        const liste=(j&&j.systemes&&Array.isArray(j.systemes.expShop))?j.systemes.expShop:[];
        if(!Array.isArray(ids)||!ids.length)return false;
        return ids.every(function(id){const it=liste.find(function(x){return x.id===id;});return Boolean(it)&&it.nextCost==null;});
      }

      function pageSpendExpIdleV1_(j){
        const H=window.__SOREAL_IDLE_META_HOST_V130__;
        const m=j&&j.systemes?j.systemes:{};
        const exp=H.idleEntier_((m.currencies&&m.currencies.experience)||0);
        const onglets_visibles=idleExpOngletsVisiblesIdleV1_(j,m);
        const onglet=idleExpOngletCourantV1_(onglets_visibles);
        const abordables=idleExpDebutsAbordablesIdleV1_(j,m,exp);
        const css=idleBoutiqueCssIdleV1_();
        /* Points rouges : ouvrir un rayon marque ses nouveaux achats comme vus (les cartes gardent leur point le temps de la visite). */
        const B=window.__SOREAL_IDLE_BOUTIQUE_V1__;
        const parRayon=B?idleExpAchatsParRayonIdleV1_(j):{};
        if(B)B.marquerRayon('exp',parRayon,onglet);
        const onglets=onglets_visibles.map(function(o){
          const actif=o.id===onglet;
          const pastille=(o.id==='debuts'&&abordables>0?`<span class="soreal-idle-exp-pastille-v212" title="Achats abordables">${abordables}</span>`:'')+(B&&B.rayonNonVu('exp',parRayon,o.id)?B.point('Nouveaux achats dans ce rayon'):'');
          return `<button type="button" class="soreal-idle-exp-tab-v212${actif?' actif':''}" aria-pressed="${actif}" onclick="window.__ongletExpShopIdleV1__('${o.id}')">${o.icone} ${o.nom}${pastille}${idleExpRayonCompletIdleV1_(j,o.id,parRayon[o.id])?'<span class="soreal-idle-rayon-complet-v1" title="Tout est acheté dans ce rayon">✔</span>':''}</button>`;
        }).join('');
        return H.entetePageIdleV28_(
          '✨ Boutique EXP',
          'Utilise ton EXP pour améliorer durablement ta partie. Commence par l’onglet 🚀 Débuts.'
        )+
        '<style>'+css+'</style>'+
        '<div class="soreal-idle-exp-shop-v213" data-rayon="'+onglet+'">'+
          '<div class="soreal-idle-exp-awning-v213" aria-hidden="true"></div>'+
          '<div class="soreal-idle-exp-balance-v210"><span>🪙 Ta caisse · EXP disponible</span><b>'+H.formatGrandNombreIdleV70_(exp)+'</b></div>'+
          '<div class="soreal-idle-exp-aisles-v213"><span>🧭 Rayons</span><span class="soreal-idle-exp-open-v213">● OUVERT</span></div>'+
          '<div class="soreal-idle-exp-tabs-v212" role="tablist">'+onglets+'</div>'+
          '<div class="soreal-idle-exp-shelves-v213">'+idleExpShopContenuOngletIdleV1_(j,m,onglet)+'</div>'+
        '</div>';
      }

      function acheterExpShopIdleV1_(item,quantite){
        actionMetaIdleV130_({action:'buyExpShop',item:String(item),quantity:Math.max(1,Math.floor(Number(quantite))||1)});
      }
      window.__acheterExpShopIdleV1__=acheterExpShopIdleV1_;

      function acheterRichJerksIdleV1_(stat,niveaux){
        actionMetaIdleV130_({action:'richJerks',stat:String(stat),levels:Math.max(1,Math.floor(Number(niveaux))||1)});
      }
      window.__acheterRichJerksIdleV1__=acheterRichJerksIdleV1_;

  window.__SOREAL_IDLE_BOUTIQUE_EXP_PAGE_V1__={
    idleExpShopIdInput_:idleExpShopIdInput_,
    idleExpQuantiteChampIdleV1_:idleExpQuantiteChampIdleV1_,
    idleBoutiqueCssIdleV1_:idleBoutiqueCssIdleV1_,
    pageSpendExpIdleV1_:pageSpendExpIdleV1_
  };
})();
