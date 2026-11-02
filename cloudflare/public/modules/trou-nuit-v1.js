/*
 * SOREAL IDLE — le Trou sans fond DE NUIT (Norman, 2026-11-02 : « l'image du trou sans fond v2 doit être utilisée suivant le coucher du soleil de l'endroit où on y joue ; en hiver le soleil se couche plus tôt chaque jour ; elle ne sert que du coucher au lever du soleil »).
 * Aucune permission ni position GPS : l'endroit est déduit du FUSEAU HORAIRE de l'appareil (latitude et longitude approximatives de la grande ville du fuseau, tableau ci-dessous ; sinon longitude tirée du décalage horaire et latitude moyenne de l'hémisphère), et
 * la hauteur du soleil est calculée pour l'instant présent (algorithme astronomique simple, précision d'environ un degré) : il fait NUIT quand le soleil est sous l'horizon (hauteur < -0,833°, le seuil officiel du lever et du coucher). L'heure du coucher suit donc la saison
 * et la latitude toute seule (tôt en hiver, tard en été ; au-delà du cercle polaire, la nuit polaire ou le jour permanent). Seule la date de l'appareil compte ; rien n'est envoyé, rien n'est stocké.
 *
 *   window.__SOREAL_IDLE_TROU_NUIT_V1__ = { src(), estNuit(ms), hauteurSoleil(ms, lat, lon), position(), JOUR, NUIT }
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_TROU_NUIT_V1__)return;
  var JOUR='/trou/trou-sans-fond-v1.webp',NUIT='/trou/trou-sans-fond-nuit-v1.webp';
  var SEUIL=-0.833;
  /* fuseau -> [latitude, longitude] de la grande ville du fuseau */
  var ZONES={
    'Europe/Brussels':[50.85,4.35],'Europe/Paris':[48.85,2.35],'Europe/London':[51.5,-0.12],'Europe/Dublin':[53.35,-6.26],'Europe/Lisbon':[38.72,-9.14],'Europe/Madrid':[40.42,-3.7],
    'Europe/Amsterdam':[52.37,4.9],'Europe/Berlin':[52.52,13.4],'Europe/Zurich':[47.37,8.54],'Europe/Rome':[41.9,12.5],'Europe/Vienna':[48.21,16.37],'Europe/Prague':[50.08,14.44],
    'Europe/Warsaw':[52.23,21.01],'Europe/Stockholm':[59.33,18.07],'Europe/Oslo':[59.91,10.75],'Europe/Copenhagen':[55.68,12.57],'Europe/Helsinki':[60.17,24.94],
    'Europe/Athens':[37.98,23.73],'Europe/Istanbul':[41.01,28.98],'Europe/Moscow':[55.75,37.62],'Europe/Kiev':[50.45,30.52],'Europe/Kyiv':[50.45,30.52],'Europe/Bucharest':[44.43,26.1],
    'Europe/Luxembourg':[49.61,6.13],'Europe/Budapest':[47.5,19.04],'Europe/Belgrade':[44.8,20.46],'Europe/Sofia':[42.7,23.32],'Atlantic/Reykjavik':[64.15,-21.94],
    'Africa/Casablanca':[33.57,-7.59],'Africa/Algiers':[36.75,3.06],'Africa/Tunis':[36.8,10.18],'Africa/Cairo':[30.04,31.24],'Africa/Lagos':[6.52,3.38],'Africa/Nairobi':[-1.29,36.82],
    'Africa/Johannesburg':[-26.2,28.04],'Africa/Kinshasa':[-4.44,15.27],'Africa/Dakar':[14.69,-17.44],'Africa/Abidjan':[5.36,-4.01],
    'America/New_York':[40.71,-74.0],'America/Toronto':[43.65,-79.38],'America/Chicago':[41.88,-87.63],'America/Denver':[39.74,-104.99],'America/Los_Angeles':[34.05,-118.24],
    'America/Vancouver':[49.28,-123.12],'America/Montreal':[45.5,-73.57],'America/Mexico_City':[19.43,-99.13],'America/Bogota':[4.71,-74.07],'America/Lima':[-12.05,-77.04],
    'America/Santiago':[-33.45,-70.67],'America/Argentina/Buenos_Aires':[-34.6,-58.38],'America/Sao_Paulo':[-23.55,-46.63],'America/Caracas':[10.48,-66.9],'America/Halifax':[44.65,-63.57],
    'America/Anchorage':[61.22,-149.9],'Pacific/Honolulu':[21.31,-157.86],'America/Phoenix':[33.45,-112.07],
    'Asia/Tokyo':[35.68,139.69],'Asia/Seoul':[37.57,126.98],'Asia/Shanghai':[31.23,121.47],'Asia/Hong_Kong':[22.32,114.17],'Asia/Singapore':[1.35,103.82],'Asia/Bangkok':[13.76,100.5],
    'Asia/Kolkata':[28.61,77.21],'Asia/Calcutta':[28.61,77.21],'Asia/Dubai':[25.2,55.27],'Asia/Tehran':[35.69,51.39],'Asia/Jerusalem':[31.77,35.22],'Asia/Karachi':[24.86,67.01],
    'Asia/Dhaka':[23.81,90.41],'Asia/Jakarta':[-6.2,106.85],'Asia/Manila':[14.6,120.98],'Asia/Taipei':[25.03,121.57],'Asia/Riyadh':[24.71,46.68],'Asia/Beirut':[33.89,35.5],
    'Australia/Sydney':[-33.87,151.21],'Australia/Melbourne':[-37.81,144.96],'Australia/Brisbane':[-27.47,153.03],'Australia/Perth':[-31.95,115.86],'Australia/Adelaide':[-34.93,138.6],
    'Pacific/Auckland':[-36.85,174.76],'Indian/Reunion':[-21.12,55.54],'Indian/Mauritius':[-20.16,57.5],'Pacific/Noumea':[-22.28,166.46],'Pacific/Tahiti':[-17.53,-149.57],
    'America/Guadeloupe':[16.24,-61.53],'America/Martinique':[14.64,-61.02],'America/Cayenne':[4.92,-52.31]
  };
  var HEMISPHERE_SUD=/^(Australia|Pacific\/(Auckland|Fiji|Noumea|Tahiti)|Indian\/(Reunion|Mauritius|Antananarivo)|America\/(Sao_Paulo|Santiago|Argentina|Lima|La_Paz|Montevideo|Asuncion)|Africa\/(Johannesburg|Maputo|Harare|Lusaka|Windhoek))/;
  var memoPos=null;
  /* [latitude, longitude] déduits du fuseau de l'appareil */
  function position(){
    if(memoPos)return memoPos;
    var tz='',dec=0;
    try{tz=String(Intl.DateTimeFormat().resolvedOptions().timeZone||'');}catch(_e){}
    try{dec=-new Date().getTimezoneOffset()/60;}catch(_e){}
    if(ZONES[tz])memoPos=ZONES[tz];
    else memoPos=[HEMISPHERE_SUD.test(tz)?-30:45,Math.max(-180,Math.min(180,dec*15))];
    return memoPos;
  }
  var RAD=Math.PI/180;
  function mod(a,b){return ((a%b)+b)%b;}
  /* Hauteur du soleil en degrés pour l'instant ms (époque Unix), la latitude et la longitude (degrés, est positif). Algorithme astronomique simple (Astronomical Almanac, précision ~0,01° en déclinaison). */
  function hauteurSoleil(ms,lat,lon){
    var n=ms/86400000+2440587.5-2451545.0;
    var L=mod(280.460+0.9856474*n,360),g=mod(357.528+0.9856003*n,360)*RAD;
    var lambda=(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))*RAD;
    var eps=(23.439-0.0000004*n)*RAD;
    var decl=Math.asin(Math.sin(eps)*Math.sin(lambda));
    var asc=Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda));
    var gmst=mod(280.46061837+360.98564736629*n,360)*RAD;
    var ha=gmst+lon*RAD-asc;
    var sinH=Math.sin(lat*RAD)*Math.sin(decl)+Math.cos(lat*RAD)*Math.cos(decl)*Math.cos(ha);
    return Math.asin(Math.max(-1,Math.min(1,sinH)))/RAD;
  }
  function estNuit(ms,lat,lon){
    var p=position();
    return hauteurSoleil(ms==null?Date.now():ms,lat==null?p[0]:lat,lon==null?p[1]:lon)<SEUIL;
  }
  /* image à montrer maintenant : celle de nuit du coucher au lever du soleil, sinon l'image d'origine */
  function src(ms){
    try{return estNuit(ms)?NUIT:JOUR;}catch(_e){return JOUR;}
  }
  window.__SOREAL_IDLE_TROU_NUIT_V1__={src:src,estNuit:estNuit,hauteurSoleil:hauteurSoleil,position:position,JOUR:JOUR,NUIT:NUIT};
})();
