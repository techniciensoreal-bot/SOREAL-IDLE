/*
 * SOREAL IDLE — Long Press V197
 *
 * Composant réutilisable pour toute l'application.
 * Usage : data-soreal-longpress sur un élément.
 * Émet : "soreal-longpress" (CustomEvent, bubbles=true).
 *
 * Mobile/WebView : Touch Events sont volontairement la source primaire
 * du maintien. Le drag/tap de l'inventaire peut continuer à utiliser
 * Pointer Events sans posséder le timer d'appui long.
 */
(function(){
  'use strict';

  if(window.__SOREAL_LONG_PRESS_V197__)return;

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

  function fire_(s){
    if(!s||state!==s||s.moved||s.fired)return;
    s.timer=0;
    s.fired=true;

    try{
      s.target.dispatchEvent(new CustomEvent('soreal-longpress',{
        bubbles:true,
        cancelable:true,
        detail:{
          source:'long-press-v197',
          pointerType:s.mode==='touch'?'touch':s.pointerType,
          durationMs:Date.now()-s.startedAt
        }
      }));
    }catch(_){}

    /*
     * Sur certains WebView, touchcancel remplace touchend quand le système
     * tente de reprendre un maintien. Le timer reste volontairement vivant
     * jusqu'au déclenchement ; après émission on nettoie sans attendre un
     * touchend qui peut ne jamais arriver.
     */
    if(s.cancelledByBrowser){
      setTimeout(function(){clear_(s);},80);
    }
  }

  function start_(target,mode,x,y,id,pointerType){
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
    s.timer=setTimeout(function(){fire_(s);},HOLD_MS);
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
     * WKWebView/WebKit : empêche loupe/callout/drag système de devenir
     * propriétaire du maintien.
     */
    if(event.cancelable)event.preventDefault();
  },{capture:true,passive:false});

  document.addEventListener('touchmove',function(event){
    var s=state;
    if(!s||s.mode!=='touch')return;
    var touch=touchById_(event.touches,s.id);
    if(!touch)return;
    if(moved_(touch.clientX,touch.clientY))return;
    if(event.cancelable)event.preventDefault();
  },{capture:true,passive:false});

  document.addEventListener('touchend',function(event){
    var s=state;
    if(!s||s.mode!=='touch')return;
    if(touchById_(event.changedTouches,s.id)){
      if(s.fired&&event.cancelable)event.preventDefault();
      clear_(s);
    }
  },{capture:true,passive:false});

  document.addEventListener('touchcancel',function(event){
    var s=state;
    if(!s||s.mode!=='touch')return;

    var elapsed=Date.now()-s.startedAt;
    /*
     * Le cas qui nous intéresse : WebView annule le flux natif au milieu
     * d'un vrai maintien. Si le doigt était immobile depuis déjà 120 ms,
     * on laisse le timer atteindre 600 ms au lieu de tuer le long-press.
     */
    if(!s.moved&&!s.fired&&elapsed>=120){
      s.cancelledByBrowser=true;
      if(event.cancelable)event.preventDefault();
      return;
    }

    clear_(s);
  },{capture:true,passive:false});

  /*
   * Souris / stylet : Pointer Events suffisent. Le tactile n'est pas géré
   * ici par Pointer Events afin de ne pas dépendre de pointercancel WebView.
   */
  document.addEventListener('pointerdown',function(event){
    var type=String(event.pointerType||'mouse');
    if(type==='touch')return;
    if(type==='mouse'&&event.button!==0)return;
    var target=cible_(event.target);
    if(!target)return;
    start_(target,'pointer',event.clientX,event.clientY,event.pointerId,type);
  },true);

  document.addEventListener('pointermove',function(event){
    var s=state;
    if(!s||s.mode!=='pointer'||s.id!==event.pointerId)return;
    moved_(event.clientX,event.clientY);
  },true);

  document.addEventListener('pointerup',function(event){
    var s=state;
    if(!s||s.mode!=='pointer'||s.id!==event.pointerId)return;
    clear_(s);
  },true);

  document.addEventListener('pointercancel',function(event){
    var s=state;
    if(!s||s.mode!=='pointer'||s.id!==event.pointerId)return;
    clear_(s);
  },true);

  document.addEventListener('contextmenu',function(event){
    if(!cible_(event.target))return;
    event.preventDefault();
  },true);

  window.__SOREAL_LONG_PRESS_V197__={
    selector:SELECTOR,
    holdMs:HOLD_MS,
    movePx:MOVE_PX,
    cancel:function(){clear_();}
  };
})();
