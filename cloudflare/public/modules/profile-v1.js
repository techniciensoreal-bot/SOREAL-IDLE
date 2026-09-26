/*
 * SOREAL IDLE — page Achievements (succès, bonus d'AP) et Player Portraits.
 * Moteurs : cloudflare/src/idle-achievements-v1.js et idle-portraits-v1.js ; le serveur publie
 * j.systemes.achievements et j.systemes.portraits. Branché par une seule ligne dans
 * pageSystemeMetaIdleV130_ (meta-progression-v130.js) ; les actions passent par
 * window.__SOREAL_IDLE_META_V130__.actionMetaIdleV130_.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_PROFILE_V1__)return;

  function hote(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html(v){const h=hote();return h&&h.idleHtml_?h.idleHtml_(v):String(v==null?'':v);}
  function nombre(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function pct(v){return nombre(v).toFixed(2).replace('.',',')+' %';}
  function entete(titre,sous){const h=hote();return h&&h.entetePageIdleV28_?h.entetePageIdleV28_(titre,sous):'<h1>'+titre+'</h1><p>'+sous+'</p>';}

  function action(payload){
    const meta=window.__SOREAL_IDLE_META_V130__;
    if(meta&&typeof meta.actionMetaIdleV130_==='function')meta.actionMetaIdleV130_(payload);
  }
  window.__profilChoisirPortraitIdleV1__=function(id){action({action:'portrait',id:String(id)});};

  /*
   * Catégories de succès (Norman, 2026-09-26 : « accorde plus d'importance au visuel des Achievements : des emoji, de la couleur, pour appuyer les catégories »).
   * Chaque catégorie a son emoji et sa couleur ; la même table sert à l'annonce en fondu d'un succès débloqué (achievement-notice-v1.js).
   */
  const GROUPES_STYLE={
    energyPower:{nom:'Energy Power',emoji:'⚡',couleur:'#f2a900'},
    magicPower:{nom:'Magic Power',emoji:'🔮',couleur:'#9b5cf6'},
    energyCap:{nom:'Energy Cap',emoji:'🔋',couleur:'#f97316'},
    magicCap:{nom:'Magic Cap',emoji:'🧪',couleur:'#4f6bff'},
    energyBars:{nom:'Energy Bar',emoji:'📊',couleur:'#14b8a6'},
    magicBars:{nom:'Magic Bar',emoji:'📈',couleur:'#ec4899'},
    boss:{nom:'Boss vaincus',emoji:'👹',couleur:'#ef4444'},
    rebirth:{nom:'Rebirths',emoji:'♻️',couleur:'#22c55e'},
    secret:{nom:'Secrets',emoji:'🕵️',couleur:'#d4a017'}
  };
  window.__SOREAL_IDLE_SUCCES_GROUPES_V1__=GROUPES_STYLE;

  function styleSucces(){
    if(typeof document.createElement!=='function'||!document.head||document.getElementById('soreal-idle-succes-style-v1'))return;
    const st=document.createElement('style');
    st.id='soreal-idle-succes-style-v1';
    st.textContent=
      '.idle-succes-resume-v1{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}'+
      '.idle-succes-tuile-v1{padding:12px 10px;border-radius:14px;text-align:center;color:#fff;font-size:11px;font-weight:850;box-shadow:0 4px 14px rgba(20,30,60,.16)}'+
      '.idle-succes-tuile-v1 .ic{display:block;font-size:22px;line-height:1.1;margin-bottom:3px}'+
      '.idle-succes-tuile-v1 b{display:block;margin-top:2px;font-size:17px;font-weight:950}'+
      '.idle-succes-grille-v1{display:grid;gap:9px;margin-top:8px}'+
      '.idle-succes-groupe-v1{border-radius:14px;overflow:hidden;border:1px solid var(--acc);background:rgba(255,255,255,.03);box-shadow:0 3px 14px rgba(0,0,0,.28),0 0 0 1px color-mix(in srgb,var(--acc) 22%,transparent)}'+
      '.idle-succes-groupe-v1>summary{display:flex;align-items:center;gap:10px;padding:11px 13px;cursor:pointer;list-style:none;color:#fff;font-weight:900;font-size:14px;'+
        'background:linear-gradient(100deg,var(--acc),color-mix(in srgb,var(--acc) 55%,#1b2440));text-shadow:0 1px 2px rgba(0,0,0,.35)}'+
      '.idle-succes-groupe-v1>summary::-webkit-details-marker{display:none}'+
      '.idle-succes-groupe-v1>summary .em{font-size:23px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}'+
      '.idle-succes-groupe-v1>summary .nb{margin-left:auto;padding:2px 11px;border-radius:999px;background:rgba(255,255,255,.92);color:var(--acc);font-size:13px;font-weight:950;text-shadow:none}'+
      '.idle-succes-groupe-v1>summary .fl{font-size:11px;opacity:.85;transition:transform .15s}'+
      '.idle-succes-groupe-v1[open]>summary .fl{transform:rotate(90deg)}'+
      '.idle-succes-liste-v1{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;padding:10px;background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 16%,transparent),rgba(255,255,255,.02))}'+
      '.idle-succes-item-v1{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.06);border:1px solid color-mix(in srgb,var(--acc) 40%,transparent);border-left:4px solid var(--acc);font-size:12px;font-weight:800;color:inherit}'+
      '.idle-succes-item-v1 .ok{font-size:15px}'+
      '.idle-succes-item-v1 .bp{margin-left:auto;flex:0 0 auto;padding:2px 8px;border-radius:999px;background:var(--acc);color:#fff;font-size:10.5px;font-weight:950}'+
      '@media (max-width:520px){.idle-succes-liste-v1{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }

  function blocSucces(a){
    styleSucces();
    const liste=Array.isArray(a.list)?a.list:[];
    const faits=liste.filter(function(x){return x.unlocked;}).length;
    /*
     * ANTI-SPOIL (Norman, 2026-09-24 : « le joueur ne doit voir que ce qu'il a débloqué ») : seuls les succès DÉJÀ obtenus sont listés ;
     * ni les objectifs à venir, ni les succès secrets (« ??? »), ni le nombre total (« n / 153 »), ni les totaux par groupe.
     */
    const groupes=Object.keys(GROUPES_STYLE).map(function(g){
      const items=liste.filter(function(x){return x.group===g&&x.unlocked;});
      if(!items.length)return '';
      const st=GROUPES_STYLE[g];
      const lignes=items.map(function(x){
        return '<div class="idle-succes-item-v1"><span class="ok">✅</span><span>'+html(x.name)+'</span><span class="bp">'+nombre(x.bp)+' BP</span></div>';
      }).join('');
      return '<details class="idle-succes-groupe-v1" style="--acc:'+st.couleur+'"><summary><span class="em">'+st.emoji+'</span><span>'+html(st.nom)+'</span>'+
        '<span class="nb">'+items.length+'</span><span class="fl">▶</span></summary><div class="idle-succes-liste-v1">'+lignes+'</div></details>';
    }).join('');
    const tuile=function(icone,libelle,valeur,fond){
      return '<div class="idle-succes-tuile-v1" style="background:'+fond+'"><span class="ic">'+icone+'</span>'+libelle+'<b>'+valeur+'</b></div>';
    };
    return '<div class="idle-succes-resume-v1">'+
        tuile('🏅','Succès',faits,'linear-gradient(135deg,#f2a900,#f97316)')+
        tuile('💎','Bonus Points',nombre(a.bp)+' BP','linear-gradient(135deg,#4f6bff,#9b5cf6)')+
        tuile('💠','Bonus d’AP','+'+pct((nombre(a.apMultiplier)-1)*100),'linear-gradient(135deg,#14b8a6,#22c55e)')+
      '</div>'+
      '<div class="soreal-idle-note-v4" style="margin:6px 0">+1 % d’AP par tranche de 100 BP (sauf kills de l’ITOPOD et Special Prize).</div>'+
      '<div class="idle-succes-grille-v1">'+groupes+'</div>';
  }

  function blocPortraits(p){
    if(!p)return '';
    const liste=Array.isArray(p.list)?p.list:[];
    /* ANTI-SPOIL (2026-09-24) : uniquement les portraits déjà débloqués (pas de bouton verrouillé ni de condition). */
    const boutons=liste.filter(function(x){return x.unlocked;}).map(function(x){
      const choisi=x.id===p.selected;
      /* Vignette = l'image R2 du portrait ; sans image : silhouette en grand, centrée. */
      const vignette='<span class="idle-portrait-thumb-v1">'+
        '<img src="/api/idle/media/player?portrait='+encodeURIComponent(x.file)+'" alt="" loading="lazy" draggable="false" '+
          'onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\'">'+
        '<span class="idle-emoji-fallback-v1" data-n="1" style="display:none">🧑</span></span>';
      return '<button type="button" class="soreal-idle-expand-button-v25 idle-portrait-btn-v1"'+
        (choisi?' disabled':' onclick="window.__profilChoisirPortraitIdleV1__(\''+html(x.id)+'\')"')+'>'+
        vignette+'<span>'+(choisi?'✅ ':'')+html(x.name)+'</span></button>';
    }).join('');
    const auto=p.auto?'<div class="soreal-idle-note-v4" style="margin-top:8px">🛡️ Les 4 pièces du set <b>'+html(p.auto.name)+'</b> sont équipées : ton héros en porte l’armure. Retire une pièce pour retrouver ton portrait choisi.</div>':'';
    return '<div class="soreal-idle-section-v8">'+
        '<div class="soreal-idle-window-title-v31">🖼️ Player Portraits — '+nombre(p.unlockedCount)+'</div>'+
        '<div class="soreal-idle-note-v4">Portrait du héros en combat (cosmétique). Un portrait par set complété, plus les souhaits Weiner, Mayo et Sneak Preview et les fragments SEXY / SMART à 250 %.</div>'+
        auto+
        '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px">'+boutons+'</div>'+
      '</div>';
  }

  function page(j){
    const s=(j&&j.systemes)||{};
    return entete('🎖️ Achievements','Succès, Bonus Points et portraits du héros.')+
      (s.achievements?blocSucces(s.achievements):'')+
      blocPortraits(s.portraits);
  }

  window.__SOREAL_IDLE_PROFILE_V1__={page:page};
})();
