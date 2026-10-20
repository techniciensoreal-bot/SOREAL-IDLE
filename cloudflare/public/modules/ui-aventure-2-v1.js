/*
 * SOREAL IDLE — Aventure (zones, combat d'aventure, équipement) (partie 2) (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Code extrait tel quel ; les variables partagées du monolithe passent par REG.<nom> (accesseurs), les fonctions des autres fichiers par des cales,
 * le tout via le registre window.__SOREAL_IDLE_REG__ lu à l'exécution seulement (ce module se charge AVANT soreal-idle-ui.js).
 */
(function(){
  'use strict';
  const REG=window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={});
  if(REG.__chargé_ui_aventure_2_v1)return;
  REG.__chargé_ui_aventure_2_v1=true;

  function idleEntier_(){return REG.idleEntier_.apply(null,arguments);}
  function signatureObjetInventaireIdleV160_(){return REG.signatureObjetInventaireIdleV160_.apply(null,arguments);}
  function pagerSacIdleV1_(){return REG.pagerSacIdleV1_.apply(null,arguments);}
  function actionAdventureIdleV47_(){return REG.actionAdventureIdleV47_.apply(null,arguments);}
  function aventureMetaIdleV47_(){return REG.aventureMetaIdleV47_.apply(null,arguments);}
  function desequiperObjetAdventureIdleV47_(){return REG.desequiperObjetAdventureIdleV47_.apply(null,arguments);}
  function idleNombre_(){return REG.idleNombre_.apply(null,arguments);}
  function boosterCubeAdventureIdleV47_(){return REG.boosterCubeAdventureIdleV47_.apply(null,arguments);}
  function equiperObjetAdventureIdleV47_(){return REG.equiperObjetAdventureIdleV47_.apply(null,arguments);}
  function messageFlottantIdleV32_(){return REG.messageFlottantIdleV32_.apply(null,arguments);}
  function utiliserObjetDeblocageIdleV1_(){return REG.utiliserObjetDeblocageIdleV1_.apply(null,arguments);}
  function patchInventaireAdventureIdleV160_(){return REG.patchInventaireAdventureIdleV160_.apply(null,arguments);}
  function fusionnerObjetAdventureIdleV47_(){return REG.fusionnerObjetAdventureIdleV47_.apply(null,arguments);}
  function specialAcceptePlusDeBoostIdleV1_(){return REG.specialAcceptePlusDeBoostIdleV1_.apply(null,arguments);}
  function formatGrandNombreIdleV70_(){return REG.formatGrandNombreIdleV70_.apply(null,arguments);}
  function idleLabelSpecialBonusV1_(){return REG.idleLabelSpecialBonusV1_.apply(null,arguments);}
  function idleCoffreOuvertV1_(){return REG.idleCoffreOuvertV1_.apply(null,arguments);}
  function normaliserRechercheIdleV1_(){return REG.normaliserRechercheIdleV1_.apply(null,arguments);}
  function caseCoffreCorrespondIdleV1_(){return REG.caseCoffreCorrespondIdleV1_.apply(null,arguments);}
  function enregistrerObjetPopupIdleV1_(){return REG.enregistrerObjetPopupIdleV1_.apply(null,arguments);}
  function rendrePaginationIdleV1_(){return REG.rendrePaginationIdleV1_.apply(null,arguments);}
  function jouerSonOuvertureCoffreIdleV1_(){return REG.jouerSonOuvertureCoffreIdleV1_.apply(null,arguments);}
  function jouerSonFermetureCoffreIdleV197_(){return REG.jouerSonFermetureCoffreIdleV197_.apply(null,arguments);}
  function rafraichirMenuRacineIdleV28_(){return REG.rafraichirMenuRacineIdleV28_.apply(null,arguments);}

      function changerPartieDevIdleV1_(partie){
        const cible=String(partie)==='b'?'b':'a';
        if(!REG.idlePartieDevV1||!REG.idlePartieDevV1.actif||REG.idlePartieDevV1.partie===cible)return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              location.reload();
            }else{
              toastIdleV5_('Impossible de changer de partie.');
            }
          })
          .withFailureHandler(function(){
            toastIdleV5_('Impossible de changer de partie.');
          })
          .definirPartieDevSorealIdle(SOREAL_SESSION,cible);
      }

      /* Partie B uniquement : recopie la partie A (lue, jamais modifiée) pour tester dans les mêmes conditions. */
      function copierPartieADevIdleV1_(){
        if(!REG.idlePartieDevV1||!REG.idlePartieDevV1.actif||REG.idlePartieDevV1.partie!=='b')return;
        if(!window.confirm('Copier ta partie A sur la partie B ? La partie B actuelle sera remplacée. La partie A n’est pas modifiée.'))return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){location.reload();}
            else{toastIdleV5_('Copie impossible.');}
          })
          .withFailureHandler(function(){toastIdleV5_('Copie impossible.');})
          .copierPartieASurBSorealIdle(SOREAL_SESSION);
      }

      function idleHtml_(v){
        return escapeHtml(String(v==null?'':v));
      }

      function emojiObjetIdleV50_(objet){
        const presentation=window.__SOREAL_IDLE_ITEM_PRESENTATION_V1__;
        if(presentation&&typeof presentation.emojiObjet==='function'){
          return presentation.emojiObjet(objet);
        }
        return '📦 📦';
      }

      function toastIdleV5_(message){
        /* Codes d erreur des défis -> phrase française (modules/challenges-v1.js). */
        if(window.__SOREAL_IDLE_DEFIS_V1__&&typeof message==="string")message=window.__SOREAL_IDLE_DEFIS_V1__.traduire(message);
        if(window.__SOREAL_IDLE_TITANS_V1__&&typeof message==="string")message=window.__SOREAL_IDLE_TITANS_V1__.traduire(message);
        const el=document.getElementById("sorealIdleToastV5");
        /* Sans cet élément (absent de la page), ces messages restent silencieux, comme avant : les afficher faisait revenir des textes comme « Aucun combat n est en cours » en permanence (Norman, 2026-10-07). */
        if(!el)return;
        el.textContent=
          String(message||'');

        el.classList.add(
          'visible'
        );

        setTimeout(function(){
          if(el){
            el.classList.remove(
              'visible'
            );
          }
        },1800);
      }

      /*
       * Raccourcis NGU : « Tap R to reclaim Energy from all features except training » (Energy) ; « Pressing T will reclaim all allocated Magic
       * from all features » (Magic). Le serveur (action reclaimResource) laisse Basic Training réservé.
       */
      function installerRaccourcisReprendreIdleV1_(){
        if(window.__sorealIdleRaccourcisReprendreV1)return;
        window.__sorealIdleRaccourcisReprendreV1=true;
        document.addEventListener('keydown',function(ev){
          if(ev.ctrlKey||ev.metaKey||ev.altKey||ev.repeat)return;
          const cible=ev.target;
          if(cible&&(cible.tagName==='INPUT'||cible.tagName==='TEXTAREA'||cible.tagName==='SELECT'||cible.isContentEditable))return;
          if(PAGE_ACTIVE!=='idle'||!REG.idleEtat||!SOREAL_SESSION)return;
          const touche=String(ev.key||'').toLowerCase();
          if(touche!=='r'&&touche!=='t')return;
          const ressource=touche==='r'?'energy':'magic';
          if(ressource==='magic'&&!(REG.idleEtat.systemes&&REG.idleEtat.systemes.resourceInfo&&REG.idleEtat.systemes.resourceInfo.magic))return;
          ev.preventDefault();
          if(typeof window.__actionMetaV47__==='function'){
            window.__actionMetaV47__({action:'reclaimResource',resource:ressource});
            toastIdleV5_(ressource==='energy'
              ?'⚡ Énergie récupérée (sauf entraînement).'
              :'🔮 Magie récupérée.');
          }
        });
      }

      function rendreSetsIdleV25_(j){
        const actifs=
          j &&
          j.sets &&
          Array.isArray(
            j.sets.actifs
          )
            ?j.sets.actifs
            :[];

        if(!actifs.length){
          return `
            <div class="soreal-idle-set-v25">
              🧩 Aucun bonus de set actif.
              Équipe plusieurs pièces portant le même nom de set.
            </div>
          `;
        }

        return actifs
          .map(function(s){
            return `
              <div class="soreal-idle-set-v25">
                🧩 <strong>${idleHtml_(s.nom)}</strong>
                · ${idleEntier_(s.pieces)}/${idleEntier_(s.piecesMax||6)} pièces
                · <strong>+${idleEntier_(s.bonusPourcent)} % puissance</strong>
                ${
                  s.description
                    ?'<div style="margin-top:4px;opacity:.75">'+
                      idleHtml_(s.description)+
                      '</div>'
                    :''
                }
              </div>
            `;
          })
          .join('');
      }

      function rendreSlotEquipeIdleV10_(
        titre,
        objet
      ){
        return `
          <div class="soreal-idle-equip-slot-v10 ${objet?idleHtml_(objet.rarete||'commun'):'commun'}">
            ${
              objet
                ?'<div class="soreal-idle-equipped-icon-v50">'+
                  emojiObjetIdleV50_(objet)+
                  '</div>'
                :''
            }
            <div class="soreal-idle-equip-slot-title-v10">
              ${idleHtml_(titre)}
            </div>
            <div class="soreal-idle-equip-slot-name-v10">
              ${
                objet
                  ?idleHtml_(objet.nom)+
                    (
                      idleEntier_(objet.fusion)>0
                        ?' <span class="soreal-idle-equipped-level-v31">+'+
                          idleEntier_(objet.fusion)+
                          '</span>'
                        :''
                    )
                  :'Aucun objet'
              }
            </div>
            <div class="soreal-idle-equip-slot-bonus-v10">
              ${
                objet
                  ?'+'+
                    idleEntier_(objet.bonusPuissance)+
                    ' puissance · Forge +'+
                    idleEntier_(objet.forge)+
                    (
                      objet.setNom
                        ?' · 🧩 '+idleHtml_(objet.setNom)
                        :''
                    )
                  :'—'
              }
            </div>
            ${
              objet
                ?'<button type="button" class="soreal-idle-forge-button-v25" onclick="window.__forgerEquipementIdleV25__(\''+
                  idleHtml_(objet.slot)+
                  '\')">🔥 Améliorer · '+
                  idleEntier_(
                    REG.idleEtat&&REG.idleEtat.forge&&REG.idleEtat.forge[objet.slot]&&REG.idleEtat.forge[objet.slot].cout
                  )+
                  ' matériaux</button>'
                :''
            }
          </div>
        `;
      }

      /* L'objet du sac sert-il à débloquer son système (système encore verrouillé) ? Renvoie la fiche de déblocage, sinon null. */
      function deblocageParObjetIdleV1_(a,item){
        const d=item&&REG.IDLE_UNLOCK_PAR_OBJET_V1[item.definitionId];
        if(!d)return null;
        const flags=a&&a.unlockFlags&&typeof a.unlockFlags==='object'?a.unlockFlags:{};
        return flags[d.flag]?null:d;
      }

      function emplacementEquipementAdventureIdleV138_(item){
        const slot=String(item&&item.slot||'');
        if(REG.ADVENTURE_SECOND_WEAPON_SLOTS_V1.indexOf(slot)!==-1)return 'weapon2';
        return slot!=='weapon2'&&REG.ADVENTURE_CORE_SLOTS_V138.indexOf(slot)!==-1?slot:'accessory';
      }

      function urlImageObjetAdventureIdleV138_(item){
        const p=new URLSearchParams();
        p.set('set',String(item&&item.set||''));
        if(item&&item.slot)p.set('slot',String(item.slot));
        if(item&&item.definitionId)p.set('definition',String(item.definitionId));
        if(item&&item.wikiItemId)p.set('wikiItemId',String(item.wikiItemId));
        const nom=item&&(item.name||item.nom);
        if(nom)p.set('name',String(nom));
        return '/api/idle/media/item?'+p.toString();
      }

      function urlImageBoostAdventureIdleV138_(boost){
        const p=new URLSearchParams();
        p.set('boostType',String(boost&&boost.boostType||''));
        p.set('strength',String(boost&&boost.strength||''));
        if(boost&&boost.wikiItemId)p.set('wikiItemId',String(boost.wikiItemId));
        return '/api/idle/media/boost?'+p.toString();
      }

      function iconeSlotAdventureIdleV138_(slot){const a=window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__;return a&&a.iconeAdventure?a.iconeAdventure(slot):'📦';}

      /*
       * Niveau inscrit SUR l'image de l'objet (Norman, 2026-09-24 : « le niveau inscrit sur l'image de manière visible avec un contour,
       * joli ») et V vert quand l'objet est au maximum : niveau 100 ET statistiques comblées par les boosts — le même prérequis que le
       * Coffre (item.fullyMaxed, calculé par le serveur ; un boost, sans statistiques, l'est dès le niveau 100).
       */
      /* Points de couleur des boosts qu'il manque encore (Norman, 2026-10-08) : orange = Power, bleu = Toughness, jaune = Special ; fournis par le serveur (boostManque), au niveau actuel de la pièce. */
      function pointsBoostManquantIdleV1_(item){
        const m=item&&item.boostManque;
        if(!m||!(m.power||m.toughness||m.special))return '';
        return '<i class="idle-boostpts-v1" aria-hidden="true">'+
          (m.power?'<b class="p" title="Il manque des boosts de Power"></b>':'')+
          (m.toughness?'<b class="t" title="Il manque des boosts de Toughness"></b>':'')+
          (m.special?'<b class="s" title="Il manque des boosts Special"></b>':'')+
        '</i>';
      }

      function badgesNiveauObjetIdleV1_(item){
        if(!item)return '';
        const niveau=idleEntier_(item.level);
        return (niveau>=1
          ?'<i class="idle-lvl-badge-v1'+(niveau>=100?' max':'')+'" aria-hidden="true">'+niveau+'</i>'
          :'')+
          (item.fullyMaxed
            ?'<i class="idle-maxok-badge-v1" title="Niveau 100 et statistiques au maximum" aria-hidden="true">✔</i>'
            :pointsBoostManquantIdleV1_(item));
      }

      function iconeObjetAdventureIdleV138_(item){
        return iconeBaseObjetAdventureIdleV138_(item)+badgesNiveauObjetIdleV1_(item);
      }

      /*
       * Emoji de repli d'un objet dont l'image manque (Norman, 2026-09-25) : « mets-le bien grand et centré dans sa case ; s'ils sont plusieurs,
       * fais au mieux pour qu'on les voie bien ». Le nombre de symboles (data-n) règle la taille : 1 = grand, 2 = un peu moins, 3+ = sur deux lignes.
       */
      function nombreEmojisIdleV1_(texte){
        const brut=String(texte==null?'':texte).replace(/\s+/g,'');
        if(!brut)return 0;
        try{
          if(typeof Intl!=='undefined'&&Intl.Segmenter){
            return Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(brut)).length;
          }
        }catch(e){}
        return Array.from(brut).length;
      }

      function emojiRepliObjetIdleV1_(emoji){
        const n=Math.min(4,Math.max(1,nombreEmojisIdleV1_(emoji)));
        return '<span class="idle-emoji-fallback-v1" data-n="'+n+'" style="display:none">'+idleHtml_(String(emoji==null?'':emoji).split(' ').join(''))+'</span>';
      }

      const ONERROR_EMOJI_OBJET_IDLE_V1="onerror=\"this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='flex'\"";

      function iconeBaseObjetAdventureIdleV138_(item){
        if(item&&item.kind==='boost'){
          return '<img class="idle-boost-icon-v1" src="'+idleHtml_(urlImageBoostAdventureIdleV138_(item))+'" alt="" loading="eager" decoding="async" draggable="false" '+
            ONERROR_EMOJI_OBJET_IDLE_V1+'>'+
            emojiRepliObjetIdleV1_('⚡');
        }
        if(item&&item.kind==='cube'){
          return '<img src="'+idleHtml_(urlImageObjetAdventureIdleV138_(item))+'" alt="" loading="eager" decoding="async" draggable="false" '+
            ONERROR_EMOJI_OBJET_IDLE_V1+'>'+
            emojiRepliObjetIdleV1_('🧊');
        }
        /*
         * Norman (2026-09-29) : « J'ai toujours l'émoji à la place de Tuba of
         * Time » -- alors que l'image existe bien sur le R2 et que le Worker
         * média la résout correctement par wikiItemId (vérifié en direct en
         * production). Cause réelle : ce chemin de rendu (le seul utilisé par
         * le paperdoll/les accessoires Aventure -- item-specials-early-v75.js
         * et item-images-r2-v74.js ciblent des classes d'un ancien écran
         * d'équipement, jamais celui-ci) exigeait `item.set` pour même
         * tenter une image. Un Special (Tuba of Time, Cheese Grater…) n'a
         * jamais de `.set` (exclusif aux pièces d'équipement de set) --
         * repli immédiat et permanent sur l'émoji générique du slot, quelle
         * que soit la disponibilité réelle de l'image. `wikiItemId` (déjà
         * transporté par TOUT objet du catalogue, cleanItem) est un
         * identifiant tout aussi valide pour urlImageObjetAdventureIdleV138_ ;
         * le repli `onerror` vers l'émoji reste inchangé si l'image manque
         * vraiment.
         */
        if(!item||!(item.set||item.wikiItemId))return iconeSlotAdventureIdleV138_(item&&item.slot);
        return '<img src="'+idleHtml_(urlImageObjetAdventureIdleV138_(item))+'" alt="" loading="eager" decoding="async" draggable="false" '+
          ONERROR_EMOJI_OBJET_IDLE_V1+'>'+
          emojiRepliObjetIdleV1_(iconeSlotAdventureIdleV138_(item.slot));
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-235 */
      function idleRareteClasseObjetAdventureIdleV1_(item){const a=window.__SOREAL_IDLE_INVENTORY_PRESENTATION_V1__;return a&&a.rarete?a.rarete(item):'';}

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-236 */
      function rendreSlotPaperdollAdventureIdleV138_(slotKey,titre,item){
        /* Défi sans équipement : les pièces portées sont grisées (marqueur posé sur la page, lu par le CSS) ; remis à chaque rendu de l'équipement. */
        try{if(document.body)document.body.toggleAttribute('data-defi-sans-equip-v1',Boolean(REG.equipementBloqueParDefiIdleV1_&&REG.equipementBloqueParDefiIdleV1_()));}catch(_e){}
        const nomComplet=item
          ?idleHtml_(item.name||item.nom||'')+(idleEntier_(item.level)>0?' · Niv. '+idleEntier_(item.level)+'/100':'')
          :idleHtml_(titre);
        const contenu=item
          ?'<div class="soreal-idle-v138-slot-icon" title="'+nomComplet+'">'+iconeObjetAdventureIdleV138_(item)+'</div>'
          :'<div class="soreal-idle-v138-slot-icon" style="opacity:.35" title="'+nomComplet+'">'+iconeSlotAdventureIdleV138_(slotKey)+'</div>';

        const occupantId=item?idleHtml_(String(item.id||'')):'';
        const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);

        return '<div class="soreal-idle-v138-slot soreal-idle-v138-slot-'+idleHtml_(slotKey)+(rareteClasse?' '+rareteClasse:'')+(item&&item.locked?' idle-item-locked-v165':'')+'" '+
          'data-equip-slot-v180="'+idleHtml_(slotKey)+'" '+
          (occupantId?'data-occupant-id="'+occupantId+'" data-soreal-longpress="idle-item" ':'')+
          'draggable="false" '+
          '>'+
          (item
            ?''
            :'')+
          contenu+
          '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-237 */
      function rendreEmplacementAccessoireAdventureIdleV138_(item,classeSupplementaire){
        const nomComplet=item
          ?idleHtml_(item.name||item.nom||'')+(idleEntier_(item.level)>0?' · Niv. '+idleEntier_(item.level)+'/100':'')
          :'Accessoire';
        const contenu=item
          ?'<div class="soreal-idle-v138-slot-icon" title="'+nomComplet+'">'+iconeObjetAdventureIdleV138_(item)+'</div>'
          :'<div class="soreal-idle-v138-slot-icon" style="opacity:.35" title="'+nomComplet+'">💍</div>';

        const occupantId=item?idleHtml_(String(item.id||'')):'';
        const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);

        return '<div class="soreal-idle-v138-slot'+(classeSupplementaire?' '+classeSupplementaire:'')+(rareteClasse?' '+rareteClasse:'')+(item&&item.locked?' idle-item-locked-v165':'')+'" '+
          'data-equip-slot-v180="accessory" '+
          (occupantId?'data-occupant-id="'+occupantId+'" data-soreal-longpress="idle-item" ':'')+
          'draggable="false" '+
          '>'+
          (item
            ?''
            :'')+
          contenu+'</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-238 */
      function rendreAccessoiresAdventureIdleV138_(equipment,itemById,capacite){
        const ids=Array.isArray(equipment&&equipment.accessories)?equipment.accessories:[];
        const objetsPortes=ids.map(function(id){return itemById.get(String(id));}).filter(Boolean);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-239 */
        const vides=Math.max(0,idleEntier_(capacite,2)-objetsPortes.length);
        const tousLesSlots=objetsPortes.concat(Array(vides).fill(null));

        /*
         * Norman (2026-10-09) : le 3e accessoire se place SOUS les deux premiers, à côté du Pantalon ; le 4e SOUS le 3e, à côté des Bottes (colonne de gauche de la grille). Les suivants restent en dessous du paperdoll.
         */
        const classesGrille=['soreal-idle-v138-slot-acc1','soreal-idle-v138-slot-acc2','soreal-idle-v138-slot-acc3','soreal-idle-v138-slot-acc4'];
        const enGrille=tousLesSlots.slice(0,4).map(function(item,index){
          return rendreEmplacementAccessoireAdventureIdleV138_(item,classesGrille[index]);
        }).join('');

        const debordement=tousLesSlots.slice(4);
        const debordementHtml=debordement.length
          ?'<div class="soreal-idle-v138-accessories">'+
            debordement.map(function(item){return rendreEmplacementAccessoireAdventureIdleV138_(item,'');}).join('')+
          '</div>'
          :'';

        return {enGrille:enGrille,debordement:debordementHtml};
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-240 */
      function rendreCarteSacAdventureIdleV138_(item,slotIndex){
        const id=idleHtml_(item.id);
        const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);
        const titre=idleHtml_(item.name||item.nom||'Objet')+
          (idleEntier_(item.level)>0?' · Niv. '+idleEntier_(item.level)+'/100':'');
        const version=idleHtml_(signatureObjetInventaireIdleV160_(item));
        return '<div class="soreal-idle-v138-bag-card'+(rareteClasse?' '+rareteClasse:'')+(item&&item.locked?' idle-item-locked-v165':'')+'" '+
          'data-item-id="'+id+'" '+
          'data-item-version="'+version+'" '+
          'data-slot-index="'+idleEntier_(slotIndex)+'" '+
          'data-soreal-longpress="idle-item" '+
          'draggable="false" '+
          'title="'+titre+'" '+
          '>'+
          ''+
          iconeObjetAdventureIdleV138_(item)+
        '</div>';
      }

      function rendreGrilleSacAdventureIdleV1_(items,capacite){
        const total=Math.max(idleEntier_(capacite),items.length);
        const pages=Math.max(1,Math.ceil(total/REG.IDLE_SAC_CASES_PAR_PAGE_V1));
        if(REG.idlePageSacV1>pages)REG.idlePageSacV1=pages;
        const page=REG.idlePageSacV1;
        const debut=(page-1)*REG.IDLE_SAC_CASES_PAR_PAGE_V1;
        const fin=Math.min(total,debut+REG.IDLE_SAC_CASES_PAR_PAGE_V1);
        const cases=[];
        for(let i=debut;i<fin;i+=1){
          const item=items[i];
          cases.push(
            item
              ?rendreCarteSacAdventureIdleV138_(item,i)
              :'<div class="soreal-idle-v138-bag-card soreal-idle-v138-bag-card-vide" data-slot-index="'+i+'"></div>'
          );
        }
        return pagerSacIdleV1_(page,pages)+'<div class="soreal-idle-v138-bag">'+cases.join('')+'</div>'+(pages>1?pagerSacIdleV1_(page,pages):'');
      }

      function reordonnerInventaireAdventureIdleV162_(sourceId,targetId,targetIndex){
        actionAdventureIdleV47_({
          action:'reorderInventory',
          sourceId:String(sourceId||''),
          targetId:String(targetId||''),
          targetIndex:targetIndex==null?null:idleEntier_(targetIndex)
        });
      }

      function deposerSurEmplacementVideSacAdventureIdleV1_(event,targetIndex){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(!id||!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const equipment=a&&a.equipment||{};
        const estEquipe=
          REG.ADVENTURE_CORE_SLOTS_V138.some(function(slot){return String(equipment[slot]||'')===id;})||
          (Array.isArray(equipment.accessories)&&equipment.accessories.map(String).indexOf(id)!==-1);
        if(estEquipe){
          desequiperObjetAdventureIdleV47_(
            id,
            targetIndex
          );
          return;
        }
        reordonnerInventaireAdventureIdleV162_(id,'',targetIndex);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-242 */
      const IDLE_ADVENTURE_GESTE_SEUIL_PX_V196=32;

      const IDLE_ADVENTURE_DOUBLE_TAP_MS_V196=420;

      let idleDernierClicDroitSourisMsV209=0;

      let idleAdventureGesteV196=null;

      let idleAdventureDernierTapIdV196='';

      let idleAdventureDernierTapMsV196=0;

      let idleAdventureCibleDragV196=null;

      let idleAdventureDragGhostV183=null;

      function supprimerGhostDragAdventureIdleV183_(){
        if(idleAdventureDragGhostV183&&idleAdventureDragGhostV183.parentNode){
          idleAdventureDragGhostV183.remove();
        }
        idleAdventureDragGhostV183=null;
      }

      function creerGhostDragAdventureIdleV183_(source,point){
        supprimerGhostDragAdventureIdleV183_();
        if(!source||!point)return;
        const ghost=document.createElement('div');
        ghost.className='soreal-idle-drag-ghost-v183';
        const visuel=source.querySelector('img,.soreal-idle-v138-slot-icon,span');
        if(visuel)ghost.appendChild(visuel.cloneNode(true));
        else ghost.textContent='📦';
        /* Une case salie par le Coffre (modules/coffre-accident-v1.js) : le caca glisse avec l'objet. */
        if(source.hasAttribute&&source.hasAttribute('data-caca')){const caca=document.createElement('i');caca.className='soreal-idle-caca-fantome-v1';ghost.appendChild(caca);}
        document.body.appendChild(ghost);
        idleAdventureDragGhostV183=ghost;
        deplacerGhostDragAdventureIdleV183_(point);
      }

      function deplacerGhostDragAdventureIdleV183_(point){
        if(!idleAdventureDragGhostV183||!point)return;
        idleAdventureDragGhostV183.style.left=idleNombre_(point.clientX)+'px';
        idleAdventureDragGhostV183.style.top=idleNombre_(point.clientY)+'px';
      }

      function elementObjetGesteAdventureIdleV196_(target){
        if(!target||!target.closest)return null;
        return target.closest(
          '.soreal-idle-v138-bag-card[data-item-id],'+
          '.soreal-idle-v138-slot[data-occupant-id]'
        );
      }

      function idObjetGesteAdventureIdleV196_(element){
        if(!element)return '';
        return String(
          element.getAttribute('data-item-id')||
          element.getAttribute('data-occupant-id')||
          ''
        );
      }

      function nettoyerCibleDragAdventureIdleV196_(){
        if(idleAdventureCibleDragV196){
          idleAdventureCibleDragV196.classList.remove('drag-over');
          idleAdventureCibleDragV196=null;
        }
      }

      function cibleDragAdventureIdleV196_(point){
        if(!point||typeof document.elementFromPoint!=='function')return null;
        const brut=document.elementFromPoint(
          idleNombre_(point.clientX),
          idleNombre_(point.clientY)
        );
        if(!brut||!brut.closest)return null;
        return brut.closest(
          '[data-idle-trash-slot-v165],'+
          '[data-idle-cube-drop-v180],'+
          '[data-idle-coffre-drop-v180],'+
          '.soreal-idle-v138-bag-card[data-item-id],'+
          '.soreal-idle-v138-bag-card-vide[data-slot-index],'+
          '.soreal-idle-v138-slot[data-equip-slot-v180]'
        );
      }

      function marquerCibleDragAdventureIdleV196_(point){
        const cible=cibleDragAdventureIdleV196_(point);
        if(cible===idleAdventureCibleDragV196)return cible;
        nettoyerCibleDragAdventureIdleV196_();
        idleAdventureCibleDragV196=cible;
        if(cible)cible.classList.add('drag-over');
        return cible;
      }

      function appliquerDepotGesteAdventureIdleV196_(sourceId,cible){
        const source=String(sourceId||'');
        if(!source||!cible)return;

        if(cible.hasAttribute('data-idle-trash-slot-v165')){
          mettreObjetDansTrashAdventureIdleV165_(source);
          return;
        }

        if(cible.hasAttribute('data-idle-cube-drop-v180')){
          const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
          const items=a&&Array.isArray(a.inventory)?a.inventory:[];
          const item=items.find(function(x){return String(x&&x.id)===source;});
          if(!item||item.kind!=='boost'){
            toastIdleV5_('Seul un boost peut être absorbé par le Cube.');
            return;
          }
          boosterCubeAdventureIdleV47_(source);
          return;
        }

        if(cible.hasAttribute('data-idle-coffre-drop-v180')){
          /* Norman (2026-10-19) : « sur Unity le coffre a une animation quand il mange un objet ; pourquoi pas sur la version web ? » Seul le glisser-déposer HTML5 posait le drapeau d'animation ; le dépôt au doigt / à la souris (ce chemin) ne le posait pas : le Coffre à dents ne croquait jamais. */
          window.__bagageAvaleIdleV1=Date.now();
          jouerCroqueCoffreIdleV1_();
          actionAdventureIdleV47_({action:'coffreDeposer',id:source});
          return;
        }

        if(cible.getAttribute('data-equip-slot-v180')==='weapon2'&&decisionActionSlotAdventureIdleV138_(source,String(cible.getAttribute('data-occupant-id')||''))==='equiper'){
          equiperObjetAdventureIdleV47_(source,'weapon2');
          return;
        }

        if(cible.hasAttribute('data-equip-slot-v180')){
          appliquerActionSlotAdventureIdleV138_(
            source,
            String(cible.getAttribute('data-occupant-id')||'')
          );
          return;
        }

        const cibleId=String(cible.getAttribute('data-item-id')||'');
        if(cibleId){
          if(cibleId!==source){
            fusionnerSiPossibleAdventureIdleV138_(source,cibleId);
          }
          return;
        }

        if(cible.classList.contains('soreal-idle-v138-bag-card-vide')){
          const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
          const equipment=a&&a.equipment||{};
          const estEquipe=
            REG.ADVENTURE_CORE_SLOTS_V138.some(function(slot){
              return String(equipment[slot]||'')===source;
            })||
            (
              Array.isArray(equipment.accessories)&&
              equipment.accessories.map(String).indexOf(source)!==-1
            );

          if(estEquipe){
            desequiperObjetAdventureIdleV47_(
              source,
              idleEntier_(cible.getAttribute('data-slot-index'))
            );
          }else{
            reordonnerInventaireAdventureIdleV162_(
              source,
              '',
              idleEntier_(cible.getAttribute('data-slot-index'))
            );
          }
        }
      }

      function annulerTimerGesteAdventureIdleV196_(){
        if(idleAdventureGesteV196&&idleAdventureGesteV196.timer){
          clearTimeout(idleAdventureGesteV196.timer);
          idleAdventureGesteV196.timer=0;
        }
      }

      function libererCaptureGesteAdventureIdleV196_(geste){
        const el=geste&&geste.sourceEl;
        if(
          !el||
          geste.pointerId==null||
          typeof el.hasPointerCapture!=='function'||
          typeof el.releasePointerCapture!=='function'
        )return;

        try{
          if(el.hasPointerCapture(geste.pointerId)){
            el.releasePointerCapture(geste.pointerId);
          }
        }catch(_){}
      }

      function terminerEtatGesteAdventureIdleV196_(options){
        const geste=idleAdventureGesteV196;
        annulerTimerGesteAdventureIdleV196_();
        if(!(options&&options.garderCapture)){
          libererCaptureGesteAdventureIdleV196_(geste);
        }
        idleAdventureGesteV196=null;
        supprimerGhostDragAdventureIdleV183_();
        nettoyerCibleDragAdventureIdleV196_();
      }

      function popupDetailsObjetAdventureIdleOuvertV207_(){
        const root=document.getElementById('soreal-idle-v138-details');
        if(!root)return false;
        return root.style.display!=='none'&&root.getClientRects().length>0;
      }

      function cibleDansPopupDetailsObjetAdventureIdleV207_(target){
        if(!target||!target.closest)return false;
        return Boolean(
          target.closest('#soreal-idle-v138-details')||
          target.closest('#soreal-idle-v138-details-compare-v183')
        );
      }

      /* Un nouvel appui sur l'objet dont la fiche est ouverte la REFERME (Norman, 2026-10-14) : l'appui ferme d'abord la fiche (clic hors du popup), puis le tap qui suit ne doit pas la rouvrir. */
      let idleFicheFermeeParAppuiV1={id:'',ms:0};

      function fermerPopupDetailsSiExterieurAdventureIdleV207_(event){
        if(!popupDetailsObjetAdventureIdleOuvertV207_())return false;
        const target=event&&event.target;
        if(cibleDansPopupDetailsObjetAdventureIdleV207_(target))return false;
        const appuye=idObjetGesteAdventureIdleV196_(elementObjetGesteAdventureIdleV196_(target));
        idleFicheFermeeParAppuiV1=appuye&&appuye===String(REG.idleFicheObjetOuverteIdV1||'')?{id:appuye,ms:Date.now()}:{id:'',ms:0};
        fermerDetailsObjetAdventureIdleV1_();
        return true;
      }

      function ouvrirDetailsObjetParGesteAdventureIdleV196_(id){
        const objet=String(id||'');
        if(!objet)return false;

        /* Même objet que celui dont l'appui vient de fermer la fiche : elle reste fermée. */
        if(idleFicheFermeeParAppuiV1.id===objet&&Date.now()-idleFicheFermeeParAppuiV1.ms<1500){
          idleFicheFermeeParAppuiV1={id:'',ms:0};
          nettoyerEtatDragAdventureIdleV138_();
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          return true;
        }
        idleFicheFermeeParAppuiV1={id:'',ms:0};
        nettoyerEtatDragAdventureIdleV138_();
        afficherDetailsObjetAdventureIdleV138_(objet);
        REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
        return true;
      }

      /*
       * Gestes du sac ACHETÉS (Norman, 2026-10-04) : le double tap (équiper / fusionner d'un objet du sac, absorber les boosts d'une pièce équipée) et le triple tap n'existent plus de base. Deux achats de la boutique EXP,
       * rayon Aventure : « Double tap » (20 EXP : un objet, équipé ou non, absorbe tous les boosts du sac) et « Triple tap » (30 EXP : il fusionne automatiquement avec les pièces identiques disponibles). Les drapeaux
       * viennent du serveur (inventoryAuto.unlocked). Tactile et stylet seulement : la souris garde « A + clic » et le clic droit.
       */
      function gestesAchetesIdleV1_(){
        const u=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.inventoryAuto&&REG.idleEtat.systemes.inventoryAuto.unlocked;
        return {double:Boolean(u&&u.doubleTap),triple:Boolean(u&&u.tripleTap)};
      }

      let idleTapsObjetV1={id:'',n:0,ms:0};

      let idleDoubleDiffereTimerV1=0;

      /* Nombre d'appuis rapides consécutifs sur le même objet (1, 2 ou 3 ; au troisième le compteur repart de zéro). La souris compte toujours 1. */
      function compterTapsObjetIdleV1_(id,pointerType){
        if(pointerType==='mouse')return 1;
        const maintenant=Date.now();
        const objet=String(id||'');
        if(objet&&objet===idleTapsObjetV1.id&&maintenant-idleTapsObjetV1.ms<=IDLE_ADVENTURE_DOUBLE_TAP_MS_V196)idleTapsObjetV1.n+=1;
        else idleTapsObjetV1.n=1;
        idleTapsObjetV1.id=objet;
        idleTapsObjetV1.ms=maintenant;
        const n=idleTapsObjetV1.n;
        /* Un seul geste tactile : le double tap (Norman, 2026-10-09) ; au deuxième appui la séquence repart de zéro. */
        if(n>=2){idleTapsObjetV1={id:'',n:0,ms:0};}
        return n;
      }

      /* Pièces du sac qui peuvent fusionner avec cet objet : même objet, ni verrouillées, ni équipées, ni au niveau 100. */
      function piecesIdentiquesFusionIdleV1_(a,item){
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const equipement=(a&&a.equipment)||{};
        const idsEquipes=REG.ADVENTURE_CORE_SLOTS_V138
          .map(function(slot){return String(equipement[slot]||'');})
          .concat(Array.isArray(equipement.accessories)?equipement.accessories.map(String):[])
          .filter(Boolean);
        return items.filter(function(x){
          return x&&String(x.id)!==String(item.id)&&x.kind!=='boost'&&x.definitionId===item.definitionId&&!x.locked&&idsEquipes.indexOf(String(x.id))===-1&&idleEntier_(x.level)<100;
        });
      }

      /*
       * Clic droit de la souris avec Double tap / Triple tap ACHETÉS (Norman, 2026-10-04 : « pour que l'achat serve aussi sur PC : un premier clic droit absorbe les objets identiques, et quand aucune pièce n'est
       * disponible, il absorbe les boosts ; dans l'inventaire ou équipé »). Triple tap acheté : fusion avec les pièces identiques tant qu'il y en a ; Double tap acheté : sinon, absorption des boosts du sac.
       * Renvoie false quand aucun des deux achats ne s'applique (l'ancienne action rapide équiper / fusionner reste alors celle du clic droit).
       */
      function clicDroitGestesAchetesIdleV1_(id){
        const g=gestesAchetesIdleV1_();
        if(!g.double&&!g.triple)return false;
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        /* Clic droit / double tap sur un BOOST (Norman, 2026-10-10) : il absorbe tous les boosts de même chiffre et de même couleur (même définition), jusqu'à ce qu'ils fusionnent au niveau 100 (action serveur inventoryAuto / mergeAll). */
        if(item&&item.kind==='boost'){
          const identiques=items.filter(function(x){return x&&x.kind==='boost'&&String(x.id)!==objet&&x.definitionId===item.definitionId&&!x.locked&&idleEntier_(x.level)<100;});
          if(idleEntier_(item.level)>=100||!identiques.length){
            messageFlottantIdleV32_('Aucun boost identique à fusionner avec celui-ci.');
            return true;
          }
          const envoyerBoost=window.__actionMetaV47__;
          if(typeof envoyerBoost!=='function')return false;
          nettoyerEtatDragAdventureIdleV138_();
          envoyerBoost({action:'inventoryAuto',mode:'mergeAll',itemId:objet});
          return true;
        }
        if(!item)return false;
        if(deblocageParObjetIdleV1_(a,item))return false;
        if(g.triple&&idleEntier_(item.level)<100&&piecesIdentiquesFusionIdleV1_(a,item).length){
          return fusionnerAutoObjetIdleV1_(objet);
        }
        if(g.double)return boosterObjetEquipeAdventureIdleV1_(objet);
        return false;
      }

      /*
       * Clic droit (PC) sur le Cube de l'infini : même règle que sur un objet (Norman, 2026-10-05 : « le clic droit sur le cube de l'infini absorbe tous les boosts comme pour les items, pas de règle à part ») : avec Double tap acheté,
       * il absorbe tous les boosts du sac (la même action que « A + clic » sur le cube, inventoryAuto / boostAll) ; sans cet achat, rien de plus qu'avant.
       */
      function clicDroitCubeIdleV1_(){
        const g=gestesAchetesIdleV1_();
        if(!g.double||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        if(!(a&&a.cube&&a.cube.unlocked))return false;
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'boostAll',targetId:'cube'});
        return true;
      }

      /* Triple tap : fusion automatique de l'objet avec toutes les pièces identiques du sac (action serveur inventoryAuto / mergeAll). Prévient s'il n'y a rien à fusionner. */
      function fusionnerAutoObjetIdleV1_(id){
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        if(!item||item.kind==='boost')return false;
        const candidats=piecesIdentiquesFusionIdleV1_(a,item);
        if(idleEntier_(item.level)>=100||!candidats.length){
          messageFlottantIdleV32_('Aucune pièce identique à fusionner avec cet objet.');
          return true;
        }
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'mergeAll',itemId:objet});
        return true;
      }

      function estDoubleTapGesteAdventureIdleV196_(id,pointerType){
        if(pointerType==='mouse')return false;

        const maintenant=Date.now();
        const objet=String(id||'');
        const estDouble=Boolean(
          objet&&
          objet===idleAdventureDernierTapIdV196&&
          maintenant-idleAdventureDernierTapMsV196<=IDLE_ADVENTURE_DOUBLE_TAP_MS_V196
        );

        if(estDouble){
          idleAdventureDernierTapIdV196='';
          idleAdventureDernierTapMsV196=0;
        }else{
          idleAdventureDernierTapIdV196=objet;
          idleAdventureDernierTapMsV196=maintenant;
        }

        return estDouble;
      }

      function executerTapSlotAdventureIdleV196_(element){
        if(!element)return;
        const occupant=String(element.getAttribute('data-occupant-id')||'');
        if(!occupant)return;

        if(
          idleAdventureComparerEnAttenteV183&&
          occupant!==idleAdventureComparerPremierV183
        ){
          ouvrirComparaisonObjetAdventureIdleV183_(occupant);
          return;
        }

        /* Un simple appui ouvre la fiche de l'objet (Norman, 2026-10-14) : plus aucune sélection. */
        ouvrirDetailsObjetParGesteAdventureIdleV196_(occupant);
      }

      function executerTapCarteAdventureIdleV196_(element,id){
        const objet=String(id||'');
        if(!element||!objet)return;

        if(
          idleAdventureComparerEnAttenteV183&&
          objet!==idleAdventureComparerPremierV183
        ){
          ouvrirComparaisonObjetAdventureIdleV183_(objet);
          return;
        }

        /* Un simple appui ouvre la fiche de l'objet, avec ou sans statistiques (Norman, 2026-10-14) : plus aucune sélection. */
        ouvrirDetailsObjetParGesteAdventureIdleV196_(objet);
      }

      /*
       * Action rapide d'un objet du sac (2026-09-24, comme le clic droit de NGU Idle) :
       * - une pièce identique (même definitionId) est déjà équipée -> fusion dans la pièce équipée ;
       * - sinon -> équipement (remplace la pièce du slot).
       * Les boosts ne sont pas concernés (retourne false). Réutilise la décision du glisser-déposer sur un slot.
       */
      function actionRapideObjetAdventureIdleV209_(id){
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        if(!item||item.kind==='boost')return false;

        /* Objet de déblocage dont le système est encore verrouillé : le clic droit l'utilise (comme CTRL + clic dans le jeu d'origine). */
        if(deblocageParObjetIdleV1_(a,item)){
          nettoyerEtatDragAdventureIdleV138_();
          utiliserObjetDeblocageIdleV1_(objet);
          return true;
        }

        const equipement=a.equipment||{};
        const idsEquipes=REG.ADVENTURE_CORE_SLOTS_V138
          .map(function(slot){return String(equipement[slot]||'');})
          .concat(Array.isArray(equipement.accessories)?equipement.accessories.map(String):[])
          .filter(Boolean);
        if(idsEquipes.indexOf(objet)!==-1)return false;

        const jumeau=idsEquipes
          .map(function(idEquipe){return items.find(function(x){return String(x&&x.id)===idEquipe;});})
          .find(function(x){return x&&x.kind!=='boost'&&x.definitionId===item.definitionId;});

        nettoyerEtatDragAdventureIdleV138_();
        if(jumeau)appliquerActionSlotAdventureIdleV138_(objet,String(jumeau.id));
        else equiperParIdAdventureIdleV138_(objet);
        return true;
      }

      /*
       * Double tap sur une pièce ÉQUIPÉE = même effet que « A + clic » sur ordinateur (Norman, 2026-09-26 : « quand on double tape sur une pièce équipée, ça doit avoir le même effet que
       * CTRL + A sur PC ») : applique les boosts du sac à cette pièce (action inventoryAuto / boostAll, la même que modules/inventory-auto-v1.js).
       */
      function boosterObjetEquipeAdventureIdleV1_(id){
        const objet=String(id||'');
        if(!objet||!REG.idleEtat)return false;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===objet;});
        if(!item||item.kind==='boost')return false;
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'boostAll',targetId:objet});
        return true;
      }

      function executerTapObjetAdventureIdleV196_(element,id){
        if(!element)return;
        if(element.classList.contains('soreal-idle-v138-bag-card')){
          executerTapCarteAdventureIdleV196_(element,id);
          return;
        }
        executerTapSlotAdventureIdleV196_(element);
      }

      function commencerGesteAdventureIdleV196_(event,element,id){
        terminerEtatGesteAdventureIdleV196_();

        const geste={
          pointerId:event.pointerId,
          pointerType:String(event.pointerType||'mouse'),
          sourceEl:element,
          itemId:String(id||''),
          startX:idleNombre_(event.clientX),
          startY:idleNombre_(event.clientY),
          drag:false,
          moved:false,
          appuiLong:false,
          timer:0
        };

        idleAdventureGesteV196=geste;

        if(typeof element.setPointerCapture==='function'){
          try{element.setPointerCapture(event.pointerId);}catch(_){}
        }

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-243 */
      }

      function deplacerGesteAdventureIdleV196_(event){
        const geste=idleAdventureGesteV196;
        if(!geste||geste.pointerId!==event.pointerId)return;

        const dx=idleNombre_(event.clientX)-geste.startX;
        const dy=idleNombre_(event.clientY)-geste.startY;
        const distance=Math.hypot(dx,dy);

        if(distance<=IDLE_ADVENTURE_GESTE_SEUIL_PX_V196)return;

        geste.moved=true;
        annulerTimerGesteAdventureIdleV196_();

        if(geste.appuiLong)return;

        if(!geste.drag){
          geste.drag=true;
          REG.idleAdventureDragIdV138=geste.itemId;
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          geste.sourceEl.classList.add('drag-source');
          creerGhostDragAdventureIdleV183_(geste.sourceEl,event);
        }

        deplacerGhostDragAdventureIdleV183_(event);
        marquerCibleDragAdventureIdleV196_(event);

        if(event.cancelable)event.preventDefault();
        event.stopPropagation();
      }

      function finirGesteAdventureIdleV196_(event){
        const geste=idleAdventureGesteV196;
        if(!geste||geste.pointerId!==event.pointerId)return;

        if(event.cancelable)event.preventDefault();
        event.stopPropagation();

        annulerTimerGesteAdventureIdleV196_();

        if(geste.drag){
          const cible=marquerCibleDragAdventureIdleV196_(event);
          const source=geste.itemId;
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          terminerEtatGesteAdventureIdleV196_();
          nettoyerEtatDragAdventureIdleV138_();
          appliquerDepotGesteAdventureIdleV196_(source,cible);
          return;
        }

        if(geste.appuiLong){
          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          terminerEtatGesteAdventureIdleV196_();
          return;
        }

        const element=geste.sourceEl;
        const id=geste.itemId;
        const pointerType=geste.pointerType;
        const moved=geste.moved;

        REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
        terminerEtatGesteAdventureIdleV196_();

        if(moved)return;

        /*
         * Double tap (achats « Double tap : boosts » et « Double tap : fusion » de la boutique EXP, voir gestesAchetesIdleV1_) : sans achat, chaque appui reste un appui simple. Le geste unique est décrit juste en dessous.
         */
        /*
         * UN SEUL geste tactile, le DOUBLE TAP (Norman, 2026-10-09 : sur téléphone, le double tap absorbe toutes les pièces qui peuvent fusionner ; quand il n'y en a plus, il absorbe tous les boosts ; comme le clic droit de la
         * souris). Exactement la règle du clic droit (clicDroitGestesAchetesIdleV1_) : avec l'achat de fusion, il fusionne tant qu'il y a des pièces identiques ; avec l'achat des boosts, il absorbe les boosts sinon.
         */
        const nTaps=compterTapsObjetIdleV1_(id,pointerType);
        const gestes=gestesAchetesIdleV1_();
        /* Le premier appui n'ouvre pas la fiche tout de suite quand un double tap est acheté (Norman, 2026-10-14 : « le double tap ne fonctionne plus car un simple tap ouvre la fenêtre de stats ») : la fiche cacherait ou
         * déplacerait l'objet avant le deuxième appui. On attend la fin du délai du double tap ; un deuxième appui annule l'attente et lance l'action du double tap. Sans achat, ou à la souris, la fiche s'ouvre aussitôt. */
        clearTimeout(idleDoubleDiffereTimerV1);
        if(nTaps===2&&(gestes.double||gestes.triple)){
          if(clicDroitGestesAchetesIdleV1_(id))return;
        }else if(nTaps===1&&(gestes.double||gestes.triple)&&pointerType!=='mouse'){
          idleDoubleDiffereTimerV1=setTimeout(function(){
            idleDoubleDiffereTimerV1=0;
            executerTapObjetAdventureIdleV196_(element,id);
          },IDLE_ADVENTURE_DOUBLE_TAP_MS_V196+30);
          return;
        }

        executerTapObjetAdventureIdleV196_(element,id);
      }

      function annulerGesteAdventureIdleV196_(event){
        const geste=idleAdventureGesteV196;
        if(!geste)return;
        if(event&&event.pointerId!=null&&geste.pointerId!==event.pointerId)return;
        REG.idleAdventureIgnorerClicJusquaV165=Date.now()+350;
        terminerEtatGesteAdventureIdleV196_();
      }

      function installerGestesInventaireAdventureIdleV196_(){
        if(document.documentElement.dataset.idleInventoryGesturesV196==='1')return;
        document.documentElement.dataset.idleInventoryGesturesV196='1';

        document.addEventListener('pointerdown',function(event){
          if(event.isPrimary===false)return;
          if(String(event.pointerType||'mouse')==='mouse'&&event.button===2)idleDernierClicDroitSourisMsV209=Date.now();
          if(String(event.pointerType||'mouse')==='mouse'&&event.button!==0)return;

          fermerPopupDetailsSiExterieurAdventureIdleV207_(event);

          const element=elementObjetGesteAdventureIdleV196_(event.target);
          const id=idObjetGesteAdventureIdleV196_(element);
          if(!element||!id)return;

          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-244 */
          if(event.cancelable)event.preventDefault();
          event.stopPropagation();

          commencerGesteAdventureIdleV196_(event,element,id);
        },{capture:true,passive:false});

        document.addEventListener('pointermove',function(event){
          deplacerGesteAdventureIdleV196_(event);
        },{capture:true,passive:false});

        document.addEventListener('pointerup',function(event){
          finirGesteAdventureIdleV196_(event);
        },{capture:true,passive:false});

        document.addEventListener('pointercancel',function(event){
          annulerGesteAdventureIdleV196_(event);
        },true);

        document.addEventListener('lostpointercapture',function(event){
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-245 */
          if(
            idleAdventureGesteV196&&
            idleAdventureGesteV196.pointerId===event.pointerId
          ){
            annulerGesteAdventureIdleV196_(event);
          }
        },true);

        document.addEventListener('pointerdown',function(event){
          if(event.pointerType==='mouse'){idleCubeAppuiV1=null;return;}
          const c=event.target&&event.target.closest?event.target.closest('[data-idle-cube-drop-v180]'):null;
          idleCubeAppuiV1=c?{x:event.clientX,y:event.clientY,t:Date.now(),id:event.pointerId}:null;
        },true);
        document.addEventListener('pointerup',function(event){
          const p=idleCubeAppuiV1;
          idleCubeAppuiV1=null;
          if(!p||p.id!==event.pointerId||event.pointerType==='mouse')return;
          if(Math.hypot(event.clientX-p.x,event.clientY-p.y)>20||Date.now()-p.t>550)return;
          toucherCubeAdventureIdleV1_();
        },true);

        document.addEventListener('soreal-longpress',function(event){
          /* PC : le maintien du clic n'ouvre plus le popup (il se refermait au relâchement) — c'est le survol qui l'ouvre. */
          if(event.detail&&event.detail.pointerType==='mouse')return;
          /* Cube de l'infini : son popup s'ouvre au maintien, comme celui des autres objets. */
          const cubeLong=event.target&&event.target.closest?event.target.closest('[data-idle-cube-drop-v180]'):null;
          if(cubeLong){
            idleCubeIgnorerClicJusquaV1=Date.now()+750;
            idleCubeDernierTapMsV1=0;
            afficherDetailsCubeInfiniAdventureIdleV220_();
            if(event.cancelable)event.preventDefault();
            event.stopPropagation();
            return;
          }
          const element=elementObjetGesteAdventureIdleV196_(event.target);
          const id=idObjetGesteAdventureIdleV196_(element);
          if(!element||!id)return;

          if(
            idleAdventureGesteV196&&
            idleAdventureGesteV196.itemId===id
          ){
            idleAdventureGesteV196.appuiLong=true;
            annulerTimerGesteAdventureIdleV196_();
          }

          REG.idleAdventureIgnorerClicJusquaV165=Date.now()+750;
          ouvrirDetailsObjetParGesteAdventureIdleV196_(id);

          if(event.cancelable)event.preventDefault();
          event.stopPropagation();
        },true);

        document.addEventListener('contextmenu',function(event){
          /* Cube de l'infini : même clic droit que pour un objet (absorbe tous les boosts) ; la souris seulement. */
          const cubeEl=event.target&&event.target.closest?event.target.closest('[data-idle-cube-drop-v180]'):null;
          if(cubeEl&&cubeEl.closest('.soreal-idle-v151-inventory-columns')){
            event.preventDefault();
            const sourisCube=event.pointerType==='mouse'||(!event.pointerType&&Date.now()-idleDernierClicDroitSourisMsV209<1500);
            if(sourisCube&&clicDroitCubeIdleV1_())event.stopPropagation();
            return;
          }
          const element=elementObjetGesteAdventureIdleV196_(event.target);
          if(!element)return;
          event.preventDefault();
          /* Clic droit de la souris (PC) sur un objet du sac : action rapide équiper / fusionner. Un contextmenu tactile
             (maintien long) n'est pas un clic droit : il reste géré par le composant de maintien long. */
          const souris=
            event.pointerType==='mouse'||
            (!event.pointerType&&Date.now()-idleDernierClicDroitSourisMsV209<1500);
          if(!souris)return;
          const idObjet=idObjetGesteAdventureIdleV196_(element);
          /* Double tap / Triple tap achetés : le clic droit fusionne puis absorbe les boosts, sur une pièce du sac comme sur une pièce équipée. */
          if(clicDroitGestesAchetesIdleV1_(idObjet))return;
          if(!element.classList.contains('soreal-idle-v138-bag-card'))return;
          actionRapideObjetAdventureIdleV209_(idObjet);
        },true);

        document.addEventListener('click',function(event){

          /*
           * Comparer (2026-09-26, Norman : « Comparer ne fonctionne plus sur PC, à la souris ») : le tap qui choisit le deuxième objet ouvre la
           * comparaison au relâchement (pointerup), puis le navigateur envoie le « click » : cet objet étant hors des popups, il les refermait aussitôt.
           * Un clic qui suit de moins de 750 ms un geste sur un objet (idleAdventureIgnorerClicJusquaV165) n'est pas un clic « à l'extérieur ».
           */
          if(Date.now()<REG.idleAdventureIgnorerClicJusquaV165){
            if(elementObjetGesteAdventureIdleV196_(event.target)){
              event.preventDefault();
              event.stopPropagation();
            }
            return;
          }
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-246 */
          fermerPopupDetailsSiExterieurAdventureIdleV207_(event);

          if(!elementObjetGesteAdventureIdleV196_(event.target))return;
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-247 */
          event.preventDefault();
          event.stopPropagation();
        },true);
      }

      function survolOccupeIdleV1_(){
        return Boolean(
          REG.idleSurvolBloqueV1||
          REG.idleAdventureDragIdV138||
          idleAdventureGesteV196||
          idleAdventureComparerEnAttenteV183||
          document.getElementById('soreal-idle-v138-details-compare-v183')
        );
      }

      function fermerSurvolIdleV1_(){
        clearTimeout(REG.idleSurvolTimerFermerV1);
        REG.idleSurvolTimerFermerV1=0;
        if(!REG.idleSurvolIdV1)return;
        REG.idleSurvolIdV1='';
        if(popupDetailsObjetAdventureIdleOuvertV207_())fermerDetailsObjetAdventureIdleV1_();
      }

      function ouvrirSurvolIdleV1_(element,id){
        if(survolOccupeIdleV1_()||!element||!element.isConnected)return;
        if(!ouvrirDetailsObjetParGesteAdventureIdleV196_(id))return;
        REG.idleSurvolIdV1=id;
        REG.idleAdventureIgnorerClicJusquaV165=0; /* le survol ne doit pas avaler le premier clic */
        const root=document.getElementById('soreal-idle-v138-details');
        if(!root)return;
        /* À côté de l'objet (à droite, sinon à gauche), sans le recouvrir : la souris peut passer de l'objet au popup. */
        const r=element.getBoundingClientRect();
        const largeur=root.offsetWidth||320;
        const hauteur=root.offsetHeight||160;
        const marge=8;
        let left=r.right+4;
        if(left+largeur>window.innerWidth-marge)left=r.left-largeur-4;
        left=Math.min(Math.max(marge,left),Math.max(marge,window.innerWidth-largeur-marge));
        const top=Math.min(Math.max(marge,r.top-6),Math.max(marge,window.innerHeight-hauteur-marge));
        REG.idleItemPopupPositionV1_={left:Math.round(left),top:Math.round(top)};
        root.style.left=REG.idleItemPopupPositionV1_.left+'px';
        root.style.top=REG.idleItemPopupPositionV1_.top+'px';
      }

      function idSourceAdventureIdleV138_(event){
        return String(
          REG.idleAdventureDragIdV138||
          (event&&event.dataTransfer?event.dataTransfer.getData('text/plain'):'')||
          ''
        );
      }

      function nettoyerEtatDragAdventureIdleV138_(){
        REG.idleAdventureDragIdV138='';
        document.querySelectorAll(
          '.soreal-idle-v138-slot.drag-over,'+
          '.soreal-idle-v138-bag-card.drag-over,'+
          '.soreal-idle-v138-bag-card.drag-source,'+
          '.soreal-idle-v138-slot.drag-source'
        ).forEach(function(el){
          el.classList.remove('drag-over','drag-source');
        });
        afficherDetailsObjetAdventureIdleV138_('');

        if(REG.idleInventoryDeferredPatchV160&&REG.idleEtat){
          REG.idleInventoryDeferredPatchV160=false;
          patchInventaireAdventureIdleV160_(
            REG.idleEtat,
            {action:'deferred',confirmed:true}
          );
        }
      }

      function survolCibleAdventureIdleV138_(event){
        if(event){
          event.preventDefault();
          if(event.currentTarget)event.currentTarget.classList.add('drag-over');
        }
      }

      function quitterCibleAdventureIdleV138_(event){
        if(event&&event.currentTarget)event.currentTarget.classList.remove('drag-over');
      }

      function equiperParIdAdventureIdleV138_(itemId){
        if(!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=items.find(function(x){return String(x&&x.id)===itemId;});
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-248 */
        if(!item||item.kind==='boost')return;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-249 */
        equiperObjetAdventureIdleV47_(
          item.id,
          emplacementEquipementAdventureIdleV138_(item)
        );
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-250 */
      function idsFusionAdventureIdleV169_(sourceId,cibleId,cibleEquipe){
        void cibleEquipe;
        const source=String(sourceId||'');
        const cible=String(cibleId||'');
        return {a:cible,b:source};
      }

      function fusionnerSelonInteractionAdventureIdleV169_(sourceId,cibleId,cibleEquipe){
        const ids=idsFusionAdventureIdleV169_(sourceId,cibleId,cibleEquipe);
        if(!ids.a||!ids.b||ids.a===ids.b)return;
        fusionnerObjetAdventureIdleV47_(ids.a,ids.b);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-251 */
      function fusionnerSiPossibleAdventureIdleV138_(sourceId,cibleId){
        if(!REG.idleEtat||sourceId===cibleId)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===sourceId;});
        const cible=items.find(function(x){return String(x&&x.id)===cibleId;});
        if(!source||!cible)return;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-252 */
        const memeDefinition=
          source.definitionId===cible.definitionId;
        const boostDejaComplete=
          source.kind==='boost'&&
          Boolean(
            a.itemList&&
            a.itemList[source.definitionId]&&
            idleEntier_(a.itemList[source.definitionId].maxLevel)>=100
          );

        if(memeDefinition&&!boostDejaComplete){
          fusionnerSelonInteractionAdventureIdleV169_(
            source.id,
            cible.id,
            false
          );
        }else if(
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-253 */
          source.kind==='boost'&&
          (cible.kind==='equipment'||cible.kind==='special'||cible.kind==='cube')
        ){
          boosterObjetParIdAdventureIdleV47_(source.id,cible.id);
        }else{
          /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-254 */
          reordonnerInventaireAdventureIdleV162_(source.id,cible.id,null);
        }
      }

      function boosterObjetParIdAdventureIdleV47_(boostId,cibleId){
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const boost=items.find(function(x){return String(x&&x.id)===String(boostId||'');});
        const cible=items.find(function(x){return String(x&&x.id)===String(cibleId||'');});
        if(!boost||boost.kind!=='boost'||!cible||cible.kind==='boost')return;

        const type=String(boost.boostType||'');
        const q=1+Math.max(0,Math.min(100,idleNombre_(cible.level)))/100;
        let cap=0;
        let actuel=0;
        if(type==='power'){
          cap=idleNombre_(cible.basePower)*q;
          actuel=idleNombre_(cible.power);
        }else if(type==='toughness'){
          cap=idleNombre_(cible.baseToughness)*q;
          actuel=idleNombre_(cible.toughness);
        }else if(type==='special'){
          cap=idleNombre_(cible.baseSpecial)*q;
          actuel=idleNombre_(cible.special);
        }

        /*
         * 2026-09-24 (Norman : « Mon épée qui n'a pas de stats Toughness accepte les boosts. Ils me sont ensuite rendus. Il ne doit
         * les accepter QUE s'il a des stats Toughness non remplies. ») : un plafond de 0 = l'objet n'a pas cette statistique. Avant, la
         * garde ne refusait que « plafond > 0 et atteint » : le boost était consommé côté client puis refusé par le serveur et rendu.
         */
        if(cap<=1e-9){
          const nomStat=type==='power'?'Puissance':type==='toughness'?'Endurance':'Spécial';
          toastIdleV5_('Cet objet n’a pas de statistique '+nomStat+' à remplir : le boost n’est pas consommé.');
          return;
        }
        const specialsRestants=type==='special'?specialAcceptePlusDeBoostIdleV1_(cible):null;
        if(
          cible.fullyMaxed||
          (specialsRestants===null?actuel>=cap-1e-9:!specialsRestants)
        ){
          toastIdleV5_('Cette statistique est déjà au maximum : le boost n’est pas consommé.');
          return;
        }

        actionAdventureIdleV47_({
          action:'boost',
          boostId:String(boostId||''),
          targetId:String(cibleId||'')
        });
      }

      function deposerSurCubeAdventureIdleV138_(event){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(!id||!REG.idleEtat)return;
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===id;});
        if(!source||source.kind!=='boost'){
          toastIdleV5_('Seul un boost peut être absorbé par le Cube.');
          return;
        }
        boosterCubeAdventureIdleV47_(source.id);
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-255 */
      function afficherDetailsCubeInfiniAdventureIdleV220_(){
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
        const cube=a&&a.cube;
        const tier=a&&a.cubeTier;
        if(!root||!corps||!cube||!cube.unlocked)return;

        const palier=Math.max(0,idleEntier_(tier&&tier.tier));
        const total=Math.max(0,idleNombre_(tier&&tier.totalStats));
        const suivant=tier&&tier.suivant||null;
        const bonus=[];
        if(idleNombre_(tier&&tier.dropChancePct)>0)bonus.push('Chance de drop +'+idleNombre_(tier.dropChancePct)+'%');
        if(idleNombre_(tier&&tier.goldDropsPct)>0)bonus.push('Gold Drops +'+idleNombre_(tier.goldDropsPct)+'%');
        if(idleNombre_(tier&&tier.hackSpeedPct)>0)bonus.push('Hack Speed +'+idleNombre_(tier.hackSpeedPct)+'%');
        if(idleNombre_(tier&&tier.wishSpeedPct)>0)bonus.push('Wish Speed +'+idleNombre_(tier.wishSpeedPct)+'%');

        corps.innerHTML=
          '<div class="soreal-idle-window-title-v31">Cube de l\'infini</div>'+
          '<div class="soreal-idle-v138-details-level">Tier '+palier+' · ID wiki 100</div>'+
          '<div style="display:flex;justify-content:center;margin:8px 0 12px">'+
            '<img src="'+idleHtml_(urlImageCubeInfiniAdventureIdleV1_(palier))+'" alt="Infinity Cube Tier '+palier+'" style="width:92px;height:92px;object-fit:contain">'+
          '</div>'+
          '<div class="soreal-idle-v138-details-stats">'+
            '<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">Puissance</span><b>'+formatGrandNombreIdleV70_(cube.power||0)+'</b></div>'+
            '<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Endurance</span><b>'+formatGrandNombreIdleV70_(cube.toughness||0)+'</b></div>'+
            '<div class="soreal-idle-v138-details-stat"><span>Total stats</span><b>'+formatGrandNombreIdleV70_(total)+'</b></div>'+
            (suivant
              ?'<div class="soreal-idle-v138-details-stat"><span>Prochain tier</span><b>'+formatGrandNombreIdleV70_(suivant.seuil||0)+'</b></div>'
              :'<div class="soreal-idle-v138-details-stat"><span>Tier</span><b>MAX</b></div>')+
          '</div>'+
          (bonus.length
            ?'<div style="margin-top:10px;font-size:14px;color:#aeb5c8"><b>Bonus du tier</b><br>'+bonus.map(idleHtml_).join('<br>')+'</div>'
            :'');
        root.style.display='block';
        positionnerPopupObjetAdventureIdleV1_(root);
        activerGlisserPopupObjetAdventureIdleV1_(root);
      }

      /*
       * Double tap sur le Cube de l'infini = il absorbe tous les boosts du sac (Norman, 2026-09-29 :
       * « quand on double tape sur le cube de l'infini il doit absorber tous les boosts »). Même
       * principe que le double tap sur une pièce équipée (boosterObjetEquipeAdventureIdleV1_) et que
       * « A + clic » sur le Cube (modules/inventory-auto-v1.js) : action inventoryAuto / boostAll,
       * cible « cube » -- déjà gérée côté serveur (idle-inventory-auto-v1.js), aucune règle nouvelle.
       * Tactile/stylet seulement, comme les objets (estDoubleTapGesteAdventureIdleV196_) : la souris
       * garde « A + clic ». Le popup de détails n'est ouvert qu'une fois la fenêtre de double tap
       * écoulée : sinon il recouvrirait le Cube et le second tap tomberait dessus.
       */
      let idleCubeDernierTapMsV1=0;

      let idleCubeIgnorerClicJusquaV1=0;

      function absorberTousBoostsCubeAdventureIdleV1_(){
        const envoyer=window.__actionMetaV47__;
        if(typeof envoyer!=='function')return false;
        nettoyerEtatDragAdventureIdleV138_();
        envoyer({action:'inventoryAuto',mode:'boostAll',targetId:'cube'});
        return true;
      }

      /*
       * Un appui tactile sur le Cube (Norman, 2026-10-09 : « le double tap sur le cube n'avale plus les boosts »). Le Cube porte data-soreal-longpress (son popup s'ouvre au maintien) et le module de maintien
       * appelle preventDefault sur touchstart : le navigateur ne produit alors plus de « click » tactile, et le double tap, compté dans le clic, ne se déclenchait jamais. Le tap est donc détecté au relâchement
       * du doigt (pointerup) ; le clic, quand il existe quand même, passe par la même fonction (deux appels collés = un seul appui).
       */
      let idleCubeDernierEvtMsV1=0;

      function toucherCubeAdventureIdleV1_(){
        const maintenant=Date.now();
        if(maintenant-idleCubeDernierEvtMsV1<80)return;
        idleCubeDernierEvtMsV1=maintenant;
        if(maintenant<idleCubeIgnorerClicJusquaV1)return;
        if(!gestesAchetesIdleV1_().double)return;
        if(maintenant-idleCubeDernierTapMsV1<=IDLE_ADVENTURE_DOUBLE_TAP_MS_V196){
          idleCubeDernierTapMsV1=0;
          absorberTousBoostsCubeAdventureIdleV1_();
          return;
        }
        idleCubeDernierTapMsV1=maintenant;
      }

      let idleCubeAppuiV1=null;

      function clicCubeAdventureIdleV138_(event){
        /* Certains Safari envoient un « click » sans pointerType : repli sur le type de pointeur principal de l'appareil. */
        const typePointeur=event&&typeof event.pointerType==='string'&&event.pointerType
          ?event.pointerType
          :(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches?'touch':'mouse');
        if(typePointeur==='mouse'){
          afficherDetailsCubeInfiniAdventureIdleV220_();
          return;
        }
        /*
         * Téléphone (Norman, 2026-10-09 : le Cube de l'infini nécessite un appui long pour ouvrir son popup ; c'est le seul item qui fonctionnait différemment) : comme les autres objets, un appui simple n'ouvre plus
         * rien ; le popup s'ouvre au maintien (voir l'écouteur « soreal-longpress ») et le double tap absorbe tous les boosts (avec l'achat correspondant).
         */
        toucherCubeAdventureIdleV1_();
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-256 */
      function supprimerObjetAdventureIdleV165_(id){
        mettreObjetDansTrashAdventureIdleV165_(id);
      }

      function mettreObjetDansTrashAdventureIdleV165_(id){
        actionAdventureIdleV47_({action:'trashPut',id:String(id||'')});
      }

      function recupererObjetTrashAdventureIdleV165_(){
        actionAdventureIdleV47_({action:'trashRecover'});
      }

      function basculerVerrouObjetAdventureIdleV165_(id,locked){
        actionAdventureIdleV47_({
          action:'setLock',
          id:String(id||''),
          locked:Boolean(locked)
        });
        fermerDetailsObjetAdventureIdleV1_();
      }

      function deposerSurTrashAdventureIdleV138_(event){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(id)mettreObjetDansTrashAdventureIdleV165_(id);
      }

      function rendreTrashAdventureIdleV165_(item){
        const titre=item
          ?'Trash : '+String(item.name||item.nom||'Objet')+' — clique pour récupérer'
          :'Trash — dépose un objet ici';
        return '<div class="soreal-idle-v138-trash-slot" data-idle-trash-slot-v165 '+
          'title="'+idleHtml_(titre)+'" '+
          'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
          'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
          'ondrop="window.__deposerSurTrashAdventureIdleV138__(event)" '+
          'onclick="window.__clicTrashAdventureIdleV138__()">'+
          (item?iconeObjetAdventureIdleV138_(item):'<i class="dsn-v1 dsn-corbeille" aria-hidden="true"></i>')+
        '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-257 */
      function decisionActionSlotAdventureIdleV138_(sourceId,occupantId){
        if(!occupantId||occupantId===sourceId)return 'equiper';
        if(!REG.idleEtat)return 'equiper';
        const a=aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const source=items.find(function(x){return String(x&&x.id)===sourceId;});
        const occupant=items.find(function(x){return String(x&&x.id)===occupantId;});
        if(!source||!occupant)return 'equiper';
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-258 */
        if(source.kind!=='boost'&&occupant.kind!=='boost'&&source.definitionId===occupant.definitionId){
          return 'fusionner';
        }
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-259 */
        /*
         * 2026-09-24 : un boost spécial n'est « équipé » (échange de place) que sur une pièce SANS Special ; depuis l'audit du
         * 2026-09-23 la plupart des pièces de set en ont un (baseSpecial > 0) et doivent le recevoir (Norman : « je ne peux
         * toujours pas remplir les objets avec les boosts spéciaux »).
         */
        if(source.kind==='boost'&&source.boostType==='special'&&occupant.kind==='equipment'&&!(idleNombre_(occupant.baseSpecial)>0)){
          return 'equiper';
        }
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-260 */
        if(source.kind==='boost'&&(occupant.kind==='equipment'||occupant.kind==='special'||occupant.kind==='cube')){
          return 'booster';
        }
        return 'equiper';
      }

      function appliquerActionSlotAdventureIdleV138_(sourceId,occupantId){
        const decision=decisionActionSlotAdventureIdleV138_(sourceId,occupantId);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-261 */
        if(decision==='fusionner'){
          fusionnerSelonInteractionAdventureIdleV169_(
            sourceId,
            occupantId,
            true
          );
        }else if(decision==='booster')boosterObjetParIdAdventureIdleV47_(sourceId,occupantId);
        else equiperParIdAdventureIdleV138_(sourceId);
      }

      function statsHtmlObjetAdventureIdleV138_(item){
        if(!(item.kind==='equipment'||item.kind==='special'||item.kind==='cube'))return '';
        const niveau=idleEntier_(item.level);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-264 */
        const basePower=idleNombre_(item.basePower);
        const baseToughness=idleNombre_(item.baseToughness);
        const q=1+niveau/100;
        const maxPower=basePower*q;
        const maxToughness=baseToughness*q;
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-265 */
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-266 */
        const powerMaxAtteint=basePower>0&&idleNombre_(item.power)+1e-9>=maxPower;
        const toughnessMaxAtteint=baseToughness>0&&idleNombre_(item.toughness)+1e-9>=maxToughness;

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-267 */
        const itemHp=idleNombre_(item.power)*3;
        const itemRegen=idleNombre_(item.toughness)*.03;
        const baseHp=basePower*3;
        const baseRegen=baseToughness*.03;
        const maxHp=baseHp*q;
        const maxRegen=baseRegen*q;
        const hpMaxAtteint=baseHp>0&&itemHp+1e-9>=maxHp;
        const regenMaxAtteint=baseRegen>0&&itemRegen+1e-9>=maxRegen;

        /*
         * Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-268 -- Ordre (2026-09-27, Norman : « Dans NGU, c'est Power / Max HP /
         * Toughness / HP Regen ») : Power et Max HP se boostent avec les boosts oranges (Power), Toughness et HP Regen avec les
         * boosts bleus (Toughness) -- l'ordre affiché regroupe donc les deux paires par boost, comme sur le wiki NGU, plutôt que
         * Power/Toughness/MaxHP/Regen (ordre "brut" du moteur, qui sépare les deux paires).
         */
        return '<div class="soreal-idle-v138-details-stats">'+
            (basePower>0
              ?'<div class="soreal-idle-v138-details-stat" data-cmp-cle="Puissance" data-cmp-val="'+idleNombre_(item.power)+'"><span class="sb-power-v1">Puissance</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(powerMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.power))+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxPower)+
              '</b></div>'
              :''
            )+
            (baseHp>0
              ?'<div class="soreal-idle-v138-details-stat" data-cmp-cle="PV Max" data-cmp-val="'+idleNombre_(itemHp)+'"><span class="sb-power-v1">PV Max</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(hpMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(itemHp)+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxHp)+
              '</b></div>'
              :''
            )+
            (baseToughness>0
              ?'<div class="soreal-idle-v138-details-stat" data-cmp-cle="Endurance" data-cmp-val="'+idleNombre_(item.toughness)+'"><span class="sb-toughness-v1">Endurance</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(toughnessMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.toughness))+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxToughness)+
              '</b></div>'
              :''
            )+
            (baseRegen>0
              ?'<div class="soreal-idle-v138-details-stat" data-cmp-cle="Regen PV" data-cmp-val="'+idleNombre_(itemRegen)+'"><span class="sb-toughness-v1">Regen PV</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(regenMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(itemRegen,2)+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxRegen,2)+
              '</b></div>'
              :''
            )+
            (function(){
              /* Pièces de set : tous leurs Specials (valeur actuelle / plafond du niveau), audit NGU 2026-09-23. */
              if(Array.isArray(item.specialsAll)&&item.specialsAll.length){
                return item.specialsAll.map(function(sv){
                  const atteint=idleNombre_(sv.value)+1e-9>=idleNombre_(sv.max);
                  return '<div class="soreal-idle-v138-details-stat" data-cmp-cle="'+idleHtml_('Special: '+idleLabelSpecialBonusV1_(sv.type))+'" data-cmp-val="'+idleNombre_(sv.value)+'"><span class="sb-special-v1">Special: '+idleHtml_(idleLabelSpecialBonusV1_(sv.type))+'</span><b>'+
                    '<span class="soreal-idle-v138-stat-value-v1'+(atteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(sv.value),2)+'%</span>'+
                    ' / '+formatGrandNombreIdleV70_(idleNombre_(sv.max),2)+'%'+
                  '</b></div>';
                }).join('');
              }
              /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-269 */
              const baseSpecial=idleNombre_(item.baseSpecial);
              if(!(baseSpecial>0))return'';
              const maxSpecial=baseSpecial*q;
              const specialMaxAtteint=idleNombre_(item.special)+1e-9>=maxSpecial;
              const label=idleLabelSpecialBonusV1_(item.specialType);
              return '<div class="soreal-idle-v138-details-stat" data-cmp-cle="'+idleHtml_('Special Bonus: '+label)+'" data-cmp-val="'+idleNombre_(item.special)+'"><span class="sb-special-v1">Special Bonus: '+idleHtml_(label)+'</span><b>'+
                '<span class="soreal-idle-v138-stat-value-v1'+(specialMaxAtteint?' maxed':'')+'">'+formatGrandNombreIdleV70_(idleNombre_(item.special))+'</span>'+
                ' / '+formatGrandNombreIdleV70_(maxSpecial)+
              '</b></div>';
            })()+
          '</div>';
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-262 */
      function afficherDetailsObjetAdventureIdleV138_(itemId){
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps)return;

        const id=String(itemId||'');
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const item=id?items.find(function(x){return String(x&&x.id)===id;}):null;

        if(!item){
          REG.idleFicheObjetOuverteIdV1='';
          root.style.display='none';
          corps.innerHTML='';
          return;
        }
        REG.idleFicheObjetOuverteIdV1=id;

        const niveau=idleEntier_(item.level);
        const statsHtml=statsHtmlObjetAdventureIdleV138_(item);

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-270 */
        const equipement=a&&a.equipment||{};
        const estEquipe=
          ['head','chest','legs','boots','weapon','weapon2'].some(function(slot){return String(equipement[slot]||'')===id;}) ||
          (Array.isArray(equipement.accessories)&&equipement.accessories.includes(id));
        const boutonDesequiper=estEquipe
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__desequiperObjetAdventureIdleV47__(\''+idleHtml_(id)+'\')">🔓 Déséquiper</button>'
          :'';

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-271 */
        const estEquipable=
          !estEquipe&&
          item.kind!=='boost'&&
          !item.consumable;
        const boutonEquiper=estEquipable
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__equiperParIdAdventureIdleV138__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">⚔️ Équiper</button>'
          :'';
        const boutonConsommer=item.consumable
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__consommerObjetSkillAdventureIdleV4__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🥤 Utiliser</button>'
          :'';
        const peutTransformerGerbil=
          item.definitionId==='smallGerbil'&&
          niveau>=100&&
          String(REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.difficulty||'')==='extreme';
        /*
         * Ascensions (2026-09-24) : tout objet dont le catalogue serveur donne une évolution
         * (itemCatalog[definitionId].evolutionTo : Forest Pendant -> Ascended... -> x9, lignée
         * Looty, Wanderer's Cane, The Lonely Flubber) au niveau 100 (wiki : « level it to level
         * 100 and CTRL + Click to transform it »).
         */
        const catalogueObjetsAdv=a&&a.itemCatalog&&typeof a.itemCatalog==='object'?a.itemCatalog:{};
        const evolutionObjetAdv=catalogueObjetsAdv[item.definitionId]&&catalogueObjetsAdv[item.definitionId].evolutionTo;
        const peutTransformerFlubber=item.definitionId!=='smallGerbil'&&Boolean(evolutionObjetAdv)&&niveau>=100;
        const boutonTransformer=(peutTransformerGerbil||peutTransformerFlubber)
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__transformerObjetAdventureIdleV4__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🧪 Transformer</button>'
          :'';
        /* Copies de Wandoos 98/XL : +1 niveau d'OS (ou déblocage de Wandoos XL), action méta consumeWandoosCopy. */
        /* Objet de déblocage (A Number, Giant Seed, Scrap of Paper, UUG's Armpit Hair, Pissed Off Key, copie de Wandoos 98) : « Utiliser » le consomme et débloque son système pour toujours. */
        const deblocageObjet=deblocageParObjetIdleV1_(a,item);
        const boutonDebloquer=deblocageObjet
          ?'<button type="button" class="soreal-idle-expand-button-v25" title="Utilise l’objet : il disparaît du sac et débloque '+idleHtml_(deblocageObjet.systeme)+' pour toujours" onclick="window.__utiliserObjetDeblocageIdleV1__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();">🔓 Utiliser</button>'
          :'';
        const boutonInstallerOs=((item.definitionId==='wandoos98'&&!deblocageObjet)||item.definitionId==='wandoosXl')
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'consumeWandoosCopy\',itemId:\''+idleHtml_(id)+'\'});window.__fermerDetailsObjetAdventureIdleV1__();">💾 Installer l’OS</button>'
          :'';
        /* A Giant Seed réutilisée (Yggdrasil débloqué) : max(1, ⌊L + L²/100⌋) graines, action méta consumeGiantSeed. */
        const boutonSemerGraine=(item.definitionId==='giantSeed'&&!item.locked&&!deblocageObjet)
          ?'<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__actionMetaIdleV130__({action:\'consumeGiantSeed\',itemId:\''+idleHtml_(id)+'\'});window.__fermerDetailsObjetAdventureIdleV1__();">🌱 Ajouter aux graines</button>'
          :'';
        const estVerrouille=Boolean(item.locked);
        const boutonVerrouiller=
          '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__basculerVerrouObjetAdventureIdleV165__(\''+idleHtml_(id)+'\','+(estVerrouille?'false':'true')+')">'+
          (estVerrouille?'🔓 Déverrouiller':'🔒 Verrouiller')+
          '</button>';
        const boutonComparer=
          '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__comparerObjetAdventureIdleV183__(\''+idleHtml_(id)+'\')">⚖️ Comparer</button>';
        const boutonSupprimer=
          '<button type="button" class="soreal-idle-expand-button-v25" '+
          (estVerrouille
            ?'disabled title="Déverrouille l’objet pour le supprimer"'
            :'onclick="window.__supprimerObjetAdventureIdleV165__(\''+idleHtml_(id)+'\');window.__fermerDetailsObjetAdventureIdleV1__();"')+
          '>🗑️ Supprimer</button>';
        const actionsObjetHtml=
          '<div class="soreal-idle-item-popup-actions-v165">'+
            (boutonEquiper||boutonDesequiper)+
            boutonVerrouiller+
            boutonDebloquer+
            boutonConsommer+
            boutonTransformer+
            boutonInstallerOs+
            boutonSemerGraine+
            boutonComparer+
            boutonSupprimer+
          '</div>';

        corps.innerHTML=
          '<div class="soreal-idle-window-title-v31">'+idleHtml_(item.name||item.nom||'Objet')+'</div>'+
          '<div class="soreal-idle-v138-details-level">Niveau '+niveau+'/100</div>'+
          statsHtml+
          actionsObjetHtml;
        root.style.display='block';
        positionnerPopupObjetAdventureIdleV1_(root);
        activerGlisserPopupObjetAdventureIdleV1_(root);
      }

      function positionnerPopupObjetAdventureIdleV1_(root){
        const largeur=root.offsetWidth||320;
        const hauteur=root.offsetHeight||160;
        const margeMax={
          left:Math.max(8,window.innerWidth-largeur-8),
          top:Math.max(8,window.innerHeight-hauteur-8)
        };
        if(!REG.idleItemPopupPositionV1_){
          REG.idleItemPopupPositionV1_={
            left:Math.max(8,Math.round((window.innerWidth-largeur)/2)),
            top:Math.max(8,Math.round((window.innerHeight-hauteur)/3))
          };
        }
        REG.idleItemPopupPositionV1_.left=Math.min(margeMax.left,Math.max(8,REG.idleItemPopupPositionV1_.left));
        REG.idleItemPopupPositionV1_.top=Math.min(margeMax.top,Math.max(8,REG.idleItemPopupPositionV1_.top));
        root.style.left=REG.idleItemPopupPositionV1_.left+'px';
        root.style.top=REG.idleItemPopupPositionV1_.top+'px';
      }

      function activerGlisserPopupObjetAdventureIdleV1_(root){
        const poignee=root&&root.querySelector('.soreal-idle-item-popup-drag-v1');
        if(!poignee||poignee.dataset.idleDragBoundV1==='1')return;
        poignee.dataset.idleDragBoundV1='1';
        let actif=false,departX=0,departY=0,origineLeft=0,origineTop=0;
        const surDeplacement=function(event){
          if(!actif)return;
          const point=event.touches?event.touches[0]:event;
          const largeur=root.offsetWidth,hauteur=root.offsetHeight;
          const nouveauLeft=Math.min(
            Math.max(8,window.innerWidth-largeur-8),
            Math.max(8,origineLeft+(point.clientX-departX))
          );
          const nouveauTop=Math.min(
            Math.max(8,window.innerHeight-hauteur-8),
            Math.max(8,origineTop+(point.clientY-departY))
          );
          REG.idleItemPopupPositionV1_={left:nouveauLeft,top:nouveauTop};
          root.style.left=nouveauLeft+'px';
          root.style.top=nouveauTop+'px';
          if(event.cancelable)event.preventDefault();
        };
        const surRelachement=function(){
          actif=false;
          document.removeEventListener('mousemove',surDeplacement);
          document.removeEventListener('mouseup',surRelachement);
          document.removeEventListener('touchmove',surDeplacement);
          document.removeEventListener('touchend',surRelachement);
        };
        const surDebut=function(event){
          if(event.target&&event.target.closest('.soreal-idle-item-popup-close-v1'))return;
          actif=true;
          const point=event.touches?event.touches[0]:event;
          departX=point.clientX;
          departY=point.clientY;
          origineLeft=root.offsetLeft;
          origineTop=root.offsetTop;
          document.addEventListener('mousemove',surDeplacement);
          document.addEventListener('mouseup',surRelachement);
          document.addEventListener('touchmove',surDeplacement,{passive:false});
          document.addEventListener('touchend',surRelachement);
          if(event.cancelable)event.preventDefault();
        };
        poignee.addEventListener('mousedown',surDebut);
        poignee.addEventListener('touchstart',surDebut,{passive:false});
      }

      let idleAdventureComparerPremierV183='';

      /*
       * Comparaison de deux objets (Norman, 2026-10-20) : les statistiques que les DEUX objets possèdent (PV, Puissance, Endurance, Regen, mêmes bonus spéciaux…) sont colorées : la plus haute en VERT, la plus faible en ROUGE,
       * pour voir d'un coup d'œil lequel est le meilleur ; deux valeurs égales et les statistiques que l'autre objet n'a pas restent blanches. Les valeurs comparées sont les valeurs brutes (data-cmp-val), jamais le texte abrégé.
       */
      function colorerStatsCommunesComparaisonIdleV1_(corps){
        const blocs=corps.querySelectorAll('.idle-compare-bloc-v1');
        if(blocs.length!==2)return;
        const lire=function(bloc){
          const m=Object.create(null);
          bloc.querySelectorAll('[data-cmp-cle]').forEach(function(l){
            const v=Number(l.getAttribute('data-cmp-val'));
            if(Number.isFinite(v)&&m[l.getAttribute('data-cmp-cle')]===undefined)m[l.getAttribute('data-cmp-cle')]={ligne:l,valeur:v};
          });
          return m;
        };
        const a=lire(blocs[0]),b=lire(blocs[1]);
        Object.keys(a).forEach(function(cle){
          if(!b[cle])return;
          const va=a[cle].valeur,vb=b[cle].valeur;
          if(va===vb)return;
          const marquer=function(entree,haut){
            const cible=entree.ligne.querySelector('.soreal-idle-v138-stat-value-v1');
            if(cible)cible.classList.add(haut?'idle-cmp-haut-v1':'idle-cmp-bas-v1');
          };
          marquer(a[cle],va>vb);
          marquer(b[cle],vb>va);
        });
      }

      function composerCorpsComparaisonIdleV1_(corps,firstId,secondId){
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
        const items=a&&Array.isArray(a.inventory)?a.inventory:[];
        const existe=function(id){return items.some(function(x){return String(x&&x.id)===id;});};
        if(!corps||!existe(firstId)||!existe(secondId))return false;
        afficherDetailsObjetAdventureIdleV138_(firstId);
        const firstHtml=corps.innerHTML;
        afficherDetailsObjetAdventureIdleV138_(secondId);
        const secondHtml=corps.innerHTML;
        corps.innerHTML='<div class="idle-compare-bloc-v1">'+firstHtml+'</div><div class="idle-compare-vs-v1" aria-hidden="true"><span>VS</span></div><div class="idle-compare-bloc-v1">'+secondHtml+'</div>';
        colorerStatsCommunesComparaisonIdleV1_(corps);
        return true;
      }

      let idleAdventureComparerEnAttenteV183=false;

      function fermerComparaisonObjetAdventureIdleV183_(){
        const second=document.getElementById('soreal-idle-v138-details-compare-v183');/* ancien second popup (plus créé : la comparaison tient dans une seule fenêtre) */
        if(second)second.remove();
        idleAdventureComparerPremierV183='';
        REG.idleComparaisonIdsV1=[];
        idleAdventureComparerEnAttenteV183=false;
        const primary=document.getElementById('soreal-idle-v138-details');
        if(primary){primary.classList.remove('idle-compare-v183');primary.style.maxHeight='';}
      }

      function comparerObjetAdventureIdleV183_(id){
        fermerComparaisonObjetAdventureIdleV183_();
        idleAdventureComparerPremierV183=String(id||'');
        idleAdventureComparerEnAttenteV183=true;
        /* Le popup cachait le sac (surtout sur téléphone) : on le masque pendant le choix du deuxième objet, il revient avec la comparaison. */
        const popup=document.getElementById('soreal-idle-v138-details');
        if(popup)popup.style.display='none';
        toastIdleV5_('Choisis maintenant le deuxième objet à comparer.');
      }

      function ouvrirComparaisonObjetAdventureIdleV183_(secondId){
        const firstId=String(idleAdventureComparerPremierV183||'');
        const second=String(secondId||'');
        if(!firstId||!second||firstId===second)return false;

        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps)return false;

        if(!composerCorpsComparaisonIdleV1_(corps,firstId,second))return false;
        REG.idleComparaisonIdsV1=[firstId,second];
        root.style.display='block';
        root.classList.add('idle-compare-v183');

        poserFenetreComparaisonIdleV1_(root,root.offsetLeft,root.offsetTop);
        activerGlisserPopupObjetAdventureIdleV1_(root);
        idleAdventureComparerEnAttenteV183=false;
        return true;
      }

      /* Taille et place de la fenêtre unique de comparaison (partagées par l'ouverture et la remise en place après un redessin de la page). */
      function poserFenetreComparaisonIdleV1_(root,gauche,haut){
        const marge=8;
        const largeur=Math.min(window.innerWidth<=600?window.innerWidth-marge*2:320,window.innerWidth-marge*2);
        root.style.display='block';
        root.classList.add('idle-compare-v183');
        root.style.width=largeur+'px';
        root.style.maxHeight=(window.innerHeight-marge*2)+'px';
        root.style.left=Math.max(marge,Math.min(gauche||marge,window.innerWidth-largeur-marge))+'px';
        root.style.top=Math.max(marge,Math.min(haut||marge,window.innerHeight-root.offsetHeight-marge))+'px';
        REG.idleItemPopupPositionV1_={left:parseInt(root.style.left,10)||marge,top:parseInt(root.style.top,10)||marge};
        activerGlisserPopupObjetAdventureIdleV1_(root);
      }

      /*
       * Redessin COMPLET de la page (le popup d'objet est dans la page : le redessin le remet fermé et vide) : la comparaison ou la fiche ouverte est remise en place, au même endroit, dans la même tâche
       * (règle n°4 d'AGENTS.md). Ce n'est fait que si l'utilisateur ne l'a pas refermée (la fermeture efface les identifiants mémorisés).
       */
      function restaurerFichesApresRedessinIdleV1_(){
        if(REG.idleMenuActifV28!=='aventure')return;
        const root=document.getElementById('soreal-idle-v138-details');
        const corps=document.getElementById('soreal-idle-v138-details-body');
        if(!root||!corps||(root.style.display!=='none'&&root.querySelector('.soreal-idle-item-popup-body-v1 *')))return;
        const pos=REG.idleItemPopupPositionV1_||{left:0,top:0};
        if(REG.idleComparaisonIdsV1.length===2){
          if(composerCorpsComparaisonIdleV1_(corps,REG.idleComparaisonIdsV1[0],REG.idleComparaisonIdsV1[1]))poserFenetreComparaisonIdleV1_(root,pos.left,pos.top);
          return;
        }
        const id=String(REG.idleFicheObjetOuverteIdV1||'');
        if(!id)return;
        afficherDetailsObjetAdventureIdleV138_(id);
        if(pos&&pos.left!=null){root.style.left=pos.left+'px';root.style.top=pos.top+'px';}
      }

      function fermerDetailsObjetAdventureIdleV1_(){
        fermerComparaisonObjetAdventureIdleV183_();
        const primary=document.getElementById('soreal-idle-v138-details');
        if(primary)primary.style.width='';
        afficherDetailsObjetAdventureIdleV138_('');
      }

      function clicTrashAdventureIdleV138_(){
        const a=REG.idleEtat&&aventureMetaIdleV47_(REG.idleEtat);
        if(a&&a.trash)recupererObjetTrashAdventureIdleV165_();
      }

      function rendreBonusEquipementAdventureIdleV1_(a){
        const stats=(a&&a.stats)||{};
        const power=idleNombre_(stats.power);
        const toughness=idleNombre_(stats.toughness);
        const hp=idleNombre_(stats.hp);
        const regen=idleNombre_(stats.regen);
        const specials=stats.specials||{};

        const lignes=
          (power>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">Puissance</span><b>+'+formatGrandNombreIdleV70_(power)+'</b></div>':'')+
          (toughness>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Endurance</span><b>+'+formatGrandNombreIdleV70_(toughness)+'</b></div>':'')+
          (hp>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-power-v1">PV Max</span><b>+'+formatGrandNombreIdleV70_(hp)+'</b></div>':'')+
          (regen>0?'<div class="soreal-idle-v138-details-stat"><span class="sb-toughness-v1">Regen PV/s</span><b>+'+formatGrandNombreIdleV70_(regen,2)+'</b></div>':'');

        const specialLignes=REG.IDLE_SPECIAL_BONUS_TYPES_V1_
          .map(function(e){
            const val=idleNombre_(specials[e[0]]);
            return val>0?'<div class="soreal-idle-v138-details-stat"><span>'+e[1]+'</span><b>+'+formatGrandNombreIdleV70_(val,2)+'%</b></div>':'';
          })
          .join('');
        const specialHtml=specialLignes
          ?'<div class="soreal-idle-window-title-v31" style="margin-top:10px;font-size:.95em">Special Bonuses</div>'+
            '<div class="soreal-idle-v138-details-stats">'+specialLignes+'</div>'
          :'';

        const boostsHtml=(power>0||toughness>0)
          ?'<div class="soreal-idle-window-title-v31" style="margin-top:10px;font-size:.95em">Player Stat Boosts</div>'+
            '<div class="soreal-idle-v138-details-stats">'+
              (power>0?'<div class="soreal-idle-v138-details-stat"><span>Attack</span><b>'+formatGrandNombreIdleV70_(power)+'%</b></div>':'')+
              (toughness>0?'<div class="soreal-idle-v138-details-stat"><span>Defense</span><b>'+formatGrandNombreIdleV70_(toughness)+'%</b></div>':'')+
            '</div>'
          :'';

        return '<div class="soreal-idle-section-v8"><div class="soreal-idle-window-title-v31">📊 Equipment Bonuses</div>'+
          (lignes
            ?'<div class="soreal-idle-v138-details-stats">'+lignes+'</div>'
            :'<div style="opacity:.7;padding:8px 4px">Équipe un objet pour voir ses bonus ici.</div>'
          )+
          specialHtml+
          boostsHtml+
        '</div>';
      }

      function rendreCoffreAdventureIdleV1_(slots){
        /* ANTI-SPOIL (règle n°2) : seules les cases déjà découvertes sont listées (ni « ??? », ni total). */
        slots=slots.filter(function(s){return s&&s.decouvert;});
        const occupees=slots.filter(function(s){return s&&s.occupe;}).length;
        const grille=grilleCoffreAdventureIdleV1_(slots);
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-282 */
        const ouvert=idleCoffreOuvertV1_();
        return rendreCadreCoffreAdventureIdleV1_(grille,occupees,ouvert);
      }

      /* Grille du coffre (cases + pagination), filtrée par la recherche. */
      function grilleCoffreAdventureIdleV1_(slots){
        slots=slots.filter(function(s){return s&&s.decouvert;});
        const requete=normaliserRechercheIdleV1_(REG.idleRechercheCoffreV1);
        if(requete)slots=slots.filter(function(s){return caseCoffreCorrespondIdleV1_(s,requete);});
        if(requete&&!slots.length)return '<div class="soreal-idle-note-v4" style="padding:8px 2px">Aucun objet du coffre ne correspond à « '+idleHtml_(REG.idleRechercheCoffreV1.trim())+' ».</div>';
        const totalPagesCoffre=Math.max(1,Math.ceil(slots.length/REG.IDLE_PAGINATION_TAILLE_V1));
        if(REG.idlePageCoffreV1>totalPagesCoffre)REG.idlePageCoffreV1=totalPagesCoffre;
        const debutPageCoffre=(REG.idlePageCoffreV1-1)*REG.IDLE_PAGINATION_TAILLE_V1;
        const slotsPage=slots.slice(debutPageCoffre,debutPageCoffre+REG.IDLE_PAGINATION_TAILLE_V1);

        /* Norman (2026-10-01) : cases regroupées (zones, titans, cœurs, Looty, pendentifs...) avec un titre de section ; seules les cases déjà découvertes sont listées, donc jamais de titre de groupe encore inconnu. */
        let groupePrecedent=debutPageCoffre>0&&slots[debutPageCoffre-1]?String(slots[debutPageCoffre-1].groupeNom||''):null;
        /*
         * Mannequins (Norman, 2026-10-03 : « chaque item de set comme s'il était équipé : tête, torse, jambes, bottes, comme si l'armure était posée sur un mannequin ; les sets côte à côte, et en
         * dessous quand la ligne est occupée »). Les pièces d'un même set se rangent comme sur le personnage : colonne de gauche = tête, torse, jambes, bottes ; colonne de droite = arme puis
         * accessoires du set. Les cases gardent leur taille. Anti-spoil : seules les pièces déjà découvertes existent ; une pièce inconnue ne laisse qu'un vide, jamais une case grisée.
         */
        /*
         * Filtre de butin amélioré (Norman, 2026-10-03 : « quand on achète le filtre de loot spécial, c'est dans le coffre qu'on doit pouvoir désactiver un objet en particulier »). Une fois acheté, chaque
         * case du coffre porte un petit bouton : un objet filtré n'est plus ramassé dans la zone en cours (chaque zone a son filtre). Il n'existe QUE pour les objets déjà découverts (les seuls du coffre).
         */
        const iaFiltre=REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.inventoryAuto;
        const filtreAmeliore=Boolean(iaFiltre&&iaFiltre.unlocked&&iaFiltre.unlocked.lootFilterImproved);
        const defsFiltrees=filtreAmeliore&&iaFiltre.lootFilter&&Array.isArray(iaFiltre.lootFilter.items)?iaFiltre.lootFilter.items:[];
        function boutonFiltre(s){
          if(!filtreAmeliore)return '';
          const filtre=defsFiltrees.indexOf(s.definitionId)!==-1;
          return '<button type="button" class="soreal-idle-coffre-filtre-v1'+(filtre?' actif':'')+'" '+
            'title="'+(filtre?'Filtré : cet objet n’est plus ramassé dans cette zone. Clique pour le ramasser de nouveau.':'Clique pour ne plus ramasser cet objet dans cette zone.')+'" '+
            'onclick="event.stopPropagation();window.__filtrerObjetCoffreIdleV1__(\''+idleHtml_(String(s.definitionId))+'\',this)">'+(filtre?'🚫':'🧹')+'</button>';
        }
        function carteCoffre(s){
          if(!s.occupe){
            return '<div class="soreal-idle-collection-card-v1">'+boutonFiltre(s)+
              '<div class="soreal-idle-collection-card-icon-v1"><span>⬜</span></div>'+
              '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(s.name)+'</div>'+
            '</div>';
          }
          const item=s.item||{};
          const pseudoItem={set:s.set,slot:s.slot,name:s.name,level:100,definitionId:s.definitionId,wikiItemId:s.wikiItemId,kind:item.kind};
          const rareteClasse=idleRareteClasseObjetAdventureIdleV1_(item);
          const clePopup='coffre:'+String(s.definitionId);
          enregistrerObjetPopupIdleV1_(clePopup,Object.assign({},item,{name:item.name||s.name}),'coffre');
          return '<div class="soreal-idle-collection-card-v1 maxed'+(rareteClasse?' '+rareteClasse:'')+'" '+
            'data-popup-objet-v1="'+idleHtml_(clePopup)+'" '+
            'onclick="window.__consulterObjetIdleV1__(\''+idleHtml_(clePopup)+'\',this)" '+
            'title="Clique pour voir les statistiques (et reprendre l’objet dans l’inventaire)">'+
            /* Coffre épuré (Norman, 2026-10-02) : l'image prend toute la case ; seuls « 100 », le ✔ et le nom (par-dessus l'image) restent. */
            '<div class="soreal-idle-collection-check-v1" title="Niveau maximum">✔</div>'+boutonFiltre(s)+
            '<div class="soreal-idle-collection-card-icon-v1">'+iconeBaseObjetAdventureIdleV138_(pseudoItem)+'</div>'+
            '<div class="soreal-idle-collection-card-level-v1" title="Niveau 100/100">100</div>'+
            '<div class="soreal-idle-collection-card-name-v1">'+idleHtml_(s.name)+'</div>'+
          '</div>';
        }
        const LIGNE_ARMURE={head:1,chest:2,legs:3,boots:4};
        function mannequin(pieces){
          let autres=1;
          const cases=pieces.map(function(p){
            let colonne=2,ligne;
            if(LIGNE_ARMURE[p.slot]){colonne=1;ligne=LIGNE_ARMURE[p.slot];}
            else if(p.slot==='weapon')ligne=1;
            else{autres+=1;ligne=autres;}
            return '<div style="grid-column:'+colonne+';grid-row:'+ligne+'">'+carteCoffre(p)+'</div>';
          }).join('');
          return '<div class="soreal-idle-coffre-mannequin-v1">'+cases+'</div>';
        }
        /*
         * Cadres thématiques (Norman, 2026-10-03 : « les sets côte à côte, et en dessous seulement quand il n'y a plus de place ; un cadre dédié à chaque set qui rappelle la zone d'où il vient, avec ses couleurs et
         * ses décorations ; un thème par set »). Une zone = un cadre (son set posé en mannequin + ses objets) ; pour les titans, un cadre par set puis un cadre pour leurs autres objets. Les cadres se rangent côte à côte
         * et passent à la ligne quand la place manque (centrés sur téléphone). Le thème (couleurs, décor) est choisi par l'identifiant du set, voir « data-theme-set-v1 » dans soreal-idle-ui.css.
         */
        function cadreThematique(cle,titre,corps){
          return '<section class="soreal-idle-coffre-cadre-v1" data-theme-set-v1="'+idleHtml_(cle)+'">'+
            '<header class="soreal-idle-coffre-cadre-titre-v1"><i class="soreal-idle-coffre-cadre-deco-v1" aria-hidden="true"></i><span>'+idleHtml_(titre)+'</span></header>'+
            '<div class="soreal-idle-coffre-cadre-corps-v1">'+corps+'</div>'+
          '</section>';
        }
        const groupesCoffre=[];
        slotsPage.forEach(function(s){
          const nomGroupe=String(s.groupeNom||'');
          let g=groupesCoffre[groupesCoffre.length-1];
          if(!g||g.nom!==nomGroupe){g={nom:nomGroupe,groupe:String(s.groupe||''),sets:[],libres:[]};groupesCoffre.push(g);}
          if(s.set){
            let st=g.sets.find(function(x){return x.id===s.set;});
            if(!st){st={id:s.set,nom:s.setName||nomGroupe,pieces:[]};g.sets.push(st);}
            st.pieces.push(s);
          }else g.libres.push(s);
        });
        let html='';
        const libres=function(liste){return liste.length?'<div class="soreal-idle-coffre-libres-v1">'+liste.map(carteCoffre).join('')+'</div>':'';};
        groupesCoffre.forEach(function(g){
          if(g.groupe==='zone'){
            const cle=g.sets.length?g.sets[0].id:'ciel';
            /* Les accessoires sans set se rangent SOUS l'arme, dans la 2e colonne du mannequin (Norman, 2026-10-11 : « les accessoires en dessous de l'arme plutôt qu'à sa droite : 2 colonnes au lieu de 3 »). */
            const corpsZone=g.sets.length
              ?g.sets.map(function(st,i){return mannequin(i===0?st.pieces.concat(g.libres):st.pieces);}).join('')
              :libres(g.libres);
            html+=cadreThematique(cle,g.nom,corpsZone);
          }else{
            g.sets.forEach(function(st){html+=cadreThematique(st.id,st.nom,mannequin(st.pieces));});
            if(g.libres.length)html+=cadreThematique(g.groupe||'autre',g.nom,libres(g.libres));
          }
        });
        return '<div class="soreal-idle-collection-grid-v1 soreal-idle-coffre-grille-v1 soreal-idle-coffre-mannequins-v1">'+html+'</div>'+
        rendrePaginationIdleV1_(REG.idlePageCoffreV1,totalPagesCoffre,'window.__changerPageCoffreV1__');
      }

      /*
       * Le Coffre est un coffre à pattes, avec des dents et une langue, qui mange les objets pour les ranger (Norman, 2026-10-10 : « un coffre qui fait référence à Discworld »). Dessin original en SVG ; sa gueule est la zone de
       * dépôt. Il croque (couvercle qui claque, corps qui gonfle, bulle) quand un objet est déposé : le drapeau window.__bagageAvaleIdleV1 survit au redessin de la page. Animations : voir « Inventaire v2 » dans soreal-idle-itopod.css.
       */
      const BAGAGE_SVG_IDLE_V1='<svg viewBox="0 0 320 260" aria-hidden="true" focusable="false"><defs>'+
        '<linearGradient id="bgBois" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9783a"/><stop offset=".55" stop-color="#8a5122"/><stop offset="1" stop-color="#5f3414"/></linearGradient>'+
        '<linearGradient id="bgBoisC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cf8d4c"/><stop offset="1" stop-color="#8f5626"/></linearGradient>'+
        '<linearGradient id="bgCuivre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset=".5" stop-color="#d79a1f"/><stop offset="1" stop-color="#8a5a08"/></linearGradient>'+
        '<linearGradient id="bgLangue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8fa8"/><stop offset="1" stop-color="#d94b6d"/></linearGradient>'+
        '<radialGradient id="bgGueule" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#5a0f1c"/><stop offset="1" stop-color="#1c0309"/></radialGradient></defs>'+
        '<ellipse cx="160" cy="246" rx="120" ry="11" fill="rgba(0,0,0,.45)"/>'+
        '<g><g class="bg-patte"><rect x="62" y="214" width="16" height="26" rx="6" fill="#6a3a16"/><ellipse cx="68" cy="241" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte bg-b"><rect x="104" y="218" width="16" height="24" rx="6" fill="#6a3a16"/><ellipse cx="110" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte"><rect x="132" y="220" width="16" height="22" rx="6" fill="#6a3a16"/><ellipse cx="138" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte bg-b"><rect x="172" y="220" width="16" height="22" rx="6" fill="#6a3a16"/><ellipse cx="178" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte"><rect x="200" y="218" width="16" height="24" rx="6" fill="#6a3a16"/><ellipse cx="206" cy="243" rx="14" ry="6" fill="#4a280e"/></g>'+
        '<g class="bg-patte bg-b"><rect x="242" y="214" width="16" height="26" rx="6" fill="#6a3a16"/><ellipse cx="248" cy="241" rx="14" ry="6" fill="#4a280e"/></g></g>'+
        '<g class="bg-corps"><path d="M44 130 L276 130 L270 100 L50 100 Z" fill="url(#bgGueule)"/>'+
        '<path d="M40 128 H280 V214 Q280 228 266 228 H54 Q40 228 40 214 Z" fill="url(#bgBois)" stroke="#3a1d08" stroke-width="4"/>'+
        '<path d="M40 160 H280 M40 192 H280" stroke="#4a2509" stroke-width="3" opacity=".55"/><path d="M96 130 V228 M224 130 V228" stroke="url(#bgCuivre)" stroke-width="12"/>'+
        '<circle cx="96" cy="150" r="3.5" fill="#6a4308"/><circle cx="96" cy="206" r="3.5" fill="#6a4308"/><circle cx="224" cy="150" r="3.5" fill="#6a4308"/><circle cx="224" cy="206" r="3.5" fill="#6a4308"/>'+
        '<rect x="140" y="166" width="40" height="34" rx="6" fill="url(#bgCuivre)" stroke="#6a4308" stroke-width="3"/><circle cx="160" cy="180" r="5" fill="#3a2300"/><rect x="158" y="182" width="4" height="10" fill="#3a2300"/>'+
        '<g fill="#fffbe8" stroke="#6a5a3a" stroke-width="2" stroke-linejoin="round"><path d="M52 130 l10 -20 l10 20z"/><path d="M76 130 l9 -17 l9 17z"/><path d="M102 130 l9 -18 l9 18z"/><path d="M200 130 l9 -18 l9 18z"/><path d="M226 130 l9 -17 l9 17z"/><path d="M248 130 l11 -22 l11 22z"/></g>'+
        '<g class="bg-langue"><path d="M148 126 C144 168 150 208 176 214 C202 208 208 168 204 126 Z" fill="url(#bgLangue)" stroke="#8f2a45" stroke-width="3" stroke-linejoin="round"/><path d="M176 134 L176 196" stroke="#b83a58" stroke-width="3" stroke-linecap="round"/><ellipse cx="164" cy="168" rx="4" ry="9" fill="#ffb3c4" opacity=".55"/></g>'+
        '<g class="bg-couvercle"><path d="M40 126 V92 Q40 52 90 48 H230 Q280 52 280 92 V126 Z" fill="url(#bgBoisC)" stroke="#3a1d08" stroke-width="4"/><path d="M54 74 Q160 52 266 74" stroke="#5a3010" stroke-width="3" fill="none" opacity=".5"/>'+
        '<path d="M96 52 V126 M224 52 V126" stroke="url(#bgCuivre)" stroke-width="12"/><circle cx="96" cy="86" r="3.5" fill="#6a4308"/><circle cx="224" cy="86" r="3.5" fill="#6a4308"/>'+
        '<g fill="#fffbe8" stroke="#6a5a3a" stroke-width="2" stroke-linejoin="round"><path d="M56 126 l10 20 l10 -20z"/><path d="M80 126 l9 17 l9 -17z"/><path d="M108 126 l9 19 l9 -19z"/><path d="M130 126 l8 14 l8 -14z"/><path d="M174 126 l8 14 l8 -14z"/><path d="M198 126 l9 19 l9 -19z"/><path d="M228 126 l9 17 l9 -17z"/><path d="M250 126 l10 20 l10 -20z"/></g></g></g></svg>';

      const BAGAGE_OBJETS_IDLE_V1=['🗡️','🛡️','👢','💍','🪖','📿','🧪'];

      const BAGAGE_CRIS_IDLE_V1=['*Gloups !*','*Miam.*','*Rrrot.*','*Crounch !*','*Encore.*'];

      /* Cadre du coffre : titre repliable, case de dépôt, champ de recherche et grille. */
      function rendreCadreCoffreAdventureIdleV1_(grille,occupees,ouvert){
        /* Un vrai coffre (Norman, 2026-10-02 : « ça fait classeur ») : bois, bandes de fer, couvercle ; voir .soreal-idle-coffre-v1 (soreal-idle-ui.css). */
        return '<div class="soreal-idle-section-v8 soreal-idle-coffre-v1'+(ouvert?' ouvert':'')+'">'+
          '<div class="soreal-idle-window-title-v31 soreal-idle-coffre-titre-v1" '+
            'onclick="window.__toggleCoffreOuvertAdventureIdleV1__()" '+
            'role="button" tabindex="0" aria-expanded="'+(ouvert?'true':'false')+'">'+
            '<span><i class="dsn-v1 dsn-coffre" aria-hidden="true"></i> Coffre ('+occupees+')</span>'+
            '<span class="soreal-idle-coffre-chevron-v1">'+(ouvert?'▲':'▼')+'</span>'+
          '</div>'+
          '<div class="soreal-idle-v138-cube-slot" data-idle-coffre-drop-v180 '+
            'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
            'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
            'ondrop="window.__deposerSurCoffreAdventureIdleV1__(event)" '+
            'onclick="window.__clicCoffreAdventureIdleV1__()"'+
            '>'+
            '<div class="bg-bagage-v1'+(Date.now()-(window.__bagageAvaleIdleV1||0)<1300?' croque':'')+'">'+
              '<span class="bg-bulle-v1">'+BAGAGE_CRIS_IDLE_V1[Math.floor(Math.random()*BAGAGE_CRIS_IDLE_V1.length)]+'</span>'+
              '<span class="bg-objet-v1">'+BAGAGE_OBJETS_IDLE_V1[Math.floor(Math.random()*BAGAGE_OBJETS_IDLE_V1.length)]+'</span>'+
              BAGAGE_SVG_IDLE_V1+
            '</div>'+
            '<div class="bg-texte-v1"><b>Il mange les objets pour les ranger.</b>'+
              '<span>Glisse ici un objet réellement maxé : il croque, avale, rote, puis le range quelque part là-dedans. Ne lui mets pas les doigts.</span></div>'+
          '</div>'+
          (ouvert?'<div style="margin-top:10px">'+
            '<input type="search" id="sorealIdleCoffreRechercheV1" class="soreal-idle-coffre-recherche-v1" placeholder="🔎 Rechercher : un nom, ou une stat (Magic Power…)" value="'+idleHtml_(REG.idleRechercheCoffreV1)+'" oninput="window.__rechercheCoffreV1__(this.value)" autocomplete="off" spellcheck="false">'+
            '<div id="sorealIdleCoffreGrilleV1">'+grille+'</div>'+
          '</div>':'')+
        '</div>';
      }

      function toggleCoffreOuvertAdventureIdleV1_(){
        const actuel=idleCoffreOuvertV1_();
        if(!actuel){
          jouerSonOuvertureCoffreIdleV1_();
        }else{
          jouerSonFermetureCoffreIdleV197_();
        }
        try{
          localStorage.setItem('soreal_idle_coffre_ouvert_v1',actuel?'0':'1');
        }catch(e){}
        const root=document.querySelector('.soreal-idle-page-root-v28');
        if(root&&REG.idleEtat)rafraichirMenuRacineIdleV28_();
      }

      /*
       * Croque joué au DÉPÔT, sur le coffre affiché (Norman, 2026-10-20 : « il n'a l'animation que quand il est ouvert et qu'on y place un objet ; s'il est fermé, l'animation ne se fait pas »).
       * Avant, la classe « croque » n'était posée qu'au redessin du cadre (drapeau __bagageAvaleIdleV1) : un Coffre ouvert change de contenu donc redessine, un Coffre refermé non. La classe est
       * maintenant posée tout de suite sur chaque Bagage de la page (on la retire puis on la remet pour relancer l'animation), et retirée après 1,3 s ; le drapeau reste pour un redessin en cours de route.
       */
      function jouerCroqueCoffreIdleV1_(){
        const bagages=document.querySelectorAll('.bg-bagage-v1');
        for(let i=0;i<bagages.length;i+=1){
          const b=bagages[i];
          b.classList.remove('croque');
          void b.offsetWidth;
          b.classList.add('croque');
          clearTimeout(b.__croqueFinV1);
          b.__croqueFinV1=setTimeout(function(){b.classList.remove('croque');},1300);
        }
      }
      window.__jouerCroqueCoffreIdleV1__=jouerCroqueCoffreIdleV1_;

      function deposerSurCoffreAdventureIdleV1_(event){
        if(event){event.preventDefault();event.stopPropagation();}
        const id=idSourceAdventureIdleV138_(event);
        nettoyerEtatDragAdventureIdleV138_();
        if(id){window.__bagageAvaleIdleV1=Date.now();jouerCroqueCoffreIdleV1_();actionAdventureIdleV47_({action:'coffreDeposer',id:String(id)});}
      }

      function clicCoffreAdventureIdleV1_(){
        toggleCoffreOuvertAdventureIdleV1_();
      }

      function retirerDuCoffreAdventureIdleV1_(id){
        if(!id)return;
        actionAdventureIdleV47_({action:'coffreRetirer',id:String(id)});
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-284 */
      function urlImageCubeInfiniAdventureIdleV1_(tier){
        const n=Math.max(0,idleEntier_(tier));
        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-285 */
        return '/api/idle/media/item?wikiItemId=100&tier='+n+'&name='+encodeURIComponent('THE CUBE');
      }

      /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-286 */
      function rendreSlotCubeInfiniAdventureIdleV1_(cube,cubeTier){
        if(!cube||!cube.unlocked)return '';

        const tier=idleEntier_(cubeTier&&cubeTier.tier);
        const titre=idleHtml_(
          'Cube de l’infini · Palier '+tier+
          ' · Puissance '+formatGrandNombreIdleV70_(cube.power||0)+
          ' · Endurance '+formatGrandNombreIdleV70_(cube.toughness||0)
        );

        return '<div class="soreal-idle-v138-slot soreal-idle-v138-slot-cube" data-idle-cube-drop-v180 data-soreal-longpress="idle-cube" '+
          'ondragover="window.__survolCibleAdventureIdleV138__(event)" '+
          'ondragleave="window.__quitterCibleAdventureIdleV138__(event)" '+
          'ondrop="window.__deposerSurCubeAdventureIdleV138__(event)" '+
          'onclick="window.__clicCubeAdventureIdleV138__(event)"'+
          '>'+
          '<div class="soreal-idle-v138-slot-icon" title="'+titre+'">'+
            '<img src="'+idleHtml_(urlImageCubeInfiniAdventureIdleV1_(tier))+'" alt="" loading="lazy" '+
            'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'block\'">'+
            '<span style="display:none">🧊</span>'+
          '</div>'+
        '</div>';
      }

      function enregistrerPseudoIdleV1_(){
        const champ=document.getElementById('sorealIdlePseudoChampV1');
        if(!champ||!SOREAL_SESSION)return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              if(REG.idleEtat)REG.idleEtat.identite=Object.assign({},REG.idleEtat.identite||{},res);
              toastIdleV5_('✅ Pseudo enregistré : '+(res.nomAffiche||res.pseudo||''));
              const root=document.querySelector('.soreal-idle-page-root-v28');
              if(root&&REG.idleEtat&&REG.idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
            }else{
              toastIdleV5_((res&&res.message)||'Ce pseudo ne peut pas être utilisé.');
            }
          })
          .withFailureHandler(function(e){
            toastIdleV5_((e&&e.message)||'Impossible d’enregistrer le pseudo.');
          })
          .definirPseudoSorealIdle(SOREAL_SESSION,champ.value);
      }

      /* Accès public (administrateur) : les personnes connectées par Google peuvent jouer ; la liste montre leur adresse et leur nom Google. */
      function basculerAccesPublicIdleV1_(){
        if(!REG.idleEtat||!REG.idleEtat.reglages||!SOREAL_SESSION)return;
        const voulu=!REG.idleEtat.reglages.accesPublic;
        if(voulu&&!window.confirm('Ouvrir SOREAL IDLE à toute personne qui se connecte avec un compte Google, sans passer par APP / TV ?'))return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              REG.idleEtat.reglages.accesPublic=Boolean(res.accesPublic);
              toastIdleV5_(res.accesPublic?'🌍 Accès public ouvert (connexion Google).':'🔒 Accès public fermé.');
              const root=document.querySelector('.soreal-idle-page-root-v28');
              if(root&&REG.idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
            }else{
              toastIdleV5_((res&&res.message)||'Impossible de changer l’accès public.');
            }
          })
          .withFailureHandler(function(e){
            toastIdleV5_((e&&e.message)||'Impossible de changer l’accès public.');
          })
          .definirAccesPublicSorealIdle(SOREAL_SESSION,voulu);
      }

      function chargerJoueursGoogleIdleV1_(){
        const zone=document.getElementById('sorealIdleJoueursGoogleV1');
        if(!zone||!SOREAL_SESSION)return;
        zone.textContent='Chargement…';
        google.script.run
          .withSuccessHandler(function(res){
            const liste=res&&res.ok&&Array.isArray(res.joueurs)?res.joueurs:[];
            zone.innerHTML=liste.length
              ?liste.map(function(x){
                return '<div style="padding:6px 0;border-top:1px solid rgba(129,176,255,.15);font-size:14px;color:#dce5f3">'+
                  '<b>'+idleHtml_(x.pseudo||'(pas encore de pseudo)')+'</b> · '+idleHtml_(x.nomGoogle||'')+
                  '<div style="color:#7f8aa4;font-size:13px">'+idleHtml_(x.email)+'</div></div>';
              }).join('')
              :'<div style="font-size:14px;color:#7f8aa4">Aucun joueur connecté par Google pour l’instant.</div>';
          })
          .withFailureHandler(function(e){
            zone.textContent=(e&&e.message)||'Impossible de charger la liste.';
          })
          .listerJoueursExternesSorealIdle(SOREAL_SESSION);
      }

      /* Interrupteur d'accès à SOREAL IDLE (administrateur seulement) : ouvre / ferme l'accès de tous les comptes connectés. */
      function basculerAccesOuvertIdleV1_(){
        if(!REG.idleEtat||!REG.idleEtat.reglages||!SOREAL_SESSION)return;
        const voulu=!REG.idleEtat.reglages.accesOuvert;
        if(voulu&&!window.confirm('Ouvrir SOREAL IDLE à toutes les personnes qui ont le trophée Assiduité de bronze (même celles qui ne travaillent plus ici) ?'))return;
        google.script.run
          .withSuccessHandler(function(res){
            if(res&&res.ok){
              REG.idleEtat.reglages.accesOuvert=Boolean(res.accesOuvert);
              toastIdleV5_(res.accesOuvert?'🔓 Accès ouvert aux détenteurs du trophée Assiduité de bronze.':'🔒 Accès fermé : SOREAL IDLE est caché à tout le monde.');
              const root=document.querySelector('.soreal-idle-page-root-v28');
              if(root&&REG.idleMenuActifV28==='parametres')rafraichirMenuRacineIdleV28_();
            }else{
              toastIdleV5_((res&&res.message)||'Impossible de changer l’accès.');
            }
          })
          .withFailureHandler(function(e){
            toastIdleV5_((e&&e.message)||'Impossible de changer l’accès.');
          })
          .definirAccesOuvertSorealIdle(SOREAL_SESSION,voulu);
      }

  Object.assign(REG,{
    changerPartieDevIdleV1_:changerPartieDevIdleV1_,
    copierPartieADevIdleV1_:copierPartieADevIdleV1_,
    idleHtml_:idleHtml_,
    toastIdleV5_:toastIdleV5_,
    installerRaccourcisReprendreIdleV1_:installerRaccourcisReprendreIdleV1_,
    rendreSetsIdleV25_:rendreSetsIdleV25_,
    iconeObjetAdventureIdleV138_:iconeObjetAdventureIdleV138_,
    idleRareteClasseObjetAdventureIdleV1_:idleRareteClasseObjetAdventureIdleV1_,
    rendreSlotPaperdollAdventureIdleV138_:rendreSlotPaperdollAdventureIdleV138_,
    rendreAccessoiresAdventureIdleV138_:rendreAccessoiresAdventureIdleV138_,
    rendreCarteSacAdventureIdleV138_:rendreCarteSacAdventureIdleV138_,
    rendreGrilleSacAdventureIdleV1_:rendreGrilleSacAdventureIdleV1_,
    deposerSurEmplacementVideSacAdventureIdleV1_:deposerSurEmplacementVideSacAdventureIdleV1_,
    elementObjetGesteAdventureIdleV196_:elementObjetGesteAdventureIdleV196_,
    popupDetailsObjetAdventureIdleOuvertV207_:popupDetailsObjetAdventureIdleOuvertV207_,
    cibleDansPopupDetailsObjetAdventureIdleV207_:cibleDansPopupDetailsObjetAdventureIdleV207_,
    gestesAchetesIdleV1_:gestesAchetesIdleV1_,
    installerGestesInventaireAdventureIdleV196_:installerGestesInventaireAdventureIdleV196_,
    survolOccupeIdleV1_:survolOccupeIdleV1_,
    fermerSurvolIdleV1_:fermerSurvolIdleV1_,
    survolCibleAdventureIdleV138_:survolCibleAdventureIdleV138_,
    quitterCibleAdventureIdleV138_:quitterCibleAdventureIdleV138_,
    equiperParIdAdventureIdleV138_:equiperParIdAdventureIdleV138_,
    deposerSurCubeAdventureIdleV138_:deposerSurCubeAdventureIdleV138_,
    clicCubeAdventureIdleV138_:clicCubeAdventureIdleV138_,
    supprimerObjetAdventureIdleV165_:supprimerObjetAdventureIdleV165_,
    basculerVerrouObjetAdventureIdleV165_:basculerVerrouObjetAdventureIdleV165_,
    deposerSurTrashAdventureIdleV138_:deposerSurTrashAdventureIdleV138_,
    rendreTrashAdventureIdleV165_:rendreTrashAdventureIdleV165_,
    statsHtmlObjetAdventureIdleV138_:statsHtmlObjetAdventureIdleV138_,
    afficherDetailsObjetAdventureIdleV138_:afficherDetailsObjetAdventureIdleV138_,
    activerGlisserPopupObjetAdventureIdleV1_:activerGlisserPopupObjetAdventureIdleV1_,
    composerCorpsComparaisonIdleV1_:composerCorpsComparaisonIdleV1_,
    fermerComparaisonObjetAdventureIdleV183_:fermerComparaisonObjetAdventureIdleV183_,
    comparerObjetAdventureIdleV183_:comparerObjetAdventureIdleV183_,
    restaurerFichesApresRedessinIdleV1_:restaurerFichesApresRedessinIdleV1_,
    fermerDetailsObjetAdventureIdleV1_:fermerDetailsObjetAdventureIdleV1_,
    clicTrashAdventureIdleV138_:clicTrashAdventureIdleV138_,
    rendreBonusEquipementAdventureIdleV1_:rendreBonusEquipementAdventureIdleV1_,
    rendreCoffreAdventureIdleV1_:rendreCoffreAdventureIdleV1_,
    grilleCoffreAdventureIdleV1_:grilleCoffreAdventureIdleV1_,
    toggleCoffreOuvertAdventureIdleV1_:toggleCoffreOuvertAdventureIdleV1_,
    deposerSurCoffreAdventureIdleV1_:deposerSurCoffreAdventureIdleV1_,
    clicCoffreAdventureIdleV1_:clicCoffreAdventureIdleV1_,
    retirerDuCoffreAdventureIdleV1_:retirerDuCoffreAdventureIdleV1_,
    rendreSlotCubeInfiniAdventureIdleV1_:rendreSlotCubeInfiniAdventureIdleV1_,
    enregistrerPseudoIdleV1_:enregistrerPseudoIdleV1_,
    basculerAccesPublicIdleV1_:basculerAccesPublicIdleV1_,
    chargerJoueursGoogleIdleV1_:chargerJoueursGoogleIdleV1_,
    basculerAccesOuvertIdleV1_:basculerAccesOuvertIdleV1_
  });
})();
