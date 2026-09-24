/*
 * SOREAL IDLE — Long Press V200
 *
 * Composant réutilisable pour toute l'application.
 * Usage : data-soreal-longpress sur un élément.
 * Émet : "soreal-longpress" (CustomEvent, bubbles=true).
 *
 * V200 ne dépend plus d'un seul flux d'événements mobile :
 * - Touch Events = voie principale WebView ;
 * - Pointer Events = repli si la WebView ne livre pas touchstart ;
 * - contextmenu = repli natif supplémentaire pour les maintiens Android.
 *
 * Un pointercancel/touchcancel tactile immobile ne détruit plus le timer :
 * certaines WebView l'émettent précisément parce qu'elles tentent de
 * reprendre le geste de maintien.
 */
(function(){
  'use strict';

  if(window.__SOREAL_LONG_PRESS_V200__)return;

  var SELECTOR='[data-soreal-longpress]';
  var HOLD_MS=600;
  var MOVE_PX=32;
  var state=null;

  function cible_(node){
    if(!node||!node.closest)return null;
    if(node.closest('[data-soreal-longpress-ignore]'))return null;
    return node.closest(SELECTOR);
  }

  function clear_(expected){
    if(expected&&state!==expected)return;
    var s=state;
    state=null;
    if(s&&s.timer){
      clearTimeout(s.timer);
      s.timer=0;
    }
  }

  function emit_(target,source,pointerType,durationMs){
    if(!target)return false;
    try{
      target.dispatchEvent(new CustomEvent('soreal-longpress',{
        bubbles:true,
        cancelable:true,
        detail:{
          source:String(source||'long-press-v200'),
          pointerType:String(pointerType||'touch'),
          durationMs:Math.max(0,Number(durationMs)||0)
        }
      }));
      return true;
    }catch(_){
      return false;
    }
  }

  function fire_(s,source){
    if(!s||state!==s||s.moved||s.fired)return false;
    if(s.timer){
      clearTimeout(s.timer);
      s.timer=0;
    }
    s.fired=true;

    emit_(
      s.target,
      source||'long-press-v200',
      s.pointerType,
      Date.now()-s.startedAt
    );

    if(s.cancelledByBrowser){
      setTimeout(function(){clear_(s);},100);
    }
    return true;
  }

  function start_(target,mode,x,y,id,pointerType){
    if(!target)return null;

    /*
     * pointerdown tactile arrive souvent juste avant touchstart.
     * touchstart devient alors la source la plus précise : il remplace
     * proprement le fallback pointer sans créer deux timers.
     */
    clear_();

    var s={
      target:target,
      mode:mode,
      id:id,
      pointerType:pointerType||mode,
      x:Number(x)||0,
      y:Number(y)||0,
      startedAt:Date.now(),
      moved:false,
      fired:false,
      cancelledByBrowser:false,
      timer:0
    };

    s.timer=setTimeout(function(){
      fire_(s,'timer');
    },HOLD_MS);

    state=s;
    return s;
  }

  function moved_(x,y){
    if(!state)return false;
    var dx=(Number(x)||0)-state.x;
    var dy=(Number(y)||0)-state.y;

    if(Math.hypot(dx,dy)>MOVE_PX){
      state.moved=true;
      clear_(state);
      return true;
    }
    return false;
  }

  function touchById_(list,id){
    if(!list)return null;
    for(var i=0;i<list.length;i+=1){
      if(list[i]&&list[i].identifier===id)return list[i];
    }
    return null;
  }

  document.addEventListener('touchstart',function(event){
    if(!event.touches||event.touches.length!==1)return;

    var target=cible_(event.target);
    if(!target)return;

    var touch=event.touches[0];
    start_(
      target,
      'touch',
      touch.clientX,
      touch.clientY,
      touch.identifier,
      'touch'
    );

    /*
     * Empêche loupe/callout/drag natif de devenir propriétaire du geste.
     * Listener non passif indispensable pour WebKit/WKWebView.
     */
    if(event.cancelable)event.preventDefault();
  },{capture:true,passive:false});

  document.addEventListener('touchmove',function(event){
    var s=state;
    if(!s||s.pointerType!=='touch')return;

    var touch=
      s.mode==='touch'
        ?touchById_(event.touches,s.id)
        :(event.touches&&event.touches.length===1?event.touches[0]:null);

    if(!touch)return;
    if(moved_(touch.clientX,touch.clientY))return;
    if(event.cancelable)event.preventDefault();
  },{capture:true,passive:false});

  document.addEventListener('touchend',function(event){
    var s=state;
    if(!s||s.pointerType!=='touch')return;

    var termine=
      s.mode==='touch'
        ?Boolean(touchById_(event.changedTouches,s.id))
        :Boolean(event.changedTouches&&event.changedTouches.length);

    if(!termine)return;

    if(s.fired&&event.cancelable)event.preventDefault();
    clear_(s);
  },{capture:true,passive:false});

  document.addEventListener('touchcancel',function(event){
    var s=state;
    if(!s||s.pointerType!=='touch')return;

    /*
     * Point clé V200 : une annulation tactile immobile n'annule plus
     * l'intention de maintien, même si elle arrive très tôt. On conserve
     * le timer jusqu'à 600 ms. Un vrai déplacement, lui, l'a déjà annulé.
     */
    if(!s.moved&&!s.fired){
      s.cancelledByBrowser=true;
      if(event.cancelable)event.preventDefault();
      return;
    }

    clear_(s);
  },{capture:true,passive:false});

  document.addEventListener('pointerdown',function(event){
    var type=String(event.pointerType||'mouse');
    if(type==='mouse'&&event.button!==0)return;

    var target=cible_(event.target);
    if(!target)return;

    /*
     * Le tactile est inclus comme fallback. Si touchstart arrive ensuite,
     * il remplace ce timer automatiquement.
     */
    start_(
      target,
      type==='touch'?'pointer-touch':'pointer',
      event.clientX,
      event.clientY,
      event.pointerId,
      type
    );
  },true);

  document.addEventListener('pointermove',function(event){
    var s=state;
    if(!s||s.id!==event.pointerId)return;
    if(s.mode!=='pointer'&&s.mode!=='pointer-touch')return;
    moved_(event.clientX,event.clientY);
  },true);

  document.addEventListener('pointerup',function(event){
    var s=state;
    if(!s||s.id!==event.pointerId)return;
    if(s.mode!=='pointer'&&s.mode!=='pointer-touch')return;
    clear_(s);
  },true);

  document.addEventListener('pointercancel',function(event){
    var s=state;
    if(!s||s.id!==event.pointerId)return;
    if(s.mode!=='pointer'&&s.mode!=='pointer-touch')return;

    if(s.pointerType==='touch'&&!s.moved&&!s.fired){
      s.cancelledByBrowser=true;
      return;
    }

    clear_(s);
  },true);

  /*
   * 2026-09-24 : le clic droit de la souris (PC) n'est PAS un maintien. Il sert à l'action rapide de l'inventaire
   * (équiper / fusionner, comme NGU Idle), gérée dans soreal-idle-ui.js. Seul un contextmenu tactile sert de signal de secours.
   */
  var dernierClicDroitSouris=0;
  document.addEventListener('pointerdown',function(e){
    if(e.pointerType==='mouse'&&e.button===2)dernierClicDroitSouris=Date.now();
  },true);
  function clicDroitSouris_(event){
    if(event.pointerType==='mouse')return true;
    return !event.pointerType&&Date.now()-dernierClicDroitSouris<1500;
  }

  document.addEventListener('contextmenu',function(event){
    var target=cible_(event.target);
    if(!target)return;

    event.preventDefault();
    if(clicDroitSouris_(event))return;

    /*
     * Android/Chrome peut considérer contextmenu comme le résultat du
     * maintien. Au lieu de seulement supprimer le menu natif, on l'utilise
     * comme signal de secours pour ouvrir immédiatement notre popup.
     */
    var s=state;
    if(s&&s.target===target&&!s.moved&&!s.fired){
      fire_(s,'contextmenu');
      return;
    }

    emit_(target,'contextmenu','touch',HOLD_MS);
  },true);

  window.addEventListener('blur',function(){
    clear_();
  },true);

  document.addEventListener('visibilitychange',function(){
    if(document.hidden)clear_();
  },true);

  window.__SOREAL_LONG_PRESS_V200__={
    selector:SELECTOR,
    holdMs:HOLD_MS,
    movePx:MOVE_PX,
    cancel:function(){clear_();},
    debugState:function(){
      return state
        ?{
            mode:state.mode,
            pointerType:state.pointerType,
            moved:state.moved,
            fired:state.fired,
            cancelledByBrowser:state.cancelledByBrowser,
            elapsedMs:Date.now()-state.startedAt
          }
        :null;
    }
  };
})();
