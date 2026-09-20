/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/item-infinity-cubes-r2-v78.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_INFINITY_CUBES_IMAGES_V78__)return;
  window.__SOREAL_IDLE_INFINITY_CUBES_IMAGES_V78__=true;

  var timer=0;
  var TUTORIAL_URL_V78='/api/idle/media/item?set=infinity-cubes&name=tutorialCube';

  function root_(){
    return document.querySelector('.soreal-idle-page-root-v28');
  }

  function appliquerTutorialCube_(){
    var root=root_();
    if(!root)return;

    root.querySelectorAll(
      '[data-v75-special-id="tutorialCube"] img.soreal-idle-v75-special-image'
    ).forEach(function(img){
      if(img.dataset.v78InfinityCubeSource==='tutorialCube')return;
      img.dataset.v78InfinityCubeSource='tutorialCube';
      img.src=TUTORIAL_URL_V78;
    });
  }

  function programmer_(){
    clearTimeout(timer);
    timer=setTimeout(appliquerTutorialCube_,60);
  }

  window.__SOREAL_IDLE_INFINITY_CUBES_IMAGES_V78_TEST__={
    tutorialCubeUrl:TUTORIAL_URL_V78
  };

  var rt=window.__SOREAL_IDLE_RUNTIME_V1__;
  if(rt&&typeof rt.onRender==='function')rt.onRender(programmer_);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',programmer_,{once:true});
  }else{
    programmer_();
  }
})();
