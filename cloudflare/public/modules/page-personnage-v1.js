/*
 * SOREAL IDLE — page Personnage et profil (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Extrait tel quel (même code) ; les aides du monolithe sont lues à l'exécution par window.__SOREAL_IDLE_UI_PARTAGE_V1__
 * (jamais au chargement : ce module se charge AVANT le monolithe). Expose window.__SOREAL_IDLE_PAGE_PERSONNAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PAGE_PERSONNAGE_V1__)return;

      function entetePageIdleV28_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.entetePageIdleV28_.apply(null,arguments);}
      function idleHtml_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleHtml_.apply(null,arguments);}
      function formatGrandNombreIdleV70_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.formatGrandNombreIdleV70_.apply(null,arguments);}
      function idleEntier_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleEntier_.apply(null,arguments);}
      function formaterDureeJeuIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.formaterDureeJeuIdleV1_.apply(null,arguments);}
      function idleNombre_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleNombre_.apply(null,arguments);}

      function dateIdleV25_(iso){
        const d=new Date(iso||'');
        return Number.isNaN(d.getTime())
          ?'—'
          :d.toLocaleDateString('fr-BE',{
              day:'2-digit',
              month:'2-digit',
              year:'numeric'
            });
      }

      function dureeProfilIdleV25_(p){
        const jours=Math.floor(idleNombre_(p&&p.ageJours));
        const heures=Math.floor(idleNombre_(p&&p.ageHeures));
        const mois=Math.floor(idleNombre_(p&&p.ageMois));
        if(mois>=1)return mois+' mois · '+jours+' jours';
        if(jours>=1)return jours+' jours · '+heures+' h';
        return heures+' h';
      }

      function rendreProfilIdleV26_(j){
        const joueur=
          j && typeof j==='object'
            ?j
            :{};

        const profil=
          joueur.profil &&
          typeof joueur.profil==='object'
            ?joueur.profil
            :{};

        const stats=
          profil.stats &&
          typeof profil.stats==='object'
            ?profil.stats
            :{};

        const prochain=
          joueur.prochainPalier &&
          typeof joueur.prochainPalier==='object'
            ?joueur.prochainPalier
            :null;

        return `
          <div class="soreal-idle-window-title-v31 dark">
            👤 ${idleHtml_(joueur.nom||'Joueur')}
            · ${idleHtml_(joueur.titre||'Recrue du dépôt')}
          </div>

          <div class="soreal-idle-character-grid-v25">
            <div class="soreal-idle-character-stat-v25">
              Nombre
              <b>${formatGrandNombreIdleV70_(joueur.systemes&&joueur.systemes.rebirth&&joueur.systemes.rebirth.number||1)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Puissance
              <b>${idleEntier_(joueur.puissance)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Force
              <b>${idleEntier_(joueur.force)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Endurance
              <b>${idleEntier_(joueur.endurance)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Organisation
              <b>${idleEntier_(joueur.organisation)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Défense
              <b>${idleEntier_(joueur.defense)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Boss vaincus
              <b>${idleEntier_(joueur.bossVaincus)}</b>
            </div>

            <div class="soreal-idle-character-stat-v25">
              Renaissances
              <b>${idleEntier_(joueur.renaissances)}</b>
            </div>
          </div>

          <div class="soreal-idle-profile-detail-v52">
            <div>
              📅 Début :
              <strong>${dateIdleV25_(profil.dateDebut)}</strong>
            </div>

            <div>
              ⏱️ Temps de jeu :
              <strong>${formaterDureeJeuIdleV1_(stats.tempsActifSec)}</strong>
            </div>

            <div>
              🗓️ Ancienneté :
              <strong>${dureeProfilIdleV25_(profil)}</strong>
            </div>

            <div>
              🎁 Loots obtenus :
              <strong>${idleEntier_(stats.lootsObtenus)}</strong>
            </div>

            <div>
              ♻️ Objets recyclés :
              <strong>${idleEntier_(stats.objetsRecycles)}</strong>
            </div>

            <div>
              🔗 Fusions :
              <strong>${idleEntier_(stats.fusions)}</strong>
            </div>

            <div>
              🔥 Améliorations forge :
              <strong>${idleEntier_(stats.forge)}</strong>
            </div>

            <div>
              🗺️ Combats aventure :
              <strong>${idleEntier_(stats.combatsAventure)}</strong>
            </div>

            <div>
              🏆 Victoires aventure :
              <strong>${idleEntier_(stats.victoiresAventure)}</strong>
            </div>
          </div>

          ${
            prochain
              ?`
                <div class="soreal-idle-profile-next-v52">
                  🎯 Prochain titre :
                  <strong>${idleHtml_(prochain.nom||'—')}</strong>
                  ${
                    idleEntier_(prochain.niveau)>idleEntier_(joueur.niveau)
                      ?' au niveau '+idleEntier_(prochain.niveau)
                      :''
                  }
                </div>
              `
              :''
          }
        `;
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

      function pagePersonnageIdleV28_(j){
        return `
          ${entetePageIdleV28_(
            '👤 Personnage',
            'Statistiques générales et historique du personnage.'
          )}

          <div class="soreal-idle-character-v25">
            ${rendreProfilIdleV26_(j)}
            ${rendreSetsIdleV25_(j)}

            <div class="soreal-idle-danger-zone-v67">
              <div class="soreal-idle-danger-title-v67">
                ⚠️ Zone dangereuse
              </div>

              <div class="soreal-idle-danger-text-v67">
                Efface entièrement ce personnage et recommence SOREAL IDLE
                exactement comme lors de ta toute première connexion.
              </div>

              <button
                type="button"
                class="soreal-idle-danger-button-v67"
                onclick="window.__ouvrirPopupResetTotalIdleV67__()"
              >
                💣 Réinitialiser entièrement SOREAL IDLE
              </button>
            </div>
          </div>
        `;
      }

      /*
       * Profil et pseudo (2026-09-26, Norman : « la possibilité de choisir un Pseudo dans les paramètres ; c'est ce pseudo qui est utilisé pour les gens qui jouent en dehors
       * de SOREAL APP et TV ; si c'est un ouvrier, il peut afficher un pseudo, mais on voit son prénom entre parenthèses »). Le serveur valide et garantit l'unicité.
       */
      function htmlProfilPseudoIdleV1_(j){
        const id=j&&j.identite;
        if(!id)return '';
        const google=Boolean(id.externe);
        return '<div class="soreal-idle-section-v8" id="sorealIdleProfilPseudoV1">'+
          '<div class="soreal-idle-window-title-v31">👤 Profil</div>'+
          '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">'+
            (google
              ?'Les autres joueurs te voient uniquement sous ton pseudo (jamais ton nom Google ni ton adresse).'
              :'Tu peux choisir un pseudo : les autres te verront « Pseudo ('+idleHtml_(id.prenom||'Prénom')+') ».')+
          '</div>'+
          '<div style="font-size:15px;color:#dce5f3;margin-bottom:8px">Nom affiché : <b>'+idleHtml_(id.nomAffiche||'Joueur')+'</b></div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'+
            '<input id="sorealIdlePseudoChampV1" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Ton pseudo (3 à 20 caractères)" value="'+idleHtml_(id.pseudo||'')+'" '+
              'style="flex:1 1 180px;min-width:0;padding:9px 11px;border-radius:10px;border:1px solid rgba(129,176,255,.35);background:#0d1830;color:#eef5ff;font-size:14px">'+
            '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__enregistrerPseudoIdleV1__()">Enregistrer</button>'+
          '</div>'+
          (google
            ?'<div style="font-size:13px;color:#7f8aa4;margin-top:10px">Connecté avec Google : '+idleHtml_(id.email||'')+'</div>'+
              '<button type="button" class="soreal-idle-expand-button-v25" style="margin-top:8px" onclick="window.__deconnexionGoogleIdleV1__()">Se déconnecter</button>'
            :'')+
        '</div>';
      }

  window.__SOREAL_IDLE_PAGE_PERSONNAGE_V1__={
    pagePersonnageIdleV28_:pagePersonnageIdleV28_,
    htmlProfilPseudoIdleV1_:htmlProfilPseudoIdleV1_
  };
  Object.assign(window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={}),window.__SOREAL_IDLE_PAGE_PERSONNAGE_V1__);
})();
