/*
 * SOREAL IDLE — page Basic Training (Norman, 2026-10-16 : audit d'architecture, découpage du monolithe soreal-idle-ui.js).
 * Extrait tel quel (même code) ; les aides du monolithe sont lues à l'exécution par window.__SOREAL_IDLE_UI_PARTAGE_V1__
 * (jamais au chargement : ce module se charge AVANT le monolithe). Expose window.__SOREAL_IDLE_PAGE_ENTRAINEMENT_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PAGE_ENTRAINEMENT_V1__)return;

      function entetePageIdleV28_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.entetePageIdleV28_.apply(null,arguments);}
      function rendreBarreEnergiePersistanteIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.rendreBarreEnergiePersistanteIdleV1_.apply(null,arguments);}
      function idleEntier_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleEntier_.apply(null,arguments);}
      function idleHtml_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleHtml_.apply(null,arguments);}
      function synchroBasicTrainingAcheteIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.synchroBasicTrainingAcheteIdleV1_.apply(null,arguments);}
      function synchroBasicTrainingActifIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.synchroBasicTrainingActifIdleV1_.apply(null,arguments);}
      function formatGrandNombreIdleV70_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.formatGrandNombreIdleV70_.apply(null,arguments);}
      function idleNombre_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.idleNombre_.apply(null,arguments);}
      function formatEntierLisibleIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.formatEntierLisibleIdleV1_.apply(null,arguments);}
      function texteEtaBasicTrainingIdleV1_(){return window.__SOREAL_IDLE_UI_PARTAGE_V1__.texteEtaBasicTrainingIdleV1_.apply(null,arguments);}

      function skillBasicTrainingIdleV120_(
        j,
        skill
      ){
        if(!skill)return '';

        /*
         * Seule la PROCHAINE compétence à débloquer est montrée (groupeBasicTrainingIdleV120_ n'en passe jamais plus d'une), en gris, avec son seul prérequis
         * (Norman, 2026-10-03 : « Nécessite 5K niveaux dans le menu au-dessus »). Aucune autre information (ni coût, ni effet) : règle n°2.
         */
        if(!skill.unlocked){
          const liste=j&&j.basicTraining&&Array.isArray(j.basicTraining.skills)?j.basicTraining.skills:[];
          const dessus=liste.find(function(x){return x&&x.id===skill.prerequisite;});
          const nomDessus=dessus?String(dessus.name||''):'';
          return `
            <div class="soreal-idle-bt-row-v120 ${idleHtml_(skill.group||'')} verrouille" data-basic-training-skill="${idleHtml_(skill.id)}" aria-disabled="true">
              <div class="soreal-idle-bt-main-v120">
                <div class="soreal-idle-bt-name-v120">${idleHtml_(skill.name)}</div>
                <div class="soreal-idle-bt-prerequis-v1">Nécessite ${idleHtml_(formatGrandNombreIdleV70_(idleEntier_(skill.prerequisiteLevel)))} niveaux dans ${nomDessus?idleHtml_(nomDessus):'le menu au-dessus'}</div>
              </div>
            </div>`;
        }

        /*
         * Montée en puissance (Norman, 2026-10-04 : « Attaque régulière plus bad ass que attaque passive, attaque puissante plus bad ass que attaque régulière ») : le rang de la barre dans sa section (0 à 5)
         * pilote son habillage (soreal-idle-themes.css, « MONTÉE EN PUISSANCE ») : mêmes couleurs, de plus en plus sombre, lumineux et animé.
         */
        const rangBt=Math.max(0,Math.min(5,(j&&j.basicTraining&&Array.isArray(j.basicTraining.skills)?j.basicTraining.skills:[]).filter(function(x){return x&&x.group===skill.group;}).findIndex(function(x){return x.id===skill.id;})));

        const vitesseInitiale=
          Math.max(
            0,
            idleNombre_(skill.levelsPerSecond)
          );

        /* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-170 */
        /* Cap atteint (énergie allouée >= cap) : barre entièrement remplie, sans clignotement (voir animerBarreBasicTrainingIdleV220_). */
        const pourcentageInitial=
          vitesseInitiale>0
            ?(idleEntier_(skill.allocation)>0&&idleEntier_(skill.allocation)>=Math.max(1,idleEntier_(skill.cap))
              ?100
              :Math.max(0,Math.min(100,idleNombre_(skill.progress)*100)))
            :0;

        return `
          <div
            class="soreal-idle-bt-row-v120 ${idleHtml_(skill.group||'')}"
            data-basic-training-skill="${idleHtml_(skill.id)}"
            data-rang-v1="${rangBt}"
          >
            <div class="soreal-idle-bt-main-v120">
              <div class="soreal-idle-bt-name-v120">
                ${idleHtml_(window.__SOREAL_IDLE_ICONES_V1__?window.__SOREAL_IDLE_ICONES_V1__.avec('basicTraining',skill.id,skill.name):skill.name)}
              </div>

              <div class="soreal-idle-bt-track-v120">
                <div
                  id="sorealIdleBtBarV120_${idleHtml_(skill.id)}"
                  class="soreal-idle-bt-fill-v120"
                  style="width:100%;transform:scaleX(${pourcentageInitial/100});transform-origin:left center;will-change:transform;transition:none"
                ></div>
              </div>

              <div class="soreal-idle-bt-meta-v120">
                <span id="sorealIdleBtSpeedV120_${idleHtml_(skill.id)}">
                  ${idleNombre_(skill.levelsPerSecond).toFixed(2).replace('.',',')} niv/s
                </span>
                <span>
                  Cap :
                  <strong id="sorealIdleBtCapV120_${idleHtml_(skill.id)}">
                    ${formatEntierLisibleIdleV1_(skill.cap)}
                  </strong> ⚡
                  · prochain :
                  <strong
                    id="sorealIdleBtNextCapV120_${idleHtml_(skill.id)}"
                    class="${skill.maxReductionReached?'ready':''}"
                  >
                    ${formatEntierLisibleIdleV1_(skill.nextCap||skill.cap)}
                  </strong>
                </span>
                <span id="sorealIdleBtEtaV120_${idleHtml_(skill.id)}">
                  ${texteEtaBasicTrainingIdleV1_(vitesseInitiale)}
                </span>
              </div>
            </div>

            <div
              id="sorealIdleBtLevelV120_${idleHtml_(skill.id)}"
              class="soreal-idle-bt-level-v120"
            >
              ${formatGrandNombreIdleV70_(skill.level)}
            </div>

            <div
              id="sorealIdleBtAllocationV120_${idleHtml_(skill.id)}"
              class="soreal-idle-bt-allocation-v120"
            >
              ${formatEntierLisibleIdleV1_(skill.allocation)} ⚡
            </div>

            <div class="soreal-idle-bt-actions-v120">
              <button
                type="button"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','plus')"
              >+</button>
              <button
                type="button"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','moins')"
              >−</button>
              <button
                type="button"
                data-sans-traduction
                title="Cap : place seulement l’énergie nécessaire pour atteindre le plafond de cette compétence"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','cap')"
              >Cap</button>
              <button
                type="button"
                title="Retirer toute l’énergie de cette barre"
                onclick="window.__ajusterBasicTrainingIdleV120__('${idleHtml_(skill.id)}','zero')"
              >0</button>
            </div>
          </div>
        `;
      }

      function groupeBasicTrainingIdleV120_(
        j,
        groupe,
        titre
      ){
        const toutesSkills=
          j&&
          j.basicTraining&&
          Array.isArray(j.basicTraining.skills)
            ?j.basicTraining.skills.filter(function(x){
                return x.group===groupe;
              })
            :[];
        const premierVerrouille=toutesSkills.findIndex(function(x){return !x.unlocked;});
        const skills=premierVerrouille<0
          ?toutesSkills
          :toutesSkills.slice(0,premierVerrouille+1);

        return `
          <section class="soreal-idle-bt-panel-v120 ${idleHtml_(groupe)}">
            <div class="soreal-idle-bt-panel-head-v120">
              <strong>${idleHtml_(titre)}</strong>
              <span>Niveau</span>
              <span>Énergie affectée</span>
              <span></span>
            </div>

            ${skills.map(function(skill){
              return skillBasicTrainingIdleV120_(
                j,
                skill
              );
            }).join('')}
          </section>
        `;
      }

      function pageEntrainementIdleLegacyV47_(j){
        const bt=
          j&&j.basicTraining
            ?j.basicTraining
            :{
                energy:{idle:0,allocated:0,cap:0},
                energyPower:1,
                energyBars:1,
                maxLevelsPerSecond:50,
                skills:[]
              };

        const energie=
          bt.energy||{};

        return `
          ${entetePageIdleV28_(
            '🏋️ Basic Training',
            'Place ton énergie pour augmenter ton attaque et ta défense.'
          )}

          <!--
            Norman (2026-09-16) : "tu peux l'enlever de basic training et
            de fight boss et n'utiliser que celle que je te demande [la
            barre persistante sous le menu]." L'ancien bloc
            .soreal-idle-bt-energy-v120 (Idle/affectée/Cap + sa propre
            barre) est retiré ici — la seule barre d'Énergie visible reste
            désormais rendreBarreEnergiePersistanteIdleV1_ (shell), jamais
            un second mécanisme. L'info vitesse/multiplicateurs, utile
            spécifiquement à cet écran, reste affichée seule.
          -->
          <div class="soreal-idle-bt-toolbar-v120">
            <div class="soreal-idle-bt-info-v1">
              vitesse max ${idleEntier_(bt.maxLevelsPerSecond||50)} niv/s
              · Energy Power n’accélère pas Basic Training
            </div>

            <div class="soreal-idle-bt-input-box-v120">
              <label for="sorealIdleTrainingInputV120">🎚️ Input</label>
              <input
                id="sorealIdleTrainingInputV120"
                type="text"
                inputmode="decimal"
                value="${idleHtml_(String(window.__lireMontantAugmentIdleV1__?window.__lireMontantAugmentIdleV1__():125))}"
                title="Un nombre, ou une fraction comme 1/8 (résolue en 1/8 de l'énergie idle libre à la validation)"
                oninput="window.__saisirMontantAugmentIdleV1__&&window.__saisirMontantAugmentIdleV1__(this.value)"
                onblur="window.__resoudreFractionInputIdleV1__(this);window.__saisirMontantAugmentIdleV1__&&window.__saisirMontantAugmentIdleV1__(this.value)"
              >
              ${synchroBasicTrainingAcheteIdleV1_()?`
              <label class="soreal-idle-bt-synchro-v1" title="Cochée : l'énergie placée dans une compétence est placée en même temps dans sa jumelle (Attaque passive ↔ Blocage…)">
                <input
                  type="checkbox"
                  id="sorealIdleTrainingSynchroV1"
                  ${synchroBasicTrainingActifIdleV1_()?'checked':''}
                  onchange="window.__basculerSynchroBasicTrainingIdleV1__(this.checked)"
                >
                🔗 Synchro
              </label>`:''}
            </div>

            <div class="soreal-idle-bt-presets-v120">
              <span>⚡ Plafond d’énergie</span>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',1)">Max</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',.5)">1/2</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('cap',.25)">1/4</button>
            </div>

            <div class="soreal-idle-bt-presets-v120">
              <span>💤 Idle</span>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('idle',.5)">1/2</button>
              <button type="button" onclick="window.__presetBasicTrainingIdleV120__('idle',.25)">1/4</button>
              <button type="button" class="clear" onclick="window.__viderBasicTrainingIdleV120__()">Tout retirer</button>
            </div>
            ${window.__SOREAL_IDLE_ALLOC_V1__&&window.__SOREAL_IDLE_ALLOC_V1__.compteur?window.__SOREAL_IDLE_ALLOC_V1__.compteur('energy','basicTraining'):''}
          </div>

          ${groupeBasicTrainingIdleV120_(
            j,
            'attack',
            '⚔️ Compétences d’attaque'
          )}

          ${groupeBasicTrainingIdleV120_(
            j,
            'defense',
            '🛡️ Compétences de défense'
          )}
        `;
      }

      function pageEntrainementIdleV28_(j){
        return pageEntrainementIdleLegacyV47_(j);
      }

  window.__SOREAL_IDLE_PAGE_ENTRAINEMENT_V1__={
    pageEntrainementIdleV28_:pageEntrainementIdleV28_
  };
  Object.assign(window.__SOREAL_IDLE_REG__||(window.__SOREAL_IDLE_REG__={}),window.__SOREAL_IDLE_PAGE_ENTRAINEMENT_V1__);
})();
